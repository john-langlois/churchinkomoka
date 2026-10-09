import { db } from '@/src/lib/db/connection';
import { retreats, retreatRegistrations, retreatRegistrants } from '@/src/lib/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
import type { 
  Retreat,
  NewRetreat,
  NewRetreatRegistration, 
  NewRetreatRegistrant,
  RetreatRegistration,
  RetreatRegistrant,
  PricingTier
} from '@/src/lib/db/schema/retreat';

/**
 * Get all retreats (admin function)
 */
export async function getAllRetreats(): Promise<Retreat[]> {
  try {
    const allRetreats = await db
      .select()
      .from(retreats)
      .orderBy(retreats.createdAt);
    
    return allRetreats;
  } catch (error) {
    console.error('Error in getAllRetreats:', error);
    return [];
  }
}

/**
 * Get only active retreats (public function)
 */
export async function getActiveRetreats(): Promise<Retreat[]> {
  try {
    const activeRetreats = await db
      .select()
      .from(retreats)
      .where(eq(retreats.isActive, true))
      .orderBy(retreats.startDate);
    
    return activeRetreats;
  } catch (error) {
    console.error('Error in getActiveRetreats:', error);
    return [];
  }
}

/**
 * Get a retreat by ID
 */
export async function getRetreatById(id: string): Promise<Retreat | null> {
  try {
    const [retreat] = await db
      .select()
      .from(retreats)
      .where(eq(retreats.id, id))
      .limit(1);
    
    return retreat || null;
  } catch (error) {
    console.error('Error in getRetreatById:', error);
    return null;
  }
}

/**
 * Create a new retreat
 */
export async function createRetreat(
  data: {
    name: string;
    description?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    location?: string;
    isActive?: boolean;
    pricingTiers?: PricingTier[] | null;
    paymentInstructions?: string | null;
  }
): Promise<{ success: boolean; retreat: Retreat | null; error?: string }> {
  try {
    const newRetreat: NewRetreat = {
      name: data.name,
      description: data.description || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      location: data.location || null,
      isActive: data.isActive ?? false,
      pricingTiers: data.pricingTiers ?? null,
      paymentInstructions: data.paymentInstructions || null,
    };

    const [retreat] = await db
      .insert(retreats)
      .values(newRetreat)
      .returning();

    return { success: true, retreat };
  } catch (error) {
    console.error('Error in createRetreat:', error);
    return {
      success: false,
      retreat: null,
      error: error instanceof Error ? error.message : 'Failed to create retreat'
    };
  }
}

/**
 * Update a retreat
 */
export async function updateRetreat(
  id: string,
  data: {
    name?: string;
    description?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    location?: string;
    isActive?: boolean;
    pricingTiers?: PricingTier[] | null;
    paymentInstructions?: string | null;
  }
): Promise<{ success: boolean; retreat: Retreat | null; error?: string }> {
  try {
    const updateData: Partial<NewRetreat> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate || null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate || null;
    if (data.location !== undefined) updateData.location = data.location || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.pricingTiers !== undefined) updateData.pricingTiers = data.pricingTiers ?? null;
    if (data.paymentInstructions !== undefined) updateData.paymentInstructions = data.paymentInstructions || null;

    const [retreat] = await db
      .update(retreats)
      .set(updateData)
      .where(eq(retreats.id, id))
      .returning();

    if (!retreat) {
      return { success: false, retreat: null, error: 'Retreat not found' };
    }

    return { success: true, retreat };
  } catch (error) {
    console.error('Error in updateRetreat:', error);
    return {
      success: false,
      retreat: null,
      error: error instanceof Error ? error.message : 'Failed to update retreat'
    };
  }
}

/**
 * Delete a retreat
 */
export async function deleteRetreat(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(retreats)
      .where(eq(retreats.id, id));

    return { success: true };
  } catch (error) {
    console.error('Error in deleteRetreat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete retreat'
    };
  }
}

/**
 * Toggle retreat active status
 */
export async function toggleRetreatActive(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; retreat: Retreat | null; error?: string }> {
  try {
    const [retreat] = await db
      .update(retreats)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(retreats.id, id))
      .returning();

    if (!retreat) {
      return { success: false, retreat: null, error: 'Retreat not found' };
    }

    return { success: true, retreat };
  } catch (error) {
    console.error('Error in toggleRetreatActive:', error);
    return {
      success: false,
      retreat: null,
      error: error instanceof Error ? error.message : 'Failed to toggle retreat status'
    };
  }
}

