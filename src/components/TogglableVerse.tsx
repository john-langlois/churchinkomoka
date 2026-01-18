'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const TogglableVerse = ({ reference, text }: { reference: string, text: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="text-sm font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2"
      >
        <span className="w-4 h-4 rounded-full border border-blue-600 flex items-center justify-center text-[10px]">
          {isOpen ? '-' : '+'}
        </span>
        {reference}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-2 pl-6 border-l-2 border-blue-200 italic text-stone-500 text-sm">
              "{text}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
