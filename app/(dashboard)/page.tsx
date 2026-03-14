"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Clock,
  ArrowRight,
  PlayCircle,
  Music,
  ChevronRight,
  X,
  MapPin,
  Calendar as CalendarIcon,
  Check,
} from "lucide-react";
import { SpotifyIcon } from "@/src/components/SpotifyIcon";
import { YouTubeIcon } from "@/src/components/YouTubeIcon";
import { format } from "date-fns";
import { SectionHeader } from "@/src/components/SectionHeader";
import { EventRow } from "@/src/components/EventRow";

type EventForDisplay = {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  time?: string;
  displayDate: string;
  displayTime?: string;
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
  const [selectedEvent, setSelectedEvent] = useState<EventForDisplay | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [sermonLoading, setSermonLoading] = useState(true);
  const [calendarEmail, setCalendarEmail] = useState("");
  const [sendingICS, setSendingICS] = useState(false);
  const [icsSent, setIcsSent] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    fetchUpcomingEvents();
    fetchLatestSermon();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const res = await fetch("/api/events/upcoming?limit=5");
      const data = await res.json();
      // Filter out Service category events and limit to 3
      const events = (data.events || []).slice(0, 3);
      setFeaturedEvents(events);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestSermon = async () => {
    try {
      const res = await fetch("/api/sermons");
      const data = await res.json();
      // Sermons are already sorted by date descending, so the first one is the latest
      const sermons = data.sermons || [];
      if (sermons.length > 0) {
        setLatestSermon(sermons[0]);
      }
    } catch (error) {
      console.error("Error fetching latest sermon:", error);
    } finally {
      setSermonLoading(false);
    }
  };

  // Get YouTube thumbnail URL from video ID
  const getYouTubeThumbnail = (videoId: string): string => {
    if (!videoId) return "";
    // Extract video ID if it's a full URL
    const idMatch = videoId.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([^&\n?#]+)/,
    );
    const id = idMatch ? idMatch[1] : videoId;
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  };

  // Extract intro from article content (first paragraph or first 200 characters)
  const getIntro = (content?: string): string => {
    if (!content) return "";
    // Try to extract first paragraph
    const firstParagraph = content.split("\n\n")[0] || content.split("\n")[0];
    if (firstParagraph && firstParagraph.length < 300) {
      return firstParagraph;
    }
    // Otherwise, take first 200 characters
    return content.substring(0, 200).trim() + "...";
  };

  const whatToExpectData = [
    {
      title: "Public Reading of Scripture",
      desc: "We devote time to hearing the Word of God read aloud, allowing it to wash over us and shape our hearts.",
      image: "/images/sharing_1.png",
    },
    {
      title: "Worship Together",
      desc: "We lift our voices in unity to praise the Name of Jesus, responding to who He is and what He has done.",
      image: "/images/worship_1.png",
    },
    {
      title: "Biblical Teaching",
      desc: "Faithful exposition of the Scriptures that points us to Christ and challenges us to live as His disciples.",
      image: "/images/sharing_1.png",
    },
    {
      title: "Church in Komoka Kids",
      desc: "A safe, fun environment where children learn the gospel story and experience the love of Jesus.",
      image: "/images/kids_1.png",
    },
    {
      title: "Fellowship & Lunch",
      desc: "We don't rush off. We stay, we eat, and we share life. Because the church is a family, not an event.",
      image: "/images/cooking_1.png",
    },
    {
      title: "Time of Prayer",
      desc: "We come before the Lord together, lifting up our needs, our community, and our world in prayer.",
      image: "/images/worship_2.png",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section — h-svh so mobile fits in viewport; content contained to width */}
      <div className="relative h-svh min-h-[480px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/images/hero_1.png')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-stone-900/60" />
        </div>

        <div className="absolute inset-0 max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 flex flex-col justify-end pb-8 sm:pb-12 md:pb-24 z-20 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="min-w-0 w-full"
          >
            <div className="flex items-end gap-2 mb-3 md:mb-2">
              <h1 className="flex flex-wrap text-[13vw] sm:text-[15vw] md:text-[73px] font-black leading-none tracking-tighter text-white uppercase select-none break-words">
                Church in Komoka
              </h1>
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-12 ml-0 md:ml-2 min-w-0">
              <div className="text-white/80 min-w-0">
                <p className="text-base md:text-lg font-medium">
                  Providence Collegiate
                </p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=93+Queen+St+Komoka+ON+N0L+1R0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base md:text-lg font-light break-words hover:text-white transition-colors underline underline-offset-2"
                >
                  93 Queen St Komoka, ON N0L 1R0
                </a>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 min-w-0 flex-wrap">
                <div className="px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 shrink-0 w-fit">
                  <Clock size={14} className="text-blue-400 shrink-0" /> Sundays
                  at 10:00 AM
                </div>
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                  <a
                    href="https://churchinkomoka.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-colors shrink-0"
                  >
                    <YouTubeIcon size={14} className="text-red-500 shrink-0" />{" "}
                    Live Online
                  </a>
                  <a
                    href="https://churchinkomoka.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-colors shrink-0"
                  >
                    <SpotifyIcon
                      size={14}
                      className="text-green-400 shrink-0"
                    />{" "}
                    View on Spotify
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Join Us Section */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-stone-900 mb-12 md:mb-16 max-w-2xl leading-tight">
            You&apos;re welcome here every Sunday.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Clock size={20} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                When
              </p>
              <p className="text-3xl font-black tracking-tight mb-1">
                10:00 AM
              </p>
              <p className="text-white/60 font-medium">Every Sunday morning</p>
            </div>
            <div className="bg-stone-100 rounded-3xl p-8 md:p-10">
              <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center mb-6">
                <MapPin size={20} className="text-stone-700" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                Where
              </p>
              <p className="text-3xl font-black tracking-tight text-stone-900 mb-1">
                Komoka, ON
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=93+Queen+St+Komoka+ON+N0L+1R0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 font-medium hover:text-stone-900 transition-colors underline underline-offset-2"
              >
                93 Queen St — Providence Collegiate
              </a>
            </div>
            <a
              href="https://www.youtube.com/@churchinkomoka"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-stone-100 rounded-3xl p-8 md:p-10 hover:bg-stone-200 transition-colors group block"
            >
              <div className="w-12 h-12 rounded-2xl bg-stone-200 group-hover:bg-red-500 flex items-center justify-center mb-6 transition-colors">
                <PlayCircle size={20} className="text-stone-700 group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                Can&apos;t make it?
              </p>
              <p className="text-3xl font-black tracking-tight text-stone-900 mb-1">
                Watch Live
              </p>
              <p className="text-stone-500 font-medium">
                Streaming on YouTube every Sunday
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-stone-900">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-medium">
              We are a group of disciples in Komoka who live to serve and follow
              Jesus. Our mission is to lead others to a life changing
              relationship with our Creator.
            </p>
            <div className="pt-8 border-t border-white/10">
              <blockquote className="text-lg md:text-xl text-white/60 italic leading-relaxed mb-4">
                "Go therefore and make disciples of all the nations, baptizing
                them in the name of the Father and the Son and the Holy Spirit,
                teaching them to observe all that I commanded you; and lo, I am
                with you always, even to the end of the age."
              </blockquote>
              <p className="text-white/40 font-medium">Matthew 28:19-20</p>
            </div>
          </div>
        </div>
      </section>

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
                  <span className="text-[10px] font-bold tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                    Video
                  </span>
                )}
                {latestSermon.spotifyLink && (
                  <span className="text-[10px] font-bold tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">
                    Audio
                  </span>
                )}
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-stone-900 mb-4 leading-tight group-hover:text-stone-500 transition-colors">
                {latestSermon.title}
              </h3>
              <p className="text-stone-500 text-base font-medium mb-8">
                {latestSermon.date
                  ? format(
                      new Date(latestSermon.date + "T12:00:00"),
                      "MMMM d, yyyy",
                    )
                  : "Date TBD"}{" "}
                • {latestSermon.speaker || "Speaker TBD"}
              </p>
              {latestSermon.articleContent && (
                <p className="text-stone-600 text-lg font-medium leading-relaxed mb-8">
                  {getIntro(latestSermon.articleContent)}
                </p>
              )}
              <div className="flex items-center gap-4 pt-6 border-t border-stone-200">
                {latestSermon.youtubeId && (
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <YouTubeIcon
                      size={18}
                      className="text-red-500 group-hover:text-white transition-colors"
                    />
                  </div>
                )}
                {latestSermon.spotifyLink && (
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <SpotifyIcon
                      size={18}
                      className="text-green-500 group-hover:text-white transition-colors"
                    />
                  </div>
                )}
                <span className="ml-auto text-sm font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-900 transition-colors flex items-center">
                  {latestSermon.youtubeId
                    ? "Watch Now"
                    : latestSermon.spotifyLink
                      ? "Listen Now"
                      : "Read More"}{" "}
                  <ChevronRight size={16} className="ml-1" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {whatToExpectData.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-default relative aspect-[4/3] border border-stone-300 rounded-lg overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
              >
                <div className="absolute inset-0 bg-stone-900/60 group-hover:bg-stone-900/70 transition-colors duration-300" />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-10">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-white/90 leading-relaxed font-medium text-sm md:text-base">
                  {item.desc}
                </p>
              </div>
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
            <Link
              href="/calendar"
              className="hidden md:inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm border-b-2 border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors"
            >
              View Full Calendar <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <p className="text-stone-500 text-center py-8">
                Loading events...
              </p>
            ) : featuredEvents.length > 0 ? (
              featuredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="cursor-pointer"
                >
                  <EventRow
                    event={{
                      ...event,
                      date: event.displayDate,
                      day: event.displayDate.split(",")[0] || "Sun",
                      time: event.displayTime || event.time,
                    }}
                  />
                </div>
              ))
            ) : (
              <p className="text-stone-500 text-center py-8">
                No upcoming events
              </p>
            )}
          </div>

          <div className="mt-12 md:hidden">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-sm border-b-2 border-stone-900 pb-1"
            >
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
              onClick={() => {
                setSelectedEvent(null);
                setShowEmailInput(false);
                setCalendarEmail("");
                setIcsSent(false);
              }}
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
                onClick={() => {
                  setSelectedEvent(null);
                  setShowEmailInput(false);
                  setCalendarEmail("");
                  setIcsSent(false);
                }}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors z-10 text-white"
              >
                <X />
              </button>

              <div className="bg-stone-900 p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                  <CalendarIcon size={200} />
                </div>
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest mb-6 border border-white/20">
                    {selectedEvent.category}
                  </span>
                  <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">
                    {selectedEvent.title}
                  </h2>
                  <p className="text-stone-400 font-medium">
                    {selectedEvent.displayDate}
                  </p>
                </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                      Time
                    </span>
                    <p className="font-bold text-stone-900 text-lg flex items-center gap-2">
                      <Clock size={16} className="text-stone-400" />{" "}
                      {selectedEvent.displayTime || selectedEvent.time || "TBD"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                      Location
                    </span>
                    <p className="font-bold text-stone-900 text-lg flex items-center gap-2">
                      <MapPin size={16} className="text-stone-400" />{" "}
                      {selectedEvent.location}
                    </p>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                      Details
                    </span>
                    <p className="text-stone-600 leading-relaxed text-lg">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                <div className="pt-8">
                  {icsSent ? (
                    <div className="flex items-center justify-center gap-2 py-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-bold text-sm">
                      <Check size={16} /> Calendar invite sent! Check your
                      email.
                    </div>
                  ) : showEmailInput ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!selectedEvent || !calendarEmail) return;
                        setSendingICS(true);
                        try {
                          const res = await fetch("/api/events/send-ics", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              eventId: selectedEvent.id,
                              email: calendarEmail,
                            }),
                          });
                          if (res.ok) setIcsSent(true);
                        } catch (err) {
                          console.error("Error sending calendar invite:", err);
                        } finally {
                          setSendingICS(false);
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="email"
                        required
                        placeholder="Your email address"
                        value={calendarEmail}
                        onChange={(e) => setCalendarEmail(e.target.value)}
                        className="flex-grow px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <button
                        type="submit"
                        disabled={sendingICS || !calendarEmail}
                        className="px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors disabled:opacity-50"
                      >
                        {sendingICS ? "Sending..." : "Send"}
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowEmailInput(true)}
                      className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors"
                    >
                      Add to Calendar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
