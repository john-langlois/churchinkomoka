import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  getAllSermons,
  getPublicSermons,
  getSermonById,
  createSermon,
  updateSermon,
  deleteSermon,
  toggleSermonVisibility,
} from '@/src/services/sermonService';

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
const articleContentSchema = z.object({
  intro: z.string(),
  paragraphs: z.array(z.string()),
  takeaways: z.array(z.string()),
});

const createSermonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  speaker: z.string().min(1, 'Speaker is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  thumbnail: z.string().url().optional().nullable(),
  youtubeId: z.string().optional().nullable(),
  spotifyLink: z.string().url().optional().nullable(),
  articleContent: articleContentSchema.optional().nullable(),
  isPublic: z.boolean().default(true),
});

const updateSermonSchema = createSermonSchema.partial();

export const sermonsRouter = new Hono()
  .get('/', async (c) => {
    // Public endpoint - get only public sermons
    const sermons = await getPublicSermons();
    return c.json({ sermons });
  })
  .get('/all', async (c) => {
    // Admin only - get all sermons including private
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    const sermons = await getAllSermons();
    return c.json({ sermons });
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const sermon = await getSermonById(id);
    
    if (!sermon) {
      return c.json({ error: 'Sermon not found' }, 404);
    }

    // Check if sermon is public or user is admin
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!sermon.isPublic && !isAdmin) {
      return c.json({ error: 'Sermon not found' }, 404);
    }

    return c.json({ sermon });
  })
  .post(
    '/',
    zValidator('json', createSermonSchema),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const data = c.req.valid('json');
      
      const result = await createSermon({
        title: data.title,
        speaker: data.speaker,
        date: data.date,
        thumbnail: data.thumbnail || null,
        youtubeId: data.youtubeId || null,
        spotifyLink: data.spotifyLink || null,
        articleContent: data.articleContent || null,
        isPublic: data.isPublic,
      });

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to create sermon' }, 500);
      }

      return c.json({ 
        sermon: result.sermon,
        message: 'Sermon created successfully' 
      }, 201);
    }
  )
  .put(
    '/:id',
    zValidator('json', updateSermonSchema),
    async (c) => {
      const isAdmin = await checkAdminFromRequest(c.req.raw);
      if (!isAdmin) {
        return c.json({ error: 'Unauthorized' }, 403);
      }

      const id = c.req.param('id');
      const data = c.req.valid('json');
      
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.speaker !== undefined) updateData.speaker = data.speaker;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail || null;
      if (data.youtubeId !== undefined) updateData.youtubeId = data.youtubeId || null;
      if (data.spotifyLink !== undefined) updateData.spotifyLink = data.spotifyLink || null;
      if (data.articleContent !== undefined) updateData.articleContent = data.articleContent || null;
      if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

      const result = await updateSermon(id, updateData);

      if (!result.success) {
        return c.json({ error: result.error || 'Failed to update sermon' }, 500);
      }

      return c.json({ 
        sermon: result.sermon,
        message: 'Sermon updated successfully' 
      });
    }
  )
  .post('/:id/toggle-visibility', async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const result = await toggleSermonVisibility(id);

    if (!result.success) {
      return c.json({ error: result.error || 'Failed to toggle visibility' }, 500);
    }

    return c.json({ 
      sermon: result.sermon,
      message: 'Visibility toggled successfully' 
    });
  })
  .delete('/:id', async (c) => {
    const isAdmin = await checkAdminFromRequest(c.req.raw);
    if (!isAdmin) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const result = await deleteSermon(id);

    if (!result.success) {
      return c.json({ error: result.error || 'Failed to delete sermon' }, 500);
    }

    return c.json({ message: 'Sermon deleted successfully' });
  });
