import type { Metadata } from 'next';
import CalendarPage from './CalendarClient';
import { getUpcomingEvents } from '@/src/services/eventService';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Events & Calendar',
  description: 'Stay connected with what\'s happening at Church in Komoka — weekly services, prayer nights, retreats, Bible studies, and community events. Sundays at 10:00 AM at Providence Collegiate, 93 Queen St, Komoka ON.',
  alternates: {
    canonical: 'https://churchinkomoka.com/calendar',
  },
  openGraph: {
    title: 'Events & Calendar — Church in Komoka',
    description: 'Stay connected with what\'s happening at Church in Komoka — weekly services, prayer nights, retreats, Bible studies, and community events.',
    url: 'https://churchinkomoka.com/calendar',
  },
};

export default async function Page() {
  const events = await getUpcomingEvents(undefined, { throwOnError: true });
  return <CalendarPage initialEvents={JSON.parse(JSON.stringify(events))} />;
}
