import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const profilesRouter = new Hono()
  .get('/me', async (c) => {
    // TODO: Add auth middleware protection
    // const authUser = c.get('authUser');
    // if (!authUser) {
    //   return c.json({ error: 'Unauthorized' }, 401);
    // }
    // TODO: Call profileService.getProfile(authUser.id)
    return c.json({ message: 'Profile endpoint - auth not yet implemented' });
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
    ),
    async (c) => {
      const data = c.req.valid('json');
      // TODO: Call profileService.createProfile(data)
      return c.json({ message: 'Profile creation not yet implemented' }, 501);
    }
  );
