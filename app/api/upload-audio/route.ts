import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/flac',
];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Verify the requester is an admin
        const session = await auth();
        if ((session?.user as any)?.isAdmin !== true) {
          throw new Error('Unauthorized');
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          // 500 MB max — typical sermon audio is 30–150 MB
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uploadedAt: new Date().toISOString() }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('[upload-audio] Upload complete:', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error('[upload-audio] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 400 },
    );
  }
}
