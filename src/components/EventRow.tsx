'use client';

import React from 'react';
import { ArrowRight, Clock, MapPin } from 'lucide-react';

export const EventRow: React.FC<{ event: any }> = ({ event }) => (
  <div className="group border-t border-stone-300 py-8 flex flex-col md:flex-row gap-6 md:gap-12 items-start hover:bg-white/50 transition-colors px-4 rounded-xl">
    <div className="bg-white text-stone-900 w-24 h-24 md:w-32 md:h-32 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm border border-stone-100 group-hover:scale-105 transition-transform duration-300">
      <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-stone-400">{event.date.split(',')[1]?.trim()?.split(' ')[0] || 'OCT'}</span>
      <span className="text-3xl md:text-5xl font-black tracking-tighter">{event.date.split(',')[1]?.trim()?.split(' ')[1] || '20'}</span>
    </div>
    <div className="flex-grow pt-2">
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="bg-stone-200 text-stone-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
          {event.category}
        </span>
        {event.location.includes("Online") && (
             <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Online</span>
        )}
      </div>
      <h3 className="text-2xl md:text-3xl font-bold text-stone-900 mb-2 leading-tight group-hover:text-stone-600 transition-colors">{event.title}</h3>
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-stone-500 font-medium text-sm mt-2">
        <span className="flex items-center gap-1"><Clock size={14} /> {event.time}</span>
        <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>
      </div>
    </div>
    <div className="hidden md:flex self-center">
      <div className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white group-hover:border-stone-900 transition-all">
        <ArrowRight size={20} />
      </div>
    </div>
  </div>
);
