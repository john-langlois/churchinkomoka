'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Determine if we are on the home page
  const isHomePage = pathname === '/';
  
  // Logic for navbar text visibility:
  // - Dark text if scrolled OR if NOT on home page (because other pages have white backgrounds).
  // - White text only on Home page when at the top (hero image).
  const textColorClass = (isScrolled || !isHomePage) ? 'text-stone-900' : 'text-white';
  const navBgClass = isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6';

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${navBgClass}`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className={`${textColorClass} font-sans text-2xl tracking-tighter font-black z-50 transition-colors duration-300 uppercase`}>
            Church in Komoka
          </Link>

          {/* Desktop Menu */}
          <div className={`hidden md:flex items-center space-x-8 ${textColorClass} font-medium text-sm tracking-wide transition-colors duration-300`}>
            <Link href="/beliefs" className="hover:opacity-60 transition-opacity uppercase">Beliefs</Link>
            <Link href="/resources" className="hover:opacity-60 transition-opacity uppercase">Resources</Link>
            <Link href="/calendar" className="hover:opacity-60 transition-opacity uppercase">Events</Link>
            <Link href="/retreat" className="hover:opacity-60 transition-opacity uppercase">Retreat</Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className={`md:hidden ${textColorClass} z-50 focus:outline-none transition-colors duration-300`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Modal Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-stone-900 text-white flex flex-col items-center justify-center"
          >
            <div className="flex flex-col space-y-6 text-center">
              <Link href="/" className="text-4xl font-black tracking-tighter hover:text-stone-400 transition-colors">HOME</Link>
              <Link href="/beliefs" className="text-4xl font-black tracking-tighter hover:text-stone-400 transition-colors">BELIEFS</Link>
              <Link href="/resources" className="text-4xl font-black tracking-tighter hover:text-stone-400 transition-colors">RESOURCES</Link>
              <Link href="/calendar" className="text-4xl font-black tracking-tighter hover:text-stone-400 transition-colors">EVENTS</Link>
              <Link href="/retreat" className="text-4xl font-black tracking-tighter hover:text-stone-400 transition-colors">RETREAT</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
