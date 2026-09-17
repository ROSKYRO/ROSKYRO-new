import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

const TABS = [
  ["board", "Ops Board — Assign Officers"],
  ["hospitals", "Hospitals"],
];

export default function AdminHospitalProgram() {
  const [tab, setTab] = useState("board");
  const [hospitals, setHospitals] = useState([]);
  const [agents, setAgents] = useState([]);
  const [cases, setCases] = useState([]);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadHospitals() {
    const { data } = await api.get("/admin/hospital-program/hospitals");
    setHospitals(data);
  }
  async function loadAgents() {
    const { data } = await api.get("/agents");
    setAgents(data);
  }
  async function loadCases() {
    setLoading(true);
    const { data } = await api.get("/admin/hospital-program/patients", {
      params: { status: "active", unassigned_today: showUnassignedOnly || undefined },
    });
    setCases(data);
    setLoading(false);
  }

  useEffect(() => { loadHospitals(); loadAgents(); }, []);
  useEffect(() => { if (tab === "board") loadCases(); }, [tab, showUnassignedOnly]); // eslint-disable-line

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h1 className="font-display text-3xl text-ink">Hospital Concierge Program</h1>
        <Link to="/admin" className="text-sm text-violet font-semibold">← Back to Admin</Link>
      </div>
      <p className="text-ink/60 mb-8">
        One dedicated Relationship Officer, per patient, per day — assign across a hospital's whole partner
        network from here.
      </p>

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

      {tab === "board" && (
        <OpsBoard
          cases={cases}
          agents={agents}
          loading={loading}
          showUnassignedOnly={showUnassignedOnly}
          setShowUnassignedOnly={setShowUnassignedOnly}
          onAssigned={loadCases}
        />
      )}

      {tab === "hospitals" && (
        <HospitalsTab hospitals={hospitals} onChanged={loadHospitals} />
      )}
    </div>
  );
}

function OpsBoard({ cases, agents, loading, showUnassignedOnly, setShowUnassignedOnly, onAssigned }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-ink/70 mb-5">
        <input type="checkbox" checked={showUnassignedOnly} onChange={(e) => setShowUnassignedOnly(e.target.checked)} />
        Show only patients still waiting on today's officer
      </label>

      {loading && <p className="text-ink/50 mb-4">Loading…</p>}
      {!loading && cases.length === 0 && <p className="text-ink/60">Nothing to show here right now.</p>}

      <div className="space-y-4">
        {cases.map((c) => (
          <CaseRow key={c.id} c={c} agents={agents} onAssigned={onAssigned} />
        ))}
      </div>
    </div>
  );
}

