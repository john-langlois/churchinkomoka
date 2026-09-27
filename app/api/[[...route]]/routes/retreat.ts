import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "@/auth";
import {
  createRetreatRegistration,
  getRetreatRegistrationById,
  getRetreatRegistrationsByProfileId,
  getAllRetreatRegistrations,
  getRetreatRegistrantsWithRegistrations,
  updateRegistrationStatus,
  getAllRetreats,
  getActiveRetreats,
  getRetreatById,
  createRetreat,
  updateRetreat,
  deleteRetreat,
  toggleRetreatActive,
  updateRetreatRegistration,
} from "@/src/services/retreatService";
import {
  generateRetreatConfirmationPdf,
  getPaymentReference,
} from "@/src/services/retreatPdfService";
import { computeRetreatPricing } from "@/src/services/emailService";
import {
  sendRetreatConfirmationEmail,
  sendAdminRetreatNotificationEmail,
  sendAdminRetreatFailureEmail,
  getRetreatNotificationEmailsFromEnv,
} from "@/src/services/emailService";
import { getAdminEmails } from "@/src/services/profileService";

// Helper to check if user is admin from request headers
async function checkAdminFromRequest(request: Request): Promise<boolean> {
  try {
    const session = await auth();
    return (session?.user as any)?.isAdmin === true;
  } catch (error) {
    return false;
  }
}

// Admin profile emails plus any configured fallback addresses, de-duplicated
async function getRetreatAdminRecipients(): Promise<string[]> {
  const adminEmails = await getAdminEmails();
  const all = [...adminEmails, ...getRetreatNotificationEmailsFromEnv()];
  return Array.from(new Set(all.map((e) => e.trim().toLowerCase())));
}

