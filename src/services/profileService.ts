import { db } from '@/src/lib/db/connection';
import { profiles } from '@/src/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Profile, NewProfile } from '@/src/lib/db/schema/profiles';

/**
 * Get or create a profile by identifier (email or phone)
 */
export async function getOrCreateProfileByIdentifier(
  identifier: string,
  type: 'email' | 'phone'
): Promise<{ success: boolean; profile: Profile | null }> {
  try {
    // Try to find existing profile
    const existing = await db
      .select()
      .from(profiles)
      .where(type === 'email' ? eq(profiles.email, identifier) : eq(profiles.phone, identifier))
      .limit(1);

    if (existing.length > 0) {
      return { success: true, profile: existing[0] };
    }

    // Create new profile
    const newProfile: NewProfile = {
      email: type === 'email' ? identifier : null,
      phone: type === 'phone' ? identifier : null,
    };

    const [created] = await db.insert(profiles).values(newProfile).returning();

    return { success: true, profile: created };
  } catch (error) {
    console.error('Error in getOrCreateProfileByIdentifier:', error);
    return { success: false, profile: null };
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
