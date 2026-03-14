import type { Metadata } from 'next';
import BeliefsPage from './BeliefsClient';

export const metadata: Metadata = {
  title: 'What We Believe',
  description: 'We are disciples of the Lord Jesus Christ — followers committed to His word, His church, and His mission. Read what Church in Komoka believes about God, Scripture, salvation, and the Christian life.',
  alternates: {
    canonical: 'https://churchinkomoka.com/beliefs',
  },
  openGraph: {
    title: 'What We Believe — Church in Komoka',
    description: 'We are disciples of the Lord Jesus Christ — followers committed to His word, His church, and His mission. Read what Church in Komoka believes about God, Scripture, salvation, and the Christian life.',
    url: 'https://churchinkomoka.com/beliefs',
  },
};

export default BeliefsPage;
