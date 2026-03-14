'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';

const links = [
  { href: '/', label: 'Home' },
  { href: '/beliefs', label: 'Beliefs' },
  { href: '/resources', label: 'Resources' },
  { href: '/calendar', label: 'Events' },
  { href: '/retreat', label: 'Retreat' },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isHomePage = pathname === '/';
  const useDarkText = isScrolled || !isHomePage;
  const navBgClass =
    isScrolled || mobileOpen
      ? 'bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm'
      : 'bg-transparent border-b border-transparent';

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 w-full z-50 transition-all duration-300',
        isScrolled || mobileOpen ? 'py-4' : 'py-6',
        navBgClass
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link
          href="/"
          className={cn(
            'font-sans text-2xl tracking-tighter font-black uppercase transition-colors duration-300',
            useDarkText ? 'text-stone-900' : 'text-white'
          )}
        >
          Church in Komoka
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {links.slice(1).map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative font-medium text-sm tracking-wide uppercase transition-colors duration-300 py-1',
                  useDarkText
                    ? isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
                    : isActive ? 'text-white' : 'text-white/70 hover:text-white'
                )}
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className={cn(
                      'absolute bottom-0 left-0 right-0 h-[2px] rounded-full',
                      useDarkText ? 'bg-stone-900' : 'bg-white'
                    )}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile: Animated burger that becomes X */}
        <button
          type="button"
          className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-[6px]"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <motion.span
            animate={mobileOpen ? { rotate: 45, y: 4.5 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'block w-6 h-[2px] origin-center',
              useDarkText ? 'bg-stone-900' : 'bg-white'
            )}
          />
          <motion.span
            animate={mobileOpen ? { rotate: -45, y: -4.5 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'block w-6 h-[2px] origin-center',
              useDarkText ? 'bg-stone-900' : 'bg-white'
            )}
          />
        </button>
      </div>

      {/* Mobile full-screen overlay — portaled to body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
                className="fixed inset-0 z-[100] bg-white flex flex-col md:hidden"
              >
                {/* Top bar: Logo left, Close X right */}
                <div className="flex items-center justify-between p-6 pt-8 shrink-0">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="text-xl font-black tracking-tighter uppercase text-stone-900"
                  >
                    Church in Komoka
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-2 -m-2 text-stone-500 hover:text-stone-900 transition-colors"
                    aria-label="Close menu"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Nav links — centered, staggered */}
                <nav className="flex-1 flex flex-col items-center justify-center gap-1 px-6 overflow-y-auto">
                  {links.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{
                        delay: 0.08 + i * 0.05,
                        duration: 0.3,
                        ease: 'easeOut',
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'block text-3xl sm:text-4xl font-black transition-colors py-3 tracking-tighter uppercase',
                          pathname === link.href
                            ? 'text-stone-900 underline underline-offset-4 decoration-2'
                            : 'text-stone-400 hover:text-stone-900'
                        )}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* CTA — pinned bottom */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  transition={{ delay: 0.28, duration: 0.4, ease: 'easeOut' }}
                  className="px-6 pb-10 pt-4 shrink-0"
                >
                  <Link
                    href="/calendar"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full max-w-xs mx-auto bg-stone-900 text-white text-sm font-bold uppercase tracking-widest px-8 py-4 text-center rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    View Events
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </nav>
  );
};
