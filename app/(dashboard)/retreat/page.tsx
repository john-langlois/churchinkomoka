import type { Metadata } from 'next';
import RetreatPage from './RetreatClient';

export const metadata: Metadata = {
  title: 'Retreat Registration',
  description: 'Join us for a Church in Komoka retreat — a time to step away, seek the Lord together, and be refreshed in community. Register online or look up your existing registration.',
  alternates: {
    canonical: 'https://churchinkomoka.com/retreat',
  },
  openGraph: {
    title: 'Retreat Registration — Church in Komoka',
    description: 'Join us for a Church in Komoka retreat — a time to step away, seek the Lord together, and be refreshed in community.',
    url: 'https://churchinkomoka.com/retreat',
  },
};

export default RetreatPage;
