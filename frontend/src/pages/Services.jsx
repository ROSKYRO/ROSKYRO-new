import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Services() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] = useState("");
  const [hours, setHours] = useState(2);
  const [distanceKm, setDistanceKm] = useState(4);
  const [endsElsewhere, setEndsElsewhere] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [form, setForm] = useState({
    address: "", contact_on_arrival_name: "", contact_on_arrival_phone: "", scheduled_start: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    api.get("/services").then((r) => {
      setServices(r.data);
      if (r.data.length) setSelected(r.data[0]);
    });
    api.get("/hospitals").then((r) => setHospitals(r.data)).catch(() => setHospitals([]));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.post("/bookings/estimate", {
      service_id: selected.id,
      booked_hours: Number(hours),
      distance_km: Number(distanceKm),
      ends_at_different_location: endsElsewhere,
    }).then((r) => setEstimate(r.data)).catch(() => setEstimate(null));
  }, [selected, hours, distanceKm, endsElsewhere]);

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
        hospital_id: hospitalId ? Number(hospitalId) : null,
      });
      setConfirmed(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create the booking. Please check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-display text-3xl text-ink mb-3">Booking confirmed</h1>
        <p className="text-ink/60 mb-8">Booking code <span className="font-semibold text-ink">{confirmed.booking_code}</span></p>
        <div className="bg-violet text-parchment rounded-card p-6 text-left space-y-3">
          <p className="text-sm text-parchment/70">Share these PINs only at the right moment — never in advance.</p>
          <div className="flex justify-between bg-parchment/10 rounded-lg px-4 py-3">
            <span>Start PIN</span><span className="font-display text-xl">{confirmed.start_pin}</span>
          </div>
          <div className="flex justify-between bg-parchment/10 rounded-lg px-4 py-3">
            <span>End PIN</span><span className="font-display text-xl">{confirmed.end_pin}</span>
          </div>
        </div>
        <button onClick={() => navigate("/my-bookings")} className="mt-8 px-6 py-3 rounded-full bg-ink text-parchment font-semibold hover:bg-violet transition-colors">
          Go to My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-14 grid md:grid-cols-5 gap-10">
      {/* Left: service + details form */}
      <div className="md:col-span-3">
        <h1 className="font-display text-3xl text-ink mb-6">Book a Partner</h1>

        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`text-left rounded-card border p-4 transition-colors ${
                selected?.id === s.id ? "border-violet bg-violet/5" : "border-ink/10 hover:border-ink/30"
              }`}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-semibold text-ink text-sm mb-1">{s.name}</div>
              <div className="text-xs text-ink/50">₹{s.hourly_rate}/hr</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleBook} className="space-y-4">
          {hospitals.length > 0 && (
            <div>
              <label className="text-sm font-medium text-ink/70">Hospital (optional — for hospital-floor journeys like OPD, admission, discharge)</label>
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet bg-white"
              >
                <option value="">No specific hospital</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}{h.city_name ? ` — ${h.city_name}` : ""}</option>
                ))}
              </select>
              {hospitalId && (
                <p className="text-xs text-ink/50 mt-1">
                  Your family will get a live journey timeline (Assist Assigned → On the Way → Arrival → Registration → Consultation → Diagnostics → Admission/Discharge → Home) on the My Bookings page.
                </p>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-ink/70">Hours needed</label>
              <input type="number" min="1" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70">Date &amp; time</label>
              <input type="datetime-local" required value={form.scheduled_start}
                onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink/70">Address</label>
            <textarea required rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-ink/70">Contact on arrival (name)</label>
              <input value={form.contact_on_arrival_name} onChange={(e) => setForm({ ...form, contact_on_arrival_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70">Contact on arrival (phone)</label>
              <input value={form.contact_on_arrival_phone} onChange={(e) => setForm({ ...form, contact_on_arrival_phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="elsewhere" checked={endsElsewhere} onChange={(e) => setEndsElsewhere(e.target.checked)} />
            <label htmlFor="elsewhere" className="text-sm text-ink/70">Service ends at a different location (adds a flat return fee)</label>
          </div>

          <div>
            <label className="text-sm font-medium text-ink/70">Notes for your Partner (optional)</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
          </div>

          {error && <p className="text-sm text-clay">{error}</p>}

          <button disabled={submitting || !selected}
            className="w-full py-3 rounded-full bg-violet text-parchment font-semibold hover:bg-magenta transition-colors disabled:opacity-60">
            {submitting ? "Booking..." : user ? "Confirm booking" : "Log in to confirm"}
          </button>
        </form>
      </div>

      {/* Right: live estimate */}
      <div className="md:col-span-2">
        <div className="sticky top-24 bg-ink text-parchment rounded-card p-6">
          <div className="font-display text-lg mb-4">Estimated bill</div>
          {estimate ? (
            <div className="space-y-2 text-sm">
              <Row label={`${estimate.booked_hours} hr × ₹${estimate.hourly_rate}`} value={`₹${estimate.service_subtotal.toFixed(2)}`} />
              <Row label="Arrival fee" value={`₹${estimate.arrival_fee.toFixed(2)}`} />
              <Row label="Return fee" value={`₹${estimate.return_fee.toFixed(2)}`} />
              <Row label="GST (18%)" value={`₹${estimate.gst_amount.toFixed(2)}`} />
              <div className="border-t border-parchment/20 pt-3 mt-3 flex justify-between font-display text-xl">
                <span>Total</span><span>₹{estimate.estimated_total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-parchment/50 pt-2">
                This is an estimate. You're billed for actual time worked (Start PIN to End PIN), not the booked time.
              </p>
            </div>
          ) : (
            <p className="text-sm text-parchment/60">Select a service to see live pricing.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-parchment/80">
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
