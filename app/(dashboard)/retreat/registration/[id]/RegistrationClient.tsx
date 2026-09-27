"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar as CalendarIcon,
  Check,
  Copy,
  CreditCard,
  Download,
  Loader2,
  MapPin,
  Pencil,
  Plane,
  Plus,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

type PricingTier = {
  name: string;
  minAge: number;
  maxAge: number | null;
  price: number | null;
  isFree: boolean;
};

type Registration = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "waitlisted";
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  churchName: string | null;
  pastorName: string | null;
  pastorContact: string | null;
  city: string | null;
  country: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  notes: string | null;
  createdAt: string;
};

type Registrant = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  isAdult: boolean;
  dietaryRestrictions: string | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};

type Bundle = {
  registration: Registration;
  registrants: Registrant[];
  retreat: {
    id: string;
    name: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
    pricingTiers: PricingTier[] | null;
    paymentInstructions: string | null;
  } | null;
  pricing: {
    lines: { name: string; tierName: string; price: number }[];
    total: number | null;
  } | null;
  paymentReference: string;
  canEdit: boolean;
  editLockedReason: string | null;
};

type AttendeeDraft = {
  key: string;
  id?: string;
  firstName: string;
  lastName: string;
  age: string;
  dietaryRestrictions: string;
  medicalNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

type Draft = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  churchName: string;
  pastorName: string;
  pastorContact: string;
  city: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  notes: string;
  attendees: AttendeeDraft[];
};

const STATUS_STYLES: Record<Registration["status"], { label: string; className: string }> = {
  pending: { label: "Awaiting payment", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed · Paid", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", className: "bg-stone-200 text-stone-700" },
  waitlisted: { label: "Waitlisted", className: "bg-blue-100 text-blue-800" },
};

const inputClass =
  "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all";
const labelClass =
  "block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2";

