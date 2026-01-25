import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { auth } from '@/auth';
import { 
  createRetreatRegistration, 
  getRetreatRegistrationById, 
  getRetreatRegistrationsByProfileId, 
  getAllRetreatRegistrations, 
  updateRegistrationStatus,
  getAllRetreats,
  getActiveRetreats,
  getRetreatById,
  createRetreat,
  updateRetreat,
  deleteRetreat,
  toggleRetreatActive
} from '@/src/services/retreatService';

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
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  age: z.number().int().positive().optional(),
  isAdult: z.boolean().default(true),
  dietaryRestrictions: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  profileId: z.string().uuid().optional(),
});

const createRegistrationSchema = z.object({
  type: z.enum(['individual', 'family']),
  profileId: z.string().uuid(),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  registrants: z.array(registrantSchema).min(1, 'At least one registrant is required'),
});

// Validation schemas for retreat management
const dateOrDateTimeSchema = z.string().refine(
  (val) => {
    if (!val) return true; // Allow empty strings for optional fields
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: 'Must be a valid date or datetime string' }
).optional().nullable();

const createRetreatSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: dateOrDateTimeSchema,
  endDate: dateOrDateTimeSchema,
  location: z.string().optional(),
  isActive: z.boolean().default(false),
});

const updateRetreatSchema = createRetreatSchema.partial();

const retreat = new Hono()
  // Retreat management routes
  .get('/retreats/all', async (c) => {
    // Admin only - get all retreats
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    const retreats = await getAllRetreats();
    return c.json({ retreats });
  })
  .get('/retreats/active', async (c) => {
    // Public route - get only active retreats
    const activeRetreats = await getActiveRetreats();
    return c.json({ retreats: activeRetreats });
  })
  .get('/retreats/:id', async (c) => {
    const id = c.req.param('id');
    const retreat = await getRetreatById(id);
    
    if (!retreat) {
      return c.json({ error: 'Retreat not found' }, 404);
    }

    return c.json({ retreat });
  })
  .post(
    '/retreats',
    zValidator('json', createRetreatSchema),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const data = c.req.valid('json');
      
      const result = await createRetreat({
        name: data.name,
        description: data.description || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location || null,
        isActive: data.isActive ?? false,
      });

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to create retreat' }, 500);
      }

      return c.json({ 
        retreat: result.retreat,
        message: 'Retreat created successfully' 
      }, 201);
    }
  )
  .put(
    '/retreats/:id',
    zValidator('json', updateRetreatSchema),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const id = c.req.param('id');
      const data = c.req.valid('json');
      
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.location !== undefined) updateData.location = data.location || null;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const result = await updateRetreat(id, updateData);

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to update retreat' }, 500);
      }

      return c.json({ 
        retreat: result.retreat,
        message: 'Retreat updated successfully' 
      });
    }
  )
  .put(
    '/retreats/:id/toggle-active',
    zValidator('json', z.object({ isActive: z.boolean() })),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const id = c.req.param('id');
      const { isActive } = c.req.valid('json');
      
      const result = await toggleRetreatActive(id, isActive);

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to toggle retreat status' }, 500);
      }

      return c.json({ 
        retreat: result.retreat,
        message: 'Retreat status updated successfully' 
      });
    }
  )
  .delete('/retreats/:id', async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const result = await deleteRetreat(id);

    if (!result.success) {
      return c.json({ error: result.error || 'Failed to delete retreat' }, 500);
    }

    return c.json({ message: 'Retreat deleted successfully' });
  })
  // Registration routes
  .post(
    '/',
    zValidator('json', createRegistrationSchema),
    async (c) => {
      const data = c.req.valid('json');
      
      const result = await createRetreatRegistration({
        type: data.type,
        profileId: data.profileId,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        notes: data.notes,
        registrants: data.registrants,
      });

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to create registration' }, 500);
      }

      return c.json({ 
        registration: result.registration,
        message: 'Registration created successfully' 
      }, 201);
    }
  )
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    
    const result = await getRetreatRegistrationById(id);
    
    if (!result.registration) {
      return c.json({ error: 'Registration not found' }, 404);
    }

    return c.json({
      registration: result.registration,
      registrants: result.registrants,
    });
  })
  .get('/profile/:profileId', async (c) => {
    const profileId = c.req.param('profileId');
    
    const registrations = await getRetreatRegistrationsByProfileId(profileId);
    
    return c.json({ registrations });
  })
  .get('/all', async (c) => {
    // Admin only - get all retreat registrations
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    const retreatId = c.req.query('retreatId');
    const registrations = await getAllRetreatRegistrations(retreatId || undefined);
    return c.json({ registrations });
  })
  .put(
    '/:id/status',
    zValidator('json', z.object({ status: z.enum(['pending', 'confirmed', 'cancelled', 'waitlisted']) })),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const id = c.req.param('id');
      const { status } = c.req.valid('json');
      
      const result = await updateRegistrationStatus(id, status);
      
      if (!result.success) {
        return c.json({ error: result.error || 'Failed to update status' }, 500);
      }

      return c.json({ message: 'Status updated successfully' });
    }
  );

export default retreat;
