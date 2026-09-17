import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const TABS = [
  ["active", "Active Patients"],
  ["new", "Hand Over a New Patient"],
  ["discharged", "Discharged"],
];

const STATUS_LABEL = {
  assigned: "Assigned",
  completed: "Completed",
  no_show: "No-show",
};

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [tab, setTab] = useState("active");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  async function loadDashboard() {
    const { data } = await api.get("/hospital-console/dashboard");
    setDashboard(data);
  }

  async function loadCases(status) {
    setLoading(true);
    const { data } = await api.get("/hospital-console/patients", { params: { status } });
    setCases(data);
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (tab === "active") loadCases("active");
    if (tab === "discharged") loadCases("discharged");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function dischargeCase(id) {
    if (!window.confirm("Mark this patient as discharged? ROSKYRO billing for this case stops from today.")) return;
    await api.patch(`/hospital-console/patients/${id}/status`, { status: "discharged" });
    loadDashboard();
    loadCases("active");
  }

  async function onCreated() {
    setTab("active");
    loadDashboard();
    loadCases("active");
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h1 className="font-display text-3xl text-ink">{dashboard?.hospital_name || "Hospital Console"}</h1>
        <span className="text-sm text-ink/50">Signed in as {user?.full_name}</span>
      </div>
      <p className="text-ink/60 mb-8">
        Your concierge service, managed by ROSKYRO — hand off a patient's short details and ROSKYRO takes care of
        the rest, with one dedicated Relationship Officer assigned every day of their stay.
      </p>

      {dashboard && (
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <Stat label="Active patients" value={dashboard.active_patients} />
          <Stat label="Covered today" value={dashboard.today_assigned} />
          <Stat
            label="Awaiting today's officer"
            value={dashboard.today_unassigned}
            highlight={dashboard.today_unassigned > 0}
          />
          <Stat label="Discharged this month" value={dashboard.discharged_this_month} />
          <Stat label="Est. billing this month" value={`₹${dashboard.estimated_billing_this_month.toLocaleString("en-IN")}`} />
        </div>
      )}

      <div className="flex gap-6 border-b border-ink/10 mb-8 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${
              tab === key ? "border-violet text-violet" : "border-transparent text-ink/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-ink/50 mb-4">Loading…</p>}

      {tab === "new" && <NewPatientForm onCreated={onCreated} />}

      {(tab === "active" || tab === "discharged") && (
        <div className="space-y-4">
          {cases.length === 0 && !loading && (
            <p className="text-ink/60">
              {tab === "active" ? "No active patients right now." : "No discharged patients yet."}
            </p>
          )}
          {cases.map((c) => (
            <PatientCard
              key={c.id}
              c={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onDischarge={tab === "active" ? () => dischargeCase(c.id) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientCard({ c, expanded, onToggle, onDischarge }) {
  return (
    <div className="border border-ink/10 rounded-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-ink">
            {c.patient_name}
            {c.patient_age != null && <span className="text-ink/40 font-normal"> · {c.patient_age} yrs</span>}
            {c.ward_or_room && <span className="text-ink/40 font-normal"> · {c.ward_or_room}</span>}
          </div>
          <div className="text-sm text-ink/50">
            Attendant: {c.attendant_name || "—"} · {c.attendant_phone}
          </div>
          <div className="text-sm text-ink/50">Admitted {c.admission_date}</div>
          {c.short_note && <div className="text-sm text-ink/60 mt-1">{c.short_note}</div>}
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${c.today_officer_name ? "text-violet" : "text-clay"}`}>
            {c.today_officer_name ? `Today: ${c.today_officer_name}` : "Awaiting today's officer"}
          </div>
          <div className="text-xs text-ink/40 mt-1">
            {c.days_covered} day{c.days_covered === 1 ? "" : "s"} covered · ₹{c.billed_estimate.toLocaleString("en-IN")} billed
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-3">
        <button onClick={onToggle} className="text-xs font-semibold text-violet">
          {expanded ? "Hide assignment history" : "View assignment history"}
        </button>
        {onDischarge && (
          <button onClick={onDischarge} className="text-xs font-semibold text-clay ml-auto">
            Mark discharged
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 border-t border-ink/10 pt-3 space-y-1.5">
          {c.assignments.length === 0 && <p className="text-xs text-ink/40">No officer assigned yet.</p>}
          {c.assignments.map((a) => (
            <div key={a.id} className="text-sm flex flex-wrap gap-2 items-baseline">
              <span className="font-semibold text-ink">{a.date}</span>
              <span className="text-ink/70">{a.agent_name}</span>
              <span className="text-xs text-ink/40">{STATUS_LABEL[a.status] || a.status}</span>
              {a.note && <span className="text-xs text-ink/40 ml-auto">{a.note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewPatientForm({ onCreated }) {
  const [form, setForm] = useState({
    patient_name: "", patient_age: "", attendant_name: "", attendant_phone: "",
    ward_or_room: "", short_note: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/hospital-console/patients", {
        patient_name: form.patient_name,
        patient_age: form.patient_age ? Number(form.patient_age) : null,
        attendant_name: form.attendant_name || null,
        attendant_phone: form.attendant_phone,
        ward_or_room: form.ward_or_room || null,
        short_note: form.short_note || null,
      });
      setForm({ patient_name: "", patient_age: "", attendant_name: "", attendant_phone: "", ward_or_room: "", short_note: "" });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save this patient.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <p className="text-sm text-ink/60">
        Just the basics — ROSKYRO's Relationship Officer takes it from here and looks after every need the
        patient and attendant have, day by day.
      </p>
      <Field label="Patient name" required>
        <input required value={form.patient_name} onChange={(e) => set("patient_name", e.target.value)} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Age (optional)">
          <input type="number" min="0" value={form.patient_age} onChange={(e) => set("patient_age", e.target.value)} className="input" />
        </Field>
        <Field label="Ward / room (optional)">
          <input value={form.ward_or_room} onChange={(e) => set("ward_or_room", e.target.value)} className="input" />
        </Field>
      </div>
      <Field label="Attendant name (optional)">
        <input value={form.attendant_name} onChange={(e) => set("attendant_name", e.target.value)} className="input" />
      </Field>
      <Field label="Attendant phone" required>
        <input required type="tel" value={form.attendant_phone} onChange={(e) => set("attendant_phone", e.target.value)} className="input" />
      </Field>
      <Field label="Short note for ROSKYRO (optional)">
        <textarea
          value={form.short_note} onChange={(e) => set("short_note", e.target.value)}
          rows={3} className="input" placeholder="e.g. cardiac, post-op, needs help with mobility"
        />
      </Field>
      {error && <p className="text-sm text-clay">{error}</p>}
      <button
        disabled={saving}
        className="px-6 py-3 rounded-full bg-violet text-white font-semibold disabled:opacity-60"
      >
        {saving ? "Handing over…" : "Hand over to ROSKYRO"}
      </button>
      <style>{`.input { width: 100%; margin-top: 4px; border: 1px solid rgba(0,0,0,0.15); border-radius: 0.5rem; padding: 0.6rem 0.9rem; }`}</style>
    </form>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">{label}{required && " *"}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-card p-5 border ${highlight ? "border-clay bg-clay/5" : "border-ink/10"}`}>
      <div className="text-2xl font-display text-ink">{value}</div>
      <div className="text-sm text-ink/50">{label}</div>
    </div>
  );
}
