import { useState } from "react";
import api from "../api/client";

const EMPTY = {
  partner_type: "doctor",
  name: "", city: "", area: "", address: "",
  contact_number: "", whatsapp: "", email: "", website: "", maps_link: "",
  specialty: "", sub_specialty: "", qualification: "", affiliation: "",
  consultation_fee: "", priority_fee: "", priority_slots: "", available_days: "", available_timings: "",
  departments: "", specialists: "", opd_timings: "", emergency_available: false, concierge_desk_contact: "",
};

export default function PriorityAccessApply() {
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
        priority_fee: form.priority_fee ? Number(form.priority_fee) : null,
      };
      await api.post("/priority-access/apply", payload);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit your application. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-5 py-24 text-center">
        <div className="text-3xl mb-4">✅</div>
        <h1 className="font-display text-2xl text-ink mb-2">Application received</h1>
        <p className="text-ink/60">
          A ROSKYRO concierge will verify your details and get in touch on WhatsApp/phone. Once
          approved, you'll appear as a <strong>✓ ROSKYRO Priority Access Partner</strong> in our
          public directory.
        </p>
      </div>
    );
  }

  const isDoctor = form.partner_type === "doctor";

  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <span className="text-xs font-semibold tracking-wide text-magenta">Priority Access Network</span>
      <h1 className="font-display text-3xl text-ink mt-2 mb-2">Become a Priority Access Partner</h1>
      <p className="text-ink/60 mb-8">
        Get discovered by patients searching for a doctor or hospital in your city — with a
        verified ROSKYRO badge. A concierge reviews every application before it goes live.
      </p>

      <form onSubmit={submit} className="space-y-6">
        <div className="flex gap-3">
          {["doctor", "hospital"].map((t) => (
            <button key={t} type="button" onClick={() => update("partner_type", t)}
              className={"flex-1 py-3 rounded-lg border font-semibold capitalize " + (form.partner_type === t ? "border-violet bg-mist" : "border-ink/10")}>
              {t}
            </button>
          ))}
        </div>

        <Section title="Basic information">
          <Field label={isDoctor ? "Doctor name" : "Hospital name"} required value={form.name} onChange={(v) => update("name", v)} />
          <Row>
            <Field label="City" required value={form.city} onChange={(v) => update("city", v)} />
            <Field label="Area" value={form.area} onChange={(v) => update("area", v)} />
          </Row>
          <Field label="Address" value={form.address} onChange={(v) => update("address", v)} textarea />
          <Row>
            <Field label="Contact number" required value={form.contact_number} onChange={(v) => update("contact_number", v)} />
            <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => update("whatsapp", v)} />
          </Row>
          <Row>
            <Field label="Email" value={form.email} onChange={(v) => update("email", v)} />
            <Field label="Website" value={form.website} onChange={(v) => update("website", v)} />
          </Row>
          <Field label="Google Maps link" value={form.maps_link} onChange={(v) => update("maps_link", v)} />
        </Section>

        {isDoctor ? (
          <Section title="Doctor details">
            <Row>
              <Field label="Specialty" value={form.specialty} onChange={(v) => update("specialty", v)} />
              <Field label="Sub-specialty" value={form.sub_specialty} onChange={(v) => update("sub_specialty", v)} />
            </Row>
            <Row>
              <Field label="Qualification" value={form.qualification} onChange={(v) => update("qualification", v)} />
              <Field label="Hospital/Clinic affiliation" value={form.affiliation} onChange={(v) => update("affiliation", v)} />
            </Row>
            <Row>
              <Field label="Consultation fee (₹)" type="number" value={form.consultation_fee} onChange={(v) => update("consultation_fee", v)} />
              <Field label="Priority fee (₹, if any)" type="number" value={form.priority_fee} onChange={(v) => update("priority_fee", v)} />
            </Row>
            <Field label="Priority slots" value={form.priority_slots} onChange={(v) => update("priority_slots", v)} />
            <Row>
              <Field label="Available days" value={form.available_days} onChange={(v) => update("available_days", v)} placeholder="e.g. Mon–Sat" />
              <Field label="Available timings" value={form.available_timings} onChange={(v) => update("available_timings", v)} placeholder="e.g. 10am–2pm" />
            </Row>
          </Section>
        ) : (
          <Section title="Hospital details">
            <Field label="Departments" value={form.departments} onChange={(v) => update("departments", v)} textarea placeholder="Cardiology, Orthopedics, Neurology..." />
            <Field label="Key specialists" value={form.specialists} onChange={(v) => update("specialists", v)} textarea />
            <Row>
              <Field label="OPD timings" value={form.opd_timings} onChange={(v) => update("opd_timings", v)} />
              <Field label="Concierge/front-desk contact" value={form.concierge_desk_contact} onChange={(v) => update("concierge_desk_contact", v)} />
            </Row>
            <Field label="Priority fee (₹, if any)" type="number" value={form.priority_fee} onChange={(v) => update("priority_fee", v)} />
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" checked={form.emergency_available} onChange={(e) => update("emergency_available", e.target.checked)} />
              Emergency services available
            </label>
          </Section>
        )}

        {error && <p className="text-sm text-clay">{error}</p>}

        <button className="w-full py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity">
          Submit application
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="font-display text-base text-ink mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ children }) {
  return <div className="grid sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, value, onChange, required, type = "text", textarea, placeholder }) {
  const Component = textarea ? "textarea" : "input";
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink/60">{label}{required && " *"}</span>
      <Component
        type={textarea ? undefined : type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet"
      />
    </label>
  );
}
