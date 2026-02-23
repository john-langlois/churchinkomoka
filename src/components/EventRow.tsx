"use client";

import React from "react";
import { ArrowRight, Clock, MapPin } from "lucide-react";

const month = (event: any) =>
  event.date.split(",")[1]?.trim()?.split(" ")[0] || "OCT";
const day = (event: any) =>
  event.date.split(",")[1]?.trim()?.split(" ")[1] || "20";

export const EventRow: React.FC<{ event: any }> = ({ event }) => (
  <div className="group border-t border-stone-300 py-5 md:py-8 flex flex-col md:flex-row gap-4 md:gap-12 items-stretch md:items-start hover:bg-white/50 transition-colors px-4 rounded-xl">
    {/* Mobile: date only in first column; desktop: date box then content */}
    <div className="flex flex-col gap-0 flex-1 md:flex-initial min-w-0 md:min-w-0">
      <div className="bg-white text-stone-900 w-14 h-14 md:w-32 md:h-32 rounded-xl md:rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm border border-stone-100 group-hover:scale-105 transition-transform duration-300">
        <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-stone-400">
          {month(event)}
        </span>
        <span className="text-xl md:text-5xl font-black tracking-tighter leading-none">
          {day(event)}
        </span>
      </div>
    </div>
    <div className="flex-grow min-w-0 md:pt-2">
      <h3 className="text-lg md:text-3xl font-bold text-stone-900 leading-tight group-hover:text-stone-600 transition-colors line-clamp-2 md:line-clamp-none mb-2">
        {event.title}
      </h3>
      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-stone-500 font-medium text-sm">
        <span className="flex items-center gap-1 shrink-0">
          <Clock size={14} className="shrink-0" />{" "}
          <span className="truncate">{event.time}</span>
        </span>
        <span className="bg-stone-200 text-stone-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
          {event.category}
        </span>
        {event.location.includes("Online") && (
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            Online
          </span>
        )}
        <span className="flex items-center gap-1 min-w-0 basis-full md:basis-auto">
          <MapPin size={14} className="shrink-0" />{" "}
          <span className="truncate">{event.location}</span>
        </span>
      </div>
    </div>
    <div className="hidden md:flex self-center">
      <div className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white group-hover:border-stone-900 transition-all">
        <ArrowRight size={20} />
      </div>
    </div>
  </div>
);
