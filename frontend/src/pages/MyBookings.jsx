import { useEffect, useState } from "react";
import api from "../api/client";

const STATUS_LABEL = {
  requested: "Requested — matching a Partner",
  assigned: "Partner assigned",
  en_route: "Partner en route",
  awaiting_start_pin: "Partner arrived — share Start PIN",
  in_progress: "In progress",
  awaiting_end_pin: "Wrapping up — share End PIN to close billing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STAGE_LABEL = {
  assist_assigned: "Assist Assigned",
  on_the_way: "On the Way",
  arrived: "Arrived",
  registration: "Registration",
  consultation: "Consultation",
  diagnostics: "Diagnostics",
  admission: "Admission",
  discharge: "Discharge",
  home: "Home Return",
  follow_up: "Follow-up Care",
};
const STAGE_ORDER = Object.keys(STAGE_LABEL);

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState({});
  const [message, setMessage] = useState("");

  async function load() {
    const { data } = await api.get("/bookings/mine");
    setBookings(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submitStart(id) {
    try {
      await api.post(`/bookings/${id}/start`, { start_pin: pins[id]?.start || "" });
      setMessage("Service started — billing clock is running.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not verify the Start PIN.");
    }
  }

  async function submitEnd(id) {
    try {
      await api.post(`/bookings/${id}/end`, { end_pin: pins[id]?.end || "" });
      setMessage("Service ended — your bill is ready.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not verify the End PIN.");
    }
  }

  async function cancel(id) {
    try {
      await api.post(`/bookings/${id}/cancel`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not cancel this booking.");
    }
  }

  async function sos(id) {
    await api.post(`/bookings/${id}/sos`, {});
    setMessage("SOS sent — our team has been alerted immediately.");
    load();
  }

  if (loading) return <div className="max-w-3xl mx-auto px-5 py-20 text-ink/60">Loading your bookings…</div>;

  return (
    <div className="max-w-3xl mx-auto px-5 py-14">
      <h1 className="font-display text-3xl text-ink mb-8">My bookings</h1>
      {message && <div className="mb-6 text-sm bg-flare/20 border border-flare/40 rounded-lg px-4 py-3 text-ink">{message}</div>}

      {bookings.length === 0 && <p className="text-ink/60">No bookings yet.</p>}

      <div className="space-y-5">
        {bookings.map((b) => (
          <div key={b.id} className="border border-ink/10 rounded-card p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold text-ink">{b.booking_code}</div>
                <div className="text-sm text-ink/60">{STATUS_LABEL[b.status] || b.status}</div>
              </div>
              {b.total_amount != null && (
                <div className="font-display text-xl text-ink">₹{b.total_amount.toFixed(2)}</div>
              )}
            </div>

            <div className="text-sm text-ink/60 mb-3">{b.address}</div>

            {b.status === "awaiting_start_pin" && (
              <div className="flex gap-2 mt-3">
                <input
                  placeholder="Enter Start PIN"
                  className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  onChange={(e) => setPins((p) => ({ ...p, [b.id]: { ...p[b.id], start: e.target.value } }))}
                />
                <button onClick={() => submitStart(b.id)} className="px-4 py-2 rounded-lg bg-violet text-parchment text-sm font-semibold">
                  Start service
                </button>
              </div>
            )}

            {b.status === "in_progress" && (
              <div className="flex gap-2 mt-3">
                <input
                  placeholder="Enter End PIN"
                  className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  onChange={(e) => setPins((p) => ({ ...p, [b.id]: { ...p[b.id], end: e.target.value } }))}
                />
                <button onClick={() => submitEnd(b.id)} className="px-4 py-2 rounded-lg bg-violet text-parchment text-sm font-semibold">
                  End service
                </button>
                <button onClick={() => sos(b.id)} className="px-4 py-2 rounded-lg bg-clay text-parchment text-sm font-semibold">
                  SOS
                </button>
              </div>
            )}

            {["requested", "assigned"].includes(b.status) && (
              <button onClick={() => cancel(b.id)} className="text-sm text-clay font-medium mt-2">
                Cancel booking
              </button>
            )}

            {b.sos_triggered && <div className="mt-3 text-xs text-clay font-semibold">🚨 SOS alert sent for this booking</div>}

            {b.hospital_id && <JourneyTimeline bookingId={b.id} currentStage={b.current_stage} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneyTimeline({ bookingId, currentStage }) {
  const [journey, setJourney] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && !journey) {
      api.get(`/bookings/${bookingId}/journey`).then((r) => setJourney(r.data));
    }
  }, [open, journey, bookingId]);

  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="mt-4 border-t border-ink/10 pt-4">
      <button onClick={() => setOpen((v) => !v)} className="text-sm font-semibold text-violet">
        {open ? "Hide" : "View"} live journey &amp; family updates
      </button>

      {open && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2 mb-4">
            {STAGE_ORDER.map((stage, i) => (
              <span
                key={stage}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  i <= currentIndex ? "bg-violet text-parchment" : "bg-ink/5 text-ink/40"
                }`}
              >
                {STAGE_LABEL[stage]}
              </span>
            ))}
          </div>

          {!journey && <p className="text-sm text-ink/50">Loading updates…</p>}
          {journey && journey.hospital_name && (
            <p className="text-sm text-ink/60 mb-2">Hospital: {journey.hospital_name}</p>
          )}
          {journey && journey.updates.length === 0 && (
            <p className="text-sm text-ink/50">No family updates posted yet — check back soon.</p>
          )}
          {journey && journey.updates.length > 0 && (
            <div className="space-y-2">
              {journey.updates.map((u) => (
                <div key={u.id} className="text-sm bg-parchment rounded-lg px-4 py-2">
                  <div className="font-semibold text-ink">{STAGE_LABEL[u.stage] || u.stage}</div>
                  {u.note && <div className="text-ink/70">{u.note}</div>}
                  <div className="text-xs text-ink/40 mt-1">{new Date(u.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
