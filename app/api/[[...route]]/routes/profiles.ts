import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  getAllProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
} from '@/src/services/profileService';

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
const createProfileSchema = z.object({
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  isAdmin: z.boolean().default(false),
});

const updateProfileSchema = createProfileSchema.partial();

export const profilesRouter = new Hono()
  .get('/all', async (c) => {
    // Admin only - get all profiles
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    const profiles = await getAllProfiles();
    return c.json({ profiles });
  })
  .get('/:id', async (c) => {
    // Admin only - get single profile
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const profile = await getProfileById(id);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  })
  .post(
    '/',
    zValidator('json', createProfileSchema),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const data = c.req.valid('json');
      
      // At least email or phone must be provided
      if (!data.email && !data.phone) {
        return c.json({ error: 'Email or phone is required' }, 400);
      }

      const result = await createProfile({
        email: data.email || null,
        phone: data.phone || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        avatarUrl: data.avatarUrl || null,
        isAdmin: data.isAdmin,
      });

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to create profile' }, 500);
      }

      return c.json({ 
        profile: result.profile,
        message: 'Profile created successfully' 
      }, 201);
    }
  )
  .put(
    '/:id',
    zValidator('json', updateProfileSchema),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const id = c.req.param('id');
      const data = c.req.valid('json');
      
      const updateData: any = {};
      if (data.email !== undefined) updateData.email = data.email || null;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.firstName !== undefined) updateData.firstName = data.firstName || null;
      if (data.lastName !== undefined) updateData.lastName = data.lastName || null;
      if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;
      if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin;

      const result = await updateProfile(id, updateData);

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to update profile' }, 500);
      }

      return c.json({ 
        profile: result.profile,
        message: 'Profile updated successfully' 
      });
    }
  )
  .delete('/:id', async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const result = await deleteProfile(id);

    if (!result.success) {
      return c.json({ error: result.error || 'Failed to delete profile' }, 500);
    }

    return c.json({ message: 'Profile deleted successfully' });
  });
