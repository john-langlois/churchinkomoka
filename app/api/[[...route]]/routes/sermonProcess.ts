import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { streamSSE, type SSEStreamingApi } from 'hono/streaming';
import { auth } from '@/auth';
import { getVideoInfo, normaliseDate } from '@/src/services/youtubeService';
import { transcribeAndRewrite } from '@/src/services/geminiService';
import { createSermon } from '@/src/services/sermonService';
import { regeneratePodcastFeed } from '@/src/services/rssService';

const LOGO_PATH = '/images/CHURCH IN KOMOKA.png';

async function checkAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    return (session?.user as any)?.isAdmin === true;
  } catch {
    return false;
  }
}

function sendStep(
  writer: SSEStreamingApi,
  step: string,
  message: string,
  data?: Record<string, unknown>
) {
  return writer.writeSSE({
    event: step,
    data: JSON.stringify({ step, message, ...data }),
  });
}

// ─── Schema definitions ────────────────────────────────────────────────────

const processSchema = z.object({
  youtubeUrl: z.string().url('Must be a valid YouTube URL').optional().or(z.literal('')),
  preacherName: z.string().min(1, 'Preacher name is required'),
  // audioUrl is the Vercel Blob URL returned after the client-side upload
  audioUrl: z.string().url('Must be a valid audio URL'),
  audioMimeType: z.string().default('audio/mp4'),
});

const confirmSchema = z.object({
  title: z.string().min(1),
  speaker: z.string(),
  date: z.string().nullable(),
  youtubeUrl: z.string().optional(),
  audioUrl: z.string().url(),
  articleContent: z.string(),
});


// ─── Routes ────────────────────────────────────────────────────────────────

const sermonProcess = new Hono()

  /**
   * POST /api/sermons/process
   * Phase 1: Fetch YouTube metadata (if URL provided) → transcribe uploaded audio.
   * Streams SSE progress; ends with a `review` event for admin approval.
   */
  .post(
    '/process',
    zValidator('json', processSchema),
    async (c) => {
      const isAdmin = await checkAdmin();
      if (!isAdmin) return c.json({ error: 'Unauthorized' }, 403);

      const { youtubeUrl, preacherName, audioUrl, audioMimeType } = c.req.valid('json');

      return streamSSE(c, async (stream) => {
        try {
          let title = '';
          let sermonDate = '';

          // ── Step 1 (optional): Fetch YouTube metadata ─────────────────
          if (youtubeUrl) {
            await sendStep(stream, 'metadata', 'Fetching video info from YouTube…');
            const videoInfo = await getVideoInfo(youtubeUrl);
            title = videoInfo.title;
            sermonDate = normaliseDate(videoInfo.uploadDate);
            await sendStep(stream, 'metadata', `Found: "${videoInfo.title}"`, {
              title: videoInfo.title,
              date: sermonDate,
            });
          } else {
            await sendStep(stream, 'metadata', 'No YouTube URL — skipping metadata fetch.');
          }

          // ── Step 2: Download audio from Blob for Gemini ───────────────
          await sendStep(stream, 'audio', 'Fetching uploaded audio…');
          const audioResponse = await fetch(audioUrl);
          if (!audioResponse.ok) throw new Error('Failed to fetch uploaded audio from storage.');
          const arrayBuffer = await audioResponse.arrayBuffer();
          const audioBuffer = Buffer.from(arrayBuffer);
          const audioFilename = audioUrl.split('/').pop() ?? 'sermon.mp4';
          await sendStep(stream, 'audio', 'Audio ready.');

          // ── Step 3: Transcribe + rewrite ──────────────────────────────
          await sendStep(stream, 'transcribe', 'Transcribing and rewriting with Gemini…');
          const sermonTitle = title || 'Sermon';
          const { articleContent, podcastDescription } = await transcribeAndRewrite(
            audioBuffer,
            audioFilename,
            sermonTitle,
            audioMimeType,
          );
          await sendStep(stream, 'transcribe', 'Transcription complete.');

          // ── Pause for review ──────────────────────────────────────────
          await sendStep(stream, 'review', 'Ready for your review.', {
            title: sermonTitle,
            speaker: preacherName,
            date: sermonDate || null,
            youtubeUrl: youtubeUrl || null,
            audioUrl,
            articleContent,
            podcastDescription,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An unexpected error occurred';
          console.error('[sermonProcess] Pipeline error:', err);
          await sendStep(stream, 'error', message, { error: true });
        }
      });
    }
  )

  /**
   * POST /api/sermons/confirm
   * Phase 2: Save the (possibly edited) content to the DB and regenerate RSS.
   */
  .post(
    '/confirm',
    zValidator('json', confirmSchema),
    async (c) => {
      const isAdmin = await checkAdmin();
      if (!isAdmin) return c.json({ error: 'Unauthorized' }, 403);

      const body = c.req.valid('json');

      const result = await createSermon({
        title: body.title,
        speaker: body.speaker,
        date: body.date,
        youtubeId: body.youtubeUrl ?? null,
        spotifyLink: null,
        articleContent: body.articleContent,
        thumbnailUrl: LOGO_PATH,
        audioUrl: body.audioUrl,
        isPublic: true,
        inPodcastFeed: true,
      });

      if (!result.success || !result.sermon) {
        return c.json({ error: result.error ?? 'Failed to save sermon' }, 500);
      }

      const rssUrl = await regeneratePodcastFeed();

      return c.json({
        success: true,
        sermonId: result.sermon.id,
        title: result.sermon.title,
        rssUrl,
      });
    }
  )

;

export default sermonProcess;
