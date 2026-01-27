'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Clock, ArrowRight, PlayCircle, Music, ChevronRight, X, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { SpotifyIcon } from '@/src/components/SpotifyIcon';
import { YouTubeIcon } from '@/src/components/YouTubeIcon';
import { format } from 'date-fns';
import { SectionHeader } from '@/src/components/SectionHeader';
import { EventRow } from '@/src/components/EventRow';

type EventForDisplay = {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  time?: string;
  displayDate: string;
  isRecurring: boolean;
};

type Sermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  youtubeId?: string;
  spotifyLink?: string;
  articleContent?: string;
  isPublic: boolean;
};

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<EventForDisplay[]>([]);
  const [latestSermon, setLatestSermon] = useState<Sermon | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventForDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [sermonLoading, setSermonLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
    fetchLatestSermon();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const res = await fetch('/api/events/upcoming?limit=5');
      const data = await res.json();
      // Filter out Service category events and limit to 3
      const events = (data.events || []).slice(0, 3);
      setFeaturedEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestSermon = async () => {
    try {
      const res = await fetch('/api/sermons');
      const data = await res.json();
      // Sermons are already sorted by date descending, so the first one is the latest
      const sermons = data.sermons || [];
      if (sermons.length > 0) {
        setLatestSermon(sermons[0]);
      }
    } catch (error) {
      console.error('Error fetching latest sermon:', error);
    } finally {
      setSermonLoading(false);
    }
  };

  // Get YouTube thumbnail URL from video ID
  const getYouTubeThumbnail = (videoId: string): string => {
    if (!videoId) return '';
    // Extract video ID if it's a full URL
    const idMatch = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([^&\n?#]+)/);
    const id = idMatch ? idMatch[1] : videoId;
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  };

  // Extract intro from article content (first paragraph or first 200 characters)
  const getIntro = (content?: string): string => {
    if (!content) return '';
    // Try to extract first paragraph
    const firstParagraph = content.split('\n\n')[0] || content.split('\n')[0];
    if (firstParagraph && firstParagraph.length < 300) {
      return firstParagraph;
    }
    // Otherwise, take first 200 characters
    return content.substring(0, 200).trim() + '...';
  };

  const whatToExpectData = [
    {
      title: "Public Reading of Scripture",
      desc: "We devote time to hearing the Word of God read aloud, allowing it to wash over us and shape our hearts.",
      image: "/images/sharing_1.png"
    },
    {
      title: "Worship Together",
      desc: "We lift our voices in unity to praise the Name of Jesus, responding to who He is and what He has done.",
      image: "/images/worship_1.png"
    },
    {
      title: "Biblical Teaching",
      desc: "Faithful exposition of the Scriptures that points us to Christ and challenges us to live as His disciples.",
      image: "/images/sharing_1.png"
    },
    {
      title: "Church in Komoka Kids",
      desc: "A safe, fun environment where children learn the gospel story and experience the love of Jesus.",
      image: "/images/kids_1.png"
    },
    {
      title: "Fellowship & Lunch",
      desc: "We don't rush off. We stay, we eat, and we share life. Because the church is a family, not an event.",
      image: "/images/cooking_1.png"
    },
    {
      title: "Time of Prayer",
      desc: "We come before the Lord together, lifting up our needs, our community, and our world in prayer.",
      image: "/images/worship_2.png"
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="relative h-screen w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/images/hero_1.png')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-stone-900/60" />
        </div>

        <div className="absolute inset-0 max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col justify-end pb-16 md:pb-24 z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-end gap-2 mb-2">
                <h1 className="flex flex-wrap text-[15vw] md:text-[73px] font-black leading-none tracking-tighter text-white uppercase select-none">
                Church in Komoka
                </h1>
                <div className="hidden md:block w-4 h-4 rounded-full bg-blue-500 mb-8 md:mb-12 animate-pulse"></div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12 ml-2">
              <div className="text-white/80">
                <p className="text-lg font-medium">Komoka Community Center</p>
                <p className="text-lg font-light">93 Queen St Komoka, ON N0L 1R0</p>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="px-5 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} className="text-blue-400"/> Sundays at 10:00 AM
                 </div>
                 <a 
                   href="https://youtube.com" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="px-5 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-colors"
                 >
                    <YouTubeIcon size={14} className="text-red-500"/> Live Online
                 </a>
                 <a 
                   href="https://open.spotify.com" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="px-5 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-colors"
                 >
                    <SpotifyIcon size={14} className="text-green-400"/> View on Spotify
                 </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Latest Sermon Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-stone-900">
              Latest Sermon
            </h2>
            <Link 
              href="/resources" 
              className="text-sm font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>
          
          {sermonLoading ? (
            <div className="bg-stone-50 rounded-3xl border border-stone-200 p-12 text-center">
              <p className="text-stone-500">Loading latest sermon...</p>
            </div>
          ) : latestSermon ? (
            <Link 
              href={`/resources/${latestSermon.id}`}
              className="group block bg-stone-50 rounded-3xl overflow-hidden border border-stone-200 shadow-sm p-8 md:p-12 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-6">
                {latestSermon.youtubeId && (
                  <span className="text-[10px] font-bold tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Video</span>
                )}
                {latestSermon.spotifyLink && (
                  <span className="text-[10px] font-bold tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Audio</span>
                )}
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-stone-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                {latestSermon.title}
              </h3>
              <p className="text-stone-500 text-base font-medium mb-8">
                {latestSermon.date ? format(new Date(latestSermon.date), 'MMMM d, yyyy') : 'Date TBD'} • {latestSermon.speaker || 'Speaker TBD'}
              </p>
              {latestSermon.articleContent && (
                <p className="text-stone-600 text-lg font-medium leading-relaxed mb-8">
                  {getIntro(latestSermon.articleContent)}
                </p>
              )}
              <div className="flex items-center gap-4 pt-6 border-t border-stone-200">
                {latestSermon.youtubeId && (
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <YouTubeIcon size={18} className="text-red-500 group-hover:text-white transition-colors" />
                  </div>
                )}
                {latestSermon.spotifyLink && (
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <SpotifyIcon size={18} className="text-green-500 group-hover:text-white transition-colors" />
                  </div>
                )}
                <span className="ml-auto text-sm font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors flex items-center">
                  {latestSermon.youtubeId ? 'Watch Now' : latestSermon.spotifyLink ? 'Listen Now' : 'Read More'} <ChevronRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>
          ) : (
            <div className="bg-stone-50 rounded-3xl border border-stone-200 p-12 text-center">
              <p className="text-stone-500">No sermons available</p>
            </div>
          )}
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 max-w-[1400px] mx-auto">
        <SectionHeader title="What to Expect" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 justify-items-center">
           {whatToExpectData.map((item, idx) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.1 }}
               className="group cursor-default w-full max-w-[400px] flex flex-col"
             >
               <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-stone-200 relative">
                 <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                 <img 
                   src={item.image} 
                   alt={item.title} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out brightness-[0.95] contrast-[1.05] saturate-[1.1] group-hover:brightness-100 group-hover:contrast-100 group-hover:saturate-110"
                 />
               </div>
               <h3 className="text-2xl font-bold text-stone-900 mb-3 group-hover:text-blue-600 transition-colors">{item.title}</h3>
               <p className="text-stone-500 leading-relaxed font-medium flex-grow">{item.desc}</p>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="bg-[#E5E5E0] py-24 md:py-32">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-20">
                 <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-stone-900">
                    Upcoming Events
                 </h2>
                 <Link href="/calendar" className="hidden md:inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm border-b-2 border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors">
                    View Full Calendar <ArrowRight size={16} />
                 </Link>
            </div>

            <div className="flex flex-col gap-4">
                {loading ? (
                  <p className="text-stone-500 text-center py-8">Loading events...</p>
                ) : featuredEvents.length > 0 ? (
                  featuredEvents.map((event) => (
                    <div 
                      key={event.id} 
                      onClick={() => setSelectedEvent(event)} 
                      className="cursor-pointer"
                    >
                      <EventRow event={{
                        ...event,
                        date: event.displayDate,
                        day: event.displayDate.split(',')[0] || 'Sun',
                      }} />
                    </div>
                  ))
                ) : (
                  <p className="text-stone-500 text-center py-8">No upcoming events</p>
                )}
            </div>
             
             <div className="mt-12 md:hidden">
                 <Link href="/calendar" className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm border-b-2 border-stone-900 pb-1">
                    View Full Calendar <ArrowRight size={16} />
                 </Link>
             </div>
        </div>
      </section>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors z-10 text-white"
              >
                <X />
              </button>
              
              <div className="bg-stone-900 p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                  <CalendarIcon size={200} />
                </div>
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-6 border border-white/20">{selectedEvent.category}</span>
                  <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">{selectedEvent.title}</h2>
                  <p className="text-stone-400 font-medium">{selectedEvent.displayDate}</p>
                </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Time</span>
                    <p className="font-bold text-stone-900 text-lg flex items-center gap-2"><Clock size={16} className="text-stone-400"/> {selectedEvent.time || 'TBD'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Location</span>
                    <p className="font-bold text-stone-900 text-lg flex items-center gap-2"><MapPin size={16} className="text-stone-400" /> {selectedEvent.location}</p>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Details</span>
                    <p className="text-stone-600 leading-relaxed text-lg">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="pt-8 flex gap-4">
                  <button className="flex-grow py-4 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors">Add to Calendar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