function CaseRow({ c, agents, onAssigned }) {
  const [agentId, setAgentId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  async function assign(e) {
    e.preventDefault();
    if (!agentId) return;
    setError("");
    setAssigning(true);
    try {
      await api.post(`/admin/hospital-program/patients/${c.id}/assign`, {
        agent_id: Number(agentId), start_date: startDate, end_date: endDate, note: note || null,
      });
      setNote("");
      onAssigned();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not assign.");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="border border-ink/10 rounded-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-ink">{c.patient_name} — {c.hospital_name}</div>
          <div className="text-sm text-ink/50">
            {c.attendant_name || "—"} · {c.attendant_phone} · ₹{c.daily_rate}/day
          </div>
          <div className="text-sm text-ink/50">Admitted {c.admission_date}</div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${c.today_officer_name ? "bg-violet/15 text-violet" : "bg-clay/15 text-clay"}`}>
          {c.today_officer_name ? `Today: ${c.today_officer_name}` : "Needs today's officer"}
        </span>
      </div>

      <form onSubmit={assign} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-ink/50 block">Relationship Officer</label>
          <select required value={agentId} onChange={(e) => setAgentId(e.target.value)} className="text-sm border border-ink/15 rounded-lg px-3 py-2 bg-white">
            <option value="">Select…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name}{a.is_available ? "" : " (unavailable)"}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 block">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm border border-ink/15 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-ink/50 block">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm border border-ink/15 rounded-lg px-3 py-2" />
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="flex-1 min-w-[140px] text-sm border border-ink/15 rounded-lg px-3 py-2" />
        <button disabled={assigning} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
          {assigning ? "Assigning…" : "Assign"}
        </button>
      </form>
      {error && <p className="text-sm text-clay mt-2">{error}</p>}
    </div>
  );
}

function HospitalsTab({ hospitals, onChanged }) {
  const [showNewHospital, setShowNewHospital] = useState(false);
  const [showStaffFor, setShowStaffFor] = useState(null);

  return (
    <div>
      <button onClick={() => setShowNewHospital((v) => !v)} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white mb-5">
        {showNewHospital ? "Cancel" : "+ Add a hospital"}
      </button>

      {showNewHospital && <NewHospitalForm onCreated={() => { setShowNewHospital(false); onChanged(); }} />}

      <div className="space-y-4 mt-5">
        {hospitals.map((h) => (
          <div key={h.id} className="border border-ink/10 rounded-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-ink">{h.name}</div>
                <div className="text-sm text-ink/50">{h.contact_name} · {h.contact_phone}</div>
                <div className="text-sm text-ink/50 capitalize">{h.contract_status} · per-patient daily rate: {h.per_patient_daily_rate != null ? `₹${h.per_patient_daily_rate}` : "not set"}</div>
              </div>
              <button onClick={() => setShowStaffFor(showStaffFor === h.id ? null : h.id)} className="text-xs font-semibold text-violet">
                {showStaffFor === h.id ? "Hide Console logins" : "Manage Console logins"}
              </button>
            </div>
            {showStaffFor === h.id && <StaffPanel hospitalId={h.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function NewHospitalForm({ onCreated }) {
  const [form, setForm] = useState({ name: "", contact_name: "", contact_phone: "", per_patient_daily_rate: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/admin/hospital-program/hospitals", {
        name: form.name,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        per_patient_daily_rate: form.per_patient_daily_rate ? Number(form.per_patient_daily_rate) : null,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create hospital.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-ink/10 rounded-card p-5 space-y-3 max-w-lg">
      <input required placeholder="Hospital name" value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full text-sm border border-ink/15 rounded-lg px-3 py-2" />
      <input placeholder="Contact name" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} className="w-full text-sm border border-ink/15 rounded-lg px-3 py-2" />
      <input placeholder="Contact phone" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} className="w-full text-sm border border-ink/15 rounded-lg px-3 py-2" />
      <input type="number" placeholder="Per-patient daily rate (₹) — hospital pays ROSKYRO this per patient per day" value={form.per_patient_daily_rate} onChange={(e) => set("per_patient_daily_rate", e.target.value)} className="w-full text-sm border border-ink/15 rounded-lg px-3 py-2" />
      {error && <p className="text-sm text-clay">{error}</p>}
      <button disabled={saving} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
        {saving ? "Creating…" : "Create hospital"}
      </button>
    </form>
  );
}

function StaffPanel({ hospitalId }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get(`/admin/hospital-program/hospitals/${hospitalId}/staff`);
    setStaff(data);
  }
  useEffect(() => { load(); }, [hospitalId]); // eslint-disable-line

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/admin/hospital-program/hospitals/${hospitalId}/staff`, form);
      setForm({ full_name: "", phone: "", password: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create login.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-ink/10 pt-4">
      <div className="space-y-1.5 mb-3">
        {staff.length === 0 && <p className="text-xs text-ink/40">No Console logins yet.</p>}
        {staff.map((s) => (
          <div key={s.id} className="text-sm text-ink/70">{s.full_name} · {s.phone}</div>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input required placeholder="Full name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="text-sm border border-ink/15 rounded-lg px-3 py-2" />
        <input required placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="text-sm border border-ink/15 rounded-lg px-3 py-2" />
        <input required type="password" placeholder="Password" value={form.password} onChange={(e) => set("password", e.target.value)} className="text-sm border border-ink/15 rounded-lg px-3 py-2" />
        <button disabled={saving} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
          {saving ? "Creating…" : "Issue login"}
        </button>
      </form>
      {error && <p className="text-sm text-clay mt-2">{error}</p>}
    </div>
  );
}
