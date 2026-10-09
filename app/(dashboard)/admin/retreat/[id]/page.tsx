"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  Save,
  Loader2,
  Users,
  CheckCircle2,
  Edit,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  Pencil,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { exportRegistrationsToExcel } from "@/src/lib/exportRegistrations";

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

type RegistrationSummary = {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: string;
  type: string;
  notes?: string;
  churchName?: string | null;
  pastorName?: string | null;
  pastorContact?: string | null;
  city?: string | null;
  country?: string | null;
  arrivalDate?: string | null;
  departureDate?: string | null;
  createdAt: string;
};

type Registrant = {
  id: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  age?: number | null;
  isAdult: boolean;
  dietaryRestrictions?: string;
  medicalNotes?: string;
  createdAt: string;
};

type RegistrantRow = {
  registrant: Registrant;
  registration: RegistrationSummary;
};

function tierForAge(
  age: number | null | undefined,
  tiers: PricingTier[] | null | undefined,
): PricingTier | null {
  if (!tiers || age == null) return null;
  return (
    tiers.find(
      (t) => age >= t.minAge && (t.maxAge == null || age <= t.maxAge),
    ) ?? null
  );
}

export default function RetreatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id: retreatId } = use(params);

  const [retreat, setRetreat] = useState<Retreat | null>(null);
  const [rows, setRows] = useState<RegistrantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [viewingRegistration, setViewingRegistration] =
    useState<RegistrationSummary | null>(null);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const isModalOpen = showEditForm || viewingRegistration !== null;
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !(session.user as any)?.isAdmin) {
      router.push("/");
      return;
    }
    fetchData();
  }, [status, session, retreatId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [retreatRes, registrantsRes] = await Promise.all([
        fetch(`/api/retreat/retreats/${retreatId}`),
        fetch(`/api/retreat/retreats/${retreatId}/registrants`),
      ]);

      const retreatData = await retreatRes.json();
      const registrantsData = await registrantsRes.json();

      setRetreat(retreatData.retreat);
      setRows(registrantsData.rows || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    registrationId: string,
    newStatus: string,
  ) => {
    try {
      const res = await fetch(`/api/retreat/${registrationId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        setViewingRegistration(null);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    try {
      const res = await fetch(`/api/retreat/${registrationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setViewingRegistration(null);
        fetchData();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Failed to delete registration");
      }
    } catch (error) {
      console.error("Error deleting registration:", error);
      alert("Failed to delete registration");
    }
  };

  const handleSaveRetreat = async (retreatData: Partial<Retreat>) => {
    if (!retreat) return;

    try {
      const res = await fetch(`/api/retreat/retreats/${retreat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(retreatData),
      });

      if (res.ok) {
        setShowEditForm(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error saving retreat:", error);
    }
  };

  // Metrics
  const activeRows = rows.filter((r) => r.registration.status !== "cancelled");
  const totalRegistrants = activeRows.length;
  const totalPaid = useMemo(() => {
    return activeRows.filter((r) => r.registration.status === "confirmed")
      .length;
  }, [activeRows]);

  // Group by registration, filtered by search
  type RegistrationGroup = {
    registration: RegistrationSummary;
    registrants: Registrant[];
  };

  const groups = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? rows.filter(
          (r) =>
            `${r.registrant.firstName} ${r.registrant.lastName}`
              .toLowerCase()
              .includes(q) ||
            r.registration.contactName.toLowerCase().includes(q) ||
            r.registration.contactEmail.toLowerCase().includes(q),
        )
      : rows;

    const map = new Map<string, RegistrationGroup>();
    for (const row of filtered) {
      const existing = map.get(row.registration.id);
      if (existing) {
        existing.registrants.push(row.registrant);
      } else {
        map.set(row.registration.id, {
          registration: row.registration,
          registrants: [row.registrant],
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.registration.createdAt).getTime() -
        new Date(a.registration.createdAt).getTime(),
    );
  }, [rows, search]);

  const handleExport = async () => {
    if (!retreat) return;
    setExporting(true);
    try {
      const all = new Map<string, RegistrationGroup>();
      for (const row of rows) {
        const g = all.get(row.registration.id);
        if (g) g.registrants.push(row.registrant);
        else
          all.set(row.registration.id, {
            registration: row.registration,
            registrants: [row.registrant],
          });
      }
      await exportRegistrationsToExcel(
        retreat.name,
        Array.from(all.values()),
        retreat.pricingTiers,
      );
    } catch (error) {
      console.error("Error exporting registrants:", error);
    } finally {
      setExporting(false);
    }
  };

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!session || !(session.user as any)?.isAdmin) return null;

  if (!retreat) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">Retreat not found</p>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-700 transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  const statusColor = (s: string) =>
    s === "confirmed"
      ? "bg-green-100 text-green-700"
      : s === "pending"
        ? "bg-yellow-100 text-yellow-700"
        : s === "cancelled"
          ? "bg-red-100 text-red-600"
          : "bg-blue-100 text-blue-700";

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 pt-20 md:pt-24 pb-12">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-4 font-bold text-sm uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Admin
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900">
              {retreat.name}
            </h1>
            {retreat.description && (
              <p className="text-stone-500 mt-1 max-w-2xl">
                {retreat.description}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleExport}
              disabled={exporting || rows.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-stone-900 border border-stone-200 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Export
            </button>
            <button
              onClick={() => setShowEditForm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors"
            >
              <Edit size={16} />
              Edit
            </button>
          </div>
        </div>

        {/* 2 Metric Cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-10">
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-stone-600" />
              </div>
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-stone-400">
                Total Registrants
              </h3>
            </div>
            <p className="text-4xl font-black text-stone-900">
              {totalRegistrants}
            </p>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-stone-400">
                Total Paid
              </h3>
            </div>
            <p className="text-4xl font-black text-stone-900">{totalPaid}</p>
          </div>
        </div>

        {/* Grouped Data Table */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
            <h2 className="text-lg font-bold text-stone-900 shrink-0">
              Registrations
            </h2>
            <div className="relative sm:max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-stone-500">
                {search
                  ? "No results match your search."
                  : "No registrations for this retreat yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {groups.map((group) => {
                const isCollapsed = collapsedGroups.has(group.registration.id);
                const groupTotal = retreat.pricingTiers?.length
                  ? group.registrants.reduce((sum, reg) => {
                      const t = tierForAge(reg.age, retreat.pricingTiers);
                      if (!t || t.isFree) return sum;
                      return sum + (t.price ?? 0);
                    }, 0)
                  : null;
                return (
                  <div key={group.registration.id}>
                    {/* Registration header row */}
                    <div
                      className="flex items-start gap-3 px-4 md:px-6 py-4 bg-stone-50/60 cursor-pointer hover:bg-stone-100/60 transition-colors"
                      onClick={() => toggleGroup(group.registration.id)}
                    >
                      <div className="text-stone-400 shrink-0 pt-1">
                        {isCollapsed ? (
                          <ChevronRight size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingRegistration(group.registration);
                            }}
                            className="text-left hover:underline min-w-0 max-w-full"
                          >
                            <span className="block font-bold text-stone-900 truncate">
                              {group.registration.contactName}
                            </span>
                            <span className="block text-stone-400 text-sm truncate">
                              {group.registration.contactEmail}
                            </span>
                          </button>
                          <div onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={group.registration.status}
                              onValueChange={(value) =>
                                handleStatusUpdate(group.registration.id, value)
                              }
                            >
                              <SelectTrigger
                                className={`h-auto w-auto gap-1.5 rounded-full border-0 px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-none ${statusColor(group.registration.status)}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="end">
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Paid</SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                                <SelectItem value="waitlisted">
                                  Waitlisted
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-stone-500 tabular-nums">
                          <span>
                            {group.registrants.length}{" "}
                            {group.registrants.length === 1
                              ? "person"
                              : "people"}
                            {groupTotal != null && (
                              <span className="ml-1 font-bold text-stone-700">
                                · ${groupTotal}
                              </span>
                            )}
                          </span>
                          <span className="text-stone-400">
                            {new Date(
                              group.registration.createdAt,
                            ).toLocaleDateString("en-US", {
                              timeZone: "America/New_York",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Registrant rows */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-xs font-bold uppercase tracking-widest text-stone-300 border-b border-stone-100">
                              <th className="pl-11 md:pl-16 pr-3 md:pr-6 py-2.5">Name</th>
                              <th className="px-3 md:px-6 py-2.5">Age</th>
                              <th className="px-3 md:px-6 py-2.5">Type</th>
                              {retreat.pricingTiers?.length ? (
                                <th className="px-3 md:px-6 py-2.5">Price</th>
                              ) : null}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {group.registrants.map((registrant) => {
                              const tier = tierForAge(
                                registrant.age,
                                retreat.pricingTiers,
                              );
                              return (
                                <tr
                                  key={registrant.id}
                                  className="hover:bg-stone-50 transition-colors"
                                >
                                  <td className="pl-11 md:pl-16 pr-3 md:pr-6 py-3">
                                    <p className="font-medium text-stone-900">
                                      {registrant.firstName}{" "}
                                      {registrant.lastName}
                                    </p>
                                  </td>
                                  <td className="px-3 md:px-6 py-3 text-stone-600 text-sm">
                                    {registrant.age != null
                                      ? registrant.age
                                      : "—"}
                                  </td>
                                  <td className="px-3 md:px-6 py-3 text-stone-500 text-sm">
                                    {registrant.isAdult ? "Adult" : "Child"}
                                  </td>
                                  {retreat.pricingTiers?.length ? (
                                    <td className="px-3 md:px-6 py-3 font-bold text-stone-900 text-sm">
                                      {tier
                                        ? tier.isFree
                                          ? "Free"
                                          : `$${tier.price ?? 0}`
                                        : "—"}
                                    </td>
                                  ) : null}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Registration Detail Modal */}
      {viewingRegistration && (
        <RegistrationDetailModal
          registration={viewingRegistration}
          registrants={rows
            .filter((r) => r.registration.id === viewingRegistration.id)
            .map((r) => r.registrant)}
          pricingTiers={retreat.pricingTiers}
          onClose={() => setViewingRegistration(null)}
          onUpdateStatus={handleStatusUpdate}
          onDelete={handleDeleteRegistration}
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
  registrants,
  pricingTiers,
  onClose,
  onUpdateStatus,
  onDelete,
}: {
  registration: RegistrationSummary;
  registrants: Registrant[];
  pricingTiers?: PricingTier[] | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const groupTotal = pricingTiers?.length
    ? registrants.reduce((sum, reg) => {
        const t = tierForAge(reg.age, pricingTiers);
        if (!t || t.isFree) return sum;
        return sum + (t.price ?? 0);
      }, 0)
    : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900">
              Registration Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-stone-900 mb-1">
                {registration.contactName}
              </h3>
              <p className="text-stone-600">{registration.contactEmail}</p>
              {registration.contactPhone && (
                <p className="text-stone-600">{registration.contactPhone}</p>
              )}
              <p className="text-sm text-stone-500 mt-2">
                Payment reference:{" "}
                <span className="font-mono font-bold text-stone-900">
                  RET-{registration.id.replace(/-/g, "").slice(0, 8).toUpperCase()}
                </span>
                {" · "}
                <a
                  href={`/retreat/registration/${registration.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-stone-900 underline"
                >
                  Registrant page
                </a>
                {" · "}
                <a
                  href={`/api/retreat/${registration.id}/pdf`}
                  className="font-bold text-stone-900 underline"
                >
                  PDF
                </a>
              </p>
            </div>

            {(registration.churchName ||
              registration.pastorName ||
              registration.city ||
              registration.country ||
              registration.arrivalDate ||
              registration.departureDate) && (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ["Church", registration.churchName],
                  [
                    "Pastor",
                    registration.pastorName
                      ? `${registration.pastorName}${registration.pastorContact ? ` (${registration.pastorContact})` : ""}`
                      : null,
                  ],
                  [
                    "From",
                    [registration.city, registration.country]
                      .filter(Boolean)
                      .join(", ") || null,
                  ],
                  ["Arrival", registration.arrivalDate],
                  ["Departure", registration.departureDate],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label as string}>
                      <dt className="font-bold uppercase tracking-widest text-xs text-stone-400">
                        {label}
                      </dt>
                      <dd className="text-stone-700">{value}</dd>
                    </div>
                  ))}
              </dl>
            )}

            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Status
              </label>
              <Select
                value={registration.status}
                onValueChange={(value) =>
                  onUpdateStatus(registration.id, value)
                }
              >
                <SelectTrigger className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none h-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {registration.notes && (
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                  Notes
                </label>
                <p className="text-stone-600 whitespace-pre-line">
                  {registration.notes}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">
                Registrants ({registrants.length})
              </h4>
              <div className="space-y-3">
                {registrants.map((reg) => {
                  const tier = tierForAge(reg.age, pricingTiers);
                  const price = tier
                    ? tier.isFree
                      ? "Free"
                      : `$${tier.price ?? 0}`
                    : null;
                  return (
                    <div
                      key={reg.id}
                      className="bg-stone-50 p-4 rounded-xl flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900">
                          {reg.firstName} {reg.lastName}
                        </p>
                        <p className="text-sm text-stone-600">
                          {reg.isAdult ? "Adult" : "Child"}
                          {reg.age != null && ` (${reg.age} years)`}
                        </p>
                        {reg.dietaryRestrictions && (
                          <p className="text-sm text-stone-500 mt-1">
                            <span className="font-bold">Dietary:</span>{" "}
                            {reg.dietaryRestrictions}
                          </p>
                        )}
                        {reg.medicalNotes && (
                          <p className="text-sm text-stone-500 mt-1">
                            <span className="font-bold">Medical:</span>{" "}
                            {reg.medicalNotes}
                          </p>
                        )}
                      </div>
                      {price && (
                        <span className="text-sm font-bold text-stone-900 shrink-0">
                          {price}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {groupTotal != null && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-200">
                  <span className="text-sm font-bold uppercase tracking-widest text-stone-400">
                    Total
                  </span>
                  <span className="text-xl font-black text-stone-900">
                    ${groupTotal}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-stone-100">
              {!confirmDelete ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`/retreat/registration/${registration.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors"
                  >
                    <Pencil size={16} />
                    Edit registration
                  </a>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="font-bold text-stone-900 mb-1">
                    Delete this registration?
                  </p>
                  <p className="text-sm text-stone-600 mb-4">
                    This permanently removes {registration.contactName}&apos;s
                    registration and its {registrants.length}{" "}
                    {registrants.length === 1 ? "registrant" : "registrants"}.
                    It can&apos;t be undone. To keep a record, set the status to
                    Cancelled instead.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={async () => {
                        setDeleting(true);
                        await onDelete(registration.id);
                        setDeleting(false);
                      }}
                      disabled={deleting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                      {deleting && <Loader2 size={16} className="animate-spin" />}
                      Yes, delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-100 transition-colors"
                    >
                      Keep it
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const defaultTier: PricingTier = {
  name: "",
  minAge: 0,
  maxAge: null,
  price: null,
  isFree: false,
};

function RetreatFormModal({
  retreat,
  onClose,
  onSave,
}: {
  retreat: Retreat;
  onClose: () => void;
  onSave: (data: Partial<Retreat>) => void;
}) {
  const [formData, setFormData] = useState<Partial<Retreat>>({
    name: retreat?.name || "",
    description: retreat?.description || "",
    startDate: retreat?.startDate
      ? new Date(retreat.startDate).toISOString().slice(0, 16)
      : "",
    endDate: retreat?.endDate
      ? new Date(retreat.endDate).toISOString().slice(0, 16)
      : "",
    location: retreat?.location || "",
    isActive: retreat?.isActive ?? false,
    pricingTiers: retreat?.pricingTiers?.length
      ? [...retreat.pricingTiers]
      : [],
  });
  const tiers = formData.pricingTiers ?? [];

  const updateTiers = (next: PricingTier[]) => {
    setFormData((prev) => ({ ...prev, pricingTiers: next }));
  };
  const addTier = () => updateTiers([...tiers, { ...defaultTier }]);
  const removeTier = (i: number) =>
    updateTiers(tiers.filter((_, idx) => idx !== i));
  const setTier = (i: number, patch: Partial<PricingTier>) => {
    const next = tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    updateTiers(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900">
              Edit Retreat
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
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
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
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
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold uppercase tracking-widest text-stone-400">
                  Pricing tiers
                </label>
                <button
                  type="button"
                  onClick={addTier}
                  className="text-sm font-bold text-stone-900 hover:text-stone-600 flex items-center gap-1"
                >
                  <Plus size={14} /> Add tier
                </button>
              </div>
              <div className="space-y-4">
                {tiers.map((tier, i) => (
                  <div
                    key={i}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-500">
                        Tier {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTier(i)}
                        className="p-1 hover:bg-stone-200 rounded text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 mb-1">
                          Name
                        </label>
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
                          <label className="block text-xs font-bold text-stone-500 mb-1">
                            Min age
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={tier.minAge}
                            onChange={(e) =>
                              setTier(i, {
                                minAge: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm"
                          />
                        </div>
                        <span className="text-stone-400 pb-2">–</span>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-stone-500 mb-1">
                            Max age
                          </label>
                          <input
                            type="number"
                            min={0}
                            placeholder="—"
                            value={tier.maxAge ?? ""}
                            onChange={(e) =>
                              setTier(i, {
                                maxAge:
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value, 10) || 0,
                              })
                            }
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
                          onChange={(e) =>
                            setTier(i, {
                              isFree: e.target.checked,
                              price: e.target.checked ? null : tier.price,
                            })
                          }
                          className="w-4 h-4 rounded border-stone-300 text-stone-900"
                        />
                        <span className="text-sm font-medium text-stone-900">
                          Free
                        </span>
                      </label>
                      {!tier.isFree && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-stone-700">
                            $
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={tier.price ?? ""}
                            onChange={(e) =>
                              setTier(i, {
                                price:
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-20 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {tiers.length === 0 && (
                <p className="text-sm text-stone-500 italic mt-2">
                  No tiers. Add tiers above or leave empty for &quot;Contact for
                  pricing&quot;.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-bold text-stone-900"
              >
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
