'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  X,
  Save,
  Loader2,
  Users,
  UserCheck,
  Clock,
  XCircle,
  Edit,
} from 'lucide-react';

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
  retreatId?: string;
  type: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: string;
  notes?: string;
  createdAt: string;
};

type RetreatRegistrant = {
  id: string;
  firstName: string;
  lastName: string;
  age?: number;
  isAdult: boolean;
  dietaryRestrictions?: string;
  medicalNotes?: string;
};

export default function RetreatRegistrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const retreatId = params.id as string;
  
  const [retreat, setRetreat] = useState<Retreat | null>(null);
  const [registrations, setRegistrations] = useState<RetreatRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingRegistration, setViewingRegistration] = useState<RetreatRegistration | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalRegistrants: 0,
    adults: 0,
    children: 0,
    byStatus: {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      waitlisted: 0,
    },
    byType: {
      individual: 0,
      family: 0,
    },
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !(session.user as any)?.isAdmin) {
      router.push('/');
      return;
    }
    fetchData();
  }, [status, session, retreatId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [retreatRes, registrationsRes] = await Promise.all([
        fetch(`/api/retreat/retreats/${retreatId}`),
        fetch(`/api/retreat/all?retreatId=${retreatId}`)
      ]);
      
      const retreatData = await retreatRes.json();
      const registrationsData = await registrationsRes.json();
      
      setRetreat(retreatData.retreat);
      const fetchedRegistrations = registrationsData.registrations || [];
      setRegistrations(fetchedRegistrations);

      // Fetch registrants for all registrations to calculate stats
      const registrantPromises = fetchedRegistrations.map((reg: RetreatRegistration) =>
        fetch(`/api/retreat/${reg.id}`).then(res => res.json())
      );
      const registrantData = await Promise.all(registrantPromises);

      // Calculate stats
      let totalRegistrants = 0;
      let adults = 0;
      let children = 0;
      const byStatus = {
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        waitlisted: 0,
      };
      const byType = {
        individual: 0,
        family: 0,
      };

      fetchedRegistrations.forEach((reg: RetreatRegistration) => {
        // Count by status
        byStatus[reg.status as keyof typeof byStatus]++;
        
        // Count by type
        byType[reg.type as keyof typeof byType]++;
      });

      registrantData.forEach((data: { registrants: RetreatRegistrant[] }) => {
        const registrants = data.registrants || [];
        totalRegistrants += registrants.length;
        registrants.forEach((reg: RetreatRegistrant) => {
          if (reg.isAdult) {
            adults++;
          } else {
            children++;
          }
        });
      });

      setStats({
        totalRegistrations: fetchedRegistrations.length,
        totalRegistrants,
        adults,
        children,
        byStatus,
        byType,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (registrationId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/retreat/${registrationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        setViewingRegistration(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSaveRetreat = async (retreatData: Partial<Retreat>) => {
    if (!retreat) return;
    
    try {
      const res = await fetch(`/api/retreat/retreats/${retreat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retreatData),
      });

      if (res.ok) {
        setShowEditForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving retreat:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!session || !(session.user as any)?.isAdmin) {
    return null;
  }

  if (!retreat) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">Retreat not found</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-700 transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-24 pb-12">
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-4 font-bold"
        >
          <ArrowLeft size={20} />
          Back to Admin
        </button>
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black tracking-tight text-stone-900">{retreat.name}</h1>
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors"
          >
            <Edit size={16} />
            Edit Details
          </button>
        </div>
        
        <div className="mb-8">
          {retreat.description && (
            <p className="text-stone-600 mb-4">{retreat.description}</p>
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

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-stone-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Total Registrations</h3>
            </div>
            <p className="text-3xl font-black text-stone-900">{stats.totalRegistrations}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-stone-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Total Registrants</h3>
            </div>
            <p className="text-3xl font-black text-stone-900">{stats.totalRegistrants}</p>
            <p className="text-xs text-stone-500 mt-1">
              {stats.adults} adults, {stats.children} children
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Confirmed</h3>
            </div>
            <p className="text-3xl font-black text-green-600">{stats.byStatus.confirmed}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Pending</h3>
            </div>
            <p className="text-3xl font-black text-yellow-600">{stats.byStatus.pending}</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Cancelled</h3>
            </div>
            <p className="text-3xl font-black text-red-600">{stats.byStatus.cancelled}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Waitlisted</h3>
            </div>
            <p className="text-3xl font-black text-blue-600">{stats.byStatus.waitlisted}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-stone-600" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">By Type</h3>
            </div>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-widest">Individual</p>
                <p className="text-2xl font-black text-stone-900">{stats.byType.individual}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-widest">Family</p>
                <p className="text-2xl font-black text-stone-900">{stats.byType.family}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-900">
            Registrations ({registrations.length})
          </h2>
        </div>

        <div className="space-y-4">
          {registrations.map((registration) => (
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
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                      registration.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                      registration.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      registration.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {registration.status}
                    </span>
                    <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-widest">
                      {registration.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {registrations.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center">
              <p className="text-stone-500">No registrations for this retreat yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Registration Detail Modal */}
      {viewingRegistration && (
        <RegistrationDetailModal
          registration={viewingRegistration}
          onClose={() => setViewingRegistration(null)}
          onUpdateStatus={handleStatusUpdate}
        />
      )}

      {/* Edit Retreat Modal */}
      {showEditForm && retreat && (
        <RetreatFormModal
          retreat={retreat}
          onClose={() => setShowEditForm(false)}
          onSave={handleSaveRetreat}
        />
      )}
    </div>
  );
}

function RegistrationDetailModal({ 
  registration, 
  onClose, 
  onUpdateStatus 
}: { 
  registration: RetreatRegistration; 
  onClose: () => void; 
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [registrants, setRegistrants] = useState<RetreatRegistrant[]>([]);
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
                onChange={(e) => onUpdateStatus(registration.id, e.target.value)}
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
                      {reg.dietaryRestrictions && (
                        <p className="text-sm text-stone-500 mt-1"><span className="font-bold">Dietary:</span> {reg.dietaryRestrictions}</p>
                      )}
                      {reg.medicalNotes && (
                        <p className="text-sm text-stone-500 mt-1"><span className="font-bold">Medical:</span> {reg.medicalNotes}</p>
                      )}
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

function RetreatFormModal({ retreat, onClose, onSave }: { retreat: Retreat; onClose: () => void; onSave: (data: Partial<Retreat>) => void }) {
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
              Edit Retreat
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
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
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
                />
              </div>
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
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-stone-900">
                Active Retreat
              </label>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-stone-100 text-stone-900 rounded-xl font-bold hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
