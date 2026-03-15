import { Feed } from 'feed';
import { getPodcastSermons } from './sermonService';
import { uploadPodcastFeed } from './blobService';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://churchinkomoka.com';
const PODCAST_AUTHOR_EMAIL = process.env.PODCAST_AUTHOR_EMAIL || 'info@churchinkomoka.com';

const PODCAST_TITLE = 'Church in Komoka';
const DEFAULT_COVER_ART = `${APP_URL}/images/CHURCH IN KOMOKA.png`;

/**
 * Build the podcast RSS XML string from sermons marked as inPodcastFeed.
 * Episode titles are formatted as "Sermon Title - Preacher Name".
 */
export async function buildPodcastFeedXml(): Promise<string> {
  const sermons = await getPodcastSermons();

  const feed = new Feed({
    id: `${APP_URL}/podcast`,
    title: PODCAST_TITLE,
    description:
      'Weekly sermons from Church in Komoka. Growing together in faith, love, and community.',
    link: APP_URL,
    language: 'en',
    image: DEFAULT_COVER_ART,
    favicon: `${APP_URL}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} Church in Komoka`,
    updated: sermons[0]?.createdAt ?? new Date(),
    feedLinks: {
      rss: `${APP_URL}/api/podcast`,
    },
    author: {
      name: 'Church in Komoka',
      email: PODCAST_AUTHOR_EMAIL,
      link: APP_URL,
    },
    podcast: true,
    category: 'Religion & Spirituality',
  });

  for (const sermon of sermons) {
    if (!sermon.audioUrl) continue;

    const sermonDate = sermon.date ? new Date(sermon.date + 'T12:00:00') : sermon.createdAt;
    const sermonLink = `${APP_URL}/resources/${sermon.id}`;
    const thumbnailUrl = sermon.thumbnailUrl || DEFAULT_COVER_ART;

    // Episode title: "Sermon Title - Preacher Name"
    const episodeTitle = sermon.speaker
      ? `${sermon.title} - ${sermon.speaker}`
      : sermon.title;

    const description = sermon.articleContent
      ? sermon.articleContent.slice(0, 300).replace(/[*#_`]/g, '') + '…'
      : `Listen to "${sermon.title}" by ${sermon.speaker ?? 'Church in Komoka'}.`;

    feed.addItem({
      id: sermon.id,
      guid: sermon.id,
      title: episodeTitle,
      link: sermonLink,
      date: sermonDate,
      published: sermonDate,
      description,
      author: [
        {
          name: sermon.speaker ?? 'Church in Komoka',
          email: PODCAST_AUTHOR_EMAIL,
        },
      ],
      image: thumbnailUrl,
      audio: {
        url: sermon.audioUrl,
        type: 'audio/mpeg',
      },
      enclosure: {
        url: sermon.audioUrl,
        type: 'audio/mpeg',
      },
    });
  }

  return feed.rss2();
}

/**
 * Regenerate the podcast RSS feed from the DB and push a copy to Vercel Blob.
 */
export async function regeneratePodcastFeed(): Promise<string> {
  const xml = await buildPodcastFeedXml();
  const blobUrl = await uploadPodcastFeed(xml);
  return blobUrl;
}
