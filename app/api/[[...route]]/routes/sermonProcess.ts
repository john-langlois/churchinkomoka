import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { streamSSE, type SSEStreamingApi } from 'hono/streaming';
import { auth } from '@/auth';
import { getVideoInfo, extractAudio, formatUploadDate } from '@/src/services/youtubeService';
import { transcribeAndRewrite } from '@/src/services/geminiService';
import { uploadAudio } from '@/src/services/blobService';
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
  youtubeUrl: z.string().url('Must be a valid YouTube URL'),
  preacherName: z.string().min(1, 'Preacher name is required'),
});

const confirmSchema = z.object({
  title: z.string().min(1),
  speaker: z.string(),
  date: z.string().nullable(),
  youtubeUrl: z.string().url(),
  audioUrl: z.string().url(),
  articleContent: z.string(),
});


// ─── Routes ────────────────────────────────────────────────────────────────

const sermonProcess = new Hono()

  /**
   * POST /api/sermons/process
   * Phase 1: YouTube → audio → transcribe → thumbnail.
   * Streams SSE progress and ends with a `review` event containing all
   * generated content for the admin to approve/edit before publishing.
   */
  .post(
    '/process',
    zValidator('json', processSchema),
    async (c) => {
      const isAdmin = await checkAdmin();
      if (!isAdmin) return c.json({ error: 'Unauthorized' }, 403);

      const { youtubeUrl, preacherName } = c.req.valid('json');

      return streamSSE(c, async (stream) => {
        try {
          // ── Step 1: Fetch YouTube metadata ────────────────────────────
          await sendStep(stream, 'metadata', 'Fetching video info from YouTube…');
          const videoInfo = await getVideoInfo(youtubeUrl);
          const sermonDate = formatUploadDate(videoInfo.uploadDate);
          await sendStep(stream, 'metadata', `Found: "${videoInfo.title}"`, {
            title: videoInfo.title,
            date: sermonDate,
          });

          // ── Step 2: Extract audio ─────────────────────────────────────
          await sendStep(stream, 'audio', 'Extracting audio from YouTube video…');
          const { buffer: audioBuffer, filename: audioFilename } = await extractAudio(
            youtubeUrl,
            videoInfo.id ?? youtubeUrl
          );
          await sendStep(stream, 'audio', 'Audio extraction complete.');

          // ── Step 3: Upload audio ──────────────────────────────────────
          await sendStep(stream, 'upload_audio', 'Uploading audio to storage…');
          const audioUrl = await uploadAudio(audioBuffer, audioFilename);
          await sendStep(stream, 'upload_audio', 'Audio uploaded.', { audioUrl });

          // ── Step 4: Transcribe + rewrite ──────────────────────────────
          await sendStep(stream, 'transcribe', 'Transcribing and rewriting with Gemini…');
          const { articleContent, podcastDescription } = await transcribeAndRewrite(
            audioBuffer,
            audioFilename,
            videoInfo.title
          );
          await sendStep(stream, 'transcribe', 'Transcription complete.');

          // ── Pause for review ──────────────────────────────────────────
          await sendStep(stream, 'review', 'Ready for your review.', {
            title: videoInfo.title,
            speaker: preacherName,
            date: sermonDate || null,
            youtubeUrl,
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
   * Called after the admin has reviewed/edited the transcript and thumbnail.
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
        youtubeId: body.youtubeUrl,
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
