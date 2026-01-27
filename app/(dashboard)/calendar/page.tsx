'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Clock, MapPin, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { SectionHeader } from '@/src/components/SectionHeader';
import { EventRow } from '@/src/components/EventRow';
import { Calendar } from '@/src/components/ui/calendar';
import { cn } from '@/src/lib/utils';

type EventForDisplay = {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  time?: string;
  displayDate: string;
  isRecurring: boolean;
  nextOccurrence?: string | Date;
};

type EventCategory = 'All' | 'Service' | 'Prayer' | 'Retreat' | 'Bible Study' | 'Outreach';

export default function CalendarPage() {
  const [events, setEvents] = useState<EventForDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventForDisplay | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events/upcoming');
      const data = await res.json();
      // Events are already sorted by next occurrence (closest to farthest) from the API
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique dates that have events
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach(event => {
      if (event.nextOccurrence) {
        const date = typeof event.nextOccurrence === 'string' 
          ? parseISO(event.nextOccurrence) 
          : new Date(event.nextOccurrence);
        dates.add(format(date, 'yyyy-MM-dd'));
      }
    });
    return dates;
  }, [events]);

  // Filter events based on category and date
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filter by date if selected
    if (selectedDate) {
      filtered = filtered.filter(event => {
        if (!event.nextOccurrence) return false;
        const eventDate = typeof event.nextOccurrence === 'string' 
          ? parseISO(event.nextOccurrence) 
          : new Date(event.nextOccurrence);
        return isSameDay(eventDate, selectedDate);
      });
    }

    return filtered;
  }, [events, selectedCategory, selectedDate]);

  // Get available categories from events
  const availableCategories = useMemo(() => {
    const categories = new Set(events.map(e => e.category));
    return Array.from(categories).sort();
  }, [events]);

  const categories: EventCategory[] = ['All', ...availableCategories] as EventCategory[];

  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
         <SectionHeader title="Calendar" />

        <div className="flex flex-col lg:flex-row gap-16">
          {/* List View (2/3) */}
          <div className="lg:w-2/3">
            <div className="flex items-center justify-between mb-12 border-b border-stone-200 pb-6">
              <h2 className="text-2xl font-bold text-stone-900">Upcoming Events</h2>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedDate(undefined); // Clear date filter when changing category
                    }}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-full uppercase tracking-wider transition-colors",
                      selectedCategory === category
                        ? "bg-stone-900 text-white"
                        : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {loading ? (
                <p className="text-stone-500 text-center py-8">Loading events...</p>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div key={event.id} onClick={() => setSelectedEvent(event)} className="cursor-pointer">
                    <EventRow event={{
                      ...event,
                      date: event.displayDate,
                      day: event.displayDate.split(',')[0] || 'Sun',
                    }} />
                  </div>
                ))
              ) : (
                <p className="text-stone-500 text-center py-8">
                  {selectedDate 
                    ? `No events on ${format(selectedDate, 'MMMM d, yyyy')}` 
                    : selectedCategory !== 'All' 
                      ? `No ${selectedCategory} events scheduled`
                      : 'No events scheduled'}
                </p>
              )}
            </div>
          </div>

          {/* Calendar Sidebar (1/3) */}
          <div className="lg:w-1/3">
            <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-stone-100 sticky top-32">
              <div className="mb-8">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    // If a date is selected, clear category filter to show all events for that date
                    if (date) {
                      setSelectedCategory('All');
                    }
                  }}
                  modifiers={{
                    hasEvent: (date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      return eventDates.has(dateStr);
                    }
                  }}
                  modifiersClassNames={{
                    hasEvent: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-stone-900"
                  }}
                  className="w-full"
                  classNames={{
                    month: "space-y-4",
                    month_caption: "flex justify-center pt-1 relative items-center text-stone-900 font-bold text-xl",
                    nav: "space-x-1 flex items-center",
                    button_previous: "absolute left-1",
                    button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-stone-500 rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-stone-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: cn(
                      "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                      "hover:bg-stone-100 hover:text-stone-900",
                      "aria-selected:bg-stone-900 aria-selected:text-white",
                      "focus:bg-stone-900 focus:text-white"
                    ),
                    day_selected: "bg-stone-900 text-white hover:bg-stone-900 hover:text-white focus:bg-stone-900 focus:text-white",
                    day_today: "bg-stone-100 text-stone-900 font-bold",
                    day_outside: "text-stone-400 opacity-50",
                    day_disabled: "text-stone-400 opacity-50",
                    day_range_middle: "aria-selected:bg-stone-100 aria-selected:text-stone-900",
                    day_hidden: "invisible",
                  }}
                />
              </div>
              {selectedDate && (
                <div className="mb-6">
                  <button
                    onClick={() => setSelectedDate(undefined)}
                    className="text-sm text-stone-600 hover:text-stone-900 underline"
                  >
                    Clear date filter
                  </button>
                  </div>
              )}
              <div className="pt-8 border-t border-stone-100">
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
