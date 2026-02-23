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
} from "@/src/services/retreatService";
import {
  sendRetreatConfirmationEmail,
  sendAdminRetreatNotificationEmail,
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

// Validation schemas
const registrantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  age: z.number().int().positive().optional(),
  isAdult: z.boolean().default(true),
  dietaryRestrictions: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  profileId: z.string().uuid().optional(),
});

const createRegistrationSchema = z.object({
  retreatId: z.string().uuid("Valid retreat ID is required"),
  type: z.enum(["individual", "family"]),
  profileId: z.string().uuid(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  registrants: z
    .array(registrantSchema)
    .min(1, "At least one registrant is required"),
});

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
  .post("/", zValidator("json", createRegistrationSchema), async (c) => {
    const data = c.req.valid("json");

    const result = await createRetreatRegistration({
      retreatId: data.retreatId,
      type: data.type,
      profileId: data.profileId,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      notes: data.notes,
      registrants: data.registrants,
    });

    if (!result.success) {
      return c.json(
        { error: result.error || "Failed to create registration" },
        500,
      );
    }

    const registration = result.registration!;
    const retreat = await getRetreatById(data.retreatId);
    const full = await getRetreatRegistrationById(registration.id);
    if (retreat && full.registration && full.registrants.length > 0) {
      const [, adminEmails] = await Promise.all([
        sendRetreatConfirmationEmail(
          data.contactEmail,
          retreat,
          full.registration,
          full.registrants,
        ),
        getAdminEmails(),
      ]);

      if (adminEmails.length > 0) {
        sendAdminRetreatNotificationEmail(
          adminEmails,
          retreat,
          full.registration,
          full.registrants,
        ).catch((err) =>
          console.error("Failed to send admin notification:", err),
        );
      }
    }

    return c.json(
      {
        registration,
        message: "Registration created successfully",
      },
      201,
    );
  })
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
  .get("/:id", async (c) => {
    const id = c.req.param("id");

    const result = await getRetreatRegistrationById(id);

    if (!result.registration) {
      return c.json({ error: "Registration not found" }, 404);
    }

    return c.json({
      registration: result.registration,
      registrants: result.registrants,
    });
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
