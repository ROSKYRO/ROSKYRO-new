import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function PriorityAccess() {
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [partnerType, setPartnerType] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function search(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.get("/priority-access/partners", {
        params: {
          city: city || undefined,
          specialty: specialty || undefined,
          partner_type: partnerType || undefined,
        },
      });
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-16">
      <span className="text-xs font-semibold tracking-wide text-magenta">Priority Access Network</span>
      <h1 className="font-display text-3xl text-ink mt-2 mb-3">Find a Priority Access partner.</h1>
      <p className="text-ink/60 mb-4 max-w-2xl">
        Verified doctors and hospitals offering priority appointments through ROSKYRO. Search by
        city and specialty — request a priority appointment and your concierge confirms the rest.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-violet/10 rounded-card px-5 py-3 mb-8">
        <p className="text-sm text-violet font-semibold">
          🔒 Booking a Priority Appointment is a ROSKYRO Concierge membership benefit — anyone can
          search the directory below, but confirming an appointment requires an active membership.
        </p>
        <Link to="/membership/join" className="text-sm font-semibold text-violet underline whitespace-nowrap">
          Get Membership →
        </Link>
      </div>

      <form onSubmit={search} className="grid sm:grid-cols-4 gap-3 mb-10 bg-mist rounded-card p-5">
        <input placeholder="City (e.g. Jabalpur)" value={city} onChange={(e) => setCity(e.target.value)}
          className="rounded-lg border border-ink/15 px-3 py-2" />
        <input placeholder="Specialty / department" value={specialty} onChange={(e) => setSpecialty(e.target.value)}
          className="rounded-lg border border-ink/15 px-3 py-2" />
        <select value={partnerType} onChange={(e) => setPartnerType(e.target.value)}
          className="rounded-lg border border-ink/15 px-3 py-2">
          <option value="">Doctor or Hospital</option>
          <option value="doctor">Doctor</option>
          <option value="hospital">Hospital</option>
        </select>
        <button className="rounded-full bg-brand-gradient text-white font-semibold py-2">
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {results !== null && (
        <div className="space-y-4 mb-12">
          {results.map((p) => (
            <Link key={p.id} to={`/priority-access/${p.id}`} className="block border border-ink/10 rounded-card p-5 hover:border-violet/40 transition-colors">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <div className="font-display text-lg text-ink flex items-center gap-2">
                    {p.name}
                    <span className="text-[10px] font-semibold tracking-wide bg-brand-gradient text-white px-2 py-0.5 rounded-full">
                      ✓ PRIORITY ACCESS
                    </span>
                  </div>
                  <div className="text-sm text-ink/60 mt-1">
                    {p.city}{p.area ? `, ${p.area}` : ""} · {p.specialty || p.departments || (p.partner_type === "hospital" ? "Multi-specialty" : "")}
                  </div>
                  {p.affiliation && <div className="text-xs text-ink/50 mt-1">{p.affiliation}</div>}
                </div>
                <div className="text-right">
                  {p.consultation_fee != null && <div className="text-sm text-ink">Consultation ₹{p.consultation_fee}</div>}
                  {p.priority_fee != null && <div className="text-xs text-ink/50">Priority fee ₹{p.priority_fee}</div>}
                  <div className="text-xs mt-1 font-semibold text-violet">
                    {p.priority_access_status === "available" ? "Priority: Available" : p.priority_access_status === "by_request" ? "Priority: By request" : "Priority: Not available"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {results.length === 0 && <p className="text-ink/50">No partners found. Try a different city or specialty.</p>}
        </div>
      )}

      <div className="bg-mist rounded-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-display text-lg text-ink">Are you a doctor or hospital?</div>
          <p className="text-sm text-ink/60">Join the ROSKYRO Priority Access Network and get discovered by patients looking for you.</p>
        </div>
        <Link to="/priority-access/apply" className="px-5 py-2.5 rounded-full bg-ink text-parchment font-semibold whitespace-nowrap">
          Become a Partner
        </Link>
      </div>
    </div>
  );
}
