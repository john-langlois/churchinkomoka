'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlayCircle, Youtube, Music, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/src/components/SectionHeader';

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
  isPublic: boolean;
};

export default function ResourcesPage() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSermons();
  }, []);

  const fetchSermons = async () => {
    try {
      const res = await fetch('/api/sermons');
      const data = await res.json();
      setSermons(data.sermons || []);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
         <SectionHeader title="Resources" />

         {loading ? (
           <p className="text-stone-500 text-center py-8">Loading sermons...</p>
         ) : sermons.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sermons.map((sermon) => (
                <Link key={sermon.id} href={`/resources/${sermon.id}`} className="group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="aspect-video bg-stone-200 relative overflow-hidden">
                    <img src={sermon.thumbnail} alt={sermon.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="text-white w-16 h-16" />
                    </div>
                </div>
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Video</span>
                    <span className="text-[10px] font-bold tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Audio</span>
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">{sermon.title}</h3>
                    <p className="text-stone-500 text-sm font-medium mb-6">{sermon.date} • {sermon.speaker}</p>
                    <div className="flex items-center gap-4 pt-6 border-t border-stone-100">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <Youtube size={16} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                        <Music size={16} />
                    </div>
                    <span className="ml-auto text-xs font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors flex items-center">
                        Read <ChevronRight size={14} className="ml-1" />
                    </span>
                    </div>
                </div>
                </Link>
            ))}
           </div>
         ) : (
           <p className="text-stone-500 text-center py-8">No sermons available</p>
         )}
      </div>
    </div>
  );
}
