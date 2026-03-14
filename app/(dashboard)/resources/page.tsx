import type { Metadata } from 'next';
import ResourcesPage from './ResourcesClient';

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

export default ResourcesPage;