export type RegistrantInput = {
  id?: string;
  firstName: string;
  lastName: string;
  age?: number;
  isAdult: boolean;
  dietaryRestrictions?: string;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  profileId?: string;
};

export type RegistrationDetailsInput = {
  churchName?: string;
  pastorName?: string;
  pastorContact?: string;
  city?: string;
  country?: string;
  arrivalDate?: string | null; // YYYY-MM-DD
  departureDate?: string | null; // YYYY-MM-DD
};

function detailsToColumns(d: RegistrationDetailsInput) {
  return {
    churchName: d.churchName || null,
    pastorName: d.pastorName || null,
    pastorContact: d.pastorContact || null,
    city: d.city || null,
    country: d.country || null,
    arrivalDate: d.arrivalDate || null,
    departureDate: d.departureDate || null,
  };
}

function registrantToColumns(reg: RegistrantInput) {
  return {
    firstName: reg.firstName,
    lastName: reg.lastName,
    age: reg.age ?? null,
    isAdult: reg.isAdult,
    dietaryRestrictions: reg.dietaryRestrictions || null,
    medicalNotes: reg.medicalNotes || null,
    emergencyContactName: reg.emergencyContactName || null,
    emergencyContactPhone: reg.emergencyContactPhone || null,
  };
}

/**
 * Create a new retreat registration (individual or family)
 */
export async function createRetreatRegistration(
  registrationData: {
    retreatId: string;
    type: 'individual' | 'family';
    profileId?: string | null;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    notes?: string;
    registrants: RegistrantInput[];
  } & RegistrationDetailsInput
): Promise<{ success: boolean; registration: RetreatRegistration | null; error?: string }> {
  try {
    // Insert the registration and its registrants atomically so a failure
    // part-way through doesn't leave an orphaned registration behind.
    const registration = await db.transaction(async (tx) => {
      const newRegistration: NewRetreatRegistration = {
        retreatId: registrationData.retreatId,
        type: registrationData.type,
        profileId: registrationData.profileId || null,
        contactName: registrationData.contactName,
        contactEmail: registrationData.contactEmail,
        contactPhone: registrationData.contactPhone || null,
        notes: registrationData.notes || null,
        ...detailsToColumns(registrationData),
        status: 'pending',
      };

      const [created] = await tx
        .insert(retreatRegistrations)
        .values(newRegistration)
        .returning();

      const registrantsToInsert: NewRetreatRegistrant[] = registrationData.registrants.map(reg => ({
        registrationId: created.id,
        profileId: reg.profileId || null,
        ...registrantToColumns(reg),
      }));

      await tx.insert(retreatRegistrants).values(registrantsToInsert);

      return created;
    });

    return { success: true, registration };
  } catch (error) {
    console.error('Error in createRetreatRegistration:', error);
    return { 
      success: false, 
      registration: null, 
      error: error instanceof Error ? error.message : 'Failed to create registration' 
    };
  }
}

/**
 * Update a registration's contact details and attendees. Attendees with an
 * `id` belonging to this registration are updated, ones without an id are
 * added, and existing attendees missing from the list are removed.
 */
export async function updateRetreatRegistration(
  registrationId: string,
  data: {
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    notes?: string;
    registrants: RegistrantInput[];
  } & RegistrationDetailsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(retreatRegistrations)
        .set({
          type: data.registrants.length > 1 ? 'family' : 'individual',
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone || null,
          notes: data.notes || null,
          ...detailsToColumns(data),
          updatedAt: new Date(),
        })
        .where(eq(retreatRegistrations.id, registrationId));

      const existing = await tx
        .select({ id: retreatRegistrants.id })
        .from(retreatRegistrants)
        .where(eq(retreatRegistrants.registrationId, registrationId));
      const existingIds = new Set(existing.map((r) => r.id));

      const keepIds = new Set<string>();
      for (const reg of data.registrants) {
        if (reg.id && existingIds.has(reg.id)) {
          keepIds.add(reg.id);
          await tx
            .update(retreatRegistrants)
            .set({ ...registrantToColumns(reg), updatedAt: new Date() })
            .where(eq(retreatRegistrants.id, reg.id));
        } else {
          await tx.insert(retreatRegistrants).values({
            registrationId,
            profileId: null,
            ...registrantToColumns(reg),
          });
        }
      }

      const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
      if (toDelete.length > 0) {
        await tx
          .delete(retreatRegistrants)
          .where(
            and(
              eq(retreatRegistrants.registrationId, registrationId),
              inArray(retreatRegistrants.id, toDelete)
            )
          );
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error in updateRetreatRegistration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update registration',
    };
  }
}

