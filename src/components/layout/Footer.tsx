import Link from 'next/link';
import { MapPin, Youtube } from 'lucide-react';

export const Footer = () => (
  <footer className="bg-stone-900 text-white py-16 px-6 md:px-12">
    <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
      <div className="text-left max-w-md">
        <h3 className="text-3xl font-black tracking-tighter mb-6 uppercase">Church in Komoka</h3>
        <p className="text-stone-400 text-lg leading-relaxed mb-6">
          A spiritual family living life together, bearing one another's burdens, and growing in grace.
        </p>
        <div className="flex items-center gap-2 text-stone-300">
           <MapPin size={18} />
           <span>Komoka Community Center, Komoka, ON</span>
        </div>
      </div>
      <div className="flex gap-8">
        <div className="flex flex-col gap-4">
          <h4 className="font-bold text-stone-500 uppercase tracking-widest text-xs">Connect</h4>
          <Link href="/calendar" className="hover:text-white transition-colors">Events</Link>
          <Link href="/retreat" className="hover:text-white transition-colors">Retreat</Link>
          <Link href="/resources" className="hover:text-white transition-colors">Sermons</Link>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="font-bold text-stone-500 uppercase tracking-widest text-xs">About</h4>
          <Link href="/beliefs" className="hover:text-white transition-colors">Our Beliefs</Link>
          <a href="mailto:info@oikos.ca" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </div>
    <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center text-stone-500 text-sm">
      <p>&copy; {new Date().getFullYear()} Church in Komoka.</p>
      <div className="flex gap-4 mt-4 md:mt-0">
        <a href="https://youtube.com" className="hover:text-white transition-colors"><Youtube size={20} /></a>
      </div>
    </div>
  </footer>
);
