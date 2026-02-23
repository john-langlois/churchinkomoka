"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { MapPin, Shield, Music } from "lucide-react";
import { SpotifyIcon } from "@/src/components/SpotifyIcon";
import { YouTubeIcon } from "@/src/components/YouTubeIcon";

export const Footer = () => {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin === true;

  return (
    <footer className="bg-stone-900 text-white py-16 px-6 md:px-12">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-12 items-start">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="text-left max-w-sm">
            <h3 className="text-3xl font-black tracking-tighter mb-6 uppercase">
              Church in Komoka
            </h3>
            <p className="text-stone-400 text-lg leading-relaxed mb-6">
              A spiritual family living life together, bearing one another's
              burdens, and growing in grace.
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=93+Queen+St+Komoka+ON+N0L+1R0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors"
            >
              <MapPin size={18} />
              <span>93 Queen St Komoka, ON N0L 1R0</span>
            </a>
          </div>
          <div className="flex gap-8">
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-stone-500 uppercase tracking-widest text-xs">
                Connect
              </h4>
              <Link
                href="/calendar"
                className="hover:text-white transition-colors"
              >
                Events
              </Link>
              <Link
                href="/retreat"
                className="hover:text-white transition-colors"
              >
                Retreat
              </Link>
              <Link
                href="/resources"
                className="hover:text-white transition-colors"
              >
                Sermons
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-stone-500 uppercase tracking-widest text-xs">
                About
              </h4>
              <Link
                href="/beliefs"
                className="hover:text-white transition-colors"
              >
                Our Beliefs
              </Link>
              <a
                href="mailto:info@oikos.ca"
                className="hover:text-white transition-colors"
              >
                Contact
              </a>
              <Link
                href="/admin"
                className={`flex items-center gap-2 hover:text-white transition-colors ${
                  isAdmin ? "text-blue-400" : ""
                }`}
              >
                <Shield size={14} />
                Admin {isAdmin && "(You)"}
              </Link>
            </div>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-stone-700 h-full min-h-[400px]">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=-81.4300%2C42.9430%2C-81.4170%2C42.9500&layer=mapnik&marker=42.9466%2C-81.4233"
            className="w-full h-full min-h-[200px]"
            style={{
              border: 0,
              filter: " brightness(0.95) contrast(0.9)",
            }}
            allowFullScreen
            loading="lazy"
            title="Church in Komoka location"
          />
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center text-stone-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Church in Komoka.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a
            href="https://churchinkomoka.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
            aria-label="YouTube"
          >
            <YouTubeIcon size={20} className="text-current" />
          </a>
          <a
            href="https://churchinkomoka.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
            aria-label="Spotify"
          >
            <SpotifyIcon size={20} className="text-current" />
          </a>
        </div>
      </div>
    </footer>
  );
};
