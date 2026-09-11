import { useEffect, useState } from "react";
import api from "../api/client";
import { WHATSAPP_SUPPORT_NUMBER, waLink } from "../config";

const TABS = ["Overview", "Family", "Care History", "Documents", "Transport", "Billing"];

const STATUS_LABEL = {
  pending: "Pending — first payment being confirmed",
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default function MemberDashboard() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/membership/me");
      setData(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load your membership.");
    }
  }

  useEffect(() => { load(); }, []);

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-5 py-20 text-center">
        <p className="text-ink/60 mb-4">{error}</p>
        <a href="/membership/join" className="text-violet font-semibold">Become a ROSKYRO Concierge member →</a>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-4xl mx-auto px-5 py-20 text-ink/50">Loading your membership...</div>;
  }

  const { membership, family_members, recent_care_requests, recent_documents, recent_transport_requests, latest_invoice, max_family_members } = data;

  return (
    <div className="max-w-5xl mx-auto px-5 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold tracking-wide text-magenta">{membership.member_code}</span>
          <h1 className="font-display text-3xl text-ink mt-1">
            {membership.plan === "care" ? "ROSKYRO Care" : membership.plan === "family" ? "ROSKYRO Family" : "ROSKYRO NRI Care"}
          </h1>
          <p className="text-sm text-ink/50 mt-1">{STATUS_LABEL[membership.status]}</p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-ink">₹{membership.monthly_price_snapshot.toLocaleString("en-IN")}<span className="text-sm text-ink/50">/month</span></div>
          {membership.next_billing_date && (
            <div className="text-xs text-ink/50">Next billing {new Date(membership.next_billing_date).toLocaleDateString("en-IN")}</div>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-8 border-b border-ink/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={"px-4 py-2 rounded-full text-sm font-semibold transition-colors " + (tab === t ? "bg-ink text-parchment" : "text-ink/50 hover:text-ink")}
          >
            {t}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-violet mb-4">{message}</p>}

      {tab === "Overview" && (
        <div className="grid sm:grid-cols-3 gap-4">
          <SummaryCard label="Family members" value={`${family_members.length} / ${max_family_members}`} />
          <SummaryCard label="Open care requests" value={recent_care_requests.filter((r) => r.status === "open" || r.status === "in_progress").length} />
          <SummaryCard label="Documents on file" value={recent_documents.length} />
          <SummaryCard label="Transport requests" value={recent_transport_requests.length} />
          <SummaryCard label="Latest invoice" value={latest_invoice ? `₹${latest_invoice.amount.toLocaleString("en-IN")} — ${latest_invoice.status}` : "—"} />
        </div>
      )}

      {tab === "Family" && (
        <FamilyTab
          members={family_members}
          maxMembers={max_family_members}
          onChange={() => { load(); setMessage("Family list updated."); }}
        />
      )}

      {tab === "Care History" && (
        <CareRequestsTab
          requests={recent_care_requests}
          familyMembers={family_members}
          onChange={() => { load(); setMessage("Care request saved."); }}
        />
      )}

      {tab === "Documents" && (
        <DocumentsTab
          documents={recent_documents}
          familyMembers={family_members}
          onChange={() => { load(); setMessage("Document vault updated."); }}
        />
      )}

      {tab === "Transport" && (
        <TransportTab
          requests={recent_transport_requests}
          familyMembers={family_members}
          onChange={() => { load(); setMessage("Transport request submitted."); }}
        />
      )}

      {tab === "Billing" && <BillingTab membershipId={membership.id} />}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-mist rounded-card p-5">
      <div className="text-xs text-ink/50 mb-1">{label}</div>
      <div className="font-display text-xl text-ink">{value}</div>
    </div>
  );
}

function FamilyTab({ members, maxMembers, onChange }) {
  const [form, setForm] = useState({ full_name: "", relation: "", age: "", phone: "" });
  const [error, setError] = useState("");

  async function add(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/membership/family", { ...form, age: form.age ? Number(form.age) : null });
      setForm({ full_name: "", relation: "", age: "", phone: "" });
      onChange();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not add family member.");
    }
  }

  async function remove(id) {
    await api.delete(`/membership/family/${id}`);
    onChange();
  }

  return (
    <div>
      <div className="space-y-3 mb-8">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between bg-white border border-ink/10 rounded-lg px-4 py-3">
            <div>
              <div className="font-medium text-ink">{m.full_name} {m.relation && <span className="text-ink/40 font-normal">— {m.relation}</span>}</div>
              {m.age && <div className="text-xs text-ink/50">Age {m.age}</div>}
            </div>
            <button onClick={() => remove(m.id)} className="text-xs text-clay font-semibold">Remove</button>
          </div>
        ))}
        {members.length === 0 && <p className="text-sm text-ink/50">No family members added yet.</p>}
      </div>

      {members.length < maxMembers ? (
        <form onSubmit={add} className="grid sm:grid-cols-2 gap-3 bg-mist rounded-card p-5">
          <input placeholder="Full name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="rounded-lg border border-ink/15 px-3 py-2" />
          <input placeholder="Relation (e.g. Mother)" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}
            className="rounded-lg border border-ink/15 px-3 py-2" />
          <input placeholder="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="rounded-lg border border-ink/15 px-3 py-2" />
          <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-lg border border-ink/15 px-3 py-2" />
          {error && <p className="text-sm text-clay sm:col-span-2">{error}</p>}
          <button className="sm:col-span-2 py-2.5 rounded-full bg-ink text-parchment font-semibold">Add family member</button>
        </form>
      ) : (
        <p className="text-sm text-ink/50">Your plan covers up to {maxMembers} member(s). Message us on WhatsApp to discuss upgrading.</p>
      )}
      <p className="text-xs text-ink/40 mt-3">
        Please don't add health conditions or allergies here — share any medical detail with your
        concierge directly on WhatsApp so it isn't stored on the site.
      </p>
    </div>
  );
}

