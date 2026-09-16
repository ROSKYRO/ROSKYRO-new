import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  PhoneCall, 
  CheckCircle2, 
  Copy, 
  Sparkles, 
  Calendar, 
  ArrowRight,
  UserCheck,
  Timer
} from "lucide-react";
import api from "../api/client";
import { useBookingModal } from "../context/BookingModalContext";
import { CALL_TEL_LINK, SUPPORT_PHONE_DISPLAY } from "../config";

const STATUS_CONFIG = {
  requested: { label: "Matching Companion...", color: "bg-amber-50 text-amber-700 border-amber-200", step: 1 },
  assigned: { label: "Companion Assigned", color: "bg-blue-50 text-blue-700 border-blue-200", step: 2 },
  en_route: { label: "Companion En Route", color: "bg-violet/10 text-violet border-violet/20", step: 3 },
  awaiting_start_pin: { label: "Arrived • Share Start PIN", color: "bg-indigo-50 text-indigo-700 border-indigo-200", step: 4 },
  in_progress: { label: "Care In Progress", color: "bg-emerald-50 text-emerald-700 border-emerald-200", step: 5 },
  awaiting_end_pin: { label: "Wrapping Up • Share End PIN", color: "bg-amber-50 text-amber-700 border-amber-200", step: 5 },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-700 border-slate-200", step: 6 },
  cancelled: { label: "Cancelled", color: "bg-rose-50 text-rose-700 border-rose-200", step: 0 },
};

