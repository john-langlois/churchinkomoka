---
name: ingest-sermon
description: Turn a YouTube sermon video into a sermon page (summary article) and a podcast episode. Claude writes the article itself, previews it with the user, then saves it as a draft. Use when the user gives a YouTube URL of a sermon and wants it added to the Church in Komoka site / podcast feed.
---

# Ingest a sermon from YouTube

Claude Code writes the article (no other AI service involved), the user reviews a preview and can tweak it, and only then is anything saved.

`<skill>` below is the folder this skill is installed in (e.g. `.claude/skills/ingest-sermon` or `~/.claude/skills/ingest-sermon`).

## Prerequisites (check first)
- `yt-dlp` on PATH (`yt-dlp --version`); install with `brew install yt-dlp`. Node 18+.
- For step 5 only: `SERMON_INGEST_TOKEN` and `BLOB_READ_WRITE_TOKEN` in the shell, `./.env.local`, or `~/.ingest-sermon.env`. Optional `SITE_URL`. The site must have the same `SERMON_INGEST_TOKEN` set in Vercel.

## Steps
1. **Get inputs.** The YouTube URL and the **speaker name** (required). Title and date default to the video's.
2. **Prepare** (downloads audio + captions, saves and uploads nothing):
   ```bash
   node <skill>/ingest.mjs prepare "<url>" --speaker "<name>" [--title "<t>"] [--date YYYY-MM-DD]
   ```
   It prints a folder (`~/.cache/ingest-sermon/<video-id>/`) containing `transcript.txt` and `meta.json`. If it reports no captions, stop and tell the user: there is nothing to summarise.
3. **Write the article.** Read `<skill>/style.md` (the user's editable style guide) and the whole `transcript.txt`, then write the article to `<folder>/article.md` following the style guide exactly. Also set a clean `title` in `<folder>/meta.json` (see the style guide).
4. **Preview.** Show the user, in chat: title, speaker, date, and the full article exactly as it will appear. Flag anything uncertain ("check: ..."). Nothing is saved yet. Revise `article.md` until the user is happy. If they give feedback that should apply to every future sermon (tone, length, structure), offer to add it to `<skill>/style.md`.
5. **Save as a draft, only after the user approves:**
   ```bash
   node <skill>/ingest.mjs publish <video-id>
   ```
   This uploads the audio and saves a **private draft** (not public, not in the feed yet). Show the returned `pageUrl`. The user publishes by toggling visibility in `/admin`; the episode is already flagged for the podcast feed and `/api/podcast` is live from the database, so page and episode go live together.
   Add `--publish` only if the user explicitly asks to go live immediately.

Never print the tokens. Never run step 5 before the user has seen and approved the preview.
