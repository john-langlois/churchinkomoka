'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Clock, MapPin, Calendar, Bell, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/src/components/SectionHeader';
import { EventRow } from '@/src/components/EventRow';
import { eventsData } from '@/src/lib/data';

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<typeof eventsData[0] | null>(null);

  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
         <SectionHeader title="Calendar" />

        <div className="flex flex-col lg:flex-row gap-16">
          {/* List View (2/3) */}
          <div className="lg:w-2/3">
            <div className="flex items-center justify-between mb-12 border-b border-stone-200 pb-6">
              <h2 className="text-2xl font-bold text-stone-900">This Month</h2>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-full uppercase tracking-wider">All</span>
                <span className="px-4 py-2 bg-white border border-stone-200 text-stone-500 text-xs font-bold rounded-full uppercase tracking-wider hover:border-stone-400 cursor-pointer transition-colors">Services</span>
                <span className="px-4 py-2 bg-white border border-stone-200 text-stone-500 text-xs font-bold rounded-full uppercase tracking-wider hover:border-stone-400 cursor-pointer transition-colors">Prayer</span>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {eventsData.map((event) => (
                <div key={event.id} onClick={() => setSelectedEvent(event)} className="cursor-pointer">
                    <EventRow event={event} />
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Sidebar (1/3) */}
          <div className="lg:w-1/3">
            <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-stone-100 sticky top-32">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-2xl text-stone-900">October 2023</h3>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ChevronRight className="rotate-180 w-5 h-5" /></button>
                  <button className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-black text-stone-400 uppercase tracking-widest mb-4">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {Array.from({ length: 31 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square flex items-center justify-center text-sm font-bold rounded-full transition-all cursor-default
                      ${i + 1 === 22 || i + 1 === 25 || i + 1 === 26 ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'}
                    `}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-stone-100">
                <button className="w-full py-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold text-xs uppercase tracking-widest hover:bg-stone-100 transition-colors flex items-center justify-center gap-2">
                  <Bell size={16} /> Subscribe to Updates
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    <Calendar size={200} />
                 </div>
                 <div className="relative z-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-6 border border-white/20">{selectedEvent.category}</span>
                    <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">{selectedEvent.title}</h2>
                    <p className="text-stone-400 font-medium">{selectedEvent.date}</p>
                 </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Time</span>
                    <p className="font-bold text-stone-900 text-lg flex items-center gap-2"><Clock size={16} className="text-stone-400"/> {selectedEvent.time}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Location</span>
                    <p className="font-bold text-stone-900 text-lg flex items-center gap-2"><MapPin size={16} className="text-stone-400" /> {selectedEvent.location}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Details</span>
                  <p className="text-stone-600 leading-relaxed text-lg">{selectedEvent.description}</p>
                </div>

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
