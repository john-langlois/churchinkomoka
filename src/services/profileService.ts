import { db } from '@/src/lib/db/connection';
import { profiles } from '@/src/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Profile, NewProfile } from '@/src/lib/db/schema/profiles';

/**
 * Get profile by identifier (email or phone)
 * No longer creates new profiles - only returns existing ones
 */
export async function getProfileByIdentifier(
  identifier: string,
  type: 'email' | 'phone'
): Promise<{ success: boolean; profile: Profile | null }> {
  try {
    // Only find existing profile - no new sign ups allowed
    const existing = await db
      .select()
      .from(profiles)
      .where(type === 'email' ? eq(profiles.email, identifier) : eq(profiles.phone, identifier))
      .limit(1);

    if (existing.length > 0) {
      return { success: true, profile: existing[0] };
    }

    return { success: false, profile: null };
  } catch (error) {
    console.error('Error in getProfileByIdentifier:', error);
    return { success: false, profile: null };
  }
}

/**
 * Create a new profile (admin only)
 */
export async function createProfile(
  profileData: Omit<NewProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; profile: Profile | null; error?: string }> {
  try {
    // Check if email or phone already exists
    if (profileData.email) {
      const existing = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, profileData.email))
        .limit(1);
      
      if (existing.length > 0) {
        return { success: false, profile: null, error: 'Email already exists' };
      }
    }

    if (profileData.phone) {
      const existing = await db
        .select()
        .from(profiles)
        .where(eq(profiles.phone, profileData.phone))
        .limit(1);
      
      if (existing.length > 0) {
        return { success: false, profile: null, error: 'Phone already exists' };
      }
    }

    const newProfile: NewProfile = {
      ...profileData,
      updatedAt: new Date(),
    };

    const [created] = await db.insert(profiles).values(newProfile).returning();

    return { success: true, profile: created };
  } catch (error) {
    console.error('Error in createProfile:', error);
    return {
      success: false,
      profile: null,
      error: error instanceof Error ? error.message : 'Failed to create profile',
    };
  }
}

/**
 * Update a profile
 */
export async function updateProfile(
  id: string,
  profileData: Partial<Omit<NewProfile, 'id' | 'createdAt'>>
): Promise<{ success: boolean; profile: Profile | null; error?: string }> {
  try {
    // Check for duplicate email/phone if being updated
    if (profileData.email) {
      const existing = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.email, profileData.email), eq(profiles.id, id)))
        .limit(1);
      
      if (existing.length === 0) {
        // Check if another profile has this email
        const duplicate = await db
          .select()
          .from(profiles)
          .where(eq(profiles.email, profileData.email))
          .limit(1);
        
        if (duplicate.length > 0) {
          return { success: false, profile: null, error: 'Email already exists' };
        }
      }
    }

    if (profileData.phone) {
      const existing = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.phone, profileData.phone), eq(profiles.id, id)))
        .limit(1);
      
      if (existing.length === 0) {
        // Check if another profile has this phone
        const duplicate = await db
          .select()
          .from(profiles)
          .where(eq(profiles.phone, profileData.phone))
          .limit(1);
        
        if (duplicate.length > 0) {
          return { success: false, profile: null, error: 'Phone already exists' };
        }
      }
    }

    const [updated] = await db
      .update(profiles)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();

    if (!updated) {
      return { success: false, profile: null, error: 'Profile not found' };
    }

    return { success: true, profile: updated };
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return {
      success: false,
      profile: null,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

/**
 * Get all profiles (admin only)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const allProfiles = await db
      .select()
      .from(profiles)
      .orderBy(profiles.createdAt);

    return allProfiles;
  } catch (error) {
    console.error('Error in getAllProfiles:', error);
    return [];
  }
}

/**
 * Delete a profile
 */
export async function deleteProfile(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(profiles)
      .where(eq(profiles.id, id));

    return { success: true };
  } catch (error) {
    console.error('Error in deleteProfile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete profile',
    };
  }
}

/**
 * Check if a user is an admin
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    return result[0]?.isAdmin ?? false;
  } catch (error) {
    console.error('Error in checkIsAdmin:', error);
    return false;
  }
}

/**
 * Get profile by ID
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  try {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    return result[0] ?? null;
  } catch (error) {
    console.error('Error in getProfileById:', error);
    return null;
  }
}
