import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createRetreatRegistration, getRetreatRegistrationById, getRetreatRegistrationsByProfileId } from '@/src/services/retreatService';

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

export const retreatRouter = new Hono()
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
  });
