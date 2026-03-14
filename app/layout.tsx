import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
});

const BASE_URL = 'https://churchinkomoka.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Church in Komoka',
    template: '%s — Church in Komoka',
  },
  description: 'A spiritual family in Komoka, ON — living life together, bearing one another\'s burdens, and growing in grace. Sundays at 10:00 AM.',
  applicationName: 'Church in Komoka',
  keywords: ['church', 'Komoka', 'Ontario', 'Christian', 'Sunday service', 'sermons', 'community', 'faith', 'Jesus', 'disciples'],
  authors: [{ name: 'Church in Komoka' }],
  creator: 'Church in Komoka',
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: BASE_URL,
    siteName: 'Church in Komoka',
    title: 'Church in Komoka',
    description: 'A spiritual family in Komoka, ON — living life together, bearing one another\'s burdens, and growing in grace. Sundays at 10:00 AM.',
    images: [
      {
        url: '/images/CHURCH IN KOMOKA.png',
        width: 1024,
        height: 1024,
        alt: 'Church in Komoka',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Church in Komoka',
    description: 'A spiritual family in Komoka, ON — living life together, bearing one another\'s burdens, and growing in grace.',
    images: ['/images/CHURCH IN KOMOKA.png'],
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Church',
  name: 'Church in Komoka',
  url: 'https://churchinkomoka.com',
  logo: 'https://churchinkomoka.com/images/CHURCH IN KOMOKA.png',
  email: 'info@churchinkomoka.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '93 Queen St',
    addressLocality: 'Komoka',
    addressRegion: 'ON',
    postalCode: 'N0L 1R0',
    addressCountry: 'CA',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 42.9617,
    longitude: -81.4137,
  },
  openingHours: 'Su 10:00-12:00',
  description: 'A spiritual family in Komoka, ON — living life together, bearing one another\'s burdens, and growing in grace.',
  sameAs: [
    'https://www.youtube.com/@churchinkomoka',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
