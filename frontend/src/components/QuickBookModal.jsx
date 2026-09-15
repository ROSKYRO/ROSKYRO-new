import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Clock, MapPin, ShieldCheck, CheckCircle2, Phone, MessageSquare, ArrowRight, AlertCircle } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { BOOK_WA_LINK, waLink, WHATSAPP_BOOKING_NUMBER } from "../config";

export default function QuickBookModal({ isOpen, onClose, initialServiceId = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || 2);
  const [hours, setHours] = useState(3);
  const [distanceKm, setDistanceKm] = useState(4);
  const [endsElsewhere, setEndsElsewhere] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  // Quick form fields
  const [step, setStep] = useState(1); // 1: estimate & service, 2: contact info
  const [phone, setPhone] = useState(user?.phone || "");
  const [name, setName] = useState(user?.full_name || "");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api.get("/services").then((res) => {
      setServices(res.data);
      if (initialServiceId) {
        setSelectedServiceId(initialServiceId);
      } else if (res.data.length > 0 && !selectedServiceId) {
        setSelectedServiceId(res.data[0].id);
      }
    }).catch(() => {});
  }, [initialServiceId]);

  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
    }
  }, [initialServiceId]);

  // Recalculate estimate whenever parameters change
  useEffect(() => {
    if (!selectedServiceId) return;
    setLoadingEstimate(true);
    api.post("/bookings/estimate", {
      service_id: Number(selectedServiceId),
      booked_hours: Number(hours),
      distance_km: Number(distanceKm),
      ends_at_different_location: endsElsewhere,
    })
      .then((res) => setEstimate(res.data))
      .catch(() => setEstimate(null))
      .finally(() => setLoadingEstimate(false));
  }, [selectedServiceId, hours, distanceKm, endsElsewhere]);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setBookingSuccess(null);
      setErrorMsg("");
      if (user) {
        setPhone(user.phone || "");
        setName(user.full_name || "");
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentService = services.find((s) => s.id === Number(selectedServiceId)) || services[0];

  const handleWhatsAppInstant = () => {
    const serviceName = currentService ? currentService.name : "Healthcare Concierge";
    const text = `Namaste ROSKYRO! I want to book *${serviceName}* for ${hours} hours.\nEstimated Total: ₹${estimate ? estimate.estimated_total : "—"}.\nMy Location/Hospital: ${address || "India"}\nPlease confirm partner availability.`;
    window.open(waLink(WHATSAPP_BOOKING_NUMBER, text), "_blank");
    onClose();
  };

  const handleOnlineSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!user && (!phone || !name)) {
      setErrorMsg("Please provide your name and mobile number to confirm.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Please provide your hospital or pickup address.");
      return;
    }

    setSubmitting(true);
    try {
      if (!user) {
        // Quick guest signup/login or prompt
        try {
          await api.post("/auth/signup", {
            phone: phone.trim(),
            full_name: name.trim(),
            password: "user" + phone.slice(-4),
          });
        } catch {
          // Already exists, try login or proceed if backend allows
        }
      }

      const res = await api.post("/bookings", {
        service_id: Number(selectedServiceId),
        address: address.trim(),
        contact_on_arrival_name: name,
        contact_on_arrival_phone: phone,
        notes: notes.trim() || undefined,
        scheduled_start: new Date().toISOString(),
        booked_hours: Number(hours),
        distance_km: Number(distanceKm),
        ends_at_different_location: endsElsewhere,
      });

      setBookingSuccess(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Booking could not be finalized. Please try via WhatsApp or verify details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-ink/70 hover:text-ink transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {bookingSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <span className="inline-block text-xs font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full mb-2">
              Booking Confirmed
            </span>
            <h2 className="text-2xl font-bold font-display text-ink mb-1">
              {currentService?.name || "Concierge Assigned"}
            </h2>
            <p className="text-sm text-ink/60 mb-6">
              Booking ID: <span className="font-mono font-bold text-violet">{bookingSuccess.booking_code}</span>
            </p>

            <div className="bg-mist/70 rounded-2xl p-5 mb-6 text-left border border-violet/15 space-y-3">
              <div className="text-xs font-semibold text-violet uppercase tracking-wide">
                Security PIN Protection
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-ink/10 text-center">
                  <div className="text-xs text-ink/50 mb-0.5">Start PIN (Give upon arrival)</div>
                  <div className="text-2xl font-mono font-bold text-ink">{bookingSuccess.start_pin}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-ink/10 text-center">
                  <div className="text-xs text-ink/50 mb-0.5">End PIN (Give to close trip)</div>
                  <div className="text-2xl font-mono font-bold text-ink">{bookingSuccess.end_pin}</div>
                </div>
              </div>
              <p className="text-xs text-ink/60 italic text-center pt-1">
                A verified Relationship Officer is assigned and dispatched. You pay after the service via UPI or cash.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  onClose();
                  navigate("/my-bookings");
                }}
                className="px-6 py-3 rounded-full bg-violet text-white font-semibold hover:bg-violet-dark transition-all shadow-md"
              >
                Track in My Bookings
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-slate-100 text-ink font-semibold hover:bg-slate-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-brand-gradient text-white flex items-center justify-center font-bold text-lg shadow-md shadow-violet/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink">
                  Instant Healthcare Concierge
                </h3>
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Verified Partners on call • 20 Min Arrival in Ambikapur
                </div>
              </div>
            </div>

            {step === 1 ? (
              <div className="space-y-5">
                {/* Select Service */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-2">
                    1. Select Concierge Service
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {services.map((s) => {
                      const isSel = Number(selectedServiceId) === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedServiceId(s.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSel
                              ? "border-violet bg-violet/5 ring-2 ring-violet/20 shadow-sm"
                              : "border-ink/10 bg-slate-50/70 hover:bg-white hover:border-ink/20"
                          }`}
                        >
                          <div className="text-xl mb-1">{s.icon}</div>
                          <div className="font-semibold text-xs text-ink leading-snug line-clamp-1">{s.name}</div>
                          <div className="text-violet font-bold text-xs mt-1">₹{s.hourly_rate}/hr</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hours Slider */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-ink/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink/70 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-violet" />
                      2. Estimated Duration
                    </span>
                    <span className="font-display font-bold text-violet text-lg">
                      {hours} {hours === 1 ? "Hour" : "Hours"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full accent-violet cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-ink/40 mt-1">
                    <span>1 hr (quick test/consult)</span>
                    <span>4 hrs (OPD/admission)</span>
                    <span>12 hrs (full-day)</span>
                  </div>
                </div>

                {/* Additional Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-ink/5">
                    <label className="text-xs font-medium text-ink/70 block mb-1">
                      Distance from city centre
                    </label>
                    <select
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(Number(e.target.value))}
                      className="w-full bg-white border border-ink/15 rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-violet"
                    >
                      <option value={2}>Within 3 km (Free arrival)</option>
                      <option value={5}>3 – 8 km (+₹29 arrival)</option>
                      <option value={10}>8 – 13 km (+₹59 arrival)</option>
                      <option value={15}>13 – 18 km (+₹79 arrival)</option>
                      <option value={22}>18+ km (+₹99 arrival)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-ink/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-ink">Different End Location?</div>
                      <div className="text-[11px] text-ink/50">+₹49 return escort fee</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={endsElsewhere}
                      onChange={(e) => setEndsElsewhere(e.target.checked)}
                      className="w-5 h-5 accent-violet cursor-pointer rounded"
                    />
                  </div>
                </div>

                {/* Live Price Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet/5 via-fuchsia-50/30 to-amber-50/20 border border-violet/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-ink/70">Estimated Cost</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Pay After Visit
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold text-ink">
                      ₹{loadingEstimate ? "..." : estimate?.estimated_total || Math.round(hours * (currentService?.hourly_rate || 249) * 1.18)}
                    </span>
                    <span className="text-xs text-ink/60">
                      (Includes ₹{currentService?.hourly_rate || 249}/hr + GST 18%)
                    </span>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Transparent billing: 15-min free cushion. No prepayment required.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleWhatsAppInstant}
                    className="flex-1 py-3 px-4 rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 text-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Book Instantly on WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 px-4 rounded-full bg-ink text-white font-semibold flex items-center justify-center gap-2 hover:bg-violet transition-all shadow-md text-sm"
                  >
                    Enter Address &amp; Book
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Address & Details */
              <form onSubmit={handleOnlineSubmit} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-violet hover:underline flex items-center gap-1 mb-2"
                >
                  ← Back to estimate &amp; service
                </button>

                {errorMsg && (
                  <div className="p-3 bg-clay/10 border border-clay/30 rounded-xl text-xs text-clay flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div className="p-3 bg-violet/5 rounded-xl border border-violet/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-ink">{currentService?.name}</span> • {hours} hrs
                  </div>
                  <div className="font-bold text-violet">
                    Est. ₹{estimate?.estimated_total || "—"}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-ink/70 mb-1">
                    Patient / Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra Verma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink/15 text-sm focus:outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-ink/70 mb-1">
                    Contact Mobile Number *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-ink/15 bg-slate-50 text-xs text-ink/60">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-r-xl border border-ink/15 text-sm focus:outline-none focus:border-violet"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-ink/70 mb-1">
                    Hospital / Home Address in Ambikapur *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Room 204, Holy Cross Hospital OR Home address in Ambikapur with landmark"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink/15 text-sm focus:outline-none focus:border-violet"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-ink/70 mb-1">
                    Special notes or instructions (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wheelchair assistance needed / Elderly patient"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-ink/15 text-sm focus:outline-none focus:border-violet"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 rounded-full bg-brand-gradient text-white font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-violet/20 text-sm disabled:opacity-50"
                  >
                    {submitting ? "Confirming Partner..." : "Confirm & Dispatch Partner ⚡"}
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppInstant}
                    className="py-3 px-4 rounded-full border border-emerald-600 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Book via WhatsApp
                  </button>
                </div>

                <p className="text-[11px] text-ink/40 text-center">
                  You'll immediately receive the assigned concierge's name, photo and Start PIN.
                </p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
