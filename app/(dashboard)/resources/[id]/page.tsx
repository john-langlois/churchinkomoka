import type { Metadata } from 'next';
import SermonDetailPage from './SermonClient';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`https://churchinkomoka.com/api/sermons/${id}`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const sermon = data.sermon;

      if (sermon) {
        const description = sermon.articleContent
          ? sermon.articleContent.replace(/[#*_`>\[\]]/g, '').trim().slice(0, 160)
          : `A sermon by ${sermon.speaker} — listen on Spotify, watch on YouTube, or read along at Church in Komoka.`;

        return {
          title: sermon.title,
          description,
          alternates: {
            canonical: `https://churchinkomoka.com/resources/${id}`,
          },
          openGraph: {
            title: `${sermon.title} — Church in Komoka`,
            description,
            url: `https://churchinkomoka.com/resources/${id}`,
            type: 'article',
          },
        };
      }
    }
  } catch {
    // Fall through to default
  }

  return {
    title: 'Sermon',
    description: 'A sermon from Church in Komoka. Listen on Spotify, watch on YouTube, or read along.',
  };
}

export default function Page({ params }: Props) {
  return <SermonDetailPage params={params} />;
}
