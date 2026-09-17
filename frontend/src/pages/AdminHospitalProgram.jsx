import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

const TABS = [
  ["board", "Ops Board — Assign Officers"],
  ["officers", "Officers"],
  ["attention", "Needs Attention"],
  ["billing", "Billing"],
  ["hospitals", "Hospitals"],
];

export default function AdminHospitalProgram() {
  const [tab, setTab] = useState("board");
  const [hospitals, setHospitals] = useState([]);
  const [agents, setAgents] = useState([]);
  const [cases, setCases] = useState([]);
  const [officers, setOfficers] = useState([]);
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
    try {
      // "Needs attention" is the closest thing to a reminder feed that needs
      // no SMS/email provider: every open case carrying a warning/critical
      // alert — stuck discharges, uncovered patients, overdue expected
      // discharges, dead officer links — worst first.
      const url = tab === "attention"
        ? "/admin/hospital-program/discharge-alerts"
        : "/admin/hospital-program/patients";
      const params = tab === "attention"
        ? {}
        : { status: "active", unassigned_today: showUnassignedOnly || undefined };
      const { data } = await api.get(url, { params });
      setCases(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadOfficers() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/hospital-program/officers");
      setOfficers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHospitals(); loadAgents(); }, []);
  useEffect(() => { if (tab === "board" || tab === "attention") loadCases(); }, [tab, showUnassignedOnly]); // eslint-disable-line
  useEffect(() => { if (tab === "officers") loadOfficers(); }, [tab]); // eslint-disable-line

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h1 className="font-display text-3xl text-ink">Hospital Concierge Program</h1>
        <Link to="/admin" className="text-sm text-violet font-semibold">← Back to Admin</Link>
      </div>
      <p className="text-ink/60 mb-8">
        One dedicated Relationship Officer per patient, assigned at admission — coverage and billing keep running
        day by day until both the hospital and that officer confirm the actual discharge date & time.
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

      {(tab === "board" || tab === "attention") && (
        <OpsBoard
          attentionMode={tab === "attention"}
          cases={cases}
          agents={agents}
          loading={loading}
          showUnassignedOnly={showUnassignedOnly}
          setShowUnassignedOnly={setShowUnassignedOnly}
          onAssigned={loadCases}
        />
      )}

      {tab === "officers" && (
        <OfficersTab officers={officers} loading={loading} onChanged={loadOfficers} />
      )}

      {tab === "billing" && <BillingTab hospitals={hospitals} />}

      {tab === "hospitals" && (
        <HospitalsTab hospitals={hospitals} onChanged={loadHospitals} />
      )}
    </div>
  );
}

function OpsBoard({ cases, agents, loading, showUnassignedOnly, setShowUnassignedOnly, onAssigned, attentionMode }) {
  return (
    <div>
      {!attentionMode && (
        <label className="flex items-center gap-2 text-sm text-ink/70 mb-5">
          <input type="checkbox" checked={showUnassignedOnly} onChange={(e) => setShowUnassignedOnly(e.target.checked)} />
          Show only patients genuinely uncovered today
        </label>
      )}
      {attentionMode && (
        <p className="text-sm text-ink/60 mb-5">
          Open cases with something that needs chasing — stuck discharges still billing, uncovered patients,
          overdue expected discharges, dead officer links. Most urgent first.
        </p>
      )}

      {loading && <p className="text-ink/50 mb-4">Loading…</p>}
      {!loading && cases.length === 0 && (
        <p className="text-ink/60">{attentionMode ? "Nothing needs chasing right now." : "Nothing to show here right now."}</p>
      )}

      <div className="space-y-4">
        {cases.map((c) => (
          <CaseRow key={c.id} c={c} agents={agents} onAssigned={onAssigned} />
        ))}
      </div>
    </div>
  );
}

const ALERT_STYLES = {
  critical: "bg-rose-50 border-rose-200 text-rose-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  info: "bg-slate-50 border-ink/10 text-ink/60",
};

