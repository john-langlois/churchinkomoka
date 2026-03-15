import ytdl from '@distube/ytdl-core';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  uploadDate: string; // normalised to YYYY-MM-DD
  uploader: string;
  durationSeconds: number;
  thumbnailUrl: string;
}

export interface ExtractedAudio {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Extract the YouTube video ID from a full URL or bare ID string.
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

/**
 * Fetch video metadata without downloading media.
 */
export async function getVideoInfo(youtubeUrl: string): Promise<YouTubeVideoInfo> {
  const info = await ytdl.getInfo(youtubeUrl);
  const d = info.videoDetails;

  return {
    id: d.videoId,
    title: d.title,
    description: d.description ?? '',
    uploadDate: normaliseDate(d.uploadDate ?? d.publishDate ?? ''),
    uploader: d.author?.name ?? '',
    durationSeconds: parseInt(d.lengthSeconds ?? '0', 10),
    thumbnailUrl: d.thumbnails?.[d.thumbnails.length - 1]?.url ?? '',
  };
}

/**
 * Download the audio track of a YouTube video and return it as a Buffer.
 * Prefers MP4/AAC (natively supported by Spotify & Gemini); falls back to
 * whatever best-quality audio format is available.
 */
export async function extractAudio(youtubeUrl: string, videoId: string): Promise<ExtractedAudio> {
  const info = await ytdl.getInfo(youtubeUrl);

  // Prefer mp4 audio (aac) for widest compatibility
  const mp4Format = ytdl.chooseFormat(info.formats, {
    filter: (f) => !!f.hasAudio && !f.hasVideo && f.container === 'mp4',
    quality: 'highestaudio',
  });

  const chosenFormat = mp4Format ?? ytdl.chooseFormat(info.formats, {
    filter: 'audioonly',
    quality: 'highestaudio',
  });

  const ext = chosenFormat?.container === 'mp4' ? 'mp4' : 'webm';
  const mimeType = ext === 'mp4' ? 'audio/mp4' : 'audio/webm';
  const filename = `sermon_${videoId}_${Date.now()}.${ext}`;
  const tmpPath = path.join(os.tmpdir(), filename);

  try {
    const audioStream = ytdl.downloadFromInfo(info, { format: chosenFormat });
    await pipeline(audioStream, createWriteStream(tmpPath));
    const buffer = await fs.readFile(tmpPath);
    return { buffer, filename, mimeType };
  } finally {
    await fs.unlink(tmpPath).catch(() => undefined);
  }
}

/**
 * Normalise various date string formats to YYYY-MM-DD.
 * - ytdl-core may return "January 15, 2024", "2024-01-15", or "20240115"
 */
export function normaliseDate(raw: string): string {
  if (!raw) return '';
  // Already ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // yt-dlp style YYYYMMDD
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  // Human-readable: try JS Date parser
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
}

/** @deprecated use normaliseDate */
export function formatUploadDate(uploadDate: string): string {
  return normaliseDate(uploadDate);
}
