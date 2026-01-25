'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useSession } from 'next-auth/react';

type Retreat = {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isActive: boolean;
};

export default function RetreatPage() {
  const { data: session } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [selectedRetreatId, setSelectedRetreatId] = useState<string>('');
  const [loadingRetreats, setLoadingRetreats] = useState(true);
  const [formData, setFormData] = useState({
    contactName: '',
    contactEmail: '',
    adults: '1',
    children: '0',
    notes: '',
  });

  useEffect(() => {
    fetchActiveRetreats();
  }, []);

  const fetchActiveRetreats = async () => {
    try {
      const res = await fetch('/api/retreat/retreats/active');
      const data = await res.json();
      setRetreats(data.retreats || []);
      if (data.retreats && data.retreats.length > 0) {
        setSelectedRetreatId(data.retreats[0].id);
      }
    } catch (error) {
      console.error('Error fetching retreats:', error);
    } finally {
      setLoadingRetreats(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRetreatId) {
      alert('Please select a retreat');
      return;
    }

    if (!session?.user) {
      alert('Please sign in to register');
      return;
    }

    setLoading(true);
    
    try {
      // Get profile ID from session
      const profileId = (session.user as any)?.id || (session.user as any)?.profileId;
      
      if (!profileId) {
        alert('Unable to find your profile. Please contact support.');
        setLoading(false);
        return;
      }

      // Build registrants array
      const registrants = [];
      
      // Add adults
      for (let i = 0; i < parseInt(formData.adults); i++) {
        registrants.push({
          firstName: formData.contactName.split(' ')[0] || 'Adult',
          lastName: formData.contactName.split(' ').slice(1).join(' ') || 'Registrant',
          isAdult: true,
        });
      }
      
      // Add children
      for (let i = 0; i < parseInt(formData.children); i++) {
        registrants.push({
          firstName: 'Child',
          lastName: formData.contactName.split(' ').slice(-1)[0] || 'Registrant',
          isAdult: false,
        });
      }

      const res = await fetch('/api/retreat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retreatId: selectedRetreatId,
          type: parseInt(formData.adults) + parseInt(formData.children) > 1 ? 'family' : 'individual',
          profileId: profileId,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          notes: formData.notes || undefined,
          registrants: registrants,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit registration');
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const selectedRetreat = retreats.find(r => r.id === selectedRetreatId);
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-stone-900 mb-4">Registration Sent!</h2>
          <p className="text-stone-600 mb-8 font-medium">
            Thank you for signing up for {selectedRetreat?.name || 'the retreat'}. We'll be in touch soon.
          </p>
          <button onClick={() => { setSubmitted(false); setFormData({ contactName: '', contactEmail: '', adults: '1', children: '0', notes: '' }); }} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-colors uppercase tracking-widest text-sm">Register Another</button>
        </motion.div>
      </div>
    );
  }

  if (loadingRetreats) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (retreats.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
          <SectionHeader title="Retreat Registration" />
          <div className="bg-white p-12 rounded-3xl shadow-xl text-center">
            <p className="text-xl text-stone-600">No active retreats available at this time. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedRetreat = retreats.find(r => r.id === selectedRetreatId);

  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
         <SectionHeader title="Retreat Registration" />
         
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            <div>
                 {retreats.length > 1 && (
                   <div className="mb-8">
                     <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">
                       Select Retreat
                     </label>
                     <select
                       value={selectedRetreatId}
                       onChange={(e) => setSelectedRetreatId(e.target.value)}
                       className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                     >
                       {retreats.map(retreat => (
                         <option key={retreat.id} value={retreat.id}>{retreat.name}</option>
                       ))}
                     </select>
                   </div>
                 )}
                 
                 {selectedRetreat && (
                   <>
                     <p className="text-2xl text-stone-500 font-medium leading-relaxed mb-12">
                        {selectedRetreat.description || "Join us for a time of fellowship and spiritual growth!"}
                     </p>
                     <div className="aspect-video rounded-3xl overflow-hidden bg-stone-200 mb-8">
                         <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" alt="Retreat" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex gap-8 text-stone-900 font-bold">
                        {selectedRetreat.startDate && (
                          <div>
                              <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1">When</span>
                              {new Date(selectedRetreat.startDate).toLocaleDateString()}
                              {selectedRetreat.endDate && ` - ${new Date(selectedRetreat.endDate).toLocaleDateString()}`}
                          </div>
                        )}
                        {selectedRetreat.location && (
                          <div>
                              <span className="block text-xs uppercase tracking-widest text-stone-400 mb-1">Where</span>
                              {selectedRetreat.location}
                          </div>
                        )}
                     </div>
                   </>
                 )}
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-stone-100">
                <h3 className="text-2xl font-bold text-stone-900 mb-8">Secure Your Spot</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Contact Person</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                    />
                    </div>
                    <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Email Address</label>
                    <input 
                      required 
                      type="email" 
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                    />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Adults</label>
                            <select 
                              value={formData.adults}
                              onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                            >
                            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Children</label>
                            <select 
                              value={formData.children}
                              onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                            >
                            {[0, 1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block ml-1">Notes</label>
                    <textarea 
                      rows={3} 
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all resize-none"
                    />
                    </div>

                    <button type="submit" disabled={loading} className={`w-full group flex items-center justify-center gap-2 py-5 rounded-xl font-bold text-white uppercase tracking-widest text-xs transition-all ${loading ? 'bg-stone-400' : 'bg-stone-900 hover:bg-stone-700'}`}>
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Register <ArrowRight size={16} /></>}
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