function AlertList({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div className="space-y-1.5 mb-3">
      {alerts.map((a) => (
        <div key={a.code} className={`text-xs px-3 py-2 rounded-lg border font-medium ${ALERT_STYLES[a.severity] || ALERT_STYLES.info}`}>
          {a.message}
        </div>
      ))}
    </div>
  );
}

// "What is this officer doing right now" — answered directly, instead of
// scanning every patient card on the Ops Board to piece it together.
function OfficersTab({ officers, loading, onChanged }) {
  return (
    <div>
      <p className="text-sm text-ink/60 mb-5">
        Every Relationship Officer currently on the Hospital Concierge Program — who they're covering today, at
        which hospitals, whether they're over the daily cap, and this month's coverage payout.
      </p>
      {loading && <p className="text-ink/50 mb-4">Loading…</p>}
      {!loading && officers.length === 0 && <p className="text-ink/60">No officer has a hospital patient yet.</p>}
      <div className="space-y-4">
        {officers.map((o) => (
          <OfficerCard key={o.agent_id} o={o} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}

function OfficerCard({ o, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const portalLink = o.portal_token ? `${window.location.origin}/officer/portal/${o.portal_token}` : null;

  async function regenerate() {
    setBusy(true);
    try {
      await api.post(`/admin/hospital-program/officers/${o.agent_id}/portal-link`);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    if (!portalLink) return;
    navigator.clipboard?.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`border rounded-card p-5 ${o.over_capacity_today ? "border-clay/40" : "border-ink/10"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <div className="font-semibold text-ink">{o.full_name} · {o.phone}</div>
          <div className="text-sm text-ink/50">
            {o.status} · {o.is_fully_verified ? "fully verified" : "verification incomplete"} ·{" "}
            {o.is_available ? "available" : "marked unavailable"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${o.over_capacity_today ? "bg-clay/15 text-clay" : "bg-violet/15 text-violet"}`}>
            {o.today_patient_count} patient{o.today_patient_count === 1 ? "" : "s"} today
            {o.over_capacity_today ? " — over daily cap" : ""}
          </span>
          {o.no_show_days_30d > 0 && (
            <span className="text-[10px] text-clay">{o.no_show_days_30d} no-show day{o.no_show_days_30d === 1 ? "" : "s"} (30d)</span>
          )}
        </div>
      </div>

      {o.today_cases.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {o.today_cases.map((tc) => (
            <span key={tc.case_id} className="text-xs bg-parchment border border-ink/10 rounded-full px-3 py-1">
              {tc.patient_name} — {tc.hospital_name || "—"}{tc.is_fallback ? " (standing)" : ""}
            </span>
          ))}
        </div>
      )}

      <div className="text-xs text-ink/50 flex flex-wrap gap-x-4 gap-y-1">
        <span>Active cases: {o.active_case_count}</span>
        <span>Days covered this month: {o.days_covered_this_month}</span>
        <span>
          Payout estimate this month: {o.hospital_daily_rate != null
            ? `₹${o.payout_estimate_this_month.toLocaleString("en-IN")}`
            : "no daily rate set"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-ink/10">
        {portalLink && (
          <button type="button" onClick={copyLink} className="text-xs font-semibold text-violet hover:underline">
            {copied ? "Copied!" : "Copy their \"my day\" link"}
          </button>
        )}
        <button type="button" disabled={busy} onClick={regenerate} className="text-xs font-semibold text-clay hover:underline disabled:opacity-50">
          {portalLink ? "Regenerate link" : "Issue portal link"}
        </button>
        <span className="text-[10px] text-ink/40">
          {portalLink
            ? o.portal_link_live
              ? `valid till ${new Date(o.portal_token_expires_at).toLocaleDateString()}`
              : "link expired"
            : "no link issued yet — they can't see their day themselves"}
        </span>
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
  const [copied, setCopied] = useState(false);
  const [showForceClose, setShowForceClose] = useState(false);
  const [forceReason, setForceReason] = useState("");
  const [forceDatetime, setForceDatetime] = useState(nowLocalInput());
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conflict, setConflict] = useState(""); // 409 message from the last assign attempt
  const [forceAssign, setForceAssign] = useState(false);

  async function assign(e) {
    e.preventDefault();
    if (!agentId) return;
    setError("");
    setAssigning(true);
    try {
      await api.post(`/admin/hospital-program/patients/${c.id}/assign`, {
        agent_id: Number(agentId), start_date: startDate, end_date: endDate, note: note || null,
        force: forceAssign,
      });
      setNote("");
      setConflict("");
      setForceAssign(false);
      onAssigned();
    } catch (err) {
      const detail = err.response?.data?.detail || "Could not assign.";
      if (err.response?.status === 409) {
        // A soft block — the officer is marked unavailable, or this would put
        // them over the daily patient cap. Surface it as a conflict to
        // consciously override, not a dead end.
        setConflict(detail);
      } else {
        // A hard block (officer not active / not fully verified) has no
        // override — force would be silently ignored server-side too.
        setError(detail);
        setConflict("");
      }
    } finally {
      setAssigning(false);
    }
  }

  async function forceClose(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post(`/admin/hospital-program/patients/${c.id}/force-close-discharge`, {
        reason: forceReason,
        discharge_datetime: forceDatetime ? new Date(forceDatetime).toISOString() : null,
      });
      setShowForceClose(false);
      setForceReason("");
      onAssigned();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not force-close this discharge.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateLink() {
    setError("");
    setBusy(true);
    try {
      await api.post(`/admin/hospital-program/patients/${c.id}/discharge-link`);
      onAssigned();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not regenerate the link.");
    } finally {
      setBusy(false);
    }
  }

  async function setDayStatus(assignmentId, status) {
    setError("");
    setBusy(true);
    try {
      await api.patch(`/admin/hospital-program/assignments/${assignmentId}`, { status });
      onAssigned();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update that day.");
    } finally {
      setBusy(false);
    }
  }

  const dischargeLink = c.officer_discharge_token
    ? `${window.location.origin}/officer/discharge/${c.officer_discharge_token}`
    : null;

  function copyLink() {
    if (!dischargeLink) return;
    navigator.clipboard?.writeText(dischargeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // The officer badge now reflects who is genuinely covering today — including
  // the case's standing officer on days with no explicit daily row. Only a
  // real gap (nobody assigned, or today marked a no-show) shows as a problem.
  const coveredToday = Boolean(c.today_officer_name);
  const canForceClose = c.status === "pending_discharge";

  return (
    <div className="border border-ink/10 rounded-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-ink">{c.patient_name} — {c.hospital_name}</div>
          <div className="text-sm text-ink/50">
            {c.attendant_name || "—"} · {c.attendant_phone} · ₹{c.daily_rate}/day
          </div>
          <div className="text-sm text-ink/50">
            Admitted {c.admission_date} · {c.days_covered} day{c.days_covered === 1 ? "" : "s"} so far · ₹{c.billed_estimate.toLocaleString("en-IN")} billed
            {c.no_show_days > 0 && <span className="text-clay"> · {c.no_show_days} no-show day{c.no_show_days === 1 ? "" : "s"}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${coveredToday ? "bg-violet/15 text-violet" : "bg-clay/15 text-clay"}`}>
            {coveredToday
              ? `Today: ${c.today_officer_name}${c.today_officer_is_fallback ? " (standing)" : ""}`
              : "Needs today's officer"}
          </span>
          {c.status === "pending_discharge" && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
              Awaiting {c.discharge_waiting_on === "officer" ? "officer's" : "hospital's"} discharge confirmation
            </span>
          )}
          {!c.officer_confirmation_required && c.status !== "discharged" && (
            <span className="text-[10px] text-ink/40">No RO assigned — hospital's confirmation alone will close this</span>
          )}
        </div>
      </div>

      <AlertList alerts={c.alerts} />

      {c.assigned_agent_name && (
        <div className="text-xs text-ink/50 mb-3 flex flex-wrap items-center gap-2">
          <span>Assigned Relationship Officer: <strong className="text-ink/70">{c.assigned_agent_name}</strong></span>
          {dischargeLink && c.officer_discharge_link_live && (
            <button type="button" onClick={copyLink} className="font-semibold text-violet hover:underline">
              {copied ? "Copied!" : "Copy officer's discharge link"}
            </button>
          )}
          <button type="button" disabled={busy} onClick={regenerateLink} className="font-semibold text-clay hover:underline disabled:opacity-50">
            Regenerate link
          </button>
          <span className="text-ink/40">
            {c.officer_discharge_link_live
              ? c.officer_discharge_token_expires_at
                ? `· link valid till ${new Date(c.officer_discharge_token_expires_at).toLocaleDateString()}`
                : "· link has no expiry (legacy) — regenerate to put it on a timer"
              : "· link expired or revoked"}
          </span>
        </div>
      )}

      <div className="text-xs text-ink/40 mb-3">
        Hospital confirmed: {c.hospital_discharge_at ? `${new Date(c.hospital_discharge_at).toLocaleString()}${c.hospital_discharge_by_name ? ` by ${c.hospital_discharge_by_name}` : ""}` : "no"}
        {" · "}Officer confirmed: {c.officer_discharge_at ? new Date(c.officer_discharge_at).toLocaleString() : "no"}
        {c.discharge_force_closed_at && (
          <span className="block text-clay font-semibold mt-1">
            Force-closed by {c.discharge_force_closed_by_name || "admin"} on {new Date(c.discharge_force_closed_at).toLocaleString()} — {c.discharge_force_close_reason}
          </span>
        )}
      </div>

      <form onSubmit={assign} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-ink/50 block">Relationship Officer</label>
          <select
            required value={agentId}
            onChange={(e) => { setAgentId(e.target.value); setConflict(""); setForceAssign(false); }}
            className="text-sm border border-ink/15 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">Select…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id} disabled={a.status !== "active" || !a.is_fully_verified}>
                {a.full_name}
                {a.status !== "active" ? ` (${a.status})` : !a.is_fully_verified ? " (verification incomplete)" : ""}
                {a.status === "active" && a.is_fully_verified && !a.is_available ? " (unavailable)" : ""}
              </option>
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
          {assigning ? "Assigning…" : forceAssign ? "Assign anyway" : "Assign"}
        </button>
      </form>

      {conflict && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <p className="font-medium">{conflict}</p>
          <label className="flex items-center gap-2 mt-2 font-semibold">
            <input type="checkbox" checked={forceAssign} onChange={(e) => setForceAssign(e.target.checked)} />
            Assign anyway (this is a conscious override, not a default)
          </label>
        </div>
      )}
      <p className="text-[10px] text-ink/40 mt-2">
        This just seeds the assignment history for that stretch — the officer stays on the case (and counts as
        today's officer even after the To date passes) until both the hospital and this officer confirm the actual
        discharge. Swapping the officer here revokes the previous officer's link and clears any confirmation they'd given.
      </p>

      <div className="flex flex-wrap gap-4 mt-3">
        <button type="button" onClick={() => setShowHistory((v) => !v)} className="text-xs font-semibold text-violet">
          {showHistory ? "Hide day-by-day history" : "Day-by-day history"}
        </button>
        {canForceClose && (
          <button type="button" onClick={() => setShowForceClose((v) => !v)} className="text-xs font-semibold text-clay ml-auto">
            {showForceClose ? "Cancel override" : "Force-close discharge"}
          </button>
        )}
      </div>

      {showHistory && (
        <div className="mt-3 border-t border-ink/10 pt-3 space-y-1.5">
          {c.assignments.length === 0 && <p className="text-xs text-ink/40">No daily rows — the standing officer covers every day.</p>}
          {c.assignments.map((a) => (
            <div key={a.id} className="text-sm flex flex-wrap gap-2 items-center">
              <span className="font-semibold text-ink">{a.date}</span>
              <span className="text-ink/70">{a.agent_name}</span>
              <span className={`text-xs ${a.status === "no_show" ? "text-clay font-semibold" : "text-ink/40"}`}>{a.status}</span>
              <span className="ml-auto flex gap-2">
                <button type="button" disabled={busy} onClick={() => setDayStatus(a.id, "completed")} className="text-[11px] font-semibold text-violet disabled:opacity-50">
                  Mark completed
                </button>
                <button type="button" disabled={busy} onClick={() => setDayStatus(a.id, "no_show")} className="text-[11px] font-semibold text-clay disabled:opacity-50">
                  Mark no-show
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {showForceClose && (
        <form onSubmit={forceClose} className="mt-3 border-t border-ink/10 pt-3 space-y-2">
          <p className="text-xs text-ink/60">
            Use this only when one side has stopped responding. It fills in the missing confirmation, closes the case
            so billing stops, revokes the officer's link, and permanently records that this was an override.
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            <label className="block">
              <span className="text-xs text-ink/50 block">Discharge date & time</span>
              <input type="datetime-local" value={forceDatetime} onChange={(e) => setForceDatetime(e.target.value)} className="text-sm border border-ink/15 rounded-lg px-3 py-2" />
            </label>
            <input
              required minLength={3} value={forceReason} onChange={(e) => setForceReason(e.target.value)}
              placeholder="Reason (required) — e.g. RO left the job, unreachable 5 days"
              className="flex-1 min-w-[220px] text-sm border border-ink/15 rounded-lg px-3 py-2"
            />
            <button disabled={busy} className="text-sm font-semibold px-4 py-2 rounded-full bg-clay text-white disabled:opacity-60">
              {busy ? "Closing…" : "Force-close"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-clay mt-2">{error}</p>}
    </div>
  );
}

function nowLocalInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

// ---------------------------------------------------------------------------
// Billing — monthly hospital invoices. Only patients who have ACTUALLY
// discharged are ever counted here. A patient still active or
// pending_discharge keeps billing quietly in the background and is simply
// left off every invoice until the day they discharge — then they land on
// whichever invoice gets generated after that, this month's or a later one.
// ---------------------------------------------------------------------------

function BillingTab({ hospitals }) {
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [pending, setPending] = useState({}); // hospitalId -> { case_count, total_amount } | null

  async function loadInvoices() {
    setLoadingInvoices(true);
    try {
      const { data } = await api.get("/admin/hospital-program/invoices");
      setInvoices(data);
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function loadPending() {
    const results = {};
    await Promise.all(
      hospitals.map(async (h) => {
        try {
          const { data } = await api.get(`/admin/hospital-program/hospitals/${h.id}/pending-billing`);
          results[h.id] = data;
        } catch {
          results[h.id] = null;
        }
      })
    );
    setPending(results);
  }

  useEffect(() => { loadInvoices(); }, []);
  useEffect(() => { if (hospitals.length) loadPending(); }, [hospitals]); // eslint-disable-line

  return (
    <div>
      <h2 className="font-display text-lg text-ink mb-2">Ready to invoice</h2>
      <p className="text-sm text-ink/60 mb-5">
        Only patients who have actually discharged are counted below. A patient still active or pending discharge
        keeps billing quietly in the background — it shows up here, and on the next invoice, the moment they
        discharge, whichever month that turns out to be. Nothing is ever double-billed.
      </p>
      <div className="space-y-3 mb-10">
        {hospitals.length === 0 && <p className="text-ink/60">No hospitals yet.</p>}
        {hospitals.map((h) => {
          const p = pending[h.id];
          return (
            <div key={h.id} className="border border-ink/10 rounded-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-ink">{h.name}</div>
                <div className="text-sm text-ink/50">
                  {p
                    ? `${p.case_count} discharged patient${p.case_count === 1 ? "" : "s"} not yet invoiced · ₹${p.total_amount.toLocaleString("en-IN")}`
                    : "Loading…"}
                </div>
              </div>
              <GenerateInvoiceButton
                hospitalId={h.id}
                disabled={!p || p.case_count === 0}
                onGenerated={() => { loadInvoices(); loadPending(); }}
              />
            </div>
          );
        })}
      </div>

      <h2 className="font-display text-lg text-ink mb-3">Invoices</h2>
      {loadingInvoices && <p className="text-ink/50 mb-4">Loading…</p>}
      {!loadingInvoices && invoices.length === 0 && <p className="text-ink/60">No invoices generated yet.</p>}
      <div className="space-y-4">
        {invoices.map((inv) => (
          <InvoiceCard key={inv.id} inv={inv} onChanged={loadInvoices} />
        ))}
      </div>
    </div>
  );
}

function GenerateInvoiceButton({ hospitalId, disabled, onGenerated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      await api.post(`/admin/hospital-program/hospitals/${hospitalId}/invoices`, {});
      onGenerated();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate invoice.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={generate}
        disabled={disabled || busy}
        className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-40"
      >
        {busy ? "Generating…" : "Generate invoice"}
      </button>
      {error && <p className="text-xs text-clay mt-1 max-w-[220px]">{error}</p>}
    </div>
  );
}

function InvoiceCard({ inv, onChanged }) {
  const [showCases, setShowCases] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function markPaid(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post(`/admin/hospital-program/invoices/${inv.id}/mark-paid`, {
        payment_reference: reference || null,
        payment_note: note || null,
      });
      setShowPay(false);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not mark as paid.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-ink/10 rounded-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-ink">{inv.hospital_name}</div>
          <div className="text-sm text-ink/50">
            {inv.period_start} → {inv.period_end} · {inv.case_count} patient{inv.case_count === 1 ? "" : "s"}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl text-ink">₹{inv.total_amount.toLocaleString("en-IN")}</div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
              inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {inv.status}
          </span>
        </div>
      </div>

      {inv.status === "paid" && (
        <div className="text-xs text-ink/50 mt-2">
          Paid {new Date(inv.paid_at).toLocaleDateString()}
          {inv.payment_reference ? ` · ref: ${inv.payment_reference}` : ""}
          {inv.payment_note ? ` · ${inv.payment_note}` : ""}
        </div>
      )}

      <div className="flex gap-4 mt-3 items-center">
        <button type="button" onClick={() => setShowCases((v) => !v)} className="text-xs font-semibold text-violet">
          {showCases ? "Hide patients" : `Show ${inv.case_count} patient${inv.case_count === 1 ? "" : "s"}`}
        </button>
        {inv.status !== "paid" && (
          <button type="button" onClick={() => setShowPay((v) => !v)} className="text-xs font-semibold text-violet ml-auto">
            {showPay ? "Cancel" : "Mark as paid"}
          </button>
        )}
      </div>

      {showCases && (
        <div className="mt-3 border-t border-ink/10 pt-3 space-y-1.5">
          {inv.cases.map((c) => (
            <div key={c.case_id} className="text-sm flex flex-wrap gap-2 justify-between">
              <span className="text-ink/80">{c.patient_name}</span>
              <span className="text-ink/50">
                {c.days_covered} day{c.days_covered === 1 ? "" : "s"} · ₹{c.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      )}

      {showPay && (
        <form onSubmit={markPaid} className="mt-3 border-t border-ink/10 pt-3 flex flex-wrap gap-2 items-end">
          <input
            placeholder="Payment reference (UTR/cheque no.)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="text-sm border border-ink/15 rounded-lg px-3 py-2 flex-1 min-w-[180px]"
          />
          <input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm border border-ink/15 rounded-lg px-3 py-2 flex-1 min-w-[180px]"
          />
          <button disabled={busy} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
            {busy ? "Saving…" : "Confirm paid"}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-clay mt-2">{error}</p>}
    </div>
  );
}
