'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Music } from 'lucide-react';

type Sermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  thumbnail?: string;
  youtubeId?: string;
  spotifyLink?: string;
  articleContent?: {
    intro: string;
    paragraphs: string[];
    takeaways: string[];
  };
};

export default function SermonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSermon();
  }, [id]);

  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, [id]);

  const fetchSermon = async () => {
    try {
      const res = await fetch(`/api/sermons/${id}`);
      const data = await res.json();
      setSermon(data.sermon);
    } catch (error) {
      console.error('Error fetching sermon:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-28 pb-20 px-6 flex items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="min-h-screen bg-white pt-28 pb-20 px-6 flex items-center justify-center">
        <p className="text-stone-500">Sermon not found</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center text-xs font-bold uppercase tracking-widest text-stone-400 mb-8">
          <Link href="/resources" className="hover:text-stone-900 transition-colors">Resources</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-stone-900 line-clamp-1">{sermon.title}</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-stone-900 mb-4 leading-tight">{sermon.title}</h1>
        <p className="text-stone-500 mb-8 text-lg font-medium">{sermon.date} • {sermon.speaker}</p>
        <article className="prose prose-lg prose-stone max-w-none">
          {sermon.youtubeId && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg mb-8 bg-black">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${sermon.youtubeId}`} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="border-0"></iframe>
            </div>
          )}
          {sermon.spotifyLink && (
            <a href={sermon.spotifyLink} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-[#1DB954] hover:bg-[#1ed760] text-white p-4 rounded-xl shadow-md transition-colors no-underline mb-12">
              <Music className="w-8 h-8" />
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-none m-0">Listen on Spotify</span>
                <span className="text-white/80 text-sm m-0">Audio Podcast Available</span>
              </div>
              <ChevronRight className="w-6 h-6 ml-auto" />
            </a>
          )}
          {sermon.articleContent && (
            <div className="font-sans">
              <p className="font-medium text-xl leading-relaxed mb-6">{sermon.articleContent.intro}</p>
              {sermon.articleContent.paragraphs?.map((para, i) => <p key={i} className="mb-4 text-stone-600 leading-relaxed">{para}</p>)}
              {sermon.articleContent.takeaways && sermon.articleContent.takeaways.length > 0 && (
                <>
                  <h3 className="text-2xl font-bold mt-8 mb-4">Key Takeaways</h3>
                  <ul className="list-disc pl-5 space-y-2 marker:text-stone-900">
                    {sermon.articleContent.takeaways.map((point, i) => <li key={i} className="text-stone-700">{point}</li>)}
                  </ul>
                </>
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
