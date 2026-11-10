import type { Metadata } from 'next';
import ResourcesPage from './ResourcesClient';
import { db } from '@/src/lib/db/connection';
import { sermons as sermonsTable } from '@/src/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// Served from the ISR cache; sermon mutations call revalidatePath.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Sermons & Resources',
  description: 'Browse sermons, teachings, and resources from Church in Komoka. Watch on YouTube, listen on Spotify, or read along — faithful Biblical exposition available any time.',
  alternates: {
    canonical: 'https://churchinkomoka.com/resources',
  },
  openGraph: {
    title: 'Sermons & Resources — Church in Komoka',
    description: 'Browse sermons, teachings, and resources from Church in Komoka. Watch on YouTube, listen on Spotify, or read along — faithful Biblical exposition available any time.',
    url: 'https://churchinkomoka.com/resources',
  },
};

export default async function Page() {
  // Deliberately not the swallow-errors service: if the DB is down we want the
  // build/revalidation to fail (and keep the previous page), not cache an empty list.
  const sermons = await db
    .select()
    .from(sermonsTable)
    .where(eq(sermonsTable.isPublic, true))
    .orderBy(desc(sermonsTable.date));
  return (
    <ResourcesPage
      initialSermons={sermons.map((s) => ({
        id: s.id,
        title: s.title,
        speaker: s.speaker ?? '',
        date: s.date ?? '',
        youtubeId: s.youtubeId ?? undefined,
        spotifyLink: s.spotifyLink ?? undefined,
        articleContent: s.articleContent ?? undefined,
        isPublic: s.isPublic,
      }))}
    />
  );
}
