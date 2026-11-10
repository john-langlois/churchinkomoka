---
name: ingest-sermon
description: Turn a YouTube sermon video into a sermon page (summary article) and a podcast episode. Use when the user gives a YouTube URL of a sermon and wants it added to the Church in Komoka site / podcast feed.
---

# Ingest a sermon from YouTube

Runs on the user's own machine (YouTube blocks cloud IPs). It extracts audio and captions with `yt-dlp`, uploads the audio to Vercel Blob, then calls `POST /api/sermons/ingest` on the site, which rewrites the transcript into the article, saves the sermon, and (with `--publish`) adds it to the podcast feed and regenerates the XML.

## Prerequisites (check first)
- `yt-dlp` on PATH (`yt-dlp --version`); install with `brew install yt-dlp` or `pipx install yt-dlp`.
- Run from the repo root after `npm install`.
- `BLOB_READ_WRITE_TOKEN` and `SERMON_INGEST_TOKEN` in `.env.local` or the shell. The server must have the same `SERMON_INGEST_TOKEN` (and `GOOGLE_API_KEY`) set in Vercel. Optional `SITE_URL` (e.g. `http://localhost:3000` to test locally).

## Steps
1. Get from the user: the YouTube URL and the **speaker name** (required). Title and date default to the video's.
2. Run it as a **draft** first:
   ```bash
   node .claude/skills/ingest-sermon/ingest.mjs "<url>" --speaker "<name>" [--title "<t>"] [--date YYYY-MM-DD]
   ```
3. Show the user the returned `pageUrl` and `podcastDescription`. The draft is private (not public, not in the feed) so they can review and edit it in `/admin`.
4. Only when the user approves, publish by toggling visibility in `/admin` (the episode is already flagged for the feed, and `/api/podcast` is generated live from the DB, so page and episode go live together). `--publish` does the same at ingest time and also refreshes the `podcast/feed.xml` Blob copy.

Do not pass `--publish` on the first run unless the user explicitly asks to publish immediately. Never print the tokens.
