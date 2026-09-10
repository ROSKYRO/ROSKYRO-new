import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function PriorityAccessProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [partner, setPartner] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", preferred_time: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/priority-access/partners/${id}`)
      .then((r) => setPartner(r.data))
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, patient_name: user.full_name || "", patient_phone: user.phone || "" }));
  }, [user]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/priority-access/appointment-requests", { partner_id: Number(id), ...form });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not send your request. Please try again.");
    }
  }

  if (notFound) return <div className="max-w-xl mx-auto px-5 py-20 text-ink/60">This partner isn't listed right now.</div>;
  if (!partner) return <div className="max-w-xl mx-auto px-5 py-20 text-ink/50">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-5 py-16 grid md:grid-cols-5 gap-10">
      <div className="md:col-span-3">
        <span className="text-[10px] font-semibold tracking-wide bg-brand-gradient text-white px-2 py-0.5 rounded-full">
          ✓ ROSKYRO PRIORITY ACCESS PARTNER
        </span>
        <h1 className="font-display text-3xl text-ink mt-3 mb-1">{partner.name}</h1>
        <div className="text-ink/60 mb-6">
          {partner.partner_type === "doctor" ? partner.specialty : "Hospital"} · {partner.city}{partner.area ? `, ${partner.area}` : ""}
        </div>

        {partner.partner_type === "doctor" ? (
          <div className="space-y-2 text-sm text-ink/70 mb-6">
            {partner.qualification && <div><strong>Qualification:</strong> {partner.qualification}</div>}
            {partner.affiliation && <div><strong>Hospital/Clinic:</strong> {partner.affiliation}</div>}
            {partner.available_days && <div><strong>Available:</strong> {partner.available_days} {partner.available_timings && `· ${partner.available_timings}`}</div>}
            {partner.priority_slots && <div><strong>Priority slots:</strong> {partner.priority_slots}</div>}
          </div>
        ) : (
          <div className="space-y-2 text-sm text-ink/70 mb-6">
            {partner.departments && <div><strong>Departments:</strong> {partner.departments}</div>}
            {partner.opd_timings && <div><strong>OPD timings:</strong> {partner.opd_timings}</div>}
            <div><strong>Emergency:</strong> {partner.emergency_available ? "Available" : "Not specified"}</div>
          </div>
        )}

        <div className="flex gap-6 mb-6">
          {partner.consultation_fee != null && (
            <div><div className="text-xs text-ink/50">Consultation</div><div className="font-display text-xl text-ink">₹{partner.consultation_fee}</div></div>
          )}
          {partner.priority_fee != null && (
            <div><div className="text-xs text-ink/50">Priority fee</div><div className="font-display text-xl text-ink">₹{partner.priority_fee}</div></div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <a href={`tel:${partner.contact_number}`} className="px-5 py-2.5 rounded-full border border-ink/15 font-semibold">📞 Call</a>
          {partner.whatsapp && (
            <a href={`https://wa.me/${partner.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
              className="px-5 py-2.5 rounded-full border border-ink/15 font-semibold">💬 WhatsApp</a>
          )}
          {partner.maps_link && (
            <a href={partner.maps_link} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-full border border-ink/15 font-semibold">📍 Map</a>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="bg-mist rounded-card p-5 sticky top-24">
          <div className="font-display text-lg text-ink mb-1">📅 Request Priority Appointment</div>
          <p className="text-xs text-ink/50 mb-4">
            Your concierge confirms availability and gets back to you with the confirmed slot and fees.
          </p>

          {!user ? (
            <p className="text-sm text-ink/60">Please <a href="/login" className="text-violet font-semibold">log in</a> to request an appointment.</p>
          ) : submitted ? (
            <p className="text-sm text-violet font-semibold">Request sent! Your concierge will confirm shortly on WhatsApp.</p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input required placeholder="Patient name" value={form.patient_name}
                onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              <input required placeholder="Phone number" value={form.patient_phone}
                onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              <input placeholder="Preferred time (e.g. Tomorrow morning)" value={form.preferred_time}
                onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              <textarea placeholder="Anything else your concierge should know" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              {error && <p className="text-xs text-clay">{error}</p>}
              <button className="w-full py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold">
                Request Priority Appointment
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
