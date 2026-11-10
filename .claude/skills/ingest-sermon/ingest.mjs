#!/usr/bin/env node
// Two-step sermon ingest. Self-contained: needs only Node 18+ and yt-dlp on PATH.
//
//   node ingest.mjs prepare <youtube-url> --speaker "Name" [--title "T"] [--date YYYY-MM-DD]
//       Downloads audio + captions into ~/.cache/ingest-sermon/<video-id>/ and writes
//       transcript.txt + meta.json. No tokens needed, nothing is uploaded or saved.
//
//   (Claude Code then writes article.md in that folder and shows
//    the preview. See SKILL.md and style.md.)
//
//   node ingest.mjs publish <video-id-or-folder> [--publish]
//       Uploads the audio to Vercel Blob and saves the sermon on the site as a private
//       draft (or public + in the podcast feed with --publish).
//
// Env for `publish` (shell, ./.env.local, or ~/.ingest-sermon.env):
//   BLOB_READ_WRITE_TOKEN, SERMON_INGEST_TOKEN, SITE_URL (default https://www.churchinkomoka.com)

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename, isAbsolute } from 'node:path';

for (const f of ['.env.local', '.env', join(homedir(), '.ingest-sermon.env')]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const [cmd, target, ...rest] = process.argv.slice(2);
const flag = (n) => {
  const i = rest.indexOf(`--${n}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const CACHE = join(homedir(), '.cache', 'ingest-sermon');
const die = (msg, code = 1) => {
  console.error(msg);
  process.exit(code);
};

if (cmd === 'prepare') await prepare();
else if (cmd === 'publish') await publish();
else die('Usage:\n  ingest.mjs prepare <youtube-url> --speaker "Name" [--title T] [--date YYYY-MM-DD]\n  ingest.mjs publish <video-id-or-folder> [--publish]', 2);

// ── prepare ─────────────────────────────────────────────────────────────────
async function prepare() {
  const url = target;
  const speaker = flag('speaker');
  if (!url || !/^https?:/.test(url) || !speaker) die('Usage: ingest.mjs prepare <youtube-url> --speaker "Name" [--title T] [--date YYYY-MM-DD]', 2);

  const run = (a) => execFileSync('yt-dlp', a, { encoding: 'utf8', maxBuffer: 1 << 28 });

  console.log('→ Reading video metadata…');
  const info = JSON.parse(run(['--dump-single-json', '--no-playlist', url]));
  const dir = join(CACHE, info.id);
  mkdirSync(dir, { recursive: true });
  const ud = info.upload_date;
  const date = flag('date') || (ud ? `${ud.slice(0, 4)}-${ud.slice(4, 6)}-${ud.slice(6)}` : null);
  const title = flag('title') || info.title;

  let audioFile = readdirSync(dir).find((f) => /^sermon\.(m4a|mp3|webm|ogg|opus)$/.test(f));
  if (audioFile) console.log('→ Audio already downloaded, reusing.');
  else {
    console.log('→ Downloading audio…');
    run(['--no-playlist', '-f', 'bestaudio[ext=m4a]/bestaudio', '-o', join(dir, 'sermon.%(ext)s'), url]);
    audioFile = readdirSync(dir).find((f) => /^sermon\.(m4a|mp3|webm|ogg|opus)$/.test(f));
  }
  if (!audioFile) die('yt-dlp produced no audio file');

  // Captions are best-effort: only plain English tracks (auto-translations are
  // rate limited by YouTube and used to crash the run).
  console.log('→ Fetching captions…');
  if (!readdirSync(dir).some((f) => f.endsWith('.vtt'))) {
    try {
      run(['--no-playlist', '--skip-download', '--write-subs', '--write-auto-subs', '--sub-langs', 'en,en-orig', '--sub-format', 'vtt', '-o', join(dir, 'sermon.%(ext)s'), url]);
    } catch (err) {
      console.warn(`  (captions unavailable: ${String(err.stderr || err.message).split('\n')[0].slice(0, 120)})`);
    }
  }
  const vtt = readdirSync(dir).find((f) => f === 'sermon.en.vtt') || readdirSync(dir).find((f) => f.endsWith('.vtt'));
  let transcript = null;
  if (vtt) {
    // Rolling auto-captions repeat lines; drop consecutive duplicates.
    const out = [];
    let prev = '';
    for (const raw of readFileSync(join(dir, vtt), 'utf8').split('\n')) {
      const line = raw.replace(/<[^>]+>/g, '').trim();
      if (!line || line === 'WEBVTT' || /-->|^(Kind|Language|NOTE):/.test(line)) continue;
      if (line !== prev) out.push(line);
      prev = line;
    }
    transcript = out.join(' ');
    writeFileSync(join(dir, 'transcript.txt'), transcript + '\n');
  }

  const ext = audioFile.split('.').pop();
  const mime = { m4a: 'audio/mp4', mp3: 'audio/mpeg', webm: 'audio/webm', ogg: 'audio/ogg', opus: 'audio/ogg' }[ext] ?? 'audio/mp4';
  const meta = { id: info.id, youtubeUrl: url, title, speaker, date, audioFile, audioMimeType: mime };
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');

  console.log(JSON.stringify({
    ...meta,
    folder: dir,
    audioMB: +(statSync(join(dir, audioFile)).size / 1e6).toFixed(1),
    transcript: transcript ? join(dir, 'transcript.txt') : null,
    transcriptChars: transcript?.length ?? 0,
    next: transcript
      ? 'Write article.md in the folder (see style.md), preview with the user, then run `publish`.'
      : 'NO CAPTIONS found: there is no transcript to summarise. Tell the user.',
  }, null, 2));
}

// ── publish ─────────────────────────────────────────────────────────────────
async function publish() {
  if (!target) die('Usage: ingest.mjs publish <video-id-or-folder> [--publish]', 2);
  const dir = isAbsolute(target) ? target : join(CACHE, target);
  const need = (f) => {
    if (!existsSync(join(dir, f))) die(`Missing ${join(dir, f)}`);
    return readFileSync(join(dir, f), 'utf8').trim();
  };
  const meta = JSON.parse(need('meta.json'));
  const articleContent = need('article.md');
  const publishNow = rest.includes('--publish');

  for (const k of ['BLOB_READ_WRITE_TOKEN', 'SERMON_INGEST_TOKEN']) {
    if (!process.env[k]) die(`Missing ${k} (set it in ~/.ingest-sermon.env)`, 2);
  }
  const site = (process.env.SITE_URL || 'https://www.churchinkomoka.com').replace(/\/$/, '');

  const slug = meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const ext = meta.audioFile.split('.').pop();
  const blobPath = `sermons/audio/${meta.date ?? 'undated'}-${slug}.${ext}`;

  console.log('→ Uploading audio to Blob…');
  const up = await fetch(`https://blob.vercel-storage.com/${blobPath.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      'x-api-version': '7',
      'x-content-type': meta.audioMimeType,
      'x-add-random-suffix': '1',
    },
    body: readFileSync(join(dir, meta.audioFile)),
  });
  if (!up.ok) die(`Blob upload failed: ${up.status} ${await up.text()}`);
  const blob = await up.json();

  console.log(`→ Saving sermon as ${publishNow ? 'PUBLISHED' : 'draft'}…`);
  const res = await fetch(`${site}/api/sermons/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SERMON_INGEST_TOKEN}` },
    body: JSON.stringify({
      youtubeUrl: meta.youtubeUrl,
      title: meta.title,
      speaker: meta.speaker,
      date: meta.date,
      audioUrl: blob.url,
      audioMimeType: meta.audioMimeType,
      articleContent,
      publish: publishNow,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) die(`Ingest failed: ${res.status} ${JSON.stringify(body)}`);
  console.log(JSON.stringify({ ...body, audio: basename(blob.url) }, null, 2));
}
