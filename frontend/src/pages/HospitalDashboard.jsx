import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const STAGE_OPTIONS = [
  ["assist_assigned", "Assist Assigned"],
  ["on_the_way", "On the Way"],
  ["arrived", "Arrived — Meet & Greet / Navigation / Wheelchair"],
  ["registration", "Registration"],
  ["consultation", "Consultation — OPD / Doctor"],
  ["diagnostics", "Diagnostics"],
  ["admission", "Admission"],
  ["discharge", "Discharge — Documents / Pharmacy / Billing / Transport"],
  ["home", "Home Return"],
  ["follow_up", "Follow-up Care"],
];
const STAGE_LABEL = Object.fromEntries(STAGE_OPTIONS);

const TABS = [
  ["today", "Today's Patients"],
  ["active", "Active Journeys"],
  ["assist", "ROSKYRO Assist"],
  ["admission", "Admission Queue"],
  ["discharge", "Discharge Queue"],
  ["updates", "Family Updates"],
  ["feedback", "Patient Feedback"],
  ["reports", "Reports"],
];

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [tab, setTab] = useState("today");
  const [journeys, setJourneys] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    const { data } = await api.get("/hospital-console/dashboard");
    setDashboard(data);
  }

  async function loadJourneys(queue) {
    setLoading(true);
    const { data } = await api.get("/hospital-console/journeys", { params: queue ? { queue } : {} });
    setJourneys(data);
    setLoading(false);
  }

  async function loadFeedback() {
    setLoading(true);
    const { data } = await api.get("/hospital-console/feedback");
    setFeedback(data);
    setLoading(false);
  }

  async function loadReports() {
    setLoading(true);
    const { data } = await api.get("/hospital-console/reports");
    setReports(data);
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  useEffect(() => {
    if (["today", "active", "assist", "admission", "discharge", "updates"].includes(tab)) {
      const queueMap = { today: "today", active: "active", assist: "active", admission: "admission", discharge: "discharge", updates: null };
      loadJourneys(queueMap[tab]);
    }
    if (tab === "feedback") loadFeedback();
    if (tab === "reports") loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function postStage(bookingId, stage, note) {
    await api.post(`/hospital-console/journeys/${bookingId}/stage`, { stage, note: note || null });
    loadDashboard();
    loadJourneys(
      { today: "today", active: "active", assist: "active", admission: "admission", discharge: "discharge", updates: null }[tab]
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h1 className="font-display text-3xl text-ink">{dashboard?.hospital_name || "Hospital Console"}</h1>
        <span className="text-sm text-ink/50">Signed in as {user?.full_name}</span>
      </div>
      <p className="text-ink/60 mb-8">Concierge-as-a-Service + Technology — manage every ROSKYRO patient journey at your hospital.</p>

      {dashboard && (
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <Stat label="Today's patients" value={dashboard.todays_patients} />
          <Stat label="Active journeys" value={dashboard.active_journeys} />
          <Stat label="Admission queue" value={dashboard.admission_queue} />
          <Stat label="Discharge queue" value={dashboard.discharge_queue} />
          <Stat label="Family updates today" value={dashboard.family_updates_today} />
          <Stat
            label="Feedback rating"
            value={dashboard.feedback_avg_rating != null ? `${dashboard.feedback_avg_rating} ★` : "—"}
          />
          <Stat label="Feedback count" value={dashboard.feedback_count} />
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

      {["today", "active", "admission", "discharge"].includes(tab) && (
        <JourneyList journeys={journeys} onPostStage={postStage} emptyLabel="No journeys in this queue right now." />
      )}

      {tab === "assist" && (
        <div className="space-y-4">
          {journeys.length === 0 && !loading && <p className="text-ink/60">No ROSKYRO Assist currently deployed at your hospital.</p>}
          {journeys.map((j) => (
            <div key={j.id} className="border border-ink/10 rounded-card p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-ink">{j.agent_name || "Awaiting assignment"}</div>
                <div className="text-sm text-ink/50">
                  Assigned to {j.booking_code} · {j.customer_name} · {STAGE_LABEL[j.current_stage] || "Not started"}
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet/15 text-magenta capitalize">
                {j.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "updates" && (
        <div className="space-y-6">
          {journeys.length === 0 && !loading && <p className="text-ink/60">No journeys yet.</p>}
          {journeys.map((j) => (
            <div key={j.id} className="border border-ink/10 rounded-card p-5">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <div className="font-semibold text-ink">{j.booking_code} — {j.customer_name}</div>
                  <div className="text-sm text-ink/50">{j.customer_phone}</div>
                </div>
                <StageUpdateForm bookingId={j.id} onPost={postStage} compact />
              </div>
              <Timeline updates={j.updates} />
            </div>
          ))}
        </div>
      )}

      {tab === "feedback" && (
        <div className="space-y-3">
          {feedback.length === 0 && !loading && <p className="text-ink/60">No patient feedback yet.</p>}
          {feedback.map((f) => (
            <div key={f.id} className="border border-ink/10 rounded-card p-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-ink">{f.booking_code}</span>
                <span className="text-flare text-sm">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
              </div>
              {f.comment && <p className="text-sm text-ink/70">{f.comment}</p>}
              <div className="text-xs text-ink/40 mt-1">{new Date(f.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "reports" && reports && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            <Stat label="Total journeys" value={reports.total_journeys} />
            <Stat label="Completed" value={reports.completed} />
            <Stat label="Cancelled" value={reports.cancelled} />
            <Stat label="SOS triggered" value={reports.sos_count} highlight={reports.sos_count > 0} />
          </div>
          <div>
            <h2 className="font-display text-xl text-ink mb-3">Patients by stage</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(reports.by_stage).map(([stage, count]) => (
                <div key={stage} className="border border-ink/10 rounded-lg px-4 py-3 flex justify-between text-sm">
                  <span className="text-ink/70">{STAGE_LABEL[stage] || stage}</span>
                  <span className="font-semibold text-ink">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JourneyList({ journeys, onPostStage, emptyLabel }) {
  if (journeys.length === 0) return <p className="text-ink/60">{emptyLabel}</p>;
  return (
    <div className="space-y-4">
      {journeys.map((j) => (
        <div key={j.id} className="border border-ink/10 rounded-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div className="font-semibold text-ink">{j.booking_code} — {j.customer_name}</div>
              <div className="text-sm text-ink/50">
                {j.customer_phone} · {j.service_name} · Assist: {j.agent_name || "unassigned"}
              </div>
              <div className="text-sm text-ink/50">Scheduled {new Date(j.scheduled_start).toLocaleString()}</div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet/15 text-magenta">
              {STAGE_LABEL[j.current_stage] || "Not started"}
            </span>
          </div>
          <Timeline updates={j.updates} />
          <StageUpdateForm bookingId={j.id} onPost={onPostStage} />
        </div>
      ))}
    </div>
  );
}

function Timeline({ updates }) {
  if (!updates || updates.length === 0) {
    return <p className="text-xs text-ink/40 mb-3">No family updates posted yet.</p>;
  }
  return (
    <div className="mb-3 space-y-1.5">
      {updates.map((u) => (
        <div key={u.id} className="text-sm flex flex-wrap gap-2 items-baseline">
          <span className="font-semibold text-ink">{STAGE_LABEL[u.stage] || u.stage}</span>
          {u.note && <span className="text-ink/60">— {u.note}</span>}
          <span className="text-xs text-ink/35 ml-auto">{new Date(u.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function StageUpdateForm({ bookingId, onPost, compact }) {
  const [stage, setStage] = useState(STAGE_OPTIONS[0][0]);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setPosting(true);
    try {
      await onPost(bookingId, stage, note);
      setNote("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <form onSubmit={submit} className={`flex flex-wrap gap-2 ${compact ? "" : "mt-2"}`}>
      <select value={stage} onChange={(e) => setStage(e.target.value)} className="text-sm border border-ink/15 rounded-lg px-3 py-2 bg-white">
        {STAGE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {!compact && (
        <input
          value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the family (optional)"
          className="flex-1 min-w-[180px] text-sm border border-ink/15 rounded-lg px-3 py-2"
        />
      )}
      <button disabled={posting} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
        {posting ? "Posting…" : "Post update"}
      </button>
    </form>
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
