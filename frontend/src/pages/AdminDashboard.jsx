import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

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
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [services, setServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [team, setTeam] = useState([]);
  const [hospitals, setHospitals] = useState([]);
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
  async function loadServices() {
    setLoading(true);
    const { data } = await api.get("/admin/services");
    setServices(data);
    setLoading(false);
  }
  async function loadCities() {
    setLoading(true);
    const { data } = await api.get("/admin/cities");
    setCities(data);
    setLoading(false);
  }
  async function loadTeam() {
    setLoading(true);
    const { data } = await api.get("/admin/team");
    setTeam(data);
    setLoading(false);
  }
  async function loadHospitals() {
    setLoading(true);
    const { data } = await api.get("/admin/hospitals");
    setHospitals(data);
    setLoading(false);
  }

  useEffect(() => { loadStats(); loadAgents(); }, []);

  useEffect(() => {
    if (tab === "customers" && customers.length === 0) loadCustomers();
    if (tab === "bookings" && bookings.length === 0) loadBookings();
    if (tab === "complaints" && complaints.length === 0) loadComplaints();
    if (tab === "services" && services.length === 0) loadServices();
    if (tab === "cities" && cities.length === 0) loadCities();
    if (tab === "team" && team.length === 0) loadTeam();
    if (tab === "hospitals" && hospitals.length === 0) loadHospitals();
    if (tab === "hospitals" && cities.length === 0) loadCities();
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

  // --- Partners: add / activate-deactivate / delete ---
  async function addPartner(payload) {
    await api.post("/admin/partners", payload);
    loadAgents();
  }
  async function setPartnerStatus(id, status) {
    await api.patch(`/admin/partners/${id}/status`, { status });
    loadAgents();
  }
  async function deletePartner(id) {
    if (!window.confirm("Remove this partner? This can't be undone.")) return;
    try {
      await api.delete(`/admin/partners/${id}`);
      loadAgents();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not delete this partner.");
    }
  }

  // --- Services: add / activate-deactivate / edit / delete ---
  async function addService(payload) {
    await api.post("/admin/services", payload);
    loadServices();
  }
  async function updateService(id, payload) {
    await api.patch(`/admin/services/${id}`, payload);
    loadServices();
  }
  async function deleteService(id) {
    if (!window.confirm("Delete this service? This can't be undone.")) return;
    try {
      await api.delete(`/admin/services/${id}`);
      loadServices();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not delete this service.");
    }
  }

  // --- Cities: add / live-inactive / edit / delete ---
  async function addCity(payload) {
    await api.post("/admin/cities", payload);
    loadCities();
  }
  async function updateCity(id, payload) {
    await api.patch(`/admin/cities/${id}`, payload);
    loadCities();
  }
  async function deleteCity(id) {
    if (!window.confirm("Delete this city? This can't be undone.")) return;
    try {
      await api.delete(`/admin/cities/${id}`);
      loadCities();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not delete this city.");
    }
  }

  // --- Team: add / activate-deactivate / delete ---
  async function addTeamMember(payload) {
    await api.post("/admin/team", payload);
    loadTeam();
  }
  async function updateTeamMember(id, payload) {
    await api.patch(`/admin/team/${id}`, payload);
    loadTeam();
  }
  async function deleteTeamMember(id) {
    if (!window.confirm("Remove this team member? This can't be undone.")) return;
    try {
      await api.delete(`/admin/team/${id}`);
      loadTeam();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not remove this team member.");
    }
  }

  // --- Hospitals (partners) + their Hospital Console logins ---
  async function addHospital(payload) {
    await api.post("/admin/hospitals", payload);
    loadHospitals();
  }
  async function updateHospital(id, payload) {
    await api.patch(`/admin/hospitals/${id}`, payload);
    loadHospitals();
  }
  async function deleteHospital(id) {
    if (!window.confirm("Remove this hospital partner? This can't be undone.")) return;
    try {
      await api.delete(`/admin/hospitals/${id}`);
      loadHospitals();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not delete this hospital.");
    }
  }
  async function addHospitalStaff(payload) {
    await api.post("/admin/hospitals/staff", payload);
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl text-ink mb-8">Admin dashboard</h1>

      <div className="flex gap-6 border-b border-ink/10 mb-8 overflow-x-auto">
        {["overview", "hospitals", "partners", "services", "cities", "team", "customers", "bookings", "complaints"].map((t) => (
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

      {tab === "hospitals" && (
        <div className="space-y-4">
          <AddHospitalForm onAdd={addHospital} cities={cities} />
          {loading && <p className="text-ink/50">Loading…</p>}
          {hospitals.map((h) => (
            <HospitalRow key={h.id} hospital={h} onUpdate={updateHospital} onDelete={deleteHospital} onAddStaff={addHospitalStaff} />
          ))}
          {!loading && hospitals.length === 0 && <p className="text-ink/60">No hospital partners yet.</p>}
        </div>
      )}

      {tab === "partners" && (
        <div className="space-y-4">
          <AddPartnerForm onAdd={addPartner} />
          {agents.map((a) => (
            <div key={a.id} className="border border-ink/10 rounded-card p-5">
              <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
                <div>
                  <div className="font-semibold text-ink">{a.full_name}</div>
                  <div className="text-sm text-ink/50">{a.phone} · {a.status} · {a.verification_progress}/6 checks</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${a.is_fully_verified ? "bg-violet/15 text-magenta" : "bg-flare/20 text-ink"}`}>
                    {a.is_fully_verified ? "Fully verified" : "In progress"}
                  </span>
                  {a.status === "suspended" ? (
                    <button
                      onClick={() => setPartnerStatus(a.id, "active")}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-violet/15 text-magenta"
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      onClick={() => setPartnerStatus(a.id, "suspended")}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-ink/10 text-ink/60"
                    >
                      Deactivate
                    </button>
                  )}
                  <button
                    onClick={() => deletePartner(a.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-clay/15 text-clay"
                  >
                    Delete
                  </button>
                </div>
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

      {tab === "services" && (
        <div className="space-y-4">
          <AddServiceForm onAdd={addService} />
          {loading && <p className="text-ink/50">Loading…</p>}
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} onUpdate={updateService} onDelete={deleteService} />
          ))}
          {!loading && services.length === 0 && <p className="text-ink/60">No services yet.</p>}
        </div>
      )}

      {tab === "cities" && (
        <div className="space-y-4">
          <AddCityForm onAdd={addCity} />
          {loading && <p className="text-ink/50">Loading…</p>}
          {cities.map((c) => (
            <CityRow key={c.id} city={c} onUpdate={updateCity} onDelete={deleteCity} />
          ))}
          {!loading && cities.length === 0 && <p className="text-ink/60">No cities yet.</p>}
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-4">
          <AddTeamMemberForm onAdd={addTeamMember} />
          {loading && <p className="text-ink/50">Loading…</p>}
          {team.map((m) => (
            <TeamRow key={m.id} member={m} isSelf={user?.user_id === m.id} onUpdate={updateTeamMember} onDelete={deleteTeamMember} />
          ))}
          {!loading && team.length === 0 && <p className="text-ink/60">No team members yet.</p>}
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

// ---------------------------------------------------------------------------
// Services: add form + row with inline pricing/active edit + delete
// ---------------------------------------------------------------------------

function AddServiceForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", short_description: "", hourly_rate: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onAdd({ ...form, hourly_rate: parseFloat(form.hourly_rate) });
      setForm({ name: "", slug: "", icon: "", short_description: "", hourly_rate: "" });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add service.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white">
        + Add service
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-ink/10 rounded-card p-5 grid sm:grid-cols-2 gap-3">
      <Input label="Name" value={form.name} onChange={set("name")} required />
      <Input label="Slug (URL-friendly, unique)" value={form.slug} onChange={set("slug")} required />
      <Input label="Icon (emoji, optional)" value={form.icon} onChange={set("icon")} />
      <Input label="Hourly rate (₹)" type="number" value={form.hourly_rate} onChange={set("hourly_rate")} required />
      <div className="sm:col-span-2">
        <Input label="Short description" value={form.short_description} onChange={set("short_description")} />
      </div>
      {error && <p className="sm:col-span-2 text-sm text-clay">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={saving} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save service"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold px-4 py-2 rounded-full bg-ink/10 text-ink/70">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ServiceRow({ service, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [rate, setRate] = useState(service.hourly_rate);

  async function saveRate() {
    await onUpdate(service.id, { hourly_rate: parseFloat(rate) });
    setEditing(false);
  }

  return (
    <div className={`border rounded-card p-5 flex flex-wrap items-center justify-between gap-3 ${service.is_active ? "border-ink/10" : "border-ink/10 bg-ink/5 opacity-70"}`}>
      <div>
        <div className="font-semibold text-ink">{service.icon} {service.name}</div>
        <div className="text-sm text-ink/50">{service.short_description || service.slug}</div>
      </div>
      <div className="flex items-center gap-3">
        {editing ? (
          <>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-24 text-sm border border-ink/15 rounded-lg px-2 py-1.5"
            />
            <button onClick={saveRate} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-violet text-white">Save</button>
            <button onClick={() => { setEditing(false); setRate(service.hourly_rate); }} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-ink/10 text-ink/60">Cancel</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm font-semibold text-ink hover:text-violet">
            ₹{service.hourly_rate}/hr
          </button>
        )}
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${service.is_active ? "bg-violet/15 text-magenta" : "bg-ink/10 text-ink/50"}`}>
          {service.is_active ? "Active" : "Inactive"}
        </span>
        <button
          onClick={() => onUpdate(service.id, { is_active: !service.is_active })}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-ink/10 text-ink/60"
        >
          {service.is_active ? "Deactivate" : "Activate"}
        </button>
        <button onClick={() => onDelete(service.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-clay/15 text-clay">
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cities: add form + row with live/inactive toggle + delete
// ---------------------------------------------------------------------------

function AddCityForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", state: "", is_live: false });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onAdd(form);
      setForm({ name: "", state: "", is_live: false });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add city.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white">
        + Add city
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-ink/10 rounded-card p-5 grid sm:grid-cols-2 gap-3">
      <Input label="City name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <Input label="State" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" checked={form.is_live} onChange={(e) => setForm((f) => ({ ...f, is_live: e.target.checked }))} />
        Launch as live (bookable) immediately
      </label>
      {error && <p className="sm:col-span-2 text-sm text-clay">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={saving} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save city"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold px-4 py-2 rounded-full bg-ink/10 text-ink/70">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CityRow({ city, onUpdate, onDelete }) {
  return (
    <div className="border border-ink/10 rounded-card p-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="font-semibold text-ink">{city.name}{city.state ? `, ${city.state}` : ""}</div>
        <div className="text-sm text-ink/50">{city.agent_count} partner(s) · {city.interest_count} waitlist requests</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${city.is_live ? "bg-violet/15 text-magenta" : "bg-ink/10 text-ink/50"}`}>
          {city.is_live ? "Live" : "Inactive"}
        </span>
        <button
          onClick={() => onUpdate(city.id, { is_live: !city.is_live })}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-ink/10 text-ink/60"
        >
          {city.is_live ? "Mark inactive" : "Mark live"}
        </button>
        <button onClick={() => onDelete(city.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-clay/15 text-clay">
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team: add form + row with active toggle + delete
// ---------------------------------------------------------------------------

function AddTeamMemberForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "", role: "support" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onAdd(form);
      setForm({ full_name: "", phone: "", email: "", password: "", role: "support" });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add team member.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white">
        + Add team member
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-ink/10 rounded-card p-5 grid sm:grid-cols-2 gap-3">
      <Input label="Full name" value={form.full_name} onChange={set("full_name")} required />
      <Input label="Phone number" value={form.phone} onChange={set("phone")} required />
      <Input label="Email (optional)" value={form.email} onChange={set("email")} />
      <Input label="Temporary password" type="password" value={form.password} onChange={set("password")} required />
      <label className="text-sm text-ink/70">
        Role
        <select value={form.role} onChange={set("role")} className="mt-1 w-full text-sm border border-ink/15 rounded-lg px-3 py-2 bg-white">
          <option value="support">Support (limited access)</option>
          <option value="admin">Admin (full access)</option>
        </select>
      </label>
      {error && <p className="sm:col-span-2 text-sm text-clay">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={saving} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
          {saving ? "Saving…" : "Add member"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold px-4 py-2 rounded-full bg-ink/10 text-ink/70">
          Cancel
        </button>
      </div>
    </form>
  );
}

function TeamRow({ member, isSelf, onUpdate, onDelete }) {
  return (
    <div className="border border-ink/10 rounded-card p-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="font-semibold text-ink">{member.full_name}{isSelf ? " (you)" : ""}</div>
        <div className="text-sm text-ink/50">{member.phone} · {member.email || "no email"} · <span className="capitalize">{member.role}</span></div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${member.is_active ? "bg-violet/15 text-magenta" : "bg-ink/10 text-ink/50"}`}>
          {member.is_active ? "Active" : "Inactive"}
        </span>
        {!isSelf && (
          <button
            onClick={() => onUpdate(member.id, { is_active: !member.is_active })}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-ink/10 text-ink/60"
          >
            {member.is_active ? "Deactivate" : "Activate"}
          </button>
        )}
        {!isSelf && (
          <button onClick={() => onDelete(member.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-clay/15 text-clay">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Partners: add form (used at top of the Partners tab)
// ---------------------------------------------------------------------------

function AddPartnerForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", hourly_rate: "100", status: "applied" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onAdd({ ...form, hourly_rate: parseFloat(form.hourly_rate) });
      setForm({ full_name: "", phone: "", email: "", hourly_rate: "100", status: "applied" });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add partner.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white">
        + Add partner
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-ink/10 rounded-card p-5 grid sm:grid-cols-2 gap-3">
      <Input label="Full name" value={form.full_name} onChange={set("full_name")} required />
      <Input label="Phone number" value={form.phone} onChange={set("phone")} required />
      <Input label="Email (optional)" value={form.email} onChange={set("email")} />
      <Input label="Hourly rate (₹)" type="number" value={form.hourly_rate} onChange={set("hourly_rate")} required />
      <label className="text-sm text-ink/70">
        Starting status
        <select value={form.status} onChange={set("status")} className="mt-1 w-full text-sm border border-ink/15 rounded-lg px-3 py-2 bg-white">
          <option value="applied">Applied (goes through verification)</option>
          <option value="active">Active (already vetted)</option>
        </select>
      </label>
      {error && <p className="sm:col-span-2 text-sm text-clay">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={saving} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
          {saving ? "Saving…" : "Add partner"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold px-4 py-2 rounded-full bg-ink/10 text-ink/70">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="text-sm text-ink/70 block">
      {label}
      <input {...props} className="mt-1 w-full text-sm border border-ink/15 rounded-lg px-3 py-2" />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Hospitals: add form + row (contract/contact fields + issue Console login)
// ---------------------------------------------------------------------------

const CONTRACT_STATUS_OPTIONS = ["prospect", "active", "paused", "churned"];

function AddHospitalForm({ onAdd, cities }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", city_id: "", address: "", contact_name: "", contact_phone: "",
    contact_email: "", contract_status: "prospect", monthly_contract_amount: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onAdd({
        ...form,
        city_id: form.city_id ? Number(form.city_id) : null,
        monthly_contract_amount: form.monthly_contract_amount ? parseFloat(form.monthly_contract_amount) : null,
      });
      setForm({ name: "", city_id: "", address: "", contact_name: "", contact_phone: "", contact_email: "", contract_status: "prospect", monthly_contract_amount: "" });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add hospital.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white">
        + Add hospital partner
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border border-ink/10 rounded-card p-5 grid sm:grid-cols-2 gap-3">
      <Input label="Hospital name" value={form.name} onChange={set("name")} required />
      <label className="text-sm text-ink/70">
        City
        <select value={form.city_id} onChange={set("city_id")} className="mt-1 w-full text-sm border border-ink/15 rounded-lg px-3 py-2 bg-white">
          <option value="">— none —</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <Input label="Address" value={form.address} onChange={set("address")} />
      <Input label="Contact name" value={form.contact_name} onChange={set("contact_name")} />
      <Input label="Contact phone" value={form.contact_phone} onChange={set("contact_phone")} />
      <Input label="Contact email" value={form.contact_email} onChange={set("contact_email")} />
      <label className="text-sm text-ink/70">
        Contract status
        <select value={form.contract_status} onChange={set("contract_status")} className="mt-1 w-full text-sm border border-ink/15 rounded-lg px-3 py-2 bg-white">
          {CONTRACT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <Input label="Monthly contract amount (₹)" type="number" value={form.monthly_contract_amount} onChange={set("monthly_contract_amount")} />
      {error && <p className="sm:col-span-2 text-sm text-clay">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={saving} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
          {saving ? "Saving…" : "Save hospital"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold px-4 py-2 rounded-full bg-ink/10 text-ink/70">
          Cancel
        </button>
      </div>
    </form>
  );
}

function HospitalRow({ hospital, onUpdate, onDelete, onAddStaff }) {
  const [showStaffForm, setShowStaffForm] = useState(false);

  return (
    <div className="border border-ink/10 rounded-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-ink">{hospital.name}</div>
          <div className="text-sm text-ink/50">
            {hospital.city_name || "No city set"} · {hospital.contact_phone || "no contact phone"}
            {hospital.monthly_contract_amount != null && ` · ₹${hospital.monthly_contract_amount.toFixed(0)}/month`}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
            hospital.contract_status === "active" ? "bg-violet/15 text-magenta" : "bg-ink/10 text-ink/50"
          }`}>
            {hospital.contract_status}
          </span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${hospital.is_active ? "bg-violet/15 text-magenta" : "bg-ink/10 text-ink/50"}`}>
            {hospital.is_active ? "Live" : "Inactive"}
          </span>
          <button
            onClick={() => onUpdate(hospital.id, { is_active: !hospital.is_active })}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-ink/10 text-ink/60"
          >
            {hospital.is_active ? "Mark inactive" : "Mark live"}
          </button>
          <button onClick={() => setShowStaffForm((v) => !v)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-flare/30 text-ink">
            {showStaffForm ? "Close" : "Issue Console login"}
          </button>
          <button onClick={() => onDelete(hospital.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-clay/15 text-clay">
            Delete
          </button>
        </div>
      </div>
      {showStaffForm && (
        <AddHospitalStaffForm hospitalId={hospital.id} onAdd={onAddStaff} onDone={() => setShowStaffForm(false)} />
      )}
    </div>
  );
}

function AddHospitalStaffForm({ hospitalId, onAdd, onDone }) {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onAdd({ ...form, hospital_id: hospitalId });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create this login.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="mt-4 border-t border-ink/10 pt-4 text-sm">
        <p className="text-ink/80 mb-2">
          Hospital Console login created — share these with the hospital's front desk:
        </p>
        <div className="bg-parchment rounded-lg px-4 py-2 inline-block">
          <div>Phone: <span className="font-semibold">{form.phone}</span></div>
          <div>Password: <span className="font-semibold">{form.password}</span></div>
        </div>
        <div className="mt-2">
          <button onClick={onDone} className="text-xs font-semibold text-violet">Close</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 border-t border-ink/10 pt-4 grid sm:grid-cols-2 gap-3">
      <Input label="Staff / desk name" value={form.full_name} onChange={set("full_name")} required />
      <Input label="Login phone number" value={form.phone} onChange={set("phone")} required />
      <Input label="Email (optional)" value={form.email} onChange={set("email")} />
      <Input label="Temporary password" type="password" value={form.password} onChange={set("password")} required />
      {error && <p className="sm:col-span-2 text-sm text-clay">{error}</p>}
      <div className="sm:col-span-2">
        <button disabled={saving} className="text-sm font-semibold px-4 py-2 rounded-full bg-violet text-white disabled:opacity-60">
          {saving ? "Creating…" : "Create Console login"}
        </button>
      </div>
    </form>
  );
}