/**
 * Permanently delete a registration. Its registrants are removed by the
 * foreign key's ON DELETE CASCADE.
 */
export async function deleteRetreatRegistration(
  registrationId: string
): Promise<{ success: boolean; found: boolean; error?: string }> {
  try {
    const deleted = await db
      .delete(retreatRegistrations)
      .where(eq(retreatRegistrations.id, registrationId))
      .returning({ id: retreatRegistrations.id });
    return { success: true, found: deleted.length > 0 };
  } catch (error) {
    console.error('Error in deleteRetreatRegistration:', error);
    return {
      success: false,
      found: true,
      error: error instanceof Error ? error.message : 'Failed to delete registration',
    };
  }
}

/**
 * Get a retreat registration by ID with all registrants
 */
export async function getRetreatRegistrationById(
  registrationId: string
): Promise<{ 
  registration: RetreatRegistration | null; 
  registrants: RetreatRegistrant[] 
}> {
  try {
    const registration = await db
      .select()
      .from(retreatRegistrations)
      .where(eq(retreatRegistrations.id, registrationId))
      .limit(1);

    if (registration.length === 0) {
      return { registration: null, registrants: [] };
    }

    const registrants = await db
      .select()
      .from(retreatRegistrants)
      .where(eq(retreatRegistrants.registrationId, registrationId))
      .orderBy(asc(retreatRegistrants.createdAt));

    return { 
      registration: registration[0], 
      registrants 
    };
  } catch (error) {
    console.error('Error in getRetreatRegistrationById:', error);
    return { registration: null, registrants: [] };
  }
}

/**
 * Get all retreat registrations for a user (by profile ID)
 */
export async function getRetreatRegistrationsByProfileId(
  profileId: string
): Promise<RetreatRegistration[]> {
  try {
    const registrations = await db
      .select()
      .from(retreatRegistrations)
      .where(eq(retreatRegistrations.profileId, profileId));

    return registrations;
  } catch (error) {
    console.error('Error in getRetreatRegistrationsByProfileId:', error);
    return [];
  }
}

/**
 * Get all retreat registrations (admin function)
 */
export async function getAllRetreatRegistrations(retreatId?: string): Promise<RetreatRegistration[]> {
  try {
    let query = db
      .select()
      .from(retreatRegistrations);

    if (retreatId) {
      query = query.where(eq(retreatRegistrations.retreatId, retreatId)) as any;
    }

    const registrations = await query.orderBy(retreatRegistrations.createdAt);

    return registrations;
  } catch (error) {
    console.error('Error in getAllRetreatRegistrations:', error);
    return [];
  }
}

/**
 * Get all registrants for a retreat, joined with their parent registration
 */
export async function getRetreatRegistrantsWithRegistrations(retreatId: string) {
  try {
    const results = await db
      .select({
        registrant: retreatRegistrants,
        registration: {
          id: retreatRegistrations.id,
          contactName: retreatRegistrations.contactName,
          contactEmail: retreatRegistrations.contactEmail,
          contactPhone: retreatRegistrations.contactPhone,
          status: retreatRegistrations.status,
          type: retreatRegistrations.type,
          notes: retreatRegistrations.notes,
          churchName: retreatRegistrations.churchName,
          pastorName: retreatRegistrations.pastorName,
          pastorContact: retreatRegistrations.pastorContact,
          city: retreatRegistrations.city,
          country: retreatRegistrations.country,
          arrivalDate: retreatRegistrations.arrivalDate,
          departureDate: retreatRegistrations.departureDate,
          createdAt: retreatRegistrations.createdAt,
        },
      })
      .from(retreatRegistrants)
      .innerJoin(
        retreatRegistrations,
        eq(retreatRegistrants.registrationId, retreatRegistrations.id)
      )
      .where(eq(retreatRegistrations.retreatId, retreatId))
      .orderBy(retreatRegistrations.createdAt);

    return results;
  } catch (error) {
    console.error('Error in getRetreatRegistrantsWithRegistrations:', error);
    return [];
  }
}

/**
 * Update registration status
 */
export async function updateRegistrationStatus(
  registrationId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlisted'
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(retreatRegistrations)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(retreatRegistrations.id, registrationId));

    return { success: true };
  } catch (error) {
    console.error('Error in updateRegistrationStatus:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update status' 
    };
  }
}
