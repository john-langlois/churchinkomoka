'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, Calendar as CalendarIcon, Trash2, Plus } from 'lucide-react';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useSession } from 'next-auth/react';
import { Calendar } from '@/src/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/src/lib/utils';

type Retreat = {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isActive: boolean;
};

type Attendee = {
  id: string;
  fullName: string;
  age: string;
};

export default function RetreatPage() {
  const { data: session } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [selectedRetreatId, setSelectedRetreatId] = useState<string>('');
  const [loadingRetreats, setLoadingRetreats] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    churchName: '',
    pastorName: '',
    pastorContact: '',
    country: '',
    city: '',
    expectedArrivalDate: undefined as Date | undefined,
    expectedDepartureDate: undefined as Date | undefined,
    notes: '',
  });
  const [attendees, setAttendees] = useState<Attendee[]>([
    { id: '1', fullName: '', age: '' }
  ]);

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

  const addAttendee = () => {
    setAttendees([...attendees, { id: Date.now().toString(), fullName: '', age: '' }]);
  };

  const removeAttendee = (id: string) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter(a => a.id !== id));
    }
  };

  const updateAttendee = (id: string, field: 'fullName' | 'age', value: string) => {
    setAttendees(attendees.map(a => a.id === id ? { ...a, [field]: value } : a));
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

    // Validate required fields
    if (!formData.fullName || !formData.phoneNumber || !formData.email || 
        !formData.churchName || !formData.pastorName || !formData.pastorContact || 
        !formData.country || !formData.city) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate attendees
    const invalidAttendees = attendees.filter(a => !a.fullName || !a.age);
    if (invalidAttendees.length > 0) {
      alert('Please fill in name and age for all attendees');
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

      // Build registrants array from attendees
      const registrants = attendees.map(attendee => {
        const nameParts = attendee.fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const age = parseInt(attendee.age);
        const isAdult = age >= 18;
        
        return {
          firstName,
          lastName,
          age: isNaN(age) ? undefined : age,
          isAdult,
        };
      });

      // Build notes with additional information
      const notesParts = [];
      if (formData.expectedArrivalDate) {
        notesParts.push(`Expected Arrival: ${format(formData.expectedArrivalDate, 'yyyy-MM-dd')}`);
      }
      if (formData.expectedDepartureDate) {
        notesParts.push(`Expected Departure: ${format(formData.expectedDepartureDate, 'yyyy-MM-dd')}`);
      }
      if (formData.notes) {
        notesParts.push(formData.notes);
      }
      const notes = notesParts.length > 0 ? notesParts.join('\n') : undefined;

      const res = await fetch('/api/retreat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retreatId: selectedRetreatId,
          type: attendees.length > 1 ? 'family' : 'individual',
          profileId: profileId,
          contactName: formData.fullName,
          contactEmail: formData.email,
          contactPhone: formData.phoneNumber,
          notes: notes,
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
          <button onClick={() => { 
            setSubmitted(false); 
            setFormData({ 
              fullName: '', 
              phoneNumber: '', 
              email: '', 
              churchName: '', 
              pastorName: '', 
              pastorContact: '', 
              country: '', 
              city: '', 
              expectedArrivalDate: undefined, 
              expectedDepartureDate: undefined, 
              notes: '' 
            }); 
            setAttendees([{ id: '1', fullName: '', age: '' }]);
          }} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-colors uppercase tracking-widest text-sm">Register Another</button>
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
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-12 md:py-20">
         <SectionHeader title="Retreat Registration" />
         
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            <div className="lg:col-span-1">
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
                     
                     {/* General Information */}
                     <div className="space-y-8">
                        {/* Dates */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">Dates</h3>
                            <p className="text-lg font-bold text-stone-900 mb-1">September 19-21, 2025</p>
                            <p className="text-stone-600 font-medium">Friday evening to Sunday afternoon</p>
                        </div>

                        {/* Location */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">Location</h3>
                            <p className="text-lg font-bold text-stone-900 mb-1">Pearce Williams Summer Retreat Camp</p>
                            <p className="text-stone-600 font-medium">8009 Iona Rd, London, ON N6A 1A1</p>
                        </div>

                        {/* Cost */}
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">Cost</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-stone-900 font-medium">Adult (17+)</span>
                                    <span className="text-stone-900 font-bold">$105</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-stone-900 font-medium">Youth (10-16)</span>
                                    <span className="text-stone-900 font-bold">$85</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-stone-900 font-medium">Kids (2-9)</span>
                                    <span className="text-stone-900 font-bold">$25</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-stone-900 font-medium">Toddlers (0-2)</span>
                                    <span className="text-stone-900 font-bold">Free</span>
                                </div>
                            </div>
                            <p className="text-sm text-stone-500 mt-3 italic">Includes accommodation, meals, and all activities</p>
                          </div>

                        {/* Questions */}
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">Questions?</h3>
                            <p className="text-stone-600 font-medium mb-1">Contact us:</p>
                            <a href="mailto:info@oikoscommunitychurch.ca" className="text-stone-900 font-bold hover:text-blue-600 transition-colors underline">
                                info@oikoscommunitychurch.ca
                            </a>
                          </div>
                     </div>
                   </>
                 )}
            </div>

            <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-stone-100">
                <h3 className="text-2xl font-bold text-stone-900 mb-8">Registration Form</h3>
                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Contact Information Section */}
                    <div>
                        <h4 className="text-lg font-bold text-stone-900 mb-6">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                    <input 
                      required 
                      type="text" 
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                    />
                    </div>
                    <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    Email <span className="text-red-500">*</span>
                                </label>
                    <input 
                      required 
                      type="email" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    required 
                                    type="tel" 
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    Church Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.churchName}
                                    onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    Pastor's Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.pastorName}
                                    onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    Pastor's Contact <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.pastorContact}
                                    onChange={(e) => setFormData({ ...formData, pastorContact: e.target.value })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                    />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Travel Information Section */}
                    <div>
                        <h4 className="text-lg font-bold text-stone-900 mb-2">Travel Information</h4>
                        <p className="text-sm text-stone-500 mb-6">These fields are optional and can be left blank.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    Expected Arrival Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className={cn(
                                                "w-full justify-start text-left font-medium bg-stone-50 border border-stone-200 rounded-xl px-4 py-3",
                                                !formData.expectedArrivalDate && "text-stone-500"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.expectedArrivalDate ? (
                                                format(formData.expectedArrivalDate, "yyyy-MM-dd")
                                            ) : (
                                                <span>yyyy-mm-dd</span>
                                            )}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.expectedArrivalDate}
                                            onSelect={(date) => setFormData({ ...formData, expectedArrivalDate: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        <div className="space-y-2">
                                <label className="text-sm font-bold text-stone-900 block">
                                    Expected Departure Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className={cn(
                                                "w-full justify-start text-left font-medium bg-stone-50 border border-stone-200 rounded-xl px-4 py-3",
                                                !formData.expectedDepartureDate && "text-stone-500"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.expectedDepartureDate ? (
                                                format(formData.expectedDepartureDate, "yyyy-MM-dd")
                                            ) : (
                                                <span>yyyy-mm-dd</span>
                                            )}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.expectedDepartureDate}
                                            onSelect={(date) => setFormData({ ...formData, expectedDepartureDate: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    {/* Attendees Information Section */}
                    <div>
                        <h4 className="text-lg font-bold text-stone-900 mb-2">Attendees Information</h4>
                        <p className="text-sm text-stone-500 mb-6">Please provide information for all attendees (including yourself if attending).</p>
                        <div className="space-y-4">
                            {attendees.map((attendee, index) => (
                                <div key={attendee.id} className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-stone-900 block">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                required 
                                                type="text" 
                                                value={attendee.fullName}
                                                onChange={(e) => updateAttendee(attendee.id, 'fullName', e.target.value)}
                                                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                                            />
                        </div>
                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-stone-900 block">
                                                Age <span className="text-red-500">*</span>
                                            </label>
                                            <input 
                                                required 
                                                type="number" 
                                                min="0"
                                                max="120"
                                                value={attendee.age}
                                                onChange={(e) => updateAttendee(attendee.id, 'age', e.target.value)}
                                                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all" 
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttendee(attendee.id)}
                                            disabled={attendees.length === 1}
                                            className={`px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                attendees.length === 1
                                                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                                    : 'bg-red-500 text-white hover:bg-red-600'
                                            }`}
                                        >
                                            <Trash2 size={16} />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addAttendee}
                                className="w-full md:w-auto px-6 py-3 bg-stone-100 text-stone-900 rounded-xl font-bold hover:bg-stone-200 transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Another Attendee
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-stone-900 block">Notes</label>
                    <textarea 
                      rows={3} 
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all resize-none"
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
