'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const BeliefAccordion: React.FC<{ title: string, content: string, isOpen: boolean, onClick: () => void }> = ({ title, content, isOpen, onClick }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm transition-all hover:shadow-md">
      <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <h3 className={`text-xl font-bold transition-colors ${isOpen ? 'text-blue-600' : 'text-stone-900'}`}>
          {title}
        </h3>
        <ChevronDown 
          className={`transform transition-transform duration-300 text-stone-400 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0 text-stone-600 leading-relaxed">
              <div className="w-full h-px bg-stone-100 mb-6" />
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
