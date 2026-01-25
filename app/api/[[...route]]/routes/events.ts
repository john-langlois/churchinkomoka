import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  getAllEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsForDisplay,
} from '@/src/services/eventService';

// Helper to check if user is admin from request headers
async function checkAdminFromRequest(request: Request): Promise<boolean> {
  try {
    // Get session from auth
    const session = await auth();
    return (session?.user as any)?.isAdmin === true;
  } catch (error) {
    return false;
  }
}

// Helper to validate date or datetime strings
const dateOrDateTimeSchema = z.string().refine(
  (val) => {
    if (!val) return true; // Allow empty strings for optional fields
    // Try parsing as date (YYYY-MM-DD) or datetime (ISO 8601)
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: 'Must be a valid date or datetime string' }
).optional().nullable();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['Service', 'Prayer', 'Retreat', 'Bible Study', 'Outreach']),
  location: z.string().min(1, 'Location is required'),
  startDate: dateOrDateTimeSchema,
  endDate: dateOrDateTimeSchema,
  time: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  recurrenceDayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  recurrenceDayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  recurrenceEndDate: dateOrDateTimeSchema,
  isActive: z.boolean().default(true),
});

const updateEventSchema = createEventSchema.partial();

const events = new Hono()
  .get('/', async (c) => {
    // Public endpoint - get all active events for display
    const events = await getEventsForDisplay();
    return c.json({ events });
  })
  .get('/upcoming', async (c) => {
    // Public endpoint - get upcoming events
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const events = await getUpcomingEvents(limit);
    return c.json({ events });
  })
  .get('/all', async (c) => {
    // Admin only - get all events including inactive
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    const events = await getAllEvents();
    return c.json({ events });
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const event = await getEventById(id);
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    return c.json({ event });
  })
  .post(
    '/',
    zValidator('json', createEventSchema),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const data = c.req.valid('json');
      
      const result = await createEvent({
        title: data.title,
        description: data.description || null,
        category: data.category,
        location: data.location,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        time: data.time || null,
        isRecurring: data.isRecurring,
        recurrencePattern: data.recurrencePattern || null,
        recurrenceDayOfWeek: data.recurrenceDayOfWeek ?? null,
        recurrenceDayOfMonth: data.recurrenceDayOfMonth ?? null,
        recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
        isActive: data.isActive,
      });

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to create event' }, 500);
      }

      return c.json({ 
        event: result.event,
        message: 'Event created successfully' 
      }, 201);
    }
  )
  .put(
    '/:id',
    zValidator('json', updateEventSchema),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const id = c.req.param('id');
      const data = c.req.valid('json');
      
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.time !== undefined) updateData.time = data.time || null;
      if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
      if (data.recurrencePattern !== undefined) updateData.recurrencePattern = data.recurrencePattern || null;
      if (data.recurrenceDayOfWeek !== undefined) updateData.recurrenceDayOfWeek = data.recurrenceDayOfWeek ?? null;
      if (data.recurrenceDayOfMonth !== undefined) updateData.recurrenceDayOfMonth = data.recurrenceDayOfMonth ?? null;
      if (data.recurrenceEndDate !== undefined) updateData.recurrenceEndDate = data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const result = await updateEvent(id, updateData);

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to update event' }, 500);
      }

      return c.json({ 
        event: result.event,
        message: 'Event updated successfully' 
      });
    }
  )
  .delete('/:id', async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const result = await deleteEvent(id);

    if (!result.success) {
      return c.json({ error: result.error || 'Failed to delete event' }, 500);
    }

    return c.json({ message: 'Event deleted successfully' });
  });

export default events;
