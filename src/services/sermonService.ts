import { db } from '@/src/lib/db/connection';
import { sermons } from '@/src/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Sermon, NewSermon } from '@/src/lib/db/schema/sermons';

/**
 * Get all sermons (admin function)
 */
export async function getAllSermons(): Promise<Sermon[]> {
  try {
    const allSermons = await db
      .select()
      .from(sermons)
      .orderBy(desc(sermons.date));

    return allSermons;
  } catch (error) {
    console.error('Error in getAllSermons:', error);
    return [];
  }
}

/**
 * Get only public sermons
 */
export async function getPublicSermons(): Promise<Sermon[]> {
  try {
    const publicSermons = await db
      .select()
      .from(sermons)
      .where(eq(sermons.isPublic, true))
      .orderBy(desc(sermons.date));

    return publicSermons;
  } catch (error) {
    console.error('Error in getPublicSermons:', error);
    return [];
  }
}

/**
 * Get sermon by ID
 */
export async function getSermonById(id: string): Promise<Sermon | null> {
  try {
    const result = await db
      .select()
      .from(sermons)
      .where(eq(sermons.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error in getSermonById:', error);
    return null;
  }
}

/**
 * Create a new sermon
 */
export async function createSermon(
  sermonData: Omit<NewSermon, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; sermon: Sermon | null; error?: string }> {
  try {
    const newSermon: NewSermon = {
      ...sermonData,
      updatedAt: new Date(),
    };

    const [sermon] = await db
      .insert(sermons)
      .values(newSermon)
      .returning();

    return { success: true, sermon };
  } catch (error) {
    console.error('Error in createSermon:', error);
    return {
      success: false,
      sermon: null,
      error: error instanceof Error ? error.message : 'Failed to create sermon',
    };
  }
}

/**
 * Update a sermon
 */
export async function updateSermon(
  id: string,
  sermonData: Partial<Omit<NewSermon, 'id' | 'createdAt'>>
): Promise<{ success: boolean; sermon: Sermon | null; error?: string }> {
  try {
    const [sermon] = await db
      .update(sermons)
      .set({
        ...sermonData,
        updatedAt: new Date(),
      })
      .where(eq(sermons.id, id))
      .returning();

    if (!sermon) {
      return { success: false, sermon: null, error: 'Sermon not found' };
    }

    return { success: true, sermon };
  } catch (error) {
    console.error('Error in updateSermon:', error);
    return {
      success: false,
      sermon: null,
      error: error instanceof Error ? error.message : 'Failed to update sermon',
    };
  }
}

/**
 * Toggle sermon visibility
 */
export async function toggleSermonVisibility(id: string): Promise<{ success: boolean; sermon: Sermon | null; error?: string }> {
  try {
    const sermon = await getSermonById(id);
    if (!sermon) {
      return { success: false, sermon: null, error: 'Sermon not found' };
    }

    const [updatedSermon] = await db
      .update(sermons)
      .set({
        isPublic: !sermon.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(sermons.id, id))
      .returning();

    return { success: true, sermon: updatedSermon };
  } catch (error) {
    console.error('Error in toggleSermonVisibility:', error);
    return {
      success: false,
      sermon: null,
      error: error instanceof Error ? error.message : 'Failed to toggle visibility',
    };
  }
}

/**
 * Delete a sermon
 */
export async function deleteSermon(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(sermons)
      .where(eq(sermons.id, id));

    return { success: true };
  } catch (error) {
    console.error('Error in deleteSermon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete sermon',
    };
  }
}
