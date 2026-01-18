import { db } from '@/src/lib/db/connection';
import { retreatRegistrations, retreatRegistrants } from '@/src/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { 
  NewRetreatRegistration, 
  NewRetreatRegistrant,
  RetreatRegistration,
  RetreatRegistrant 
} from '@/src/lib/db/schema/retreat';

/**
 * Create a new retreat registration (individual or family)
 */
export async function createRetreatRegistration(
  registrationData: {
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
export async function getAllRetreatRegistrations(): Promise<RetreatRegistration[]> {
  try {
    const registrations = await db
      .select()
      .from(retreatRegistrations)
      .orderBy(retreatRegistrations.createdAt);

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
