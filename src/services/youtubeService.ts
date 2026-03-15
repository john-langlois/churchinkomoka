import { YtDlp } from 'ytdlp-nodejs';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// yt-dlp binary is not bundled — download it on first use into /tmp,
// which is writable on both local systems and Vercel Lambda.
const YTDLP_BIN = '/tmp/yt-dlp';
const YTDLP_URL =
  'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

async function ensureYtDlp(): Promise<string> {
  if (!existsSync(YTDLP_BIN)) {
    console.log('[youtubeService] Downloading yt-dlp binary…');
    execSync(`curl -fsSL "${YTDLP_URL}" -o "${YTDLP_BIN}"`, { stdio: 'pipe' });
    execSync(`chmod +x "${YTDLP_BIN}"`);
    console.log('[youtubeService] yt-dlp binary ready.');
  }
  return YTDLP_BIN;
}

function makeYtDlp(binaryPath: string) {
  return new YtDlp({ binaryPath });
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  uploadDate: string; // YYYYMMDD from yt-dlp
  uploader: string;
  durationSeconds: number;
  thumbnailUrl: string;
}

export interface ExtractedAudio {
  buffer: Buffer;
  filename: string;
}

/**
 * Extract the YouTube video ID from a URL or return the ID if already bare.
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
 * Fetch video metadata without downloading the video.
 */
export async function getVideoInfo(youtubeUrl: string): Promise<YouTubeVideoInfo> {
  const bin = await ensureYtDlp();
  const ytdlp = makeYtDlp(bin);
  const info = await ytdlp.getInfoAsync<'video'>(youtubeUrl);

  return {
    id: info.id,
    title: info.title,
    description: info.description ?? '',
    uploadDate: info.upload_date ?? '',
    uploader: info.uploader ?? '',
    durationSeconds: info.duration ?? 0,
    thumbnailUrl: info.thumbnail ?? '',
  };
}

/**
 * Download audio-only stream from a YouTube video and return as a Buffer.
 * Uses a temp file to avoid holding the full stream in memory at once.
 */
export async function extractAudio(youtubeUrl: string, videoId: string): Promise<ExtractedAudio> {
  const bin = await ensureYtDlp();
  const ytdlp = makeYtDlp(bin);

  const tmpDir = os.tmpdir();
  const filename = `sermon_${videoId}_${Date.now()}.mp3`;
  const tmpPath = path.join(tmpDir, filename);

  try {
    const writeStream = (await import('node:fs')).createWriteStream(tmpPath);

    await ytdlp
      .stream(youtubeUrl)
      .filter('audioonly')
      .type('mp3')
      .pipe(writeStream);

    const buffer = await fs.readFile(tmpPath);
    return { buffer, filename };
  } finally {
    await fs.unlink(tmpPath).catch(() => undefined);
  }
}

/**
 * Convert a yt-dlp upload_date string (YYYYMMDD) to an ISO date (YYYY-MM-DD).
 */
export function formatUploadDate(uploadDate: string): string {
  if (!uploadDate || uploadDate.length !== 8) return '';
  return `${uploadDate.slice(0, 4)}-${uploadDate.slice(4, 6)}-${uploadDate.slice(6, 8)}`;
}