function formatHms(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Live-ticking elapsed time + running cost estimate while a visit is in
 * progress. Purely a frontend display — the real bill is always computed
 * server-side (with the free cushion / minimum-hours floor applied) once the
 * customer submits the End PIN, so this is clearly labeled as an estimate. */
function LiveTimer({ startedAt, hourlyRate }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!startedAt) return null;
  const elapsedSeconds = Math.max((now - new Date(startedAt).getTime()) / 1000, 0);
  const elapsedHours = elapsedSeconds / 3600;
  const estimatedCost = hourlyRate != null ? elapsedHours * hourlyRate : null;

  return (
    <div className="p-4 bg-ink text-white rounded-2xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-emerald-400 animate-pulse" />
        <div>
          <div className="text-[10px] uppercase font-bold text-white/50">Time Elapsed</div>
          <div className="font-mono text-lg font-bold tracking-wide">{formatHms(elapsedSeconds)}</div>
        </div>
      </div>
      {estimatedCost != null && (
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-white/50">Running Estimate</div>
          <div className="font-display text-lg font-bold">₹{estimatedCost.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
}

export default function MyBookings() {
  const { openQuickBook } = useBookingModal();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState({});
  const [message, setMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "active" | "completed"
  const [copiedId, setCopiedId] = useState(null);

  async function load() {
    try {
      const { data } = await api.get("/bookings/mine");
      setBookings(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submitStart(id) {
    try {
      await api.post(`/bookings/${id}/start`, { start_pin: pins[id]?.start || "" });
      setMessage("Service started! Billing clock is running.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not verify the Start PIN.");
    }
  }

  async function submitEnd(id) {
    try {
      await api.post(`/bookings/${id}/end`, { end_pin: pins[id]?.end || "" });
      setMessage("Service completed! Your final bill is ready.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not verify the End PIN.");
    }
  }

  async function cancel(id) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not cancel this booking.");
    }
  }

  async function sos(id) {
    await api.post(`/bookings/${id}/sos`, {});
    setMessage("🚨 SOS alert dispatched to ROSKYRO rapid response team.");
    load();
  }

  const copyPin = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === "active") return !["completed", "cancelled"].includes(b.status);
    if (activeFilter === "completed") return b.status === "completed";
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink/60 text-sm font-medium">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            My Healthcare Bookings
          </h1>
          <p className="text-xs sm:text-sm text-ink/60 mt-1">
            Real-time status tracking, security PINs, and booking history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openQuickBook()}
          className="px-5 py-2.5 rounded-full bg-brand-gradient text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-violet/20 hover:opacity-95 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Instant Booking</span>
        </button>
      </div>

      {/* Alert banner */}
      {message && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="text-xs font-bold text-amber-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-ink/10 pb-3">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeFilter === "all"
              ? "bg-violet text-white shadow-xs"
              : "bg-slate-100 text-ink/70 hover:text-ink"
          }`}
        >
          All ({bookings.length})
        </button>
        <button
          onClick={() => setActiveFilter("active")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeFilter === "active"
              ? "bg-violet text-white shadow-xs"
              : "bg-slate-100 text-ink/70 hover:text-ink"
          }`}
        >
          Active ({bookings.filter((b) => !["completed", "cancelled"].includes(b.status)).length})
        </button>
        <button
          onClick={() => setActiveFilter("completed")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeFilter === "completed"
              ? "bg-violet text-white shadow-xs"
              : "bg-slate-100 text-ink/70 hover:text-ink"
          }`}
        >
          Completed ({bookings.filter((b) => b.status === "completed").length})
        </button>
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="bg-white rounded-3xl border border-ink/10 p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-ink/40 flex items-center justify-center mx-auto text-2xl">
            📅
          </div>
          <h3 className="font-display text-lg font-bold text-ink">No bookings found</h3>
          <p className="text-xs text-ink/60 max-w-sm mx-auto">
            You don't have any {activeFilter !== "all" ? activeFilter : ""} bookings yet. Book a companion for hospital, diagnostics, or elder care in under 60 seconds.
          </p>
          <button
            onClick={() => openQuickBook()}
            className="px-6 py-2.5 rounded-full bg-brand-gradient text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Book a Healthcare Concierge</span>
          </button>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-6">
        {filteredBookings.map((b) => {
          const cfg = STATUS_CONFIG[b.status] || { label: b.status, color: "bg-slate-100 text-ink/70", step: 1 };
          const isActive = !["completed", "cancelled"].includes(b.status);

          return (
            <div
              key={b.id}
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs ${
                isActive ? "border-violet/40 ring-1 ring-violet/20" : "border-ink/10"
              }`}
            >
              {/* Top Banner */}
              <div className="p-5 sm:p-6 border-b border-ink/5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-ink bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {b.booking_code}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {b.is_membership_covered && (
                        <span className="text-[10px] font-bold bg-violet text-white px-2 py-0.5 rounded-full">
                          👑 VIP Pass (Free)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink/50 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{b.scheduled_start ? new Date(b.scheduled_start).toLocaleString() : "Immediate Dispatch"}</span>
                      <span>•</span>
                      <span>{b.booked_hours} hrs booked</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {b.is_membership_covered ? (
                      <span className="font-display text-xl font-bold text-emerald-600">FREE</span>
                    ) : b.total_amount != null ? (
                      <div>
                        <div className="font-display text-2xl font-bold text-ink">₹{b.total_amount.toFixed(2)}</div>
                        <div className="text-[10px] text-ink/40">Final Bill (GST incl.)</div>
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-ink/60">Pay After Visit</div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 text-xs text-ink/70 bg-slate-50 p-3 rounded-xl">
                  <MapPin className="w-4 h-4 text-violet shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{b.address}</span>
                </div>
              </div>

              {/* Middle Action / PIN Section */}
              <div className="p-5 sm:p-6 bg-slate-50/50 space-y-4">
                
                {/* Security PIN Display for Active User */}
                {isActive && b.start_pin && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-2xl border border-ink/10 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-ink/50">Start PIN (Give at Arrival)</div>
                        <div className="font-mono text-xl font-bold text-ink mt-0.5">{b.start_pin}</div>
                      </div>
                      <button
                        onClick={() => copyPin(b.start_pin, `start-${b.id}`)}
                        className="text-xs font-semibold text-violet hover:underline flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === `start-${b.id}` ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Input PIN Verification Blocks (when companion arrived or ending) */}
                {b.status === "awaiting_start_pin" && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-700" />
                      Partner Arrived: Verify Start PIN to Begin Timer
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Enter Start PIN"
                        className="flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-mono font-bold"
                        onChange={(e) => setPins((p) => ({ ...p, [b.id]: { ...p[b.id], start: e.target.value } }))}
                      />
                      <button
                        onClick={() => submitStart(b.id)}
                        className="px-4 py-2 rounded-xl bg-violet text-white text-xs font-bold hover:bg-violet-dark transition-colors"
                      >
                        Start Service Clock
                      </button>
                    </div>
                  </div>
                )}

                {b.status === "in_progress" && (
                  <div className="space-y-3">
                    <LiveTimer startedAt={b.actual_start_at} hourlyRate={b.hourly_rate} />
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-700 animate-spin" />
                        Care in Progress
                      </div>
                      <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                        Your Relationship Officer will share the End PIN with you once the visit is
                        genuinely finished — enter it below the moment you get it to stop the clock.
                      </p>
                      <div className="flex gap-2">
                        <input
                          placeholder="Enter End PIN (given by your Officer)"
                          className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-mono font-bold"
                          onChange={(e) => setPins((p) => ({ ...p, [b.id]: { ...p[b.id], end: e.target.value } }))}
                        />
                        <button
                          onClick={() => submitEnd(b.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                        >
                          End Service &amp; Bill
                        </button>
                        <button
                          onClick={() => sos(b.id)}
                          className="px-4 py-2 rounded-xl bg-clay text-white text-xs font-bold hover:opacity-90 transition-opacity"
                          title="Emergency SOS"
                        >
                          SOS 🚨
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Controls: Cancel / Call Helpline */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  {["requested", "assigned"].includes(b.status) && (
                    <button
                      onClick={() => cancel(b.id)}
                      className="text-clay hover:underline font-semibold"
                    >
                      Cancel Booking
                    </button>
                  )}

                  <a
                    href={CALL_TEL_LINK}
                    className="text-ink/60 hover:text-violet flex items-center gap-1 ml-auto"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>24x7 Help: {SUPPORT_PHONE_DISPLAY}</span>
                  </a>
                </div>

                {b.sos_triggered && (
                  <div className="p-2.5 bg-red-100 border border-red-300 rounded-xl text-xs font-bold text-red-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                    <span>Emergency SOS Flagged: Concierge Operations Room is coordinating actively.</span>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
