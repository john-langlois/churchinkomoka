'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Music, ChevronRight, Search, X } from 'lucide-react';
import { SpotifyIcon } from '@/src/components/SpotifyIcon';
import { YouTubeIcon } from '@/src/components/YouTubeIcon';
import { format } from 'date-fns';
import { SectionHeader } from '@/src/components/SectionHeader';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

type Sermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  thumbnail?: string;
  youtubeId?: string;
  spotifyLink?: string;
  articleContent?: string; // Markdown content as string
  isPublic: boolean;
};

export default function ResourcesPage() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('all');
  const [contentType, setContentType] = useState<string>('all');

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

  // Get unique speakers
  const speakers = useMemo(() => {
    const uniqueSpeakers = Array.from(
      new Set(sermons.map(s => s.speaker).filter(Boolean))
    ).sort();
    return uniqueSpeakers;
  }, [sermons]);

  // Filter sermons based on search, speaker, and content type
  const filteredSermons = useMemo(() => {
    return sermons.filter((sermon) => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sermon.speaker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sermon.articleContent?.toLowerCase().includes(searchQuery.toLowerCase());

      // Speaker filter
      const matchesSpeaker = 
        selectedSpeaker === 'all' || 
        sermon.speaker === selectedSpeaker;

      // Content type filter
      const hasVideo = !!sermon.youtubeId;
      const hasAudio = !!sermon.spotifyLink;
      
      let matchesContentType = true;
      if (contentType === 'video') {
        matchesContentType = hasVideo;
      } else if (contentType === 'audio') {
        matchesContentType = hasAudio;
      } else if (contentType === 'both') {
        matchesContentType = hasVideo && hasAudio;
      }

      return matchesSearch && matchesSpeaker && matchesContentType;
    });
  }, [sermons, searchQuery, selectedSpeaker, contentType]);

  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
         <SectionHeader title="Resources" />

         {/* Search and Filters */}
         <div className="mb-8 flex flex-col sm:flex-row items-start gap-4">
           {/* Search Bar */}
           <div className="relative flex-1 min-w-0">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
             <Input
               type="text"
               placeholder="Search sermons by title, speaker, or content..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-12 pr-10 w-full"
             />
             {searchQuery && (
               <button
                 onClick={() => setSearchQuery('')}
                 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
               >
                 <X className="w-5 h-5" />
               </button>
             )}
           </div>

           {/* Speaker Filter */}
           <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
             <SelectTrigger className="w-full sm:w-[200px]">
               <SelectValue placeholder="All Speakers" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Speakers</SelectItem>
               {speakers.map((speaker) => (
                 <SelectItem key={speaker} value={speaker}>
                   {speaker}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>

           {/* Content Type Filter */}
           <Select value={contentType} onValueChange={setContentType}>
             <SelectTrigger className="w-full sm:w-[200px]">
               <SelectValue placeholder="All Content" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Content</SelectItem>
               <SelectItem value="video">Video Only</SelectItem>
               <SelectItem value="audio">Audio Only</SelectItem>
               <SelectItem value="both">Video & Audio</SelectItem>
             </SelectContent>
           </Select>
         </div>

         {loading ? (
           <p className="text-stone-500 text-center py-8">Loading sermons...</p>
         ) : filteredSermons.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSermons.map((sermon) => (
                <Link key={sermon.id} href={`/resources/${sermon.id}`} className="group bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      {(sermon.youtubeId || sermon.spotifyLink) && (
                        <div className="flex items-center gap-3">
                          {sermon.youtubeId && (
                            <span className="text-[10px] font-bold tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Video</span>
                          )}
                          {sermon.spotifyLink && (
                            <span className="text-[10px] font-bold tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Audio</span>
                          )}
                        </div>
                      )}
                      {sermon.date && (
                        <span className="text-stone-500 text-sm font-medium">
                          {format(new Date(sermon.date), 'LLL d, yyyy')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">{sermon.title}</h3>
                    <p className="text-stone-500 text-sm font-medium mb-6">{sermon.speaker}</p>
                    <div className="flex items-center gap-4 pt-6 border-t border-stone-100">
                      {sermon.youtubeId && (
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                          <YouTubeIcon size={16} className="group-hover:text-white text-red-500" />
                        </div>
                      )}
                      {sermon.spotifyLink && (
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                          <SpotifyIcon size={16} className="group-hover:text-white text-green-500" />
                        </div>
                      )}
                      <span className="ml-auto text-xs font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors flex items-center">
                        Read <ChevronRight size={14} className="ml-1" />
                      </span>
                    </div>
                </div>
                </Link>
            ))}
           </div>
         ) : (
           <div className="text-center py-12">
             <p className="text-stone-500 text-lg mb-2">No sermons found</p>
             <p className="text-stone-400 text-sm">
               {searchQuery || selectedSpeaker !== 'all' || contentType !== 'all'
                 ? 'Try adjusting your filters'
                 : 'No sermons available'}
             </p>
             {(searchQuery || selectedSpeaker !== 'all' || contentType !== 'all') && (
               <button
                 onClick={() => {
                   setSearchQuery('');
                   setSelectedSpeaker('all');
                   setContentType('all');
                 }}
                 className="mt-4 text-sm text-stone-900 underline hover:no-underline"
               >
                 Clear all filters
               </button>
             )}
           </div>
         )}
      </div>
    </div>
  );
}
