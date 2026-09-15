import { useEffect, useState } from "react";
import { 
  Crown, 
  Users, 
  HeartHandshake, 
  FileText, 
  Car, 
  Receipt, 
  MessageCircle, 
  Sparkles, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck,
  PhoneCall
} from "lucide-react";
import api from "../api/client";
import { WHATSAPP_SUPPORT_NUMBER, waLink, CALL_TEL_LINK, SUPPORT_PHONE_DISPLAY } from "../config";

const TABS = [
  { id: "Overview", label: "Overview", icon: Sparkles },
  { id: "Family", label: "Family Circle", icon: Users },
  { id: "Care History", label: "Care Requests", icon: HeartHandshake },
  { id: "Documents", label: "Vault Records", icon: FileText },
  { id: "Transport", label: "Transit Support", icon: Car },
  { id: "Billing", label: "Billing & Receipts", icon: Receipt },
];

const STATUS_LABEL = {
  pending: "Pending — Payment Verification in Progress",
  active: "Active VIP Membership",
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
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-violet/10 text-violet rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink mb-2">No Active Membership Found</h2>
        <p className="text-ink/60 text-sm mb-6">{error}</p>
        <a 
          href="/membership/join" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-bold shadow-md shadow-violet/20 hover:opacity-95"
        >
          <span>Explore ROSKYRO Concierge Plans</span>
          <Crown className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink/60 text-sm font-medium">Loading your member dashboard...</p>
      </div>
    );
  }

  const { membership, family_members, recent_care_requests, recent_documents, recent_transport_requests, latest_invoice, max_family_members } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      
      {/* VIP Membership Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-ink text-white p-6 sm:p-8 shadow-xl mb-8 border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial-violet opacity-30 pointer-events-none rounded-full blur-3xl -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-flare border border-white/15">
                <Crown className="w-3.5 h-3.5" />
                {membership.member_code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {STATUS_LABEL[membership.status] || membership.status}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {membership.plan === "care" ? "ROSKYRO Solo Care" : membership.plan === "family" ? "ROSKYRO Family Concierge" : "ROSKYRO Global NRI Care"}
            </h1>
            <p className="text-xs sm:text-sm text-parchment/70 mt-1">
              Dedicated Relationship Officer • Priority Hospital Desk • Medical Escorts
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="text-left md:text-right">
              <div className="font-display text-2xl font-bold text-white">
                ₹{membership.annual_price_snapshot.toLocaleString("en-IN")}
                <span className="text-xs font-normal text-white/60"> / year</span>
              </div>
              {membership.next_billing_date && (
                <div className="text-[11px] text-white/50">
                  Renews {new Date(membership.next_billing_date).toLocaleDateString("en-IN")}
                </div>
              )}
            </div>

            <a
              href={waLink(WHATSAPP_SUPPORT_NUMBER, `Hi ROSKYRO Concierge, I am member ${membership.member_code}. I need assistance.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Direct Concierge Desk</span>
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-ink/10">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-violet text-white shadow-xs"
                  : "bg-slate-100 text-ink/70 hover:text-ink hover:bg-slate-200/70"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage("")} className="text-xs text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Contents */}
      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard 
              icon={Users} 
              label="Family Circle Members" 
              value={`${family_members.length} / ${max_family_members}`} 
              subtext="Enrolled for concierge cover"
            />
            <SummaryCard 
              icon={HeartHandshake} 
              label="Active Care Requests" 
              value={recent_care_requests.filter((r) => r.status === "open" || r.status === "in_progress").length} 
              subtext="Handled by your officer"
            />
            <SummaryCard 
              icon={FileText} 
              label="Vault Records" 
              value={recent_documents.length} 
              subtext="Secure WhatsApp tracking"
            />
            <SummaryCard 
              icon={Car} 
              label="Transport Bookings" 
              value={recent_transport_requests.length} 
              subtext="Coordinated hospital trips"
            />
          </div>

          <div className="bg-slate-50 border border-ink/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet/10 text-violet flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-ink">Need immediate admission or doctor coordination?</div>
                <div className="text-xs text-ink/60">Your concierge hotline is available 24 hours a day.</div>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={CALL_TEL_LINK}
                className="px-4 py-2 rounded-full border border-ink/15 text-xs font-bold text-ink hover:bg-white flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-violet" />
                <span>Call Helpline</span>
              </a>
              <a
                href={waLink(WHATSAPP_SUPPORT_NUMBER, `Hi ROSKYRO, I need urgent hospital assistance for member ${membership.member_code}`)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {tab === "Family" && (
        <FamilyTab
          members={family_members}
          maxMembers={max_family_members}
          onChange={() => { load(); setMessage("Family circle updated."); }}
        />
      )}

      {tab === "Care History" && (
        <CareRequestsTab
          requests={recent_care_requests}
          familyMembers={family_members}
          onChange={() => { load(); setMessage("Care request dispatched to your Relationship Officer."); }}
        />
      )}

      {tab === "Documents" && (
        <DocumentsTab
          documents={recent_documents}
          familyMembers={family_members}
          onChange={() => { load(); setMessage("Document tracking record created."); }}
        />
      )}

      {tab === "Transport" && (
        <TransportTab
          requests={recent_transport_requests}
          familyMembers={family_members}
          onChange={() => { load(); setMessage("Transport request submitted to dispatch."); }}
        />
      )}

      {tab === "Billing" && <BillingTab membershipId={membership.id} />}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, subtext }) {
  return (
    <div className="bg-white rounded-3xl border border-ink/10 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-ink/60">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-slate-100 text-violet flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="font-display text-2xl font-bold text-ink mb-1">{value}</div>
      {subtext && <div className="text-[11px] text-ink/40">{subtext}</div>}
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
    if (!confirm("Remove this family member from concierge coverage?")) return;
    await api.delete(`/membership/family/${id}`);
    onChange();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between bg-white border border-ink/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-violet flex items-center justify-center font-bold text-sm">
                {m.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm text-ink">
                  {m.full_name} {m.relation && <span className="text-ink/50 font-normal text-xs">— {m.relation}</span>}
                </div>
                <div className="text-xs text-ink/50 flex gap-2">
                  {m.age && <span>Age: {m.age}</span>}
                  {m.phone && <span>• Phone: {m.phone}</span>}
                </div>
              </div>
            </div>
            <button onClick={() => remove(m.id)} className="text-xs text-clay hover:underline flex items-center gap-1 font-semibold p-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        ))}
        {members.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-ink/10 text-xs text-ink/50">
            No family members registered yet. Add your parents or spouse below so they can receive direct care visits.
          </div>
        )}
      </div>

      {members.length < maxMembers ? (
        <form onSubmit={add} className="bg-white rounded-3xl border border-ink/10 p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-ink/50 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-violet" />
            Add Family Member ({members.length} / {maxMembers} filled)
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input 
              placeholder="Full name" 
              required 
              value={form.full_name} 
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-violet outline-none" 
            />
            <input 
              placeholder="Relation (e.g. Mother, Father, Spouse)" 
              value={form.relation} 
              onChange={(e) => setForm({ ...form, relation: e.target.value })}
              className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-violet outline-none" 
            />
            <input 
              placeholder="Age" 
              type="number" 
              value={form.age} 
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-violet outline-none" 
            />
            <input 
              placeholder="Phone (optional)" 
              value={form.phone} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-violet outline-none" 
            />
          </div>

          {error && <p className="text-xs text-clay">{error}</p>}

          <button 
            type="submit"
            className="w-full py-2.5 rounded-full bg-brand-gradient text-white text-xs font-bold hover:opacity-95 transition-opacity"
          >
            Add to Family Circle
          </button>
        </form>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-center">
          Your current plan allows up to <strong>{maxMembers} family member(s)</strong>. Need more? Chat with your Relationship Officer on WhatsApp to upgrade.
        </div>
      )}

      <p className="text-[11px] text-ink/40 leading-relaxed">
        🔒 <strong>Privacy Assurance:</strong> Please do not enter confidential health records or diagnoses here. Share medical reports securely over WhatsApp directly with your assigned Relationship Officer.
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
    <div className="space-y-6">
      <form onSubmit={create} className="bg-white rounded-3xl border border-ink/10 p-6 shadow-xs space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-ink/50 flex items-center gap-1.5 mb-2">
          <HeartHandshake className="w-3.5 h-3.5 text-violet" />
          Submit Care or Appointment Request
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <select 
            value={form.family_member_id} 
            onChange={(e) => setForm({ ...form, family_member_id: e.target.value })}
            className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs bg-white outline-none focus:ring-2 focus:ring-violet"
          >
            <option value="">Patient: Myself</option>
            {familyMembers.map((m) => <option key={m.id} value={m.id}>Patient: {m.full_name}</option>)}
          </select>
          <select 
            value={form.category} 
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs bg-white outline-none focus:ring-2 focus:ring-violet capitalize"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
          </select>
        </div>

        <input 
          placeholder="What do you need help with? (e.g. Schedule cardiologist appointment at Paras Hospital)" 
          required 
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet" 
        />

        <textarea 
          rows={2}
          placeholder="Brief notes (e.g. Preferred timing: morning, needs wheelchair on entry)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet" 
        />

        <button 
          type="submit"
          className="w-full py-2.5 rounded-full bg-brand-gradient text-white text-xs font-bold hover:opacity-95 transition-opacity"
        >
          Send to Concierge Team
        </button>
      </form>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="bg-white border border-ink/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-sm text-ink">{r.title}</div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet/10 text-violet capitalize">
                {r.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-[11px] text-ink/50 mt-1 flex items-center gap-2">
              <span className="capitalize">{r.category.replace("_", " ")}</span>
              <span>•</span>
              <span>{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
            </div>
            {r.description && <p className="text-xs text-ink/70 mt-2 bg-slate-50 p-2.5 rounded-xl">{r.description}</p>}
            {r.concierge_notes && (
              <p className="text-xs text-emerald-900 mt-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                <strong>Concierge Update:</strong> {r.concierge_notes}
              </p>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-ink/10 text-xs text-ink/50">
            No care requests submitted yet.
          </div>
        )}
      </div>
    </div>
  );
}

const DOC_STATUS_LABEL = {
  pending: "Waiting for dispatch via WhatsApp",
  shared_with_concierge: "Received & Reviewed by Officer",
  resolved: "Filed in Health Log",
};

function DocumentsTab({ documents, familyMembers, onChange }) {
  const [form, setForm] = useState({ family_member_id: "", title: "", doc_type: "prescription" });

  async function add(e) {
    e.preventDefault();
    const payload = {
      ...form,
      family_member_id: form.family_member_id ? Number(form.family_member_id) : null,
    };
    await api.post("/membership/documents", payload);
    const waText = `Hi ROSKYRO, sharing a health record for my Care vault: "${form.title}" (${form.doc_type.replace("_", " ")}).`;
    setForm({ family_member_id: "", title: "", doc_type: "prescription" });
    onChange();
    window.open(waLink(WHATSAPP_SUPPORT_NUMBER, waText), "_blank", "noreferrer");
  }

  async function remove(id) {
    if (!confirm("Delete this document tracking entry?")) return;
    await api.delete(`/membership/documents/${id}`);
    onChange();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between bg-white border border-ink/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-violet flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-ink">
                  {d.title} <span className="text-xs text-ink/40 capitalize">— {d.doc_type.replace("_", " ")}</span>
                </div>
                <div className="text-xs text-ink/50">{DOC_STATUS_LABEL[d.status] || d.status}</div>
              </div>
            </div>
            <button onClick={() => remove(d.id)} className="text-xs text-clay hover:underline flex items-center gap-1 font-semibold p-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-ink/10 text-xs text-ink/50">
            No medical documents tracked yet. Add prescriptions or test reports below to coordinate reviews with your concierge.
          </div>
        )}
      </div>

      <form onSubmit={add} className="bg-white rounded-3xl border border-ink/10 p-6 shadow-xs space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-ink/50 flex items-center gap-1.5 mb-2">
          <FileText className="w-3.5 h-3.5 text-violet" />
          Log Document &amp; Send to Concierge via WhatsApp
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input 
            placeholder="Document label (e.g. Dr. Verma Cardiologist Prescription)" 
            required 
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet" 
          />
          <select 
            value={form.doc_type} 
            onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
            className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs bg-white outline-none focus:ring-2 focus:ring-violet capitalize"
          >
            {["prescription", "report", "discharge_summary", "insurance", "other"].map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <select 
          value={form.family_member_id} 
          onChange={(e) => setForm({ ...form, family_member_id: e.target.value })}
          className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs bg-white outline-none focus:ring-2 focus:ring-violet"
        >
          <option value="">Patient: Myself</option>
          {familyMembers.map((m) => <option key={m.id} value={m.id}>Patient: {m.full_name}</option>)}
        </select>

        <button 
          type="submit"
          className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Save Log &amp; Open WhatsApp to Send Document</span>
        </button>
      </form>
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
    <div className="space-y-6">
      <form onSubmit={create} className="bg-white rounded-3xl border border-ink/10 p-6 shadow-xs space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-ink/50 flex items-center gap-1.5 mb-2">
          <Car className="w-3.5 h-3.5 text-violet" />
          Schedule Medical Transport / Hospital Cab
        </div>

        <select 
          value={form.family_member_id} 
          onChange={(e) => setForm({ ...form, family_member_id: e.target.value })}
          className="w-full rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs bg-white outline-none focus:ring-2 focus:ring-violet"
        >
          <option value="">Passenger: Myself</option>
          {familyMembers.map((m) => <option key={m.id} value={m.id}>Passenger: {m.full_name}</option>)}
        </select>

        <div className="grid sm:grid-cols-2 gap-3">
          <input 
            placeholder="Pickup address (Home / Residence)" 
            required 
            value={form.pickup_address} 
            onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
            className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet" 
          />
          <input 
            placeholder="Drop address (Hospital / Diagnostic Clinic)" 
            required 
            value={form.drop_address} 
            onChange={(e) => setForm({ ...form, drop_address: e.target.value })}
            className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet" 
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3 items-center">
          <input 
            type="datetime-local" 
            required 
            value={form.requested_time} 
            onChange={(e) => setForm({ ...form, requested_time: e.target.value })}
            className="rounded-xl border border-ink/15 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-violet" 
          />
          <label className="flex items-center gap-2 text-xs text-ink/80 cursor-pointer">
            <input 
              type="checkbox" 
              checked={form.is_same_city} 
              onChange={(e) => setForm({ ...form, is_same_city: e.target.checked })} 
              className="accent-violet w-4 h-4 rounded"
            />
            <span>Same-city trip (coordination included in plan)</span>
          </label>
        </div>

        <button 
          type="submit"
          className="w-full py-2.5 rounded-full bg-brand-gradient text-white text-xs font-bold hover:opacity-95 transition-opacity"
        >
          Dispatch Transport Request
        </button>
      </form>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="bg-white border border-ink/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-sm text-ink">{r.pickup_address} → {r.drop_address}</div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet/10 text-violet capitalize">
                {r.status}
              </span>
            </div>
            <div className="text-xs text-ink/50 mt-1">
              {new Date(r.requested_time).toLocaleString("en-IN")} • {r.is_same_city ? "Same-city travel" : "Outstation trip"}
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-ink/10 text-xs text-ink/50">
            No transit requests recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}

function BillingTab({ membershipId }) {
  const [invoices, setInvoices] = useState(null);

  useEffect(() => {
    api.get("/membership/billing").then((r) => setInvoices(r.data)).catch(() => setInvoices([]));
  }, [membershipId]);

  if (invoices === null) {
    return <div className="text-xs text-ink/50 py-4">Loading billing history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between bg-white border border-ink/10 rounded-2xl p-4 shadow-xs">
            <div>
              <div className="font-bold text-base text-ink">₹{inv.amount.toLocaleString("en-IN")}</div>
              <div className="text-xs text-ink/50">
                Period: {new Date(inv.period_start).toLocaleDateString("en-IN")} – {new Date(inv.period_end).toLocaleDateString("en-IN")}
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              inv.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}>
              {inv.status.toUpperCase()}
            </span>
          </div>
        ))}
        {invoices.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-ink/10 text-xs text-ink/50">
            No historical invoices found.
          </div>
        )}
      </div>

      <p className="text-[11px] text-ink/40">
        All payments and renewals are verified manually via UPI or Bank Transfer. Your concierge confirms the payment receipts directly on WhatsApp.
      </p>
    </div>
  );
}
