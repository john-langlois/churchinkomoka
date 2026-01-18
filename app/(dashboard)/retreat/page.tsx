'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { SectionHeader } from '@/src/components/SectionHeader';

export default function RetreatPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-stone-900 mb-4">Registration Sent!</h2>
          <p className="text-stone-600 mb-8 font-medium">Thank you for signing up for the Church in Komoka Family Retreat. We'll be in touch soon.</p>
          <button onClick={() => setSubmitted(false)} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-colors uppercase tracking-widest text-sm">Register Another</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
         <SectionHeader title="Family Retreat" />
         
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            <div>
                 <p className="text-2xl text-stone-500 font-medium leading-relaxed mb-12">
                    "Behold, how good and how pleasant it is for brothers to dwell together in unity!" — Psalm 133:1
                 </p>
                 <div className="aspect-video rounded-3xl overflow-hidden bg-stone-200 mb-8">
                     <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" alt="Retreat" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex gap-8 text-stone-900 font-bold">
                    <div>
                        <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1">When</span>
                        Nov 10 - 12, 2023
                    </div>
                    <div>
                        <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1">Where</span>
                        Echo Lake Retreat Center
                    </div>
                 </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-stone-100">
                <h3 className="text-2xl font-bold text-stone-900 mb-8">Secure Your Spot</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Contact Person</label>
                    <input required type="text" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Email Address</label>
                    <input required type="email" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Adults</label>
                            <select className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all">
                            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Children</label>
                            <select className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all">
                            {[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Notes</label>
                    <textarea rows={3} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all resize-none"></textarea>
                    </div>

                    <button type="submit" disabled={loading} className={`w-full group flex items-center justify-center gap-2 py-5 rounded-xl font-bold text-white uppercase tracking-widest text-xs transition-all ${loading ? 'bg-stone-400' : 'bg-stone-900 hover:bg-stone-700'}`}>
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Register Family <ArrowRight size={16} /></>}
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
