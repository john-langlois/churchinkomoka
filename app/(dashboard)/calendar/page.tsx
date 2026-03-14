import type { Metadata } from 'next';
import CalendarPage from './CalendarClient';

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

export default CalendarPage;
