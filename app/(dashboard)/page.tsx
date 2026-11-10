import HomePage from './HomeClient';
import { getUpcomingEvents } from '@/src/services/eventService';
import { getPublicSermons } from '@/src/services/sermonService';

// Events depend on "now" (next occurrence), so keep this short. Admin edits
// revalidate immediately via revalidateEvents / revalidateSermons.
export const revalidate = 300;

export default async function Page() {
  // throwOnError: fail the build/revalidation rather than caching an empty page.
  const [events, sermons] = await Promise.all([
    getUpcomingEvents(3, { throwOnError: true }),
    getPublicSermons({ throwOnError: true }),
  ]);
  const latest = sermons[0];

  return (
    <HomePage
      // JSON round-trip gives the exact shape the API returned (Dates → strings).
      initialEvents={JSON.parse(JSON.stringify(events))}
      initialSermon={
        latest
          ? {
              id: latest.id,
              title: latest.title,
              speaker: latest.speaker ?? '',
              date: latest.date ?? '',
              youtubeId: latest.youtubeId ?? undefined,
              spotifyLink: latest.spotifyLink ?? undefined,
              articleContent: latest.articleContent ?? undefined,
              isPublic: latest.isPublic,
            }
          : null
      }
    />
  );
}
