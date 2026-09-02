import { useEffect, useState } from "react";
import api from "../api/client";

const CHECK_FIELDS = [
  ["id_verified", "ID verified"],
  ["police_verified", "Police check"],
  ["references_checked", "References"],
  ["interview_passed", "Interview"],
  ["training_completed", "Training"],
  ["id_card_issued", "Photo ID issued"],
];

const BOOKING_STATUS_LABELS = {
  requested: "Requested",
  assigned: "Assigned",
  en_route: "En route",
  awaiting_start_pin: "Awaiting start PIN",
  in_progress: "In progress",
  awaiting_end_pin: "Awaiting end PIN",
  completed: "Completed",
  cancelled: "Cancelled",
};

const COMPLAINT_STATUS_OPTIONS = ["open", "in_review", "resolved"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    const { data } = await api.get("/admin/dashboard");
    setStats(data);
  }
  async function loadAgents() {
    const { data } = await api.get("/agents");
    setAgents(data);
  }
  async function loadCustomers() {
    setLoading(true);
    const { data } = await api.get("/admin/customers");
    setCustomers(data);
    setLoading(false);
  }
  async function loadBookings() {
    setLoading(true);
    const { data } = await api.get("/admin/bookings");
    setBookings(data);
    setLoading(false);
  }
  async function loadComplaints() {
    setLoading(true);
    const { data } = await api.get("/admin/complaints");
    setComplaints(data);
    setLoading(false);
  }

  useEffect(() => { loadStats(); loadAgents(); }, []);

  useEffect(() => {
    if (tab === "customers" && customers.length === 0) loadCustomers();
    if (tab === "bookings" && bookings.length === 0) loadBookings();
    if (tab === "complaints" && complaints.length === 0) loadComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function toggleCheck(agentId, field, value) {
    await api.patch(`/agents/${agentId}/verification`, { [field]: value });
    loadAgents();
  }

  async function updateComplaint(id, status, resolution_note) {
    await api.patch(`/admin/complaints/${id}`, { status, resolution_note });
    loadComplaints();
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl text-ink mb-8">Admin dashboard</h1>

      <div className="flex gap-6 border-b border-ink/10 mb-8 overflow-x-auto">
        {["overview", "partners", "customers", "bookings", "complaints"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-semibold capitalize border-b-2 -mb-px whitespace-nowrap ${
              tab === t ? "border-violet text-violet" : "border-transparent text-ink/50"
            }`}
          >
            {t === "bookings" ? "All bookings" : t}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          <Stat label="Active bookings" value={stats.bookings.active} />
          <Stat label="Completed bookings" value={stats.bookings.completed} />
          <Stat label="Open SOS" value={stats.bookings.sos_open} highlight={stats.bookings.sos_open > 0} />
          <Stat label="Revenue collected" value={`₹${stats.revenue.collected.toFixed(0)}`} />
          <Stat label="Pending collection" value={`₹${stats.revenue.pending_collection.toFixed(0)}`} />
          <Stat label="Active partners" value={stats.agents.active} />
          <Stat label="Partners in pipeline" value={stats.agents.in_pipeline} />
          <Stat label="Priority complaints" value={stats.complaints.priority_open} highlight={stats.complaints.priority_open > 0} />
        </div>
      )}

      {tab === "partners" && (
        <div className="space-y-4">
          {agents.map((a) => (
            <div key={a.id} className="border border-ink/10 rounded-card p-5">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="font-semibold text-ink">{a.full_name}</div>
                  <div className="text-sm text-ink/50">{a.phone} · {a.status} · {a.verification_progress}/6 checks</div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${a.is_fully_verified ? "bg-violet/15 text-magenta" : "bg-flare/20 text-ink"}`}>
                  {a.is_fully_verified ? "Fully verified" : "In progress"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CHECK_FIELDS.map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 text-sm text-ink/70 bg-parchment rounded-lg px-3 py-2 border border-ink/5">
                    <input
                      type="checkbox"
                      checked={a[field] ?? false}
                      onChange={(e) => toggleCheck(a.id, field, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {agents.length === 0 && <p className="text-ink/60">No partner applications yet.</p>}
        </div>
      )}

      {tab === "customers" && (
        <div>
          {loading && <p className="text-ink/50 mb-4">Loading…</p>}
          {!loading && customers.length === 0 && <p className="text-ink/60">No customers have signed up yet.</p>}
          {customers.length > 0 && (
            <div className="overflow-x-auto border border-ink/10 rounded-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-parchment text-left text-ink/60">
                    <Th>Name</Th>
                    <Th>Phone</Th>
                    <Th>Email</Th>
                    <Th>Bookings</Th>
                    <Th>Status</Th>
                    <Th>Joined</Th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-t border-ink/5">
                      <Td className="font-semibold text-ink">{c.full_name}</Td>
                      <Td>{c.phone}</Td>
                      <Td>{c.email || "—"}</Td>
                      <Td>{c.total_bookings}</Td>
                      <Td>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.is_active ? "bg-violet/15 text-magenta" : "bg-ink/10 text-ink/50"}`}>
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </Td>
                      <Td>{new Date(c.created_at).toLocaleDateString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "bookings" && (
        <div>
          {loading && <p className="text-ink/50 mb-4">Loading…</p>}
          {!loading && bookings.length === 0 && <p className="text-ink/60">No bookings yet.</p>}
          {bookings.length > 0 && (
            <div className="overflow-x-auto border border-ink/10 rounded-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-parchment text-left text-ink/60">
                    <Th>Booking</Th>
                    <Th>Customer</Th>
                    <Th>Partner</Th>
                    <Th>Service</Th>
                    <Th>Status</Th>
                    <Th>Hours</Th>
                    <Th>Amount</Th>
                    <Th>Scheduled</Th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className={`border-t border-ink/5 ${b.sos_triggered ? "bg-clay/10" : ""}`}>
                      <Td className="font-semibold text-ink">{b.booking_code}{b.sos_triggered ? " 🚨" : ""}</Td>
                      <Td>{b.customer_name}<div className="text-ink/40">{b.customer_phone}</div></Td>
                      <Td>{b.agent_name || "Unassigned"}</Td>
                      <Td>{b.service_name}</Td>
                      <Td>{BOOKING_STATUS_LABELS[b.status] || b.status}</Td>
                      <Td>{b.booked_hours}</Td>
                      <Td>{b.total_amount != null ? `₹${b.total_amount.toFixed(0)}` : "—"}</Td>
                      <Td>{new Date(b.scheduled_start).toLocaleString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "complaints" && (
        <div className="space-y-4">
          {loading && <p className="text-ink/50">Loading…</p>}
          {!loading && complaints.length === 0 && <p className="text-ink/60">No complaints or feedback yet.</p>}
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} onUpdate={updateComplaint} />
          ))}
        </div>
      )}
    </div>
  );
}

function ComplaintCard({ complaint, onUpdate }) {
  const [note, setNote] = useState(complaint.resolution_note || "");
  const [status, setStatus] = useState(complaint.status);

  return (
    <div className={`border rounded-card p-5 ${complaint.is_priority && complaint.status !== "resolved" ? "border-clay bg-clay/5" : "border-ink/10"}`}>
      <div className="flex justify-between items-start gap-4 mb-2">
        <div>
          <div className="font-semibold text-ink">
            {complaint.name} {complaint.is_priority && <span className="text-clay text-xs ml-1">⚠ Safety</span>}
          </div>
          <div className="text-sm text-ink/50">
            {complaint.phone} · {complaint.category} {complaint.booking_code ? `· ${complaint.booking_code}` : ""} · {new Date(complaint.created_at).toLocaleString()}
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-parchment text-ink/70 capitalize whitespace-nowrap">
          {complaint.status.replace("_", " ")}
        </span>
      </div>
      <p className="text-sm text-ink/80 mb-3">{complaint.message}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-ink/15 rounded-lg px-3 py-2 bg-white"
        >
          {COMPLAINT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reply / resolution note (optional)"
          className="flex-1 text-sm border border-ink/15 rounded-lg px-3 py-2"
        />
        <button
          onClick={() => onUpdate(complaint.id, status, note)}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-violet text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-card p-5 border ${highlight ? "border-clay bg-clay/10" : "border-ink/10 bg-white/50"}`}>
      <div className="text-xs text-ink/50 mb-1">{label}</div>
      <div className="font-display text-2xl text-ink">{value}</div>
    </div>
  );
}
