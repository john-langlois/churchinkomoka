'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  BookOpen, 
  Users, 
  UserPlus,
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  X,
  Save,
  Loader2,
  Shield
} from 'lucide-react';

type Event = {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  startDate?: string;
  endDate?: string;
  time?: string | null;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceDayOfWeek?: number | null;
  recurrenceDayOfMonth?: number | null;
  recurrenceEndDate?: string;
  isActive: boolean;
};

type Sermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  thumbnail?: string;
  youtubeId?: string;
  spotifyLink?: string;
  articleContent?: {
    intro: string;
    paragraphs: string[];
    takeaways: string[];
  };
  isPublic: boolean;
};

type RetreatRegistration = {
  id: string;
  type: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: string;
  notes?: string;
  createdAt: string;
};

type Profile = {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

type Tab = 'events' | 'sermons' | 'retreat' | 'profiles';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [retreatRegistrations, setRetreatRegistrations] = useState<RetreatRegistration[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [viewingRegistration, setViewingRegistration] = useState<RetreatRegistration | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSermonForm, setShowSermonForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !(session.user as any)?.isAdmin) {
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch data based on active tab
  useEffect(() => {
    if (status === 'loading' || !session) return;
    if (!(session.user as any)?.isAdmin) return;

    fetchData();
  }, [activeTab, status, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'events') {
        const res = await fetch('/api/events/all');
        const data = await res.json();
        setEvents(data.events || []);
      } else if (activeTab === 'sermons') {
        const res = await fetch('/api/sermons/all');
        const data = await res.json();
        setSermons(data.sermons || []);
      } else if (activeTab === 'retreat') {
        const res = await fetch('/api/retreat/all');
        const data = await res.json();
        setRetreatRegistrations(data.registrations || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleDeleteSermon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sermon?')) return;
    
    try {
      const res = await fetch(`/api/sermons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting sermon:', error);
    }
  };

  const handleToggleSermonVisibility = async (id: string) => {
    try {
      const res = await fetch(`/api/sermons/${id}/toggle-visibility`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleSaveEvent = async (eventData: Partial<Event>) => {
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (res.ok) {
        setShowEventForm(false);
        setEditingEvent(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleSaveSermon = async (sermonData: Partial<Sermon>) => {
    try {
      const url = editingSermon ? `/api/sermons/${editingSermon.id}` : '/api/sermons';
      const method = editingSermon ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sermonData),
      });

      if (res.ok) {
        setShowSermonForm(false);
        setEditingSermon(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving sermon:', error);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    
    try {
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleSaveProfile = async (profileData: Partial<Profile>) => {
    try {
      const url = editingProfile ? `/api/profiles/${editingProfile.id}` : '/api/profiles';
      const method = editingProfile ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        setShowProfileForm(false);
        setEditingProfile(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!session || !(session.user as any)?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter text-stone-900 mb-4">Admin Panel</h1>
          <p className="text-stone-600">Manage events, sermons, and retreat registrations</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-stone-200">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'events'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Calendar className="inline w-4 h-4 mr-2" />
            Events
          </button>
          <button
            onClick={() => setActiveTab('sermons')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'sermons'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <BookOpen className="inline w-4 h-4 mr-2" />
            Sermons
          </button>
          <button
            onClick={() => setActiveTab('retreat')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'retreat'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Users className="inline w-4 h-4 mr-2" />
            Retreat Registrations
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'profiles'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <UserPlus className="inline w-4 h-4 mr-2" />
            Profiles
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
          </div>
        ) : (
          <>
            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-stone-900">Events</h2>
                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setShowEventForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Event
                  </button>
                </div>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-stone-900">{event.title}</h3>
                            <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-widest">
                              {event.category}
                            </span>
                            {event.isRecurring && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest">
                                Recurring
                              </span>
                            )}
                          </div>
                          <p className="text-stone-600 mb-2">{event.location}</p>
                          {event.description && <p className="text-stone-500 text-sm">{event.description}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingEvent(event);
                              setShowEventForm(true);
                            }}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sermons Tab */}
            {activeTab === 'sermons' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-stone-900">Sermons</h2>
                  <button
                    onClick={() => {
                      setEditingSermon(null);
                      setShowSermonForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Sermon
                  </button>
                </div>
                <div className="space-y-4">
                  {sermons.map((sermon) => (
                    <div key={sermon.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-stone-900">{sermon.title}</h3>
                            <button
                              onClick={() => handleToggleSermonVisibility(sermon.id)}
                              className="p-1 hover:bg-stone-100 rounded transition-colors"
                              title={sermon.isPublic ? 'Make private' : 'Make public'}
                            >
                              {sermon.isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                          </div>
                          <p className="text-stone-600 mb-2">{sermon.speaker} • {sermon.date}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSermon(sermon);
                              setShowSermonForm(true);
                            }}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteSermon(sermon.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Retreat Registrations Tab */}
            {activeTab === 'retreat' && (
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-6">Retreat Registrations</h2>
                <div className="space-y-4">
                  {retreatRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      onClick={() => setViewingRegistration(registration)}
                      className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-stone-900 mb-2">{registration.contactName}</h3>
                          <p className="text-stone-600 mb-1">{registration.contactEmail}</p>
                          {registration.contactPhone && (
                            <p className="text-stone-600 mb-2">{registration.contactPhone}</p>
                          )}
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                            registration.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                            registration.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            registration.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {registration.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Event Form Modal */}
        {showEventForm && (
          <EventFormModal
            event={editingEvent}
            onClose={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
            onSave={handleSaveEvent}
          />
        )}

        {/* Sermon Form Modal */}
        {showSermonForm && (
          <SermonFormModal
            sermon={editingSermon}
            onClose={() => {
              setShowSermonForm(false);
              setEditingSermon(null);
            }}
            onSave={handleSaveSermon}
          />
        )}

        {/* Registration Detail Modal */}
        {viewingRegistration && (
          <RegistrationDetailModal
            registration={viewingRegistration}
            onClose={() => setViewingRegistration(null)}
            onUpdate={fetchData}
          />
        )}

        {/* Profile Form Modal */}
        {showProfileForm && (
          <ProfileFormModal
            profile={editingProfile}
            onClose={() => {
              setShowProfileForm(false);
              setEditingProfile(null);
            }}
            onSave={handleSaveProfile}
          />
        )}
      </div>
    </div>
  );
}

// Event Form Component
function EventFormModal({ event, onClose, onSave }: { event: Event | null; onClose: () => void; onSave: (data: Partial<Event>) => void }) {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: event?.title || '',
    description: event?.description || '',
    category: event?.category || 'Service',
    location: event?.location || '',
    startDate: event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
    endDate: event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
    time: event?.time || '',
    isRecurring: event?.isRecurring || false,
    recurrencePattern: event?.recurrencePattern || "",
    recurrenceDayOfWeek: event?.recurrenceDayOfWeek ?? null,
    recurrenceDayOfMonth: event?.recurrenceDayOfMonth ?? null,
    recurrenceEndDate: event?.recurrenceEndDate ? new Date(event.recurrenceEndDate).toISOString().slice(0, 16) : '',
    isActive: event?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black tracking-tight text-stone-900">
              {event ? 'Edit Event' : 'Add Event'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              >
                <option value="Service">Service</option>
                <option value="Prayer">Prayer</option>
                <option value="Retreat">Retreat</option>
                <option value="Bible Study">Bible Study</option>
                <option value="Outreach">Outreach</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Location
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Time (e.g., "10:00 AM - 11:30 AM")
              </label>
              <input
                type="text"
                value={formData.time || ''}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-bold uppercase tracking-widest text-stone-400">
                  Recurring Event
                </span>
              </label>
            </div>
            {formData.isRecurring ? (
              <>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Recurrence Pattern
                  </label>
                  <select
                    value={formData.recurrencePattern || ''}
                    onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value as any || null })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                  >
                    <option value="">Select pattern</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                {formData.recurrencePattern === 'weekly' && (
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                      Day of Week (0=Sunday, 6=Saturday)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      value={formData.recurrenceDayOfWeek ?? ''}
                      onChange={(e) => setFormData({ ...formData, recurrenceDayOfWeek: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                    />
                  </div>
                )}
                {formData.recurrencePattern === 'monthly' && (
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                      Day of Month (1-31)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.recurrenceDayOfMonth ?? ''}
                      onChange={(e) => setFormData({ ...formData, recurrenceDayOfMonth: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Recurrence End Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.recurrenceEndDate || ''}
                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value || '' })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                    End Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-stone-100 text-stone-900 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Sermon Form Component
function SermonFormModal({ sermon, onClose, onSave }: { sermon: Sermon | null; onClose: () => void; onSave: (data: Partial<Sermon>) => void }) {
  const [formData, setFormData] = useState<Partial<Sermon>>({
    title: sermon?.title || '',
    speaker: sermon?.speaker || '',
    date: sermon?.date || new Date().toISOString().split('T')[0],
    thumbnail: sermon?.thumbnail || '',
    youtubeId: sermon?.youtubeId || '',
    spotifyLink: sermon?.spotifyLink || '',
    articleContent: sermon?.articleContent || {
      intro: '',
      paragraphs: [],
      takeaways: [],
    },
    isPublic: sermon?.isPublic ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black tracking-tight text-stone-900">
              {sermon ? 'Edit Sermon' : 'Add Sermon'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Speaker
              </label>
              <input
                type="text"
                required
                value={formData.speaker}
                onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                YouTube ID
              </label>
              <input
                type="text"
                value={formData.youtubeId}
                onChange={(e) => setFormData({ ...formData, youtubeId: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Spotify Link
              </label>
              <input
                type="url"
                value={formData.spotifyLink}
                onChange={(e) => setFormData({ ...formData, spotifyLink: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-bold uppercase tracking-widest text-stone-400">
                  Public (visible to everyone)
                </span>
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-stone-100 text-stone-900 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Registration Detail Modal
function RegistrationDetailModal({ registration, onClose, onUpdate }: { registration: RetreatRegistration; onClose: () => void; onUpdate: () => void }) {
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrants();
  }, [registration.id]);

  const fetchRegistrants = async () => {
    try {
      const res = await fetch(`/api/retreat/${registration.id}`);
      const data = await res.json();
      setRegistrants(data.registrants || []);
    } catch (error) {
      console.error('Error fetching registrants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/retreat/${registration.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black tracking-tight text-stone-900">Registration Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">{registration.contactName}</h3>
              <p className="text-stone-600">{registration.contactEmail}</p>
              {registration.contactPhone && <p className="text-stone-600">{registration.contactPhone}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Status
              </label>
              <select
                value={registration.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
            </div>
            {registration.notes && (
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Notes
                </label>
                <p className="text-stone-600">{registration.notes}</p>
              </div>
            )}
            <div>
              <h4 className="text-lg font-bold text-stone-900 mb-4">Registrants</h4>
              {loading ? (
                <p className="text-stone-500">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {registrants.map((reg) => (
                    <div key={reg.id} className="bg-stone-50 p-4 rounded-xl">
                      <p className="font-bold text-stone-900">{reg.firstName} {reg.lastName}</p>
                      <p className="text-sm text-stone-600">{reg.isAdult ? 'Adult' : 'Child'} {reg.age && `(${reg.age} years)`}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Form Component
function ProfileFormModal({ profile, onClose, onSave }: { profile: Profile | null; onClose: () => void; onSave: (data: Partial<Profile>) => void }) {
  const [formData, setFormData] = useState<Partial<Profile>>({
    email: profile?.email || '',
    phone: profile?.phone || '',
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    avatarUrl: profile?.avatarUrl || '',
    isAdmin: profile?.isAdmin || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black tracking-tight text-stone-900">
              {profile ? 'Edit Profile' : 'Add Profile'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-bold uppercase tracking-widest text-stone-400">
                  Admin Access
                </span>
              </label>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-stone-100 text-stone-900 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