function formatDate(value: string | null | undefined): string {
  if (!value) return "TBA";
  // Date-only values have no time zone; don't let them shift a day
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toDraft(bundle: Bundle): Draft {
  const r = bundle.registration;
  return {
    contactName: r.contactName,
    contactEmail: r.contactEmail,
    contactPhone: r.contactPhone ?? "",
    churchName: r.churchName ?? "",
    pastorName: r.pastorName ?? "",
    pastorContact: r.pastorContact ?? "",
    city: r.city ?? "",
    country: r.country ?? "",
    arrivalDate: r.arrivalDate ?? "",
    departureDate: r.departureDate ?? "",
    notes: r.notes ?? "",
    attendees: bundle.registrants.map((a) => ({
      key: a.id,
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      age: a.age != null ? String(a.age) : "",
      dietaryRestrictions: a.dietaryRestrictions ?? "",
      medicalNotes: a.medicalNotes ?? "",
      emergencyContactName: a.emergencyContactName ?? "",
      emergencyContactPhone: a.emergencyContactPhone ?? "",
    })),
  };
}

function emptyAttendee(): AttendeeDraft {
  return {
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    firstName: "",
    lastName: "",
    age: "",
    dietaryRestrictions: "",
    medicalNotes: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  };
}

export default function RegistrationClient({ id }: { id: string }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not_found" | "error">("loading");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/retreat/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (res.status === 404) {
        setLoadState("not_found");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setBundle(await res.json());
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable; the value is still visible to copy by hand
    }
  };

  const startEditing = () => {
    if (!bundle) return;
    setDraft(toDraft(bundle));
    setFormError(null);
    setNotice(null);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateDraft = (patch: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const updateAttendee = (key: string, patch: Partial<AttendeeDraft>) =>
    setDraft((d) =>
      d
        ? { ...d, attendees: d.attendees.map((a) => (a.key === key ? { ...a, ...patch } : a)) }
        : d,
    );

  const save = async () => {
    if (!draft) return;
    setFormError(null);

    if (!draft.contactName.trim() || !draft.contactEmail.trim()) {
      setFormError("Contact name and email are required.");
      return;
    }
    if (draft.attendees.length === 0) {
      setFormError("At least one attendee is required.");
      return;
    }
    if (draft.attendees.some((a) => !a.firstName.trim() || a.age.trim() === "")) {
      setFormError("Please fill in a first name and age for every attendee.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/retreat/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: draft.contactName.trim(),
          contactEmail: draft.contactEmail.trim(),
          contactPhone: draft.contactPhone.trim(),
          churchName: draft.churchName.trim(),
          pastorName: draft.pastorName.trim(),
          pastorContact: draft.pastorContact.trim(),
          city: draft.city.trim(),
          country: draft.country.trim(),
          arrivalDate: draft.arrivalDate || null,
          departureDate: draft.departureDate || null,
          notes: draft.notes.trim() || undefined,
          registrants: draft.attendees.map((a) => {
            const age = parseInt(a.age, 10);
            return {
              id: a.id,
              firstName: a.firstName.trim(),
              lastName: a.lastName.trim(),
              age: isNaN(age) ? undefined : age,
              isAdult: isNaN(age) ? true : age >= 18,
              dietaryRestrictions: a.dietaryRestrictions.trim() || undefined,
              medicalNotes: a.medicalNotes.trim() || undefined,
              emergencyContactName: a.emergencyContactName.trim() || undefined,
              emergencyContactPhone: a.emergencyContactPhone.trim() || undefined,
            };
          }),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(data?.error || "We couldn't save your changes. Please try again.");
        return;
      }
      await load();
      setEditing(false);
      setNotice("Your changes have been saved. The church team has been notified.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("We couldn't save your changes. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelRegistration = async () => {
    setCancelling(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/retreat/${encodeURIComponent(id)}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(data?.error || "We couldn't cancel your registration. Please try again.");
        return;
      }
      await load();
      setConfirmCancel(false);
      setNotice("Your registration has been cancelled. The church team has been notified.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("We couldn't cancel your registration. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  // --- Loading / errors ---
  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (loadState !== "ready" || !bundle) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24">
        <div className="max-w-[700px] mx-auto px-6 md:px-12 py-12 md:py-20">
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-stone-100 text-center">
            <h1 className="text-2xl font-black tracking-tight text-stone-900 mb-3">
              {loadState === "not_found" ? "Registration not found" : "Something went wrong"}
            </h1>
            <p className="text-stone-500 mb-8">
              {loadState === "not_found"
                ? "Check the registration ID in your confirmation email and try again."
                : "We couldn't load this registration. Please try again in a moment."}
            </p>
            <Link
              href="/retreat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-800 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Retreat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { registration, registrants, retreat, pricing, paymentReference, canEdit, editLockedReason } = bundle;
  const status = STATUS_STYLES[registration.status] ?? STATUS_STYLES.pending;
  const hasPricing = pricing?.total != null;
  const total = pricing?.total ?? 0;
  const isCancelled = registration.status === "cancelled";
  const isPaid = registration.status === "confirmed";

  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-16">
        <Link
          href="/retreat"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold text-sm uppercase tracking-widest mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Retreat
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
              Your registration
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-stone-900 mb-3 break-words">
              {retreat?.name ?? "Retreat"}
            </h1>
            <span className={cn("inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", status.className)}>
              {status.label}
            </span>
          </div>
          {!editing && (
            <div className="flex flex-wrap gap-3 shrink-0">
              <a
                href={`/api/retreat/${encodeURIComponent(id)}/pdf`}
                className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-colors"
              >
                <Download size={16} /> Download PDF
              </a>
              {canEdit && (
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-stone-200 text-stone-900 rounded-xl font-bold text-sm hover:bg-stone-100 transition-colors"
                >
                  <Pencil size={16} /> Edit registration
                </button>
              )}
            </div>
          )}
        </div>

        {notice && (
          <div className="mb-6 flex items-start gap-3 bg-green-50 text-green-800 p-4 rounded-xl font-medium text-sm">
            <Check size={18} className="shrink-0 mt-0.5" />
            {notice}
          </div>
        )}
        {!canEdit && editLockedReason && !isCancelled && (
          <div className="mb-6 flex items-start gap-3 bg-stone-100 text-stone-700 p-4 rounded-xl font-medium text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            {editLockedReason}
          </div>
        )}
        {formError && !editing && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl font-medium text-sm">{formError}</div>
        )}

        {editing && draft ? (
          <EditForm
            draft={draft}
            saving={saving}
            error={formError}
            onChange={updateDraft}
            onChangeAttendee={updateAttendee}
            onAddAttendee={() => updateDraft({ attendees: [...draft.attendees, emptyAttendee()] })}
            onRemoveAttendee={(key) => updateDraft({ attendees: draft.attendees.filter((a) => a.key !== key) })}
            onCancel={() => {
              setEditing(false);
              setFormError(null);
            }}
            onSave={save}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Registration ID */}
              <Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="min-w-0">
                    <p className={labelClass}>Registration ID</p>
                    <div className="flex items-start gap-2">
                      <p className="font-mono text-sm font-bold text-stone-900 break-all">{registration.id}</p>
                      <CopyButton copied={copied === "id"} onClick={() => copy(registration.id, "id")} />
                    </div>
                  </div>
                  <div>
                    <p className={labelClass}>Submitted</p>
                    <p className="font-bold text-stone-900">{formatDate(registration.createdAt)}</p>
                  </div>
                </div>
              </Card>

              {/* Attendees */}
              <Card>
                <CardTitle icon={Users}>
                  Attendees ({registrants.length})
                </CardTitle>
                <div className="space-y-3">
                  {registrants.map((a, i) => {
                    const line = pricing?.lines[i];
                    return (
                      <div key={a.id} className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-bold text-lg text-stone-900 break-words">
                              {a.firstName} {a.lastName}
                            </p>
                            <p className="text-sm text-stone-500">
                              {a.age != null ? `Age ${a.age}` : "Age not given"}
                              {line && line.tierName !== "—" ? ` · ${line.tierName}` : ""}
                            </p>
                          </div>
                          {hasPricing && line && (
                            <p className="font-black text-stone-900 shrink-0">
                              {line.price === 0 ? "Free" : `$${line.price}`}
                            </p>
                          )}
                        </div>
                        {(a.dietaryRestrictions || a.medicalNotes || a.emergencyContactName) && (
                          <dl className="mt-3 pt-3 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {a.dietaryRestrictions && <Detail label="Dietary" value={a.dietaryRestrictions} />}
                            {a.medicalNotes && <Detail label="Medical" value={a.medicalNotes} />}
                            {a.emergencyContactName && (
                              <Detail
                                label="Emergency contact"
                                value={`${a.emergencyContactName}${a.emergencyContactPhone ? ` · ${a.emergencyContactPhone}` : ""}`}
                              />
                            )}
                          </dl>
                        )}
                      </div>
                    );
                  })}
                </div>
                {hasPricing && (
                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-stone-200">
                    <p className="font-bold text-stone-900">Total</p>
                    <p className="text-2xl font-black text-stone-900">${total}</p>
                  </div>
                )}
              </Card>

              {/* Contact */}
              <Card>
                <CardTitle icon={User}>Contact &amp; church</CardTitle>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <Detail label="Name" value={registration.contactName} />
                  <Detail label="Email" value={registration.contactEmail} />
                  <Detail label="Phone" value={registration.contactPhone} />
                  <Detail label="Church" value={registration.churchName} />
                  <Detail
                    label="Pastor"
                    value={
                      registration.pastorName
                        ? `${registration.pastorName}${registration.pastorContact ? ` · ${registration.pastorContact}` : ""}`
                        : null
                    }
                  />
                  <Detail
                    label="From"
                    value={[registration.city, registration.country].filter(Boolean).join(", ") || null}
                  />
                </dl>
              </Card>

              {/* Travel & notes */}
              <Card>
                <CardTitle icon={Plane}>Travel &amp; notes</CardTitle>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <Detail
                    label="Arrival"
                    value={registration.arrivalDate ? formatDate(registration.arrivalDate) : "Not specified"}
                  />
                  <Detail
                    label="Departure"
                    value={registration.departureDate ? formatDate(registration.departureDate) : "Not specified"}
                  />
                </dl>
                {registration.notes && (
                  <div className="mt-4">
                    <p className={labelClass}>Notes</p>
                    <p className="text-stone-700 whitespace-pre-line break-words">{registration.notes}</p>
                  </div>
                )}
              </Card>

              {/* Cancel */}
              {canEdit && (
                <div className="bg-white rounded-3xl border border-stone-100 p-6 md:p-8">
                  {!confirmCancel ? (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700"
                    >
                      <XCircle size={16} /> Cancel this registration
                    </button>
                  ) : (
                    <div>
                      <p className="font-bold text-stone-900 mb-1">Cancel your registration?</p>
                      <p className="text-sm text-stone-500 mb-4">
                        This can&apos;t be undone online. If you&apos;ve already paid, the church team will contact you about a refund.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={cancelRegistration}
                          disabled={cancelling}
                          className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-60"
                        >
                          {cancelling && <Loader2 size={16} className="animate-spin" />}
                          Yes, cancel registration
                        </button>
                        <button
                          onClick={() => setConfirmCancel(false)}
                          disabled={cancelling}
                          className="px-5 py-3 bg-stone-100 text-stone-900 rounded-xl font-bold text-sm hover:bg-stone-200"
                        >
                          Keep registration
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar (shown first on mobile so payment info is up top) */}
            <div className="space-y-6 min-w-0 order-first lg:order-none">
              {/* Payment */}
              {!isCancelled && (
                <Card className={isPaid ? "" : "border-2 border-stone-900"}>
                  <CardTitle icon={CreditCard}>Payment</CardTitle>
                  {isPaid ? (
                    <div className="flex items-start gap-3 text-green-800">
                      <Check size={20} className="shrink-0 mt-0.5" />
                      <p className="font-bold">Payment received. Thank you!</p>
                    </div>
                  ) : (
                    <>
                      {hasPricing && (
                        <div className="mb-5">
                          <p className={labelClass}>Amount due</p>
                          <p className="text-4xl font-black text-stone-900">${total}</p>
                        </div>
                      )}
                      <p className={labelClass}>How to pay</p>
                      <p className="text-stone-700 whitespace-pre-line break-words mb-5">
                        {retreat?.paymentInstructions ||
                          "Payment details will be shared with you by the church team. If you have questions, email info@churchinkomoka.com."}
                      </p>
                      <p className={labelClass}>Payment reference</p>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-mono font-black text-lg text-stone-900">{paymentReference}</p>
                        <CopyButton copied={copied === "ref"} onClick={() => copy(paymentReference, "ref")} />
                      </div>
                      <p className="text-xs text-stone-500">
                        Include this reference with your payment (e.g. in the e-Transfer message) so we can match it to your registration.
                      </p>
                    </>
                  )}
                </Card>
              )}

              {/* Retreat details */}
              {retreat && (
                <Card>
                  <CardTitle icon={CalendarIcon}>Retreat details</CardTitle>
                  <dl className="space-y-4">
                    <Detail
                      label="Dates"
                      value={`${formatDate(retreat.startDate)}${retreat.endDate ? ` – ${formatDate(retreat.endDate)}` : ""}`}
                    />
                    {retreat.location && (
                      <div>
                        <dt className={labelClass}>Location</dt>
                        <dd className="font-bold text-stone-900 flex items-start gap-2">
                          <MapPin size={16} className="shrink-0 mt-1 text-stone-400" />
                          {retreat.location}
                        </dd>
                      </div>
                    )}
                  </dl>
                </Card>
              )}

              <p className="text-sm text-stone-500 px-2">
                Questions? Email{" "}
                <a href="mailto:info@churchinkomoka.com" className="font-bold text-stone-900 underline">
                  info@churchinkomoka.com
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-3xl shadow-sm border border-stone-100 p-6 md:p-8", className)}>
      {children}
    </div>
  );
}

function CardTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={18} className="text-stone-600" />
      </div>
      <h2 className="text-lg font-black tracking-tight text-stone-900">{children}</h2>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">{label}</dt>
      <dd className="font-medium text-stone-900 break-words">{value || "—"}</dd>
    </div>
  );
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Copied" : "Copy"}
      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function EditForm({
  draft,
  saving,
  error,
  onChange,
  onChangeAttendee,
  onAddAttendee,
  onRemoveAttendee,
  onCancel,
  onSave,
}: {
  draft: Draft;
  saving: boolean;
  error: string | null;
  onChange: (patch: Partial<Draft>) => void;
  onChangeAttendee: (key: string, patch: Partial<AttendeeDraft>) => void;
  onAddAttendee: () => void;
  onRemoveAttendee: (key: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const text = (
    field: keyof Omit<Draft, "attendees">,
    label: string,
    opts: { type?: string; required?: boolean } = {},
  ) => (
    <div>
      <label className={labelClass}>
        {label}
        {opts.required && " *"}
      </label>
      <input
        type={opts.type ?? "text"}
        value={draft[field]}
        onChange={(e) => onChange({ [field]: e.target.value } as Partial<Draft>)}
        className={inputClass}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle icon={User}>Contact &amp; church</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {text("contactName", "Full name", { required: true })}
          {text("contactEmail", "Email", { type: "email", required: true })}
          {text("contactPhone", "Phone", { type: "tel" })}
          {text("churchName", "Church")}
          {text("pastorName", "Pastor name")}
          {text("pastorContact", "Pastor contact")}
          {text("city", "City")}
          {text("country", "Country")}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
              <Users size={18} className="text-stone-600" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-stone-900">
              Attendees ({draft.attendees.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onAddAttendee}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-stone-900 hover:text-stone-600"
          >
            <Plus size={16} /> Add person
          </button>
        </div>
        <div className="space-y-4">
          {draft.attendees.map((a, i) => (
            <div key={a.key} className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-stone-500">Person {i + 1}</p>
                {draft.attendees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttendee(a.key)}
                    className="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelClass}>First name *</label>
                  <input
                    value={a.firstName}
                    onChange={(e) => onChangeAttendee(a.key, { firstName: e.target.value })}
                    className={cn(inputClass, "bg-white")}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClass}>Last name</label>
                  <input
                    value={a.lastName}
                    onChange={(e) => onChangeAttendee(a.key, { lastName: e.target.value })}
                    className={cn(inputClass, "bg-white")}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className={labelClass}>Age *</label>
                  <input
                    type="number"
                    min={0}
                    value={a.age}
                    onChange={(e) => onChangeAttendee(a.key, { age: e.target.value })}
                    className={cn(inputClass, "bg-white")}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClass}>Dietary restrictions</label>
                  <input
                    value={a.dietaryRestrictions}
                    onChange={(e) => onChangeAttendee(a.key, { dietaryRestrictions: e.target.value })}
                    className={cn(inputClass, "bg-white")}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClass}>Medical notes</label>
                  <input
                    value={a.medicalNotes}
                    onChange={(e) => onChangeAttendee(a.key, { medicalNotes: e.target.value })}
                    className={cn(inputClass, "bg-white")}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClass}>Emergency contact</label>
                  <input
                    value={a.emergencyContactName}
                    onChange={(e) => onChangeAttendee(a.key, { emergencyContactName: e.target.value })}
                    className={cn(inputClass, "bg-white")}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelClass}>Emergency phone</label>
                  <input
                    type="tel"
                    value={a.emergencyContactPhone}
                    onChange={(e) => onChangeAttendee(a.key, { emergencyContactPhone: e.target.value })}
                    className={cn(inputClass, "bg-white")}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle icon={Plane}>Travel &amp; notes</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {text("arrivalDate", "Expected arrival", { type: "date" })}
          {text("departureDate", "Expected departure", { type: "date" })}
        </div>
        <label className={labelClass}>Notes</label>
        <textarea
          value={draft.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={4}
          className={cn(inputClass, "resize-none")}
        />
      </Card>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl font-medium text-sm">{error}</div>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-3 bg-white border border-stone-200 text-stone-900 rounded-xl font-bold text-sm hover:bg-stone-100"
        >
          Discard changes
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-800 disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </div>
  );
}
