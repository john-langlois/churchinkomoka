/**
 * Lightweight YouTube helpers — no external library, no binary.
 * Uses YouTube's public oEmbed endpoint (no auth, no bot detection).
 */

export interface YouTubeMeta {
  title: string;
  authorName: string;
}

/**
 * Fetch basic video metadata via YouTube's public oEmbed API.
 * Returns null if the URL is invalid or the request fails.
 */
export async function fetchYouTubeMeta(youtubeUrl: string): Promise<YouTubeMeta | null> {
  try {
    const endpoint =
      `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title ?? '',
      authorName: data.author_name ?? '',
    };
  } catch {
    return null;
  }
}

/**
 * Extract the YouTube video ID from a full URL or return the value as-is
 * when a bare ID is passed.
 */
export function extractYouTubeId(urlOrId: string): string {
  try {
    const url = new URL(urlOrId);
    const v = url.searchParams.get('v');
    if (v) return v;
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1];
  } catch {
    return urlOrId;
  }
}
