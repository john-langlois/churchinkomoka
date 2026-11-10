#!/usr/bin/env node
// Usage: node .claude/skills/ingest-sermon/ingest.mjs <youtube-url> --speaker "Name" [--title "T"] [--date YYYY-MM-DD] [--publish]
// Self-contained: needs only Node 18+ and yt-dlp on PATH. Run from anywhere.
//
// Env (shell, ./.env.local, or ~/.ingest-sermon.env): BLOB_READ_WRITE_TOKEN,
// SERMON_INGEST_TOKEN, SITE_URL (default https://churchinkomoka.com)

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, basename } from 'node:path';

// ── tiny .env.local loader (no dependency) ──────────────────────────────────
for (const f of ['.env.local', '.env', join(homedir(), '.ingest-sermon.env')]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--') && /^https?:/.test(a));
const flag = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const publish = args.includes('--publish');
const speaker = flag('speaker');
if (!url || !speaker) {
  console.error('Usage: ingest.mjs <youtube-url> --speaker "Name" [--title T] [--date YYYY-MM-DD] [--publish]');
  process.exit(2);
}
for (const k of ['BLOB_READ_WRITE_TOKEN', 'SERMON_INGEST_TOKEN']) {
  if (!process.env[k]) {
    console.error(`Missing ${k}`);
    process.exit(2);
  }
}
const site = (process.env.SITE_URL || 'https://churchinkomoka.com').replace(/\/$/, '');

// ── 1. metadata + audio + captions via yt-dlp ───────────────────────────────
const dir = mkdtempSync(join(tmpdir(), 'sermon-'));
const run = (a) => execFileSync('yt-dlp', a, { encoding: 'utf8', maxBuffer: 1 << 28 });

console.log('→ Reading video metadata…');
const meta = JSON.parse(run(['--dump-single-json', '--no-playlist', url]));
const title = flag('title') || meta.title;
const ud = meta.upload_date; // YYYYMMDD
const date = flag('date') || (ud ? `${ud.slice(0, 4)}-${ud.slice(4, 6)}-${ud.slice(6)}` : undefined);

console.log('→ Downloading audio + captions…');
run([
  '--no-playlist',
  '-f', 'bestaudio[ext=m4a]/bestaudio',
  '--write-subs', '--write-auto-subs', '--sub-langs', 'en.*', '--sub-format', 'vtt',
  '-o', join(dir, 'sermon.%(ext)s'),
  url,
]);
const files = readdirSync(dir);
const audioFile = files.find((f) => /\.(m4a|mp3|webm|ogg|opus)$/.test(f));
const vttFile = files.find((f) => f.endsWith('.vtt'));
if (!audioFile) throw new Error('yt-dlp produced no audio file');

// ── 2. VTT → plain text (rolling auto-captions repeat lines) ────────────────
let transcript;
if (vttFile) {
  const out = [];
  let prev = '';
  for (const raw of readFileSync(join(dir, vttFile), 'utf8').split('\n')) {
    const line = raw.replace(/<[^>]+>/g, '').trim();
    if (!line || line === 'WEBVTT' || /-->|^(Kind|Language|NOTE):/.test(line)) continue;
    if (line !== prev) out.push(line);
    prev = line;
  }
  transcript = out.join(' ');
  console.log(`→ Captions found (${transcript.length} chars).`);
} else {
  console.log('→ No captions; server will transcribe the audio instead.');
}

// ── 3. upload audio to Vercel Blob ──────────────────────────────────────────
const ext = audioFile.split('.').pop();
const mime = { m4a: 'audio/mp4', mp3: 'audio/mpeg', webm: 'audio/webm', ogg: 'audio/ogg', opus: 'audio/ogg' }[ext] ?? 'audio/mp4';
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
console.log('→ Uploading audio to Blob…');
// Vercel Blob REST API (no SDK needed).
const blobPath = `sermons/audio/${date ?? 'undated'}-${slug}.${ext}`;
const up = await fetch(`https://blob.vercel-storage.com/${blobPath.split('/').map(encodeURIComponent).join('/')}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    'x-api-version': '7',
    'x-content-type': mime,
    'x-add-random-suffix': '1',
  },
  body: readFileSync(join(dir, audioFile)),
});
if (!up.ok) {
  console.error('Blob upload failed:', up.status, await up.text());
  process.exit(1);
}
const blob = await up.json();

// ── 4. hand off to the site ─────────────────────────────────────────────────
console.log(`→ Summarising and saving as ${publish ? 'PUBLISHED' : 'draft'}…`);
const res = await fetch(`${site}/api/sermons/ingest`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SERMON_INGEST_TOKEN}` },
  body: JSON.stringify({
    youtubeUrl: url, title, speaker, date: date ?? null,
    audioUrl: blob.url, audioMimeType: mime, transcript, publish,
  }),
});
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('Ingest failed:', res.status, body);
  process.exit(1);
}
console.log(JSON.stringify({ ...body, title, speaker, date, audio: basename(blob.url) }, null, 2));
