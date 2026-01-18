'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, Youtube, ArrowRight, PlayCircle, Music, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/src/components/SectionHeader';
import { EventRow } from '@/src/components/EventRow';
import { sermonsData } from '@/src/lib/data';

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

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<EventForDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const res = await fetch('/api/events/upcoming?limit=5');
      const data = await res.json();
      // Filter out Service category events and limit to 3
      const events = (data.events || []).filter((e: EventForDisplay) => e.category !== "Service").slice(0, 3);
      setFeaturedEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const whatToExpectData = [
    {
      title: "Public Reading of Scripture",
      desc: "We devote time to hearing the Word of God read aloud, allowing it to wash over us and shape our hearts.",
      image: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1974&auto=format&fit=crop"
    },
    {
      title: "Worship Together",
      desc: "We lift our voices in unity to praise the Name of Jesus, responding to who He is and what He has done.",
      image: "https://images.unsplash.com/photo-1510380365737-1bb4cf2fa08d?q=80&w=1976&auto=format&fit=crop"
    },
    {
      title: "Biblical Teaching",
      desc: "Faithful exposition of the Scriptures that points us to Christ and challenges us to live as His disciples.",
      image: "https://images.unsplash.com/photo-1475483768296-6163e08872a1?q=80&w=2070&auto=format&fit=crop"
    },
    {
      title: "Church in Komoka Kids",
      desc: "A safe, fun environment where children learn the gospel story and experience the love of Jesus.",
      image: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?q=80&w=1974&auto=format&fit=crop"
    },
    {
      title: "Fellowship & Lunch",
      desc: "We don't rush off. We stay, we eat, and we share life. Because the church is a family, not an event.",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  const latestSermon = sermonsData[0];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="relative h-screen w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
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
                <p className="text-lg font-light">133 Queen St, Komoka, ON</p>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="px-5 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} className="text-blue-400"/> Sundays at 10:00 AM
                 </div>
                 <div className="px-5 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Youtube size={14} className="text-red-500"/> Live Online
                 </div>
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
          
          {latestSermon && (
            <Link 
              href={`/resources/${latestSermon.id}`} 
              className="group block bg-stone-50 rounded-3xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="aspect-video lg:aspect-auto lg:h-[400px] bg-stone-200 relative overflow-hidden">
                  <img 
                    src={latestSermon.thumbnail} 
                    alt={latestSermon.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="text-white w-20 h-20" />
                  </div>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[10px] font-bold tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Video</span>
                    <span className="text-[10px] font-bold tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">Audio</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-stone-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                    {latestSermon.title}
                  </h3>
                  <p className="text-stone-500 text-base font-medium mb-8">
                    {latestSermon.date} • {latestSermon.speaker}
                  </p>
                  <p className="text-stone-600 text-lg font-medium leading-relaxed mb-8">
                    {latestSermon.articleContent.intro}
                  </p>
                  <div className="flex items-center gap-4 pt-6 border-t border-stone-200">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <Youtube size={18} />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                      <Music size={18} />
                    </div>
                    <span className="ml-auto text-sm font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors flex items-center">
                      Watch Now <ChevronRight size={16} className="ml-1" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 max-w-[1400px] mx-auto">
        <SectionHeader title="What to Expect" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
           {whatToExpectData.map((item, idx) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.1 }}
               className="group cursor-default"
             >
               <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-stone-200">
                 <img 
                   src={item.image} 
                   alt={item.title} 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                 />
               </div>
               <h3 className="text-2xl font-bold text-stone-900 mb-3 group-hover:text-blue-600 transition-colors">{item.title}</h3>
               <p className="text-stone-500 leading-relaxed font-medium">{item.desc}</p>
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
                    <EventRow key={event.id} event={{
                      ...event,
                      date: event.displayDate,
                      day: event.displayDate.split(',')[0] || 'Sun',
                    }} />
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
    </div>
  );
}
