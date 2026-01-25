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

type Retreat = {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

type Tab = 'events' | 'sermons' | 'retreats' | 'profiles';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [editingRetreat, setEditingRetreat] = useState<Retreat | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSermonForm, setShowSermonForm] = useState(false);
  const [showRetreatForm, setShowRetreatForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

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
        // Sort sermons by date (most recent first), maintaining order for items with same date
        const sortedSermons = (data.sermons || []).sort((a: Sermon, b: Sermon) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setSermons(sortedSermons);
      } else if (activeTab === 'retreats') {
        const res = await fetch('/api/retreat/retreats/all');
        const data = await res.json();
        setRetreats(data.retreats || []);
      } else if (activeTab === 'profiles') {
        const res = await fetch('/api/profiles/all');
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        setConfirmationModal(null);
        onConfirm();
      },
    });
  };

  const handleDeleteEvent = async (id: string) => {
    showConfirmation(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
          }
        } catch (error) {
          console.error('Error deleting event:', error);
        }
      }
    );
  };

  const handleDeleteSermon = async (id: string) => {
    showConfirmation(
      'Delete Sermon',
      'Are you sure you want to delete this sermon? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch(`/api/sermons/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
          }
        } catch (error) {
          console.error('Error deleting sermon:', error);
        }
      }
    );
  };

  const handleToggleSermonVisibility = async (id: string, currentVisibility: boolean) => {
    showConfirmation(
      currentVisibility ? 'Make Sermon Private' : 'Make Sermon Public',
      currentVisibility
        ? 'Are you sure you want to make this sermon private? It will no longer be visible to the public.'
        : 'Are you sure you want to make this sermon public? It will be visible to everyone.',
      async () => {
        try {
          const res = await fetch(`/api/sermons/${id}/toggle-visibility`, { method: 'POST' });
          if (res.ok) {
            fetchData();
          }
        } catch (error) {
          console.error('Error toggling visibility:', error);
        }
      }
    );
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
    showConfirmation(
      'Delete Profile',
      'Are you sure you want to delete this profile? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
          }
        } catch (error) {
          console.error('Error deleting profile:', error);
        }
      }
    );
  };

  const handleSaveProfile = async (profileData: Partial<Profile>) => {
    // Check if admin status is being changed
    if (editingProfile && profileData.isAdmin !== undefined && profileData.isAdmin !== editingProfile.isAdmin) {
      showConfirmation(
        profileData.isAdmin ? 'Grant Admin Access' : 'Revoke Admin Access',
        profileData.isAdmin
          ? 'Are you sure you want to grant admin access to this user? They will have full access to the admin panel.'
          : 'Are you sure you want to revoke admin access from this user? They will lose access to the admin panel.',
        async () => {
          await performSaveProfile(profileData);
        }
      );
    } else {
      await performSaveProfile(profileData);
    }
  };

  const performSaveProfile = async (profileData: Partial<Profile>) => {
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

  const handleDeleteRetreat = async (id: string) => {
    showConfirmation(
      'Delete Retreat',
      'Are you sure you want to delete this retreat? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch(`/api/retreat/retreats/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchData();
          }
        } catch (error) {
          console.error('Error deleting retreat:', error);
        }
      }
    );
  };

  const handleSaveRetreat = async (retreatData: Partial<Retreat>) => {
    try {
      const url = editingRetreat ? `/api/retreat/retreats/${editingRetreat.id}` : '/api/retreat/retreats';
      const method = editingRetreat ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retreatData),
      });

      if (res.ok) {
        setShowRetreatForm(false);
        setEditingRetreat(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving retreat:', error);
    }
  };

  const handleToggleRetreatActive = async (id: string, isActive: boolean) => {
    showConfirmation(
      isActive ? 'Activate Retreat' : 'Deactivate Retreat',
      isActive
        ? 'Are you sure you want to activate this retreat? It will be visible to the public for registration.'
        : 'Are you sure you want to deactivate this retreat? It will no longer be visible to the public.',
      async () => {
        try {
          const res = await fetch(`/api/retreat/retreats/${id}/toggle-active`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive }),
          });
          if (res.ok) {
            fetchData();
          }
        } catch (error) {
          console.error('Error toggling retreat active status:', error);
        }
      }
    );
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
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-24 pb-12">
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
            onClick={() => setActiveTab('retreats')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-colors border-b-2 ${
              activeTab === 'retreats'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Users className="inline w-4 h-4 mr-2" />
            Retreats
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
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Title</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Speaker</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">YouTube</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Spotify</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Public</th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-stone-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {sermons.map((sermon) => (
                        <tr key={sermon.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-stone-900">{sermon.title}</div>
                          </td>
                          <td className="px-6 py-4 text-stone-600">{sermon.speaker}</td>
                          <td className="px-6 py-4 text-stone-600">{sermon.date}</td>
                          <td className="px-6 py-4">
                            {sermon.youtubeId ? (
                              <a 
                                href={`https://youtube.com/watch?v=${sermon.youtubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-stone-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {sermon.spotifyLink ? (
                              <a 
                                href={sermon.spotifyLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Listen
                              </a>
                            ) : (
                              <span className="text-stone-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleSermonVisibility(sermon.id, sermon.isPublic)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                sermon.isPublic ? 'bg-stone-900' : 'bg-stone-300'
                              }`}
                              title={sermon.isPublic ? 'Make private' : 'Make public'}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  sermon.isPublic ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Retreats Tab */}
            {activeTab === 'retreats' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-stone-900">Retreats</h2>
                  <button
                    onClick={() => {
                      setEditingRetreat(null);
                      setShowRetreatForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Retreat
                  </button>
                </div>
                <div className="space-y-4">
                  {retreats.map((retreat) => (
                    <div 
                      key={retreat.id} 
                      onClick={() => router.push(`/admin/retreat/${retreat.id}`)}
                      className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-stone-900">{retreat.name}</h3>
                            {retreat.isActive ? (
                              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold uppercase tracking-widest">
                                Active
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-widest">
                                Inactive
                              </span>
                            )}
                          </div>
                          {retreat.description && (
                            <p className="text-stone-600 mb-2">{retreat.description}</p>
                          )}
                          <div className="flex gap-6 text-sm text-stone-500">
                            {retreat.location && (
                              <span><span className="font-bold">Location:</span> {retreat.location}</span>
                            )}
                            {retreat.startDate && (
                              <span>
                                <span className="font-bold">Dates:</span> {new Date(retreat.startDate).toLocaleDateString()}
                                {retreat.endDate && ` - ${new Date(retreat.endDate).toLocaleDateString()}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleRetreatActive(retreat.id, !retreat.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              retreat.isActive 
                                ? 'hover:bg-yellow-50 text-yellow-600' 
                                : 'hover:bg-green-50 text-green-600'
                            }`}
                            title={retreat.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {retreat.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingRetreat(retreat);
                              setShowRetreatForm(true);
                            }}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRetreat(retreat.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {retreats.length === 0 && (
                    <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center">
                      <p className="text-stone-500">No retreats found. Create your first retreat to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profiles Tab */}
            {activeTab === 'profiles' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-stone-900">Profiles</h2>
                  <button
                    onClick={() => {
                      setEditingProfile(null);
                      setShowProfileForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Profile
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Phone</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Admin</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Created</th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-stone-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {profiles.map((profile) => (
                        <tr key={profile.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-stone-900">
                              {profile.firstName || profile.lastName 
                                ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || '—'
                                : '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-stone-600">{profile.email || '—'}</td>
                          <td className="px-6 py-4 text-stone-600">{profile.phone || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                              profile.isAdmin 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-stone-100 text-stone-600'
                            }`}>
                              {profile.isAdmin ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-stone-600">
                            {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setEditingProfile(profile);
                                  setShowProfileForm(true);
                                }}
                                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProfile(profile.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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


        {/* Retreat Form Modal */}
        {showRetreatForm && (
          <RetreatFormModal
            retreat={editingRetreat}
            onClose={() => {
              setShowRetreatForm(false);
              setEditingRetreat(null);
            }}
            onSave={handleSaveRetreat}
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

        {/* Confirmation Modal */}
        {confirmationModal && (
          <ConfirmationModal
            title={confirmationModal.title}
            message={confirmationModal.message}
            confirmText={confirmationModal.confirmText}
            cancelText={confirmationModal.cancelText}
            onConfirm={confirmationModal.onConfirm}
            onCancel={() => setConfirmationModal(null)}
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
  const [formData, setFormData] = useState<Omit<Partial<Sermon>, 'articleContent'> & { articleContent?: string }>({
    title: sermon?.title || '',
    speaker: sermon?.speaker || '',
    date: sermon?.date || '',
    youtubeId: sermon?.youtubeId || '',
    spotifyLink: sermon?.spotifyLink || '',
    articleContent: typeof sermon?.articleContent === 'string' 
      ? sermon.articleContent 
      : (sermon?.articleContent ? JSON.stringify(sermon.articleContent) : ''),
    isPublic: sermon?.isPublic ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert articleContent to string if it's not already
    const dataToSave: Partial<Sermon> = {
      ...formData,
      articleContent: typeof formData.articleContent === 'string' 
        ? formData.articleContent as any
        : (formData.articleContent ? JSON.stringify(formData.articleContent) as any : undefined),
    };
    onSave(dataToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <span className="text-sm font-bold uppercase tracking-widest text-stone-900 block mb-1">
                  Public
                </span>
                <span className="text-xs text-stone-500">Visible to everyone</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isPublic ? 'bg-stone-900' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Content (Markdown)
              </label>
              <textarea
                value={typeof formData.articleContent === 'string' ? formData.articleContent : ''}
                onChange={(e) => setFormData({ ...formData, articleContent: e.target.value })}
                rows={12}
                placeholder="Write your sermon content in Markdown format..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none font-mono text-sm"
              />
              <p className="text-xs text-stone-500 mt-2">
                Use Markdown syntax for formatting (headers, bold, italic, lists, etc.)
              </p>
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

// Retreat Form Component
function RetreatFormModal({ retreat, onClose, onSave }: { retreat: Retreat | null; onClose: () => void; onSave: (data: Partial<Retreat>) => void }) {
  const [formData, setFormData] = useState<Partial<Retreat>>({
    name: retreat?.name || '',
    description: retreat?.description || '',
    startDate: retreat?.startDate ? new Date(retreat.startDate).toISOString().slice(0, 16) : '',
    endDate: retreat?.endDate ? new Date(retreat.endDate).toISOString().slice(0, 16) : '',
    location: retreat?.location || '',
    isActive: retreat?.isActive ?? false,
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
              {retreat ? 'Edit Retreat' : 'Add Retreat'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
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
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <span className="text-sm font-bold uppercase tracking-widest text-stone-900 block mb-1">
                  Active
                </span>
                <span className="text-xs text-stone-500">Visible for registration</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isActive ? 'bg-stone-900' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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

// Confirmation Modal Component
function ConfirmationModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="p-8">
          <h2 className="text-2xl font-black tracking-tight text-stone-900 mb-4">{title}</h2>
          <p className="text-stone-600 mb-8">{message}</p>
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-stone-100 text-stone-900 rounded-xl font-bold hover:bg-stone-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-700 transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
