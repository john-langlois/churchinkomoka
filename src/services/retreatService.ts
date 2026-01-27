import { db } from '@/src/lib/db/connection';
import { retreats, retreatRegistrations, retreatRegistrants } from '@/src/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { 
  Retreat,
  NewRetreat,
  NewRetreatRegistration, 
  NewRetreatRegistrant,
  RetreatRegistration,
  RetreatRegistrant 
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

/**
 * Create a new retreat registration (individual or family)
 */
export async function createRetreatRegistration(
  registrationData: {
    retreatId: string;
    type: 'individual' | 'family';
    profileId: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    notes?: string;
    registrants: Array<{
      firstName: string;
      lastName: string;
      age?: number;
      isAdult: boolean;
      dietaryRestrictions?: string;
      medicalNotes?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      profileId?: string;
    }>;
  }
): Promise<{ success: boolean; registration: RetreatRegistration | null; error?: string }> {
  try {
    // Start transaction by creating registration first
    const newRegistration: NewRetreatRegistration = {
      retreatId: registrationData.retreatId,
      type: registrationData.type,
      profileId: registrationData.profileId,
      contactName: registrationData.contactName,
      contactEmail: registrationData.contactEmail,
      contactPhone: registrationData.contactPhone || null,
      notes: registrationData.notes || null,
      status: 'pending',
    };

    const [registration] = await db
      .insert(retreatRegistrations)
      .values(newRegistration)
      .returning();

    // Create registrants
    const registrantsToInsert: NewRetreatRegistrant[] = registrationData.registrants.map(reg => ({
      registrationId: registration.id,
      profileId: reg.profileId || null,
      firstName: reg.firstName,
      lastName: reg.lastName,
      age: reg.age || null,
      isAdult: reg.isAdult,
      dietaryRestrictions: reg.dietaryRestrictions || null,
      medicalNotes: reg.medicalNotes || null,
      emergencyContactName: reg.emergencyContactName || null,
      emergencyContactPhone: reg.emergencyContactPhone || null,
    }));

    await db.insert(retreatRegistrants).values(registrantsToInsert);

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
      .where(eq(retreatRegistrants.registrationId, registrationId));

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