// Validation schemas
const registrantSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  // Single-word names are allowed, so last name may be empty
  lastName: z.string().trim().default(""),
  age: z.number().int().min(0).optional(),
  isAdult: z.boolean().default(true),
  dietaryRestrictions: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  profileId: z.string().uuid().optional(),
});

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} is too long`).optional();

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must be in YYYY-MM-DD format")
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

// Fields shared by creating and editing a registration
const registrationFields = {
  contactName: z.string().trim().min(1, "Contact name is required"),
  contactEmail: z.string().trim().email("Valid email is required"),
  contactPhone: optionalText(50, "Phone number"),
  churchName: optionalText(255, "Church name"),
  pastorName: optionalText(255, "Pastor name"),
  pastorContact: optionalText(255, "Pastor contact"),
  city: optionalText(255, "City"),
  country: optionalText(255, "Country"),
  arrivalDate: optionalDate,
  departureDate: optionalDate,
  notes: z.string().optional(),
};

const createRegistrationSchema = z.object({
  retreatId: z.string().uuid("Valid retreat ID is required"),
  type: z.enum(["individual", "family"]),
  ...registrationFields,
  registrants: z
    .array(registrantSchema)
    .min(1, "At least one registrant is required"),
});

const updateRegistrationSchema = z.object({
  ...registrationFields,
  registrants: z
    .array(
      registrantSchema
        .omit({ profileId: true })
        .extend({ id: z.string().uuid().optional() }),
    )
    .min(1, "At least one attendee is required"),
});

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Turn the first zod issue into a readable `{ error }` response
function validationHook(
  result: { success: boolean; error?: z.ZodError },
  c: any,
) {
  if (!result.success) {
    const issue = result.error?.issues[0];
    return c.json(
      { error: issue?.message || "Invalid registration details" },
      400,
    );
  }
}

/**
 * Load a registration with its retreat, pricing and editability, for the
 * public registration page and PDF.
 */
async function loadRegistrationBundle(id: string) {
  if (!uuidPattern.test(id)) return null;
  const { registration, registrants } = await getRetreatRegistrationById(id);
  if (!registration) return null;
  const retreat = registration.retreatId
    ? await getRetreatById(registration.retreatId)
    : null;

  let editLockedReason: string | null = null;
  if (registration.status === "cancelled") {
    editLockedReason = "This registration has been cancelled.";
  } else if (retreat?.startDate && new Date(retreat.startDate) <= new Date()) {
    editLockedReason =
      "The retreat has already started, so changes can no longer be made online. Please contact us.";
  }

  return {
    registration,
    registrants,
    retreat,
    pricing: retreat ? computeRetreatPricing(retreat, registrants) : null,
    paymentReference: getPaymentReference(registration.id),
    canEdit: editLockedReason === null,
    editLockedReason,
  };
}

async function notifyAdminsOfChange(
  id: string,
  kind: "updated" | "cancelled",
) {
  try {
    const bundle = await loadRegistrationBundle(id);
    if (!bundle?.retreat) return;
    const adminEmails = await getRetreatAdminRecipients();
    if (adminEmails.length === 0) return;
    const result = await sendAdminRetreatNotificationEmail(
      adminEmails,
      bundle.retreat,
      bundle.registration,
      bundle.registrants,
      kind,
    );
    if (!result.success) {
      console.error(`Failed to send retreat ${kind} email:`, result.error);
    }
  } catch (err) {
    console.error(`Failed to send retreat ${kind} email:`, err);
  }
}

// Validation schemas for retreat management
const dateOrDateTimeSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true; // Allow empty strings for optional fields
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: "Must be a valid date or datetime string" },
  )
  .optional()
  .nullable();

const pricingTierSchema = z.object({
  name: z.string().min(1, "Tier name is required"),
  minAge: z.number().int().min(0),
  maxAge: z.number().int().min(0).nullable(),
  price: z.number().int().min(0).nullable(),
  isFree: z.boolean(),
});

const createRetreatSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  startDate: dateOrDateTimeSchema,
  endDate: dateOrDateTimeSchema,
  location: z.string().optional(),
  isActive: z.boolean().default(false),
  pricingTiers: z.array(pricingTierSchema).optional().nullable(),
  paymentInstructions: z.string().optional().nullable(),
});

const updateRetreatSchema = createRetreatSchema.partial();

const retreat = new Hono()
  // Retreat management routes
  .get("/retreats/all", async (c) => {
    // Admin only - get all retreats
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: "Unauthorized" }, 403);
    }
    const retreats = await getAllRetreats();
    return c.json({ retreats });
  })
  .get("/retreats/active", async (c) => {
    // Public route - get only active retreats
    const activeRetreats = await getActiveRetreats();
    return c.json({ retreats: activeRetreats });
  })
  .get("/retreats/:id", async (c) => {
    const id = c.req.param("id");
    const retreat = await getRetreatById(id);

    if (!retreat) {
      return c.json({ error: "Retreat not found" }, 404);
    }

    return c.json({ retreat });
  })
  .get("/retreats/:id/registrants", async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const id = c.req.param("id");
    const rows = await getRetreatRegistrantsWithRegistrations(id);
    return c.json({ rows });
  })
  .post("/retreats", zValidator("json", createRetreatSchema), async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const data = c.req.valid("json");

    const result = await createRetreat({
      name: data.name,
      description: data.description || undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      location: data.location || undefined,
      isActive: data.isActive ?? false,
      pricingTiers: data.pricingTiers ?? null,
      paymentInstructions: data.paymentInstructions || null,
    });

    if (!result.success) {
      return c.json({ error: result.error || "Failed to create retreat" }, 500);
    }

    return c.json(
      {
        retreat: result.retreat,
        message: "Retreat created successfully",
      },
      201,
    );
  })
  .put("/retreats/:id", zValidator("json", updateRetreatSchema), async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const id = c.req.param("id");
    const data = c.req.valid("json");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description || undefined;
    if (data.startDate !== undefined)
      updateData.startDate = data.startDate
        ? new Date(data.startDate)
        : undefined;
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate ? new Date(data.endDate) : undefined;
    if (data.location !== undefined)
      updateData.location = data.location || undefined;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.pricingTiers !== undefined)
      updateData.pricingTiers = data.pricingTiers ?? null;
    if (data.paymentInstructions !== undefined)
      updateData.paymentInstructions = data.paymentInstructions || null;

    const result = await updateRetreat(id, updateData);

    if (!result.success) {
      return c.json({ error: result.error || "Failed to update retreat" }, 500);
    }

    return c.json({
      retreat: result.retreat,
      message: "Retreat updated successfully",
    });
  })
  .put(
    "/retreats/:id/toggle-active",
    zValidator("json", z.object({ isActive: z.boolean() })),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const id = c.req.param("id");
      const { isActive } = c.req.valid("json");

      const result = await toggleRetreatActive(id, isActive);

      if (!result.success) {
        return c.json(
          { error: result.error || "Failed to toggle retreat status" },
          500,
        );
      }

      return c.json({
        retreat: result.retreat,
        message: "Retreat status updated successfully",
      });
    },
  )
  .delete("/retreats/:id", async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const id = c.req.param("id");
    const result = await deleteRetreat(id);

    if (!result.success) {
      return c.json({ error: result.error || "Failed to delete retreat" }, 500);
    }

    return c.json({ message: "Retreat deleted successfully" });
  })
  // Registration routes
  .post(
    "/",
    zValidator("json", createRegistrationSchema, validationHook),
    async (c) => {
      const data = c.req.valid("json");

      // Link to the signed-in member when there is one; guests register
      // without a profile.
      let profileId: string | null = null;
      try {
        const session = await auth();
        profileId = ((session?.user as any)?.id as string | undefined) ?? null;
      } catch {
        profileId = null;
      }

      const result = await createRetreatRegistration({
        retreatId: data.retreatId,
        type: data.type,
        profileId,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        churchName: data.churchName,
        pastorName: data.pastorName,
        pastorContact: data.pastorContact,
        city: data.city,
        country: data.country,
        arrivalDate: data.arrivalDate,
        departureDate: data.departureDate,
        notes: data.notes,
        registrants: data.registrants,
      });

      if (!result.success) {
        // Don't lose the submission: send the details to the admins so they
        // can follow up manually.
        try {
          const [retreat, adminEmails] = await Promise.all([
            getRetreatById(data.retreatId),
            getRetreatAdminRecipients(),
          ]);
          const alert = await sendAdminRetreatFailureEmail(adminEmails, {
            retreatName: retreat?.name,
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            notes: [
              data.churchName && `Church: ${data.churchName}`,
              data.pastorName &&
                `Pastor: ${data.pastorName}${data.pastorContact ? ` (${data.pastorContact})` : ""}`,
              (data.city || data.country) &&
                `From: ${[data.city, data.country].filter(Boolean).join(", ")}`,
              data.arrivalDate && `Arrival: ${data.arrivalDate}`,
              data.departureDate && `Departure: ${data.departureDate}`,
              data.notes,
            ]
              .filter(Boolean)
              .join("\n"),
            registrants: data.registrants,
            error: result.error || "Unknown error",
          });
          if (!alert.success) {
            console.error("Failed to send registration failure alert:", alert.error);
          }
        } catch (err) {
          console.error("Failed to send registration failure alert:", err);
        }

        return c.json(
          {
            error:
              "We couldn't save your registration. Our team has been notified and will reach out, or please try again.",
          },
          500,
        );
      }

      const registration = result.registration!;
      const [retreat, full, adminEmails] = await Promise.all([
        getRetreatById(data.retreatId),
        getRetreatRegistrationById(registration.id),
        getRetreatAdminRecipients(),
      ]);

      if (retreat && full.registration && full.registrants.length > 0) {
        let attachments: { filename: string; content: Buffer }[] | undefined;
        try {
          const pdf = await generateRetreatConfirmationPdf(
            retreat,
            full.registration,
            full.registrants,
          );
          attachments = [
            {
              filename: `retreat-registration-${getPaymentReference(registration.id)}.pdf`,
              content: Buffer.from(pdf),
            },
          ];
        } catch (err) {
          // Still send the email without the PDF
          console.error("Failed to generate confirmation PDF:", err);
        }

        // Await both emails: on serverless hosts, work left running after the
        // response is sent can be cut off, which silently dropped admin emails.
        const [confirmation, adminNotification] = await Promise.allSettled([
          sendRetreatConfirmationEmail(
            data.contactEmail,
            retreat,
            full.registration,
            full.registrants,
            attachments,
          ),
          adminEmails.length > 0
            ? sendAdminRetreatNotificationEmail(
                adminEmails,
                retreat,
                full.registration,
                full.registrants,
              )
            : Promise.resolve({
                success: false,
                error:
                  "No admin recipients (no admin profiles with email and RETREAT_NOTIFICATION_EMAILS unset)",
              }),
        ]);

        for (const [label, outcome] of [
          ["confirmation", confirmation],
          ["admin notification", adminNotification],
        ] as const) {
          if (outcome.status === "rejected") {
            console.error(`Failed to send retreat ${label} email:`, outcome.reason);
          } else if (!outcome.value.success) {
            console.error(`Failed to send retreat ${label} email:`, outcome.value.error);
          }
        }
      } else {
        console.error(
          "Skipped retreat emails: could not load retreat or registration",
          { retreatId: data.retreatId, registrationId: registration.id },
        );
      }

      return c.json(
        {
          registration,
          message: "Registration created successfully",
        },
        201,
      );
    },
  )
  .get("/all", async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: "Unauthorized" }, 403);
    }
    const retreatId = c.req.query("retreatId");
    const registrations = await getAllRetreatRegistrations(
      retreatId || undefined,
    );
    return c.json({ registrations });
  })
  .get("/profile/:profileId", async (c) => {
    const profileId = c.req.param("profileId");

    const registrations = await getRetreatRegistrationsByProfileId(profileId);

    return c.json({ registrations });
  })
  .get("/:id/pdf", async (c) => {
    const bundle = await loadRegistrationBundle(c.req.param("id"));
    if (!bundle || !bundle.retreat) {
      return c.json({ error: "Registration not found" }, 404);
    }

    const pdf = await generateRetreatConfirmationPdf(
      bundle.retreat,
      bundle.registration,
      bundle.registrants,
    );
    return c.body(pdf as unknown as ArrayBuffer, 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="retreat-registration-${bundle.paymentReference}.pdf"`,
      "Cache-Control": "no-store",
    });
  })
  .get("/:id", async (c) => {
    const bundle = await loadRegistrationBundle(c.req.param("id"));
    if (!bundle) {
      return c.json({ error: "Registration not found" }, 404);
    }

    const { retreat, ...rest } = bundle;
    return c.json({
      ...rest,
      retreat: retreat
        ? {
            id: retreat.id,
            name: retreat.name,
            description: retreat.description,
            startDate: retreat.startDate,
            endDate: retreat.endDate,
            location: retreat.location,
            pricingTiers: retreat.pricingTiers,
            paymentInstructions: retreat.paymentInstructions,
          }
        : null,
    });
  })
  .put(
    "/:id",
    zValidator("json", updateRegistrationSchema, validationHook),
    async (c) => {
      const id = c.req.param("id");
      const bundle = await loadRegistrationBundle(id);
      if (!bundle) {
        return c.json({ error: "Registration not found" }, 404);
      }
      if (!bundle.canEdit) {
        return c.json({ error: bundle.editLockedReason }, 409);
      }

      const data = c.req.valid("json");
      const result = await updateRetreatRegistration(id, data);
      if (!result.success) {
        return c.json(
          { error: "We couldn't save your changes. Please try again." },
          500,
        );
      }

      await notifyAdminsOfChange(id, "updated");
      return c.json({ message: "Registration updated successfully" });
    },
  )
  .post("/:id/cancel", async (c) => {
    const id = c.req.param("id");
    const bundle = await loadRegistrationBundle(id);
    if (!bundle) {
      return c.json({ error: "Registration not found" }, 404);
    }
    if (!bundle.canEdit) {
      return c.json({ error: bundle.editLockedReason }, 409);
    }

    const result = await updateRegistrationStatus(id, "cancelled");
    if (!result.success) {
      return c.json(
        { error: "We couldn't cancel your registration. Please try again." },
        500,
      );
    }

    await notifyAdminsOfChange(id, "cancelled");
    return c.json({ message: "Registration cancelled" });
  })
  .put(
    "/:id/status",
    zValidator(
      "json",
      z.object({
        status: z.enum(["pending", "confirmed", "cancelled", "waitlisted"]),
      }),
    ),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: "Unauthorized" }, 403);
      }

      const id = c.req.param("id");
      const { status } = c.req.valid("json");

      const result = await updateRegistrationStatus(id, status);

      if (!result.success) {
        return c.json(
          { error: result.error || "Failed to update status" },
          500,
        );
      }

      return c.json({ message: "Status updated successfully" });
    },
  );

export default retreat;
