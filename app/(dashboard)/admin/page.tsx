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
  Shield,
  Youtube,
  CheckCircle2,
  AlertCircle,
  Radio,
  Image,
  Music,
  FileText,
  Upload,
  Rss,
  ExternalLink,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  inPodcastFeed: boolean;
};

type PricingTier = {
  name: string;
  minAge: number;
  maxAge: number | null;
  price: number | null;
  isFree: boolean;
};

type Retreat = {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isActive: boolean;
  pricingTiers?: PricingTier[] | null;
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
  const [showPipelineModal, setShowPipelineModal] = useState(false);
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
          return new Date(b.date + 'T12:00:00').getTime() - new Date(a.date + 'T12:00:00').getTime();
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

  const handleTogglePodcastFeed = async (id: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/sermons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inPodcastFeed: !currentValue }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error toggling podcast feed:', error);
    }
  };

  const handleSaveEvent = async (eventData: Partial<Event>) => {
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';
      
      // Clean up the data to match API expectations
      const cleanedData: any = {
        ...eventData,
        // Convert empty strings to null/undefined for optional fields
        description: eventData.description || undefined,
        time: eventData.time || undefined,
        startDate: eventData.startDate || undefined,
        endDate: eventData.endDate || undefined,
        recurrencePattern: eventData.recurrencePattern && eventData.recurrencePattern !== '' ? eventData.recurrencePattern : undefined,
        recurrenceDayOfWeek: eventData.recurrenceDayOfWeek ?? undefined,
        recurrenceDayOfMonth: eventData.recurrenceDayOfMonth ?? undefined,
        recurrenceEndDate: eventData.recurrenceEndDate || undefined,
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error saving event:', errorData);
        alert(errorData.error || 'Failed to save event. Please check the form and try again.');
        return;
      }

      setShowEventForm(false);
      setEditingEvent(null);
      fetchData();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
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
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPipelineModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-red-700 transition-colors"
                    >
                      <Youtube size={16} />
                      Process from YouTube
                    </button>
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
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">Podcast</th>
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
                                href={sermon.youtubeId}
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
                          <td className="px-6 py-4">
                            {sermon.inPodcastFeed ? (
                              <button
                                onClick={() => handleTogglePodcastFeed(sermon.id, true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors group"
                                title="Click to remove from podcast feed"
                              >
                                <Rss size={12} className="group-hover:hidden" />
                                <X size={12} className="hidden group-hover:block" />
                                <span className="group-hover:hidden">In Feed</span>
                                <span className="hidden group-hover:inline">Remove</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTogglePodcastFeed(sermon.id, false)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-500 text-xs font-bold hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors"
                                title="Click to add to podcast feed"
                              >
                                <Rss size={12} />
                                Add to Feed
                              </button>
                            )}
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
                          <div className="flex flex-wrap gap-6 text-sm text-stone-500">
                            {retreat.location && (
                              <span><span className="font-bold">Location:</span> {retreat.location}</span>
                            )}
                            {retreat.startDate && (
                              <span>
                                <span className="font-bold">Dates:</span> {new Date(retreat.startDate).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}
                                {retreat.endDate && ` - ${new Date(retreat.endDate).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}`}
                              </span>
                            )}
                            <span>
                              <span className="font-bold">Pricing:</span>{' '}
                              {retreat.pricingTiers && retreat.pricingTiers.length > 0
                                ? retreat.pricingTiers
                                    .sort((a, b) => a.minAge - b.minAge)
                                    .map((t) => `${t.name} ${t.isFree ? 'Free' : `$${t.price ?? 0}`}`)
                                    .join(', ')
                                : 'Contact for pricing'}
                            </span>
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
                            {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { timeZone: 'America/New_York' }) : '—'}
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

        {/* Sermon Pipeline Modal */}
        {showPipelineModal && (
          <SermonPipelineModal
            onClose={() => {
              setShowPipelineModal(false);
              if (activeTab === 'sermons') fetchData();
            }}
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
                    onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value ? (e.target.value as any) : null })}
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
                      Day of Week
                    </label>
                    <select
                      value={formData.recurrenceDayOfWeek ?? ''}
                      onChange={(e) => setFormData({ ...formData, recurrenceDayOfWeek: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                    >
                      <option value="">Select day</option>
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
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
  const [mdTab, setMdTab] = useState<'write' | 'preview' | 'split'>('split');

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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-y-auto">
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
                YouTube URL
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
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
              {/* Header row: label + tab switcher */}
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold uppercase tracking-widest text-stone-400">
                  Content (Markdown)
                </label>
                <div className="flex rounded-lg border border-stone-200 overflow-hidden text-xs font-bold">
                  {(['write', 'split', 'preview'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setMdTab(tab)}
                      className={`px-3 py-1.5 capitalize transition-colors ${
                        mdTab === tab
                          ? 'bg-stone-900 text-white'
                          : 'bg-white text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor area */}
              <div className={`rounded-xl border border-stone-200 overflow-hidden ${mdTab === 'split' ? 'grid grid-cols-2' : ''}`}>
                {/* Textarea */}
                {(mdTab === 'write' || mdTab === 'split') && (
                  <div className={mdTab === 'split' ? 'border-r border-stone-200' : ''}>
                    {mdTab === 'split' && (
                      <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-200 text-xs font-bold uppercase tracking-widest text-stone-400">
                        Editor
                      </div>
                    )}
                    <textarea
                      value={typeof formData.articleContent === 'string' ? formData.articleContent : ''}
                      onChange={(e) => setFormData({ ...formData, articleContent: e.target.value })}
                      rows={22}
                      placeholder="Write your sermon content in Markdown format..."
                      className="w-full px-4 py-3 bg-white outline-none resize-none font-mono text-sm leading-relaxed"
                    />
                  </div>
                )}

                {/* Preview */}
                {(mdTab === 'preview' || mdTab === 'split') && (
                  <div>
                    {mdTab === 'split' && (
                      <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-200 text-xs font-bold uppercase tracking-widest text-stone-400">
                        Preview
                      </div>
                    )}
                    <div className={`px-5 py-4 overflow-y-auto font-sans text-sm text-stone-700 leading-relaxed ${mdTab === 'preview' ? 'min-h-[440px]' : 'h-[calc(22*1.625rem+24px)]'}`}>
                      {formData.articleContent ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({children, ...p}) => <h1 className="text-2xl font-black text-stone-900 mt-6 mb-3" {...p}>{children}</h1>,
                            h2: ({children, ...p}) => <h2 className="text-xl font-black text-stone-900 mt-5 mb-2" {...p}>{children}</h2>,
                            h3: ({children, ...p}) => <h3 className="text-lg font-bold text-stone-900 mt-4 mb-2" {...p}>{children}</h3>,
                            p: ({children, ...p}) => <p className="mb-3 leading-relaxed" {...p}>{children}</p>,
                            ul: ({children, ...p}) => <ul className="list-disc pl-5 space-y-1 mb-3" {...p}>{children}</ul>,
                            ol: ({children, ...p}) => <ol className="list-decimal pl-5 space-y-1 mb-3" {...p}>{children}</ol>,
                            li: ({children, ...p}) => <li className="leading-relaxed" {...p}>{children}</li>,
                            strong: ({children, ...p}) => <strong className="font-bold text-stone-900" {...p}>{children}</strong>,
                            em: ({children, ...p}) => <em className="italic" {...p}>{children}</em>,
                            blockquote: ({children, ...p}) => <blockquote className="border-l-4 border-stone-300 pl-4 italic text-stone-500 my-3" {...p}>{children}</blockquote>,
                            code: ({children, ...p}: any) => {
                              const isInline = !p.className?.includes('language-');
                              return isInline
                                ? <code className="bg-stone-100 px-1 py-0.5 rounded text-xs font-mono text-stone-800" {...p}>{children}</code>
                                : <code className="block bg-stone-100 p-3 rounded-lg text-xs font-mono text-stone-800 overflow-x-auto my-3" {...p}>{children}</code>;
                            },
                            hr: ({...p}) => <hr className="border-stone-200 my-4" {...p} />,
                          }}
                        >
                          {formData.articleContent}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-stone-300 italic">Nothing to preview yet…</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-2">Supports Markdown: **bold**, *italic*, # headings, - lists, &gt; quotes, `code`</p>
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

const defaultPricingTier: PricingTier = { name: '', minAge: 0, maxAge: null, price: null, isFree: false };

// Retreat Form Component
function RetreatFormModal({ retreat, onClose, onSave }: { retreat: Retreat | null; onClose: () => void; onSave: (data: Partial<Retreat>) => void }) {
  const [formData, setFormData] = useState<Partial<Retreat>>({
    name: retreat?.name || '',
    description: retreat?.description || '',
    startDate: retreat?.startDate ? new Date(retreat.startDate).toISOString().slice(0, 16) : '',
    endDate: retreat?.endDate ? new Date(retreat.endDate).toISOString().slice(0, 16) : '',
    location: retreat?.location || '',
    isActive: retreat?.isActive ?? false,
    pricingTiers: retreat?.pricingTiers?.length ? [...retreat.pricingTiers] : [],
  });
  const tiers = formData.pricingTiers ?? [];

  const updateTiers = (next: PricingTier[]) => {
    setFormData((prev) => ({ ...prev, pricingTiers: next }));
  };
  const addTier = () => updateTiers([...tiers, { ...defaultPricingTier }]);
  const removeTier = (i: number) => updateTiers(tiers.filter((_, idx) => idx !== i));
  const setTier = (i: number, patch: Partial<PricingTier>) => {
    const next = tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    updateTiers(next);
  };

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
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400">
                  Pricing tiers
                </label>
                <button type="button" onClick={addTier} className="text-sm font-bold text-stone-900 hover:text-stone-600 flex items-center gap-1">
                  <Plus size={14} /> Add tier
                </button>
              </div>
              <p className="text-xs text-stone-500 mb-3">Age ranges (min/max years), name, and Free or price. Order by min age.</p>
              <div className="space-y-4">
                {tiers.map((tier, i) => (
                  <div key={i} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-500">Tier {i + 1}</span>
                      <button type="button" onClick={() => removeTier(i)} className="p-1 hover:bg-stone-200 rounded text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 mb-1">Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Adult"
                          value={tier.name}
                          onChange={(e) => setTier(i, { name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-stone-500 mb-1">Min age</label>
                          <input
                            type="number"
                            min={0}
                            value={tier.minAge}
                            onChange={(e) => setTier(i, { minAge: parseInt(e.target.value, 10) || 0 })}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm"
                          />
                        </div>
                        <span className="text-stone-400 pb-2">–</span>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-stone-500 mb-1">Max age (blank = no max)</label>
                          <input
                            type="number"
                            min={0}
                            placeholder="—"
                            value={tier.maxAge ?? ''}
                            onChange={(e) => setTier(i, { maxAge: e.target.value === '' ? null : parseInt(e.target.value, 10) || 0 })}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tier.isFree}
                          onChange={(e) => setTier(i, { isFree: e.target.checked, price: e.target.checked ? null : tier.price })}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900"
                        />
                        <span className="text-sm font-medium text-stone-900">Free</span>
                      </label>
                      {!tier.isFree && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-stone-700">$</label>
                          <input
                            type="number"
                            min={0}
                            value={tier.price ?? ''}
                            onChange={(e) => setTier(i, { price: e.target.value === '' ? null : parseInt(e.target.value, 10) || 0 })}
                            className="w-20 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

// Pipeline step definitions for UI
const PIPELINE_STEPS = [
  { id: 'metadata', label: 'Fetch video info (optional)', icon: Youtube },
  { id: 'audio', label: 'Prepare audio', icon: Music },
  { id: 'transcribe', label: 'Transcribe & rewrite', icon: FileText },
  { id: 'save', label: 'Save to database', icon: Radio },
  { id: 'rss', label: 'Update podcast feed', icon: Rss },
] as const;

type StepId = typeof PIPELINE_STEPS[number]['id'];
type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface PipelineResult {
  sermonId: string;
  title: string;
  thumbnailUrl: string;
  audioUrl: string;
  rssUrl: string;
  podcastDescription: string;
}

type ModalPhase = 'form' | 'running' | 'review' | 'confirming' | 'complete';

interface ReviewData {
  title: string;
  speaker: string;
  date: string | null;
  youtubeUrl: string;
  audioUrl: string;
  articleContent: string;
  podcastDescription: string;
}

function SermonPipelineModal({ onClose }: { onClose: () => void }) {
  // ── Form inputs ────────────────────────────────────────────────────────
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [preacherName, setPreacherName] = useState('');

  // ── Audio file upload state ────────────────────────────────────────────
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [uploadedAudioMime, setUploadedAudioMime] = useState<string>('audio/mp4');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Phase + progress state ─────────────────────────────────────────────
  const [phase, setPhase] = useState<ModalPhase>('form');
  const [stepStatuses, setStepStatuses] = useState<Record<StepId, StepStatus>>({
    metadata: 'pending', audio: 'pending',
    transcribe: 'pending', save: 'pending', rss: 'pending',
  });
  const [stepMessages, setStepMessages] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Review phase state ─────────────────────────────────────────────────
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');

  // ── Complete state ─────────────────────────────────────────────────────
  const [publishedSermonId, setPublishedSermonId] = useState('');
  const [publishedTitle, setPublishedTitle] = useState('');
  const [publishedRssUrl, setPublishedRssUrl] = useState('');
  const [rssCopied, setRssCopied] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────
  const updateStep = (step: string, status: StepStatus, message?: string) => {
    if (PIPELINE_STEPS.some((s) => s.id === step)) {
      setStepStatuses((prev) => ({ ...prev, [step as StepId]: status }));
    }
    if (message) setStepMessages((prev) => ({ ...prev, [step]: message }));
  };

  const stepIcon = (status: StepStatus, Icon: React.ElementType) => {
    if (status === 'done') return <CheckCircle2 size={18} className="text-green-500" />;
    if (status === 'error') return <AlertCircle size={18} className="text-red-500" />;
    if (status === 'running') return <Loader2 size={18} className="animate-spin text-blue-500" />;
    return <Icon size={18} className="text-stone-300" />;
  };

  const resetToForm = () => {
    setPhase('form');
    setErrorMessage(null);
    setReviewData(null);
    setStepStatuses({
      metadata: 'pending', audio: 'pending',
      transcribe: 'pending', save: 'pending', rss: 'pending',
    });
    setStepMessages({});
  };

  // ── Audio file selection & upload ──────────────────────────────────────
  const handleFileSelect = async (file: File) => {
    setAudioFile(file);
    setUploadedAudioUrl(null);
    setUploadError(null);
    setUploadProgress(0);
    setUploading(true);

    try {
      const { upload } = await import('@vercel/blob/client');
      const blob = await upload(`sermons/audio/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-audio',
        onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),
      });
      setUploadedAudioUrl(blob.url);
      setUploadedAudioMime(file.type || 'audio/mp4');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setAudioFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // ── Phase 1: Run pipeline ──────────────────────────────────────────────
  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedAudioUrl) return;

    setPhase('running');
    setErrorMessage(null);
    setStepStatuses({
      metadata: youtubeUrl ? 'running' : 'done', audio: 'pending',
      transcribe: 'pending', save: 'pending', rss: 'pending',
    });

    try {
      const response = await fetch('/api/sermons/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl || undefined,
          preacherName,
          audioUrl: uploadedAudioUrl,
          audioMimeType: uploadedAudioMime,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error((await response.text()) || 'Request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());
            const { step, message } = payload;

            if (step === 'error') {
              setErrorMessage(message);
              setPhase('form');
              return;
            }

            if (step === 'review') {
              const rd: ReviewData = {
                title: payload.title,
                speaker: payload.speaker,
                date: payload.date,
                youtubeUrl: payload.youtubeUrl,
                audioUrl: payload.audioUrl,
                articleContent: payload.articleContent,
                podcastDescription: payload.podcastDescription,
              };
              setReviewData(rd);
              setEditedContent(payload.articleContent);
              setEditedTitle(payload.title);
              setPhase('review');
              return;
            }

            // Advance step indicators
            const stepIdx = PIPELINE_STEPS.findIndex((s) => s.id === step);
            const nextStep = PIPELINE_STEPS[stepIdx + 1]?.id as StepId | undefined;
            updateStep(step, 'done', message);
            if (nextStep && nextStep !== 'save' && nextStep !== 'rss') {
              updateStep(nextStep, 'running');
            }
            // upload_audio step is handled client-side; skip it in SSE
          } catch { /* ignore malformed lines */ }
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      setPhase('form');
    }
  };

  // ── Phase 2: Confirm & publish ─────────────────────────────────────────
  const handleConfirm = async () => {
    if (!reviewData) return;
    setPhase('confirming');
    updateStep('save', 'running');

    try {
      const res = await fetch('/api/sermons/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          speaker: reviewData.speaker,
          date: reviewData.date,
          youtubeUrl: reviewData.youtubeUrl,
          audioUrl: reviewData.audioUrl,
          thumbnailUrl: `${window.location.origin}/images/CHURCH IN KOMOKA.png`,
          articleContent: editedContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish sermon');

      updateStep('save', 'done', 'Sermon saved.');
      updateStep('rss', 'running');
      // rss is done server-side within confirm; just mark it complete
      updateStep('rss', 'done', 'Podcast feed updated.');

      setPublishedSermonId(data.sermonId);
      setPublishedTitle(data.title);
      setPublishedRssUrl(data.rssUrl ?? `${window.location.origin}/api/podcast`);
      setPhase('complete');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to publish sermon');
      setPhase('review');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto">
        <div className="p-8">

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-stone-900">
                {phase === 'review' || phase === 'confirming' ? 'Review & Approve' : 'Add Sermon'}
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                {phase === 'review'
                  ? 'Edit the transcript before publishing'
                  : phase === 'complete'
                  ? 'Sermon published successfully'
                  : 'Upload audio, transcribe with Gemini, and publish to podcast'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={phase === 'running' || phase === 'confirming'}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-40 shrink-0"
            >
              <X size={24} />
            </button>
          </div>

          {/* ── FORM ── */}
          {phase === 'form' && (
            <form onSubmit={handleRun} className="space-y-5">
              {errorMessage && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Audio file upload */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Audio File <span className="text-red-500">*</span>
                </label>

                {/* Drop zone */}
                {!audioFile && !uploading && (
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => document.getElementById('audio-file-input')?.click()}
                    className={`relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      dragOver
                        ? 'border-stone-900 bg-stone-50'
                        : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    <Music size={28} className="text-stone-300" />
                    <div className="text-center">
                      <p className="font-semibold text-stone-700 text-sm">Drop audio file here or click to browse</p>
                      <p className="text-xs text-stone-400 mt-1">MP3, M4A, MP4, WAV, OGG, FLAC — up to 500 MB</p>
                    </div>
                    <input
                      id="audio-file-input"
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                  </div>
                )}

                {/* Upload progress */}
                {uploading && (
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-600 truncate max-w-[60%]">{audioFile?.name}</span>
                      <span className="text-stone-500 font-mono">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-900 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload complete */}
                {uploadedAudioUrl && !uploading && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-900 truncate">{audioFile?.name}</p>
                      <p className="text-xs text-green-700">Uploaded successfully</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAudioFile(null); setUploadedAudioUrl(null); setUploadProgress(0); }}
                      className="p-1 hover:bg-green-200 rounded-lg transition-colors"
                    >
                      <X size={14} className="text-green-700" />
                    </button>
                  </div>
                )}

                {/* Upload error */}
                {uploadError && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mt-2">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                )}
              </div>

              {/* Preacher name */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Preacher Name <span className="text-red-500">*</span>
                </label>
                <input type="text" required placeholder="e.g. Pastor John Smith"
                  value={preacherName} onChange={(e) => setPreacherName(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
              </div>

              {/* YouTube URL (optional) */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                  YouTube URL <span className="text-stone-300 font-normal normal-case">(optional — used to auto-fill title &amp; date)</span>
                </label>
                <input type="url" placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
              </div>

              <button
                type="submit"
                disabled={!uploadedAudioUrl || uploading || !preacherName}
                className="w-full px-6 py-4 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileText size={18} /> Transcribe & Process
              </button>
            </form>
          )}

          {/* ── RUNNING / CONFIRMING — progress steps ── */}
          {(phase === 'running' || phase === 'confirming') && (
            <div className="space-y-3">
              {PIPELINE_STEPS.map(({ id, label, icon: Icon }) => {
                const status = stepStatuses[id];
                const msg = stepMessages[id];
                return (
                  <div key={id} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    status === 'running' ? 'border-blue-200 bg-blue-50'
                    : status === 'done' ? 'border-green-200 bg-green-50'
                    : status === 'error' ? 'border-red-200 bg-red-50'
                    : 'border-stone-100 bg-stone-50'}`}>
                    <div className="mt-0.5">{stepIcon(status, Icon)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${status === 'pending' ? 'text-stone-400' : 'text-stone-900'}`}>{label}</p>
                      {msg && <p className="text-xs text-stone-500 mt-0.5 truncate">{msg}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── REVIEW ── */}
          {(phase === 'review') && reviewData && (
            <div className="space-y-6">
              {errorMessage && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">Sermon Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                />
              </div>

              {/* Transcript */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-stone-400">Article / Transcript</label>
                  <span className="text-xs text-stone-400">{editedContent.length} chars</span>
                </div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={18}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-y font-mono text-sm leading-relaxed"
                  placeholder="Sermon article content (Markdown)…"
                />
                <p className="text-xs text-stone-400 mt-1">Markdown supported. This will appear on the sermon page.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-stone-100">
                <button onClick={resetToForm}
                  className="px-5 py-3 bg-stone-100 text-stone-700 rounded-xl font-bold text-sm hover:bg-stone-200 transition-colors">
                  ← Start Over
                </button>
                <button onClick={handleConfirm}
                  className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Confirm & Publish
                </button>
              </div>
            </div>
          )}

          {/* ── COMPLETE ── */}
          {phase === 'complete' && (
            <div className="space-y-5">
              {/* Success banner */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-900">Published!</p>
                  <p className="text-sm text-green-700">"{publishedTitle}" is live on the site and podcast feed.</p>
                </div>
              </div>

              {/* Links */}
              <div className="flex gap-2">
                <a href={`/resources/${publishedSermonId}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-700 transition-colors">
                  <ExternalLink size={14} /> View Sermon Page
                </a>
                <a href={publishedRssUrl || '/api/podcast'} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-bold text-sm hover:bg-stone-200 transition-colors">
                  <Rss size={14} /> Preview RSS Feed
                </a>
              </div>

              {/* Spotify RSS setup card */}
              <div className="border border-green-200 rounded-2xl overflow-hidden">
                <div className="bg-green-600 px-4 py-3 flex items-center gap-2">
                  <Radio size={16} className="text-white" />
                  <p className="text-white font-bold text-sm">Add to Spotify for Creators</p>
                </div>
                <div className="p-4 space-y-3 bg-white">
                  <p className="text-sm text-stone-600">
                    Spotify pulls new episodes automatically from your RSS feed — you only need to submit the URL once.
                  </p>

                  {/* Copyable RSS URL */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1.5">Your RSS Feed URL</p>
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                      <code className="flex-1 text-xs text-stone-700 break-all select-all">
                        {publishedRssUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/podcast`}
                      </code>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(publishedRssUrl || `${window.location.origin}/api/podcast`);
                          setRssCopied(true);
                          setTimeout(() => setRssCopied(false), 2000);
                        }}
                        className="shrink-0 p-1.5 hover:bg-stone-200 rounded-lg transition-colors"
                        title="Copy RSS URL"
                      >
                        {rssCopied
                          ? <CheckCircle2 size={14} className="text-green-600" />
                          : <Upload size={14} className="text-stone-500" />}
                      </button>
                    </div>
                  </div>

                  {/* Step-by-step instructions */}
                  <ol className="space-y-2 text-sm text-stone-600">
                    <li className="flex gap-3">
                      <span className="w-5 h-5 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>Go to <a href="https://podcasters.spotify.com" target="_blank" rel="noopener noreferrer" className="text-green-700 font-semibold underline underline-offset-2">podcasters.spotify.com</a> and sign in.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-5 h-5 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span><strong>First time only:</strong> click <em>"Get started"</em> → <em>"I have a podcast"</em> → paste the RSS URL above.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-5 h-5 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span><strong>Already set up?</strong> Spotify checks your feed automatically every 24 h — this new episode will appear without any action needed.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-5 h-5 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                      <span>Once the episode appears, copy its Spotify link and paste it into the sermon record in your Admin → Sermons table to enable the "Listen on Spotify" button on the sermon page.</span>
                    </li>
                  </ol>
                </div>
              </div>

              <button onClick={onClose}
                className="w-full px-6 py-3 bg-stone-100 text-stone-900 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-200 transition-colors">
                Done
              </button>
            </div>
          )}

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
