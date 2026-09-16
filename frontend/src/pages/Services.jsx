import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Copy,
  Info,
  Crown
} from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const HOUR_PRESETS = [2, 3, 4, 6, 8];

export default function Services() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hours, setHours] = useState(3);
  const [distanceKm, setDistanceKm] = useState(4);
  const [endsElsewhere, setEndsElsewhere] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [quota, setQuota] = useState(null);
  const [form, setForm] = useState({
    address: "",
    contact_on_arrival_name: "",
    contact_on_arrival_phone: "",
    scheduled_start: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);
  const [copiedPin, setCopiedPin] = useState(null);

  useEffect(() => {
    api.get("/services").then((r) => {
      setServices(r.data);
      if (r.data.length) setSelected(r.data[0]);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get("/membership/relationship-officer-quota").then((r) => setQuota(r.data)).catch(() => setQuota(null));
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    api.post("/bookings/estimate", {
      service_id: selected.id,
      booked_hours: Number(hours),
      distance_km: Number(distanceKm),
      ends_at_different_location: endsElsewhere,
    }).then((r) => setEstimate(r.data)).catch(() => setEstimate(null));
  }, [selected, hours, distanceKm, endsElsewhere]);

  const coveredByMembership = quota && quota.status === "active" && quota.remaining > 0;

  async function handleBook(e) {
    e.preventDefault();
    setError("");
    if (!user) {
      navigate("/login");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/bookings", {
        service_id: selected.id,
        address: form.address,
        contact_on_arrival_name: form.contact_on_arrival_name || null,
        contact_on_arrival_phone: form.contact_on_arrival_phone || null,
        notes: form.notes || null,
        scheduled_start: new Date(form.scheduled_start).toISOString(),
        booked_hours: Number(hours),
        distance_km: Number(distanceKm),
        ends_at_different_location: endsElsewhere,
      });
      setConfirmed(data);
      api.get("/membership/relationship-officer-quota").then((r) => setQuota(r.data)).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create the booking. Please check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard?.writeText(text);
    setCopiedPin(type);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  if (confirmed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="font-display text-3xl font-bold text-ink mb-2">Booking Confirmed!</h1>
        <p className="text-ink-muted text-sm mb-6">
          Your booking code is <span className="font-mono font-bold text-ink bg-slate-100 px-2 py-1 rounded">{confirmed.booking_code}</span>
        </p>

        {confirmed.is_membership_covered && (
          <div className="mb-6 bg-violet/10 border border-violet/20 rounded-2xl p-4 text-xs font-semibold text-violet flex items-center gap-2 justify-center">
            <Crown className="w-4 h-4 text-violet" />
            <span>This visit is free — covered by your VIP Concierge Membership quota.</span>
          </div>
        )}

        {/* Security PIN Card */}
        <div className="bg-ink text-white rounded-3xl p-6 sm:p-7 text-left space-y-4 shadow-xl mb-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-flare">
              Security Authentication PIN
            </div>
            <span className="text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
              Do Not Share In Advance
            </span>
          </div>

          <p className="text-xs text-parchment/70 leading-relaxed">
            Share the <strong>Start PIN</strong> only when your Relationship Officer arrives in uniform —
            this starts the billing clock. When the visit is finished, your Officer will tell you a
            separate <strong>End PIN</strong> to enter in My Bookings, which stops the clock. You won't
            see the End PIN in advance — it only comes from your Officer once the work is genuinely done.
          </p>

          <div className="pt-2">
            <div className="bg-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] text-white/60">Start PIN</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-2xl font-bold text-white tracking-widest">{confirmed.start_pin}</span>
                <button
                  onClick={() => copyToClipboard(confirmed.start_pin, "start")}
                  className="text-white/60 hover:text-white p-1"
                  title="Copy PIN"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiedPin === "start" && <span className="text-[10px] text-emerald-400">Copied!</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/my-bookings")}
            className="px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-bold hover:opacity-95 transition-all shadow-md shadow-violet/20"
          >
            Track in My Bookings
          </button>
          <button
            onClick={() => { setConfirmed(null); }}
            className="px-6 py-3 rounded-full border border-ink/15 text-ink text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Book Another Visit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-violet bg-mist px-3 py-1 rounded-full mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Easy On-Demand Booking
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
          Book a Healthcare Companion
        </h1>
        <p className="text-ink-muted text-sm sm:text-base mt-1">
          Pick a service, set your preferred schedule, and an accredited concierge will be dispatched to your location.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Service Selection + Schedule Details */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Membership Status Badge */}
          {user && quota?.is_member && quota.status === "active" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-900">
              <Crown className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-emerald-950 font-bold">VIP Membership Active</strong>
                You have <strong>{quota.remaining} of {quota.quota} free visits</strong> left this month. This visit will be automatically waived!
              </div>
            </div>
          )}

          {/* Step 1: Select Service */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet text-white flex items-center justify-center text-[10px]">1</span>
              Select Healthcare Companion Service
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {services.map((s) => {
                const isSelected = selected?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelected(s)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-200 relative ${
                      isSelected
                        ? "border-violet bg-violet/5 ring-2 ring-violet shadow-sm"
                        : "border-ink/10 bg-white hover:border-ink/25 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="text-3xl mb-2">{s.icon}</div>
                    <div className="font-display text-sm font-bold text-ink leading-snug mb-1">
                      {s.name}
                    </div>
                    <div className="text-xs font-bold text-violet">
                      ₹{s.hourly_rate}
                      <span className="text-[10px] font-normal text-ink/50">/hr</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Service Form */}
          <form onSubmit={handleBook} className="space-y-5 bg-white p-6 sm:p-7 rounded-3xl border border-ink/10 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet text-white flex items-center justify-center text-[10px]">2</span>
              Schedule &amp; Location Details
            </div>

            {/* Hours Selection with Presets */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-ink/80 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet" />
                  Estimated Hours Needed
                </label>
                <span className="text-xs font-bold text-violet bg-violet/10 px-2 py-0.5 rounded-full">
                  {hours} {hours === 1 ? "Hour" : "Hours"}
                </span>
              </div>
              <div className="flex gap-2 mb-2">
                {HOUR_PRESETS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      Number(hours) === h
                        ? "bg-violet text-white border-violet shadow-xs"
                        : "bg-slate-50 border-ink/10 text-ink/70 hover:bg-slate-100"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-xs font-bold text-ink/80 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-violet" />
                Start Date &amp; Time
              </label>
              <input
                type="datetime-local"
                required
                value={form.scheduled_start}
                onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
                className="w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet bg-slate-50/50"
              />
            </div>

            {/* Pickup Address */}
            <div>
              <label className="block text-xs font-bold text-ink/80 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-violet" />
                Pickup / Hospital Address
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g., Flat 302, Ring Road or Room 412, Holy Cross Hospital, Ambikapur"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet bg-slate-50/50"
              />
            </div>

            {/* On-Arrival Contact Details */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink/80 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet" />
                  Contact Person on Arrival
                </label>
                <input
                  placeholder="Patient or family name"
                  value={form.contact_on_arrival_name}
                  onChange={(e) => setForm({ ...form, contact_on_arrival_name: e.target.value })}
                  className="w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/80 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-violet" />
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={form.contact_on_arrival_phone}
                  onChange={(e) => setForm({ ...form, contact_on_arrival_phone: e.target.value })}
                  className="w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet bg-slate-50/50"
                />
              </div>
            </div>

            {/* Service Return Location Checkbox */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-ink/10 flex items-center gap-3">
              <input
                type="checkbox"
                id="elsewhere"
                checked={endsElsewhere}
                onChange={(e) => setEndsElsewhere(e.target.checked)}
                className="accent-violet w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="elsewhere" className="text-xs text-ink/75 cursor-pointer">
                <strong>Service ends at a different location</strong> (adds standard flat ₹49 partner return fee)
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-ink/80 mb-1.5">
                Special Patient Instructions / Wheelchair / Doctor Details (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Patient is in wheelchair, needs assistance with cardiology OPD file on 3rd floor"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet bg-slate-50/50"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-clay">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selected}
              className="w-full py-3.5 rounded-full bg-brand-gradient text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet/25 hover:shadow-xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? "Confirming Booking..." : user ? "Confirm Booking & Dispatch" : "Log In & Confirm Booking"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Right Sticky Column: Transparent Bill Breakdown */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            
            <div className="bg-ink text-white rounded-3xl p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-flare">
                    Live Bill Estimate
                  </div>
                  <div className="font-display text-lg font-bold text-white">
                    {selected ? selected.name : "Select a Service"}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-md">
                    Pay After Visit
                  </span>
                </div>
              </div>

              {coveredByMembership ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-xs text-emerald-200">
                    ✨ <strong>VIP Member Privilege:</strong> Your visit is 100% free under your active plan quota!
                  </div>
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-white/80 text-sm">Estimated Total</span>
                    <span className="font-display text-3xl font-bold text-emerald-400">FREE</span>
                  </div>
                </div>
              ) : estimate ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-parchment/80">
                    <span>Base Service ({estimate.booked_hours} hrs × ₹{estimate.hourly_rate})</span>
                    <span className="font-mono">₹{estimate.service_subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-parchment/80">
                    <span>Partner Arrival Fee (~{distanceKm} km)</span>
                    <span className="font-mono">₹{estimate.arrival_fee.toFixed(2)}</span>
                  </div>

                  {estimate.return_fee > 0 && (
                    <div className="flex justify-between text-parchment/80">
                      <span>Different Location Return Fee</span>
                      <span className="font-mono">₹{estimate.return_fee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-parchment/80">
                    <span>GST (18% - CGST + SGST)</span>
                    <span className="font-mono">₹{estimate.gst_amount.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-white/15 pt-3 mt-3 flex justify-between items-baseline">
                    <div>
                      <span className="font-display text-xl font-bold text-white block">Estimated Total</span>
                      <span className="text-[10px] text-white/50">Exact bill calculated by PIN timer</span>
                    </div>
                    <span className="font-display text-3xl font-bold text-white tracking-tight">
                      ₹{estimate.estimated_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-parchment/60">Choose service details to see the live estimate.</p>
              )}

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-white/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero advance payment. You pay via UPI only after service is completed.</span>
              </div>
            </div>

            {/* Quick Assistance Box */}
            <div className="bg-slate-50 border border-ink/10 rounded-2xl p-4 text-xs text-ink/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-violet" />
                <span>Need immediate hospital dispatch in under 20 mins?</span>
              </div>
              <a
                href="https://wa.me/918340455584?text=Hi%20ROSKYRO,%20I%20need%20urgent%20hospital%20assistance."
                target="_blank"
                rel="noreferrer"
                className="font-bold text-violet hover:underline shrink-0"
              >
                WhatsApp Us 💬
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
