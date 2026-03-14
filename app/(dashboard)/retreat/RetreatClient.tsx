"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Calendar as CalendarIcon,
  Trash2,
  Plus,
  Search,
  MapPin,
  Clock,
  DollarSign,
  Mail,
  Users,
  Plane,
  ClipboardCheck,
} from "lucide-react";
import BackgroundPlayer from "next-video/background-player";
import { SectionHeader } from "@/src/components/SectionHeader";
import { useSession } from "next-auth/react";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/src/lib/utils";

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
};

type Attendee = {
  id: string;
  fullName: string;
  age: string;
};

type LookupRegistration = {
  id: string;
  contactName: string;
  contactEmail: string;
  status: string;
  retreatId?: string;
};
type LookupRegistrant = {
  firstName: string;
  lastName: string;
  age?: number;
  isAdult: boolean;
};

type View = "details" | "register" | "lookup";

const WIZARD_STEPS = [
  { id: "contact", label: "Contact", icon: Mail },
  { id: "attendees", label: "Attendees", icon: Users },
  { id: "travel", label: "Travel", icon: Plane },
  { id: "review", label: "Review", icon: ClipboardCheck },
] as const;

const inputClass =
  "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all";

export default function RetreatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
        </div>
      }
    >
      <RetreatPageContent />
    </Suspense>
  );
}

function RetreatPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [view, setView] = useState<View>("details");
  const [wizardStep, setWizardStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRegistrationId, setSubmittedRegistrationId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [selectedRetreatId, setSelectedRetreatId] = useState<string>("");
  const [loadingRetreats, setLoadingRetreats] = useState(true);

  const [lookupId, setLookupId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<
    | { registration: LookupRegistration; registrants: LookupRegistrant[] }
    | "not_found"
    | null
  >(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    churchName: "",
    pastorName: "",
    pastorContact: "",
    country: "",
    city: "",
    expectedArrivalDate: undefined as Date | undefined,
    expectedDepartureDate: undefined as Date | undefined,
    notes: "",
  });
  const [attendees, setAttendees] = useState<Attendee[]>([
    { id: "1", fullName: "", age: "" },
  ]);
  const [stepErrors, setStepErrors] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveRetreats();
  }, []);

  const lookupParam = searchParams.get("lookup");
  useEffect(() => {
    if (lookupParam?.trim()) {
      setLookupId(lookupParam.trim());
      setView("lookup");
      setLookupResult(null);
    }
  }, [lookupParam]);

  useEffect(() => {
    if (!lookupParam?.trim()) return;
    const id = lookupParam.trim();
    let cancelled = false;
    setLookupLoading(true);
    setLookupResult(null);
    fetch(`/api/retreat/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.registration) {
          setLookupResult({
            registration: data.registration,
            registrants: data.registrants || [],
          });
        } else {
          setLookupResult("not_found");
        }
      })
      .catch(() => {
        if (!cancelled) setLookupResult("not_found");
      })
      .finally(() => {
        if (!cancelled) setLookupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lookupParam]);

  const handleLookup = async () => {
    const id = lookupId.trim();
    if (!id) return;
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/retreat/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLookupResult({
          registration: data.registration,
          registrants: data.registrants || [],
        });
      } else {
        setLookupResult("not_found");
      }
    } catch {
      setLookupResult("not_found");
    } finally {
      setLookupLoading(false);
    }
  };

  const fetchActiveRetreats = async () => {
    try {
      const res = await fetch("/api/retreat/retreats/active");
      const data = await res.json();
      setRetreats(data.retreats || []);
      if (data.retreats?.length > 0) {
        setSelectedRetreatId(data.retreats[0].id);
      }
    } catch (error) {
      console.error("Error fetching retreats:", error);
    } finally {
      setLoadingRetreats(false);
    }
  };

  const addAttendee = () => {
    setAttendees([
      ...attendees,
      { id: Date.now().toString(), fullName: "", age: "" },
    ]);
  };

  const removeAttendee = (id: string) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((a) => a.id !== id));
    }
  };

  const updateAttendee = (
    id: string,
    field: "fullName" | "age",
    value: string,
  ) => {
    setAttendees(
      attendees.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  };

  const validateStep = (step: number): boolean => {
    setStepErrors(null);
    switch (step) {
      case 0: {
        const {
          fullName,
          phoneNumber,
          email,
          churchName,
          pastorName,
          pastorContact,
          country,
          city,
        } = formData;
        if (
          !fullName ||
          !phoneNumber ||
          !email ||
          !churchName ||
          !pastorName ||
          !pastorContact ||
          !country ||
          !city
        ) {
          setStepErrors("Please fill in all required fields.");
          return false;
        }
        return true;
      }
      case 1: {
        const invalid = attendees.filter((a) => !a.fullName || !a.age);
        if (invalid.length > 0) {
          setStepErrors("Please fill in name and age for all attendees.");
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(wizardStep)) return;
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const prevStep = () => {
    setStepErrors(null);
    setWizardStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!selectedRetreatId || !session?.user) return;

    setLoading(true);
    try {
      const profileId =
        (session.user as any)?.id || (session.user as any)?.profileId;
      if (!profileId) {
        alert("Unable to find your profile. Please contact support.");
        setLoading(false);
        return;
      }

      const registrants = attendees.map((attendee) => {
        const nameParts = attendee.fullName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        const age = parseInt(attendee.age);
        return {
          firstName,
          lastName,
          age: isNaN(age) ? undefined : age,
          isAdult: age >= 18,
        };
      });

      const notesParts = [];
      if (formData.expectedArrivalDate)
        notesParts.push(
          `Expected Arrival: ${format(formData.expectedArrivalDate, "yyyy-MM-dd")}`,
        );
      if (formData.expectedDepartureDate)
        notesParts.push(
          `Expected Departure: ${format(formData.expectedDepartureDate, "yyyy-MM-dd")}`,
        );
      if (formData.notes) notesParts.push(formData.notes);
      const notes = notesParts.length > 0 ? notesParts.join("\n") : undefined;

      const res = await fetch("/api/retreat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retreatId: selectedRetreatId,
          type: attendees.length > 1 ? "family" : "individual",
          profileId,
          contactName: formData.fullName,
          contactEmail: formData.email,
          contactPhone: formData.phoneNumber,
          notes,
          registrants,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmittedRegistrationId(data.registration?.id ?? null);
        setSubmitted(true);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to submit registration");
      }
    } catch (error) {
      console.error("Error submitting registration:", error);
      alert("Failed to submit registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setSubmittedRegistrationId(null);
    setView("details");
    setWizardStep(0);
    setStepErrors(null);
    setFormData({
      fullName: "",
      phoneNumber: "",
      email: "",
      churchName: "",
      pastorName: "",
      pastorContact: "",
      country: "",
      city: "",
      expectedArrivalDate: undefined,
      expectedDepartureDate: undefined,
      notes: "",
    });
    setAttendees([{ id: "1", fullName: "", age: "" }]);
  };

  const selectedRetreat = retreats.find((r) => r.id === selectedRetreatId);

  // --- Loading ---
  if (loadingRetreats) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  // --- No retreats ---
  if (retreats.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-20">
          <SectionHeader title="Retreat Registration" as="h1" />
          <div className="bg-white p-12 rounded-3xl shadow-xl text-center">
            <p className="text-xl text-stone-600">
              No active retreats available at this time. Please check back
              later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Success ---
  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-stone-900 mb-4">
            Registration Sent!
          </h2>
          <p className="text-stone-600 mb-4 font-medium">
            Thank you for signing up for{" "}
            {selectedRetreat?.name || "the retreat"}. We&apos;ll be in touch
            soon.
          </p>
          {submittedRegistrationId && (
            <div className="mb-6 p-4 bg-stone-50 rounded-xl text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">
                Your registration ID
              </p>
              <p className="font-mono font-bold text-stone-900 break-all">
                {submittedRegistrationId}
              </p>
              <p className="text-sm text-stone-500 mt-2">
                Save this ID to look up your registration later.
              </p>
            </div>
          )}
          <button
            onClick={resetForm}
            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-colors uppercase tracking-widest text-sm"
          >
            Back to Retreat
          </button>
        </motion.div>
      </div>
    );
  }

  // =====================
  //  DETAILS VIEW (landing)
  // =====================
  if (view === "details") {
    return (
      <div className="min-h-screen bg-stone-50 pt-24">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-12 md:py-20">
          <SectionHeader title="Retreat" as="h1" />

          {retreats.length > 1 && (
            <div className="mb-10">
              <label className="block text-sm font-bold uppercase tracking-widest text-stone-400 mb-3">
                Select Retreat
              </label>
              <select
                value={selectedRetreatId}
                onChange={(e) => setSelectedRetreatId(e.target.value)}
                className="bg-white border border-stone-200 rounded-xl px-4 py-3 font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none min-w-[280px]"
              >
                {retreats.map((retreat) => (
                  <option key={retreat.id} value={retreat.id}>
                    {retreat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedRetreat && (
            <div className="space-y-10">
              {/* Action buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setView("register")}
                  className="group bg-stone-900 text-white py-5 px-8 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-stone-800 transition-all flex items-center justify-center gap-3"
                >
                  Register Now
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
                <button
                  onClick={() => setView("lookup")}
                  className="group bg-white text-stone-900 border-2 border-stone-200 py-5 px-8 rounded-2xl font-bold uppercase tracking-widest text-sm hover:border-stone-900 transition-all flex items-center justify-center gap-3"
                >
                  <Search size={18} />
                  Look Up Registration
                </button>
              </div>

              {/* Hero card */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100">
                <div className="aspect-[3/1] relative overflow-hidden">
                  <BackgroundPlayer
                    src="/videos/Fly_Out_Edited.mp4"
                    className="absolute inset-0 w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 p-8 md:p-12 z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                      {selectedRetreat.name}
                    </h2>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <p className="text-lg md:text-xl text-stone-600 font-medium leading-relaxed mb-10">
                    {selectedRetreat.description ||
                      "Join us for a time of fellowship and spiritual growth!"}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Dates */}
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-1">
                          Dates
                        </h3>
                        {selectedRetreat.startDate ||
                        selectedRetreat.endDate ? (
                          <p className="text-lg font-bold text-stone-900">
                            {selectedRetreat.startDate
                              ? new Date(selectedRetreat.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
                              : "TBA"}
                            {selectedRetreat.endDate &&
                              selectedRetreat.startDate !==
                                selectedRetreat.endDate &&
                              ` – ${new Date(selectedRetreat.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })}`}
                          </p>
                        ) : (
                          <p className="text-lg font-bold text-stone-900">
                            TBA
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-1">
                          Location
                        </h3>
                        <p className="text-lg font-bold text-stone-900">
                          {selectedRetreat.location || "TBA"}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-1">
                          Questions?
                        </h3>
                        <a
                          href="mailto:info@churchinkomoka.com"
                          className="text-lg font-bold text-stone-900 hover:text-blue-600 transition-colors underline"
                        >
                          info@churchinkomoka.com
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Pricing tiers */}
                  {selectedRetreat.pricingTiers &&
                    selectedRetreat.pricingTiers.length > 0 && (
                      <div className="mt-10 pt-8 border-t border-stone-100">
                        <div className="flex items-center gap-3 mb-5">
                          <DollarSign className="w-5 h-5 text-stone-500" />
                          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">
                            Pricing
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedRetreat.pricingTiers
                            .sort((a, b) => a.minAge - b.minAge)
                            .map((tier) => (
                              <div
                                key={tier.name + tier.minAge}
                                className="bg-stone-50 rounded-xl p-5 border border-stone-100"
                              >
                                <p className="font-bold text-stone-900 mb-1">
                                  {tier.name}
                                </p>
                                <p className="text-sm text-stone-500 mb-2">
                                  {tier.maxAge != null
                                    ? `Ages ${tier.minAge}–${tier.maxAge}`
                                    : `Ages ${tier.minAge}+`}
                                </p>
                                <p className="text-2xl font-black text-stone-900">
                                  {tier.isFree ? "Free" : `$${tier.price ?? 0}`}
                                </p>
                              </div>
                            ))}
                        </div>
                        <p className="text-sm text-stone-500 mt-4 italic">
                          Includes accommodation, meals, and all activities
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================
  //  LOOKUP VIEW
  // =====================
  if (view === "lookup") {
    return (
      <div className="min-h-screen bg-stone-50 pt-24">
        <div className="max-w-[700px] mx-auto px-6 md:px-12 py-12 md:py-20">
          <button
            onClick={() => setView("details")}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold text-sm uppercase tracking-widest mb-10 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Retreat
          </button>

          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-stone-100">
            <h2 className="text-2xl font-black tracking-tight text-stone-900 mb-2">
              Look Up Registration
            </h2>
            <p className="text-stone-500 mb-8">
              Enter the registration ID from your confirmation email.
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Registration ID"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-mono text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupLoading || !lookupId.trim()}
                className="px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {lookupLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                Search
              </button>
            </div>

            <AnimatePresence mode="wait">
              {lookupResult === "not_found" && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 text-sm text-red-600 font-medium bg-red-50 p-4 rounded-xl"
                >
                  Registration not found. Check your ID and try again.
                </motion.p>
              )}
              {lookupResult && lookupResult !== "not_found" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 p-6 bg-stone-50 rounded-xl border border-stone-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg text-stone-900">
                        {lookupResult.registration.contactName}
                      </p>
                      <p className="text-sm text-stone-500">
                        {lookupResult.registration.contactEmail}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        lookupResult.registration.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : lookupResult.registration.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {lookupResult.registration.status}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-stone-200">
                    <p className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">
                      {lookupResult.registrants.length} Registrant
                      {lookupResult.registrants.length !== 1 ? "s" : ""}
                    </p>
                    <div className="space-y-1">
                      {lookupResult.registrants.map((r, i) => (
                        <p key={i} className="text-stone-900 font-medium">
                          {r.firstName} {r.lastName}
                          {r.age != null && (
                            <span className="text-stone-400 ml-2">
                              Age {r.age}
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // =====================
  //  REGISTRATION WIZARD
  // =====================
  return (
    <div className="min-h-screen bg-stone-50 pt-24">
      <div className="max-w-[900px] mx-auto px-6 md:px-12 py-12 md:py-20">
        <button
          onClick={() => {
            setView("details");
            setWizardStep(0);
            setStepErrors(null);
          }}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold text-sm uppercase tracking-widest mb-10 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Retreat
        </button>

        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-stone-900 mb-2">
          Register for {selectedRetreat?.name}
        </h2>
        <p className="text-stone-500 font-medium mb-10">
          Complete the steps below to register.
        </p>

        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            {/* Progress line background */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-stone-200" />
            {/* Progress line filled */}
            <motion.div
              className="absolute top-6 left-6 h-0.5 bg-stone-900"
              initial={false}
              animate={{
                width: `${(wizardStep / (WIZARD_STEPS.length - 1)) * 100}%`,
              }}
              style={{ maxWidth: "calc(100% - 48px)" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />

            {WIZARD_STEPS.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = i === wizardStep;
              const isCompleted = i < wizardStep;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (i < wizardStep) {
                      setStepErrors(null);
                      setWizardStep(i);
                    }
                  }}
                  className="relative z-10 flex flex-col items-center gap-2"
                  disabled={i > wizardStep}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                      isCompleted && "bg-stone-900 border-stone-900 text-white",
                      isActive &&
                        "bg-white border-stone-900 text-stone-900 shadow-lg",
                      !isActive &&
                        !isCompleted &&
                        "bg-white border-stone-200 text-stone-400",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <StepIcon size={20} />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest transition-colors hidden sm:block",
                      isActive ? "text-stone-900" : "text-stone-400",
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard content */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-stone-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={wizardStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step 0: Contact */}
              {wizardStep === 0 && (
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-6">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-stone-900 block">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-stone-900 block">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-stone-900 block">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phoneNumber: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-stone-900 block">
                        Church Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.churchName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            churchName: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-stone-900 block">
                        Pastor&apos;s Name{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.pastorName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pastorName: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-stone-900 block">
                        Pastor&apos;s Contact{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.pastorContact}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pastorContact: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-stone-900 block">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-stone-900 block">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Attendees */}
              {wizardStep === 1 && (
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">
                    Attendees
                  </h3>
                  <p className="text-sm text-stone-500 mb-6">
                    Add everyone who will be attending (including yourself if
                    applicable).
                  </p>
                  <div className="space-y-4">
                    {attendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="bg-stone-50 p-5 rounded-xl border border-stone-200"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_auto] gap-4 items-end">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-900 block">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={attendee.fullName}
                              onChange={(e) =>
                                updateAttendee(
                                  attendee.id,
                                  "fullName",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-900 block">
                              Age <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="120"
                              value={attendee.age}
                              onChange={(e) =>
                                updateAttendee(
                                  attendee.id,
                                  "age",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttendee(attendee.id)}
                            disabled={attendees.length === 1}
                            className={cn(
                              "px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                              attendees.length === 1
                                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                                : "bg-red-500 text-white hover:bg-red-600",
                            )}
                          >
                            <Trash2 size={16} />
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
              )}

              {/* Step 2: Travel & Notes */}
              {wizardStep === 2 && (
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">
                    Travel & Notes
                  </h3>
                  <p className="text-sm text-stone-500 mb-6">
                    These fields are optional.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-stone-900 block">
                        Expected Arrival Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "w-full justify-start text-left font-medium bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 flex items-center",
                              !formData.expectedArrivalDate && "text-stone-500",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expectedArrivalDate
                              ? format(
                                  formData.expectedArrivalDate,
                                  "yyyy-MM-dd",
                                )
                              : "yyyy-mm-dd"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.expectedArrivalDate}
                            onSelect={(date) =>
                              setFormData({
                                ...formData,
                                expectedArrivalDate: date,
                              })
                            }
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
                              "w-full justify-start text-left font-medium bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 flex items-center",
                              !formData.expectedDepartureDate &&
                                "text-stone-500",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expectedDepartureDate
                              ? format(
                                  formData.expectedDepartureDate,
                                  "yyyy-MM-dd",
                                )
                              : "yyyy-mm-dd"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.expectedDepartureDate}
                            onSelect={(date) =>
                              setFormData({
                                ...formData,
                                expectedDepartureDate: date,
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-900 block">
                      Notes
                    </label>
                    <textarea
                      rows={4}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Any dietary restrictions, medical notes, or special requests..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {wizardStep === 3 && (
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-6">
                    Review Your Registration
                  </h3>

                  <div className="space-y-6">
                    {/* Contact summary */}
                    <div className="bg-stone-50 rounded-xl p-6 border border-stone-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400">
                          Contact
                        </h4>
                        <button
                          onClick={() => setWizardStep(0)}
                          className="text-xs font-bold text-stone-500 hover:text-stone-900 uppercase tracking-widest transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-stone-400">Name:</span>{" "}
                          <span className="font-bold text-stone-900">
                            {formData.fullName}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400">Email:</span>{" "}
                          <span className="font-bold text-stone-900">
                            {formData.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400">Phone:</span>{" "}
                          <span className="font-bold text-stone-900">
                            {formData.phoneNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400">Church:</span>{" "}
                          <span className="font-bold text-stone-900">
                            {formData.churchName}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400">Pastor:</span>{" "}
                          <span className="font-bold text-stone-900">
                            {formData.pastorName}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400">
                            Pastor Contact:
                          </span>{" "}
                          <span className="font-bold text-stone-900">
                            {formData.pastorContact}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400">Location:</span>{" "}
                          <span className="font-bold text-stone-900">
                            {formData.city}, {formData.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attendees summary */}
                    <div className="bg-stone-50 rounded-xl p-6 border border-stone-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400">
                          Attendees ({attendees.length})
                        </h4>
                        <button
                          onClick={() => setWizardStep(1)}
                          className="text-xs font-bold text-stone-500 hover:text-stone-900 uppercase tracking-widest transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="space-y-2">
                        {attendees.map((a) => (
                          <div
                            key={a.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="font-bold text-stone-900">
                              {a.fullName}
                            </span>
                            <span className="text-stone-500">Age {a.age}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Travel & notes summary */}
                    {(formData.expectedArrivalDate ||
                      formData.expectedDepartureDate ||
                      formData.notes) && (
                      <div className="bg-stone-50 rounded-xl p-6 border border-stone-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400">
                            Travel & Notes
                          </h4>
                          <button
                            onClick={() => setWizardStep(2)}
                            className="text-xs font-bold text-stone-500 hover:text-stone-900 uppercase tracking-widest transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          {formData.expectedArrivalDate && (
                            <div>
                              <span className="text-stone-400">Arrival:</span>{" "}
                              <span className="font-bold text-stone-900">
                                {format(
                                  formData.expectedArrivalDate,
                                  "MMM d, yyyy",
                                )}
                              </span>
                            </div>
                          )}
                          {formData.expectedDepartureDate && (
                            <div>
                              <span className="text-stone-400">Departure:</span>{" "}
                              <span className="font-bold text-stone-900">
                                {format(
                                  formData.expectedDepartureDate,
                                  "MMM d, yyyy",
                                )}
                              </span>
                            </div>
                          )}
                          {formData.notes && (
                            <div>
                              <span className="text-stone-400">Notes:</span>{" "}
                              <span className="text-stone-900">
                                {formData.notes}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Validation error */}
          <AnimatePresence>
            {stepErrors && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 text-sm text-red-600 font-medium bg-red-50 p-4 rounded-xl"
              >
                {stepErrors}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
            <button
              onClick={prevStep}
              disabled={wizardStep === 0}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all",
                wizardStep === 0
                  ? "text-stone-300 cursor-not-allowed"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100",
              )}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {wizardStep < WIZARD_STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-stone-800 transition-all"
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-white transition-all",
                  loading ? "bg-stone-400" : "bg-stone-900 hover:bg-stone-800",
                )}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Submit Registration
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
