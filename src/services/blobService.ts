import { put, del } from '@vercel/blob';

export interface UploadedAssets {
  audioUrl: string;
  thumbnailUrl: string;
}

/**
 * Upload an MP3 audio buffer to Vercel Blob.
 * Returns the public URL.
 */
export async function uploadAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const blob = await put(`sermons/audio/${filename}`, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  });
  return blob.url;
}

/**
 * Upload a PNG thumbnail buffer to Vercel Blob.
 * Returns the public URL.
 */
export async function uploadThumbnail(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  const blob = await put(`sermons/thumbnails/${filename}`, imageBuffer, {
    access: 'public',
    contentType: 'image/png',
  });
  return blob.url;
}

/**
 * Upload the podcast RSS XML feed to Vercel Blob (overwrites on each run).
 * Returns the public URL.
 */
export async function uploadPodcastFeed(xmlContent: string): Promise<string> {
  const blob = await put('podcast/feed.xml', xmlContent, {
    access: 'public',
    contentType: 'application/rss+xml',
    // addRandomSuffix: false keeps the URL stable across regenerations
    addRandomSuffix: false,
  });
  return blob.url;
}

/**
 * Delete a blob by URL (for cleanup on failures).
 */
export async function deleteBlob(url: string): Promise<void> {
  await del(url);
}