const CATEGORIES = ["appointment", "hospital", "diagnostic", "specialist", "follow_up", "other"];

function CareRequestsTab({ requests, familyMembers, onChange }) {
  const [form, setForm] = useState({ family_member_id: "", category: "appointment", title: "", description: "" });

  async function create(e) {
    e.preventDefault();
    await api.post("/membership/care-requests", {
      ...form,
      family_member_id: form.family_member_id ? Number(form.family_member_id) : null,
    });
    setForm({ family_member_id: "", category: "appointment", title: "", description: "" });
    onChange();
  }

  return (
    <div>
      <form onSubmit={create} className="grid sm:grid-cols-2 gap-3 bg-mist rounded-card p-5 mb-8">
        <select value={form.family_member_id} onChange={(e) => setForm({ ...form, family_member_id: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2">
          <option value="">For myself</option>
          {familyMembers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
        </select>
        <input placeholder="What do you need? (e.g. Book cardiologist)" required value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2 sm:col-span-2" />
        <textarea placeholder="Reason for the visit only (e.g. 'follow-up visit') — please don't include diagnosis or report details here"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2 sm:col-span-2" />
        <button className="sm:col-span-2 py-2.5 rounded-full bg-brand-gradient text-white font-semibold">Send to concierge</button>
      </form>
      <p className="text-xs text-ink/40 -mt-5 mb-8">
        Sharing a diagnosis or medical report? Send it to your concierge on WhatsApp instead — this
        form is only for coordinating the appointment.
      </p>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="bg-white border border-ink/10 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-ink">{r.title}</div>
              <span className="text-xs font-semibold text-violet">{r.status.replace("_", " ")}</span>
            </div>
            <div className="text-xs text-ink/50 mt-1">{r.category.replace("_", " ")} · {new Date(r.created_at).toLocaleDateString("en-IN")}</div>
            {r.description && <p className="text-sm text-ink/60 mt-2">{r.description}</p>}
            {r.concierge_notes && <p className="text-sm text-ink/70 mt-2 bg-mist rounded p-2">Concierge: {r.concierge_notes}</p>}
          </div>
        ))}
        {requests.length === 0 && <p className="text-sm text-ink/50">No care requests yet — this doubles as your care history once resolved.</p>}
      </div>
    </div>
  );
}

const DOC_STATUS_LABEL = {
  pending: "Waiting for you to send it on WhatsApp",
  shared_with_concierge: "Received by concierge",
  resolved: "Resolved",
};

function DocumentsTab({ documents, familyMembers, onChange }) {
  const [form, setForm] = useState({ family_member_id: "", title: "", doc_type: "other" });

  async function add(e) {
    e.preventDefault();
    const payload = {
      ...form,
      family_member_id: form.family_member_id ? Number(form.family_member_id) : null,
    };
    await api.post("/membership/documents", payload);
    const waText = `Hi ROSKYRO, sharing a document for my Care vault: "${form.title}" (${form.doc_type.replace("_", " ")}).`;
    setForm({ family_member_id: "", title: "", doc_type: "other" });
    onChange();
    window.open(waLink(WHATSAPP_SUPPORT_NUMBER, waText), "_blank", "noreferrer");
  }

  async function remove(id) {
    await api.delete(`/membership/documents/${id}`);
    onChange();
  }

  return (
    <div>
      <p className="text-xs text-ink/40 mb-4">
        This document is shared directly with our concierge team over WhatsApp — the file itself
        (and any description of it) is never stored permanently in our system. This list only
        tracks what's been shared and its status.
      </p>
      <div className="space-y-3 mb-8">
        {documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between bg-white border border-ink/10 rounded-lg px-4 py-3">
            <div>
              <div className="font-medium text-ink">{d.title} <span className="text-xs text-ink/40">— {d.doc_type}</span></div>
              <div className="text-xs text-ink/50">{DOC_STATUS_LABEL[d.status] || d.status}</div>
            </div>
            <button onClick={() => remove(d.id)} className="text-xs text-clay font-semibold">Remove</button>
          </div>
        ))}
        {documents.length === 0 && <p className="text-sm text-ink/50">No documents on file yet.</p>}
      </div>

      <form onSubmit={add} className="grid sm:grid-cols-2 gap-3 bg-mist rounded-card p-5">
        <input placeholder="Document title (e.g. Blood test report)" required value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2" />
        <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2">
          {["prescription", "report", "discharge_summary", "insurance", "other"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
        </select>
        <select value={form.family_member_id} onChange={(e) => setForm({ ...form, family_member_id: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2 sm:col-span-2">
          <option value="">For myself</option>
          {familyMembers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
        <button className="sm:col-span-2 py-2.5 rounded-full bg-ink text-parchment font-semibold">Add ticket &amp; open WhatsApp</button>
      </form>
      <p className="text-xs text-ink/40 mt-3">
        Submitting opens WhatsApp so you can send the actual file straight to your concierge — we
        only keep the title and status here, never the document or its contents.
      </p>
    </div>
  );
}

function TransportTab({ requests, familyMembers, onChange }) {
  const [form, setForm] = useState({ family_member_id: "", pickup_address: "", drop_address: "", requested_time: "", is_same_city: true, notes: "" });

  async function create(e) {
    e.preventDefault();
    await api.post("/membership/transport-requests", {
      ...form,
      family_member_id: form.family_member_id ? Number(form.family_member_id) : null,
    });
    setForm({ family_member_id: "", pickup_address: "", drop_address: "", requested_time: "", is_same_city: true, notes: "" });
    onChange();
  }

  return (
    <div>
      <form onSubmit={create} className="grid sm:grid-cols-2 gap-3 bg-mist rounded-card p-5 mb-8">
        <select value={form.family_member_id} onChange={(e) => setForm({ ...form, family_member_id: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2 sm:col-span-2">
          <option value="">For myself</option>
          {familyMembers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
        <input placeholder="Pickup address" required value={form.pickup_address} onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2 sm:col-span-2" />
        <input placeholder="Drop address (hospital/clinic)" required value={form.drop_address} onChange={(e) => setForm({ ...form, drop_address: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2 sm:col-span-2" />
        <input type="datetime-local" required value={form.requested_time} onChange={(e) => setForm({ ...form, requested_time: e.target.value })}
          className="rounded-lg border border-ink/15 px-3 py-2" />
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={form.is_same_city} onChange={(e) => setForm({ ...form, is_same_city: e.target.checked })} />
          Same-city trip
        </label>
        <button className="sm:col-span-2 py-2.5 rounded-full bg-brand-gradient text-white font-semibold">Request transport</button>
      </form>
      <p className="text-xs text-ink/40 -mt-4 mb-8">
        Same-city trips are coordinated at no extra charge. For outstation trips, your concierge
        still manages the whole visit — travel to the city is arranged and paid for by you.
      </p>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="bg-white border border-ink/10 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-ink text-sm">{r.pickup_address} → {r.drop_address}</div>
              <span className="text-xs font-semibold text-violet">{r.status}</span>
            </div>
            <div className="text-xs text-ink/50 mt-1">
              {new Date(r.requested_time).toLocaleString("en-IN")} · {r.is_same_city ? "Same-city (included)" : "Outstation (travel cost borne by member)"}
            </div>
          </div>
        ))}
        {requests.length === 0 && <p className="text-sm text-ink/50">No transport requests yet.</p>}
      </div>
    </div>
  );
}

function BillingTab({ membershipId }) {
  const [invoices, setInvoices] = useState(null);

  useEffect(() => {
    api.get("/membership/billing").then((r) => setInvoices(r.data)).catch(() => setInvoices([]));
  }, [membershipId]);

  if (invoices === null) return <p className="text-sm text-ink/50">Loading billing history...</p>;

  return (
    <div className="space-y-3">
      {invoices.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between bg-white border border-ink/10 rounded-lg px-4 py-3">
          <div>
            <div className="font-medium text-ink">₹{inv.amount.toLocaleString("en-IN")}</div>
            <div className="text-xs text-ink/50">
              {new Date(inv.period_start).toLocaleDateString("en-IN")} – {new Date(inv.period_end).toLocaleDateString("en-IN")}
            </div>
          </div>
          <span className={"text-xs font-semibold " + (inv.status === "paid" ? "text-violet" : "text-clay")}>{inv.status}</span>
        </div>
      ))}
      {invoices.length === 0 && <p className="text-sm text-ink/50">No invoices yet.</p>}
      <p className="text-xs text-ink/40 mt-4">
        Payments are confirmed manually via UPI on WhatsApp — a concierge marks your invoice paid
        once confirmed, same as ROSKYRO Relationship Officer bookings.
      </p>
    </div>
  );
}
