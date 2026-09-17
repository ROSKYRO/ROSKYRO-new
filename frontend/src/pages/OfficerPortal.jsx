import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Building2, Calendar, ShieldCheck } from "lucide-react";
import api from "../api/client";

const STATUS_LABEL = {
  active: "Active",
  pending_discharge: "Awaiting discharge confirmation",
};

export default function OfficerPortal() {
  const { token } = useParams();
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get(`/officer/portal/${token}`);
      setPortal(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "This link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]); // eslint-disable-line

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink/60 text-sm font-medium">Loading…</p>
      </div>
    );
  }

  if (error && !portal) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-clay mx-auto" />
        <p className="text-ink font-semibold">{error}</p>
        <p className="text-ink/50 text-xs">Ask ROSKYRO to send you a fresh link.</p>
      </div>
    );
  }

  const todayCases = portal.cases.filter((c) => c.covering_today);
  const otherCases = portal.cases.filter((c) => !c.covering_today);

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-5">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-violet bg-violet/10 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          Relationship Officer — My Day
        </div>
        <h1 className="font-display text-xl font-bold text-ink">{portal.full_name}</h1>
        <p className="text-xs text-ink/50">
          {portal.today_patient_count} patient{portal.today_patient_count === 1 ? "" : "s"} today
        </p>
      </div>

      {todayCases.length === 0 && (
        <p className="text-center text-sm text-ink/50">No patients assigned to you today.</p>
      )}

      <div className="space-y-3">
        {todayCases.map((c, i) => (
          <PortalCaseCard key={i} c={c} />
        ))}
      </div>

      {otherCases.length > 0 && (
        <div className="pt-4 border-t border-ink/10">
          <p className="text-xs font-semibold text-ink/50 mb-3">
            Other cases you're not covering today (someone else was rostered in, or it's a no-show day)
          </p>
          <div className="space-y-3">
            {otherCases.map((c, i) => (
              <PortalCaseCard key={i} c={c} muted />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PortalCaseCard({ c, muted }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-2 text-sm ${muted ? "border-ink/10 opacity-60" : "border-ink/10"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-ink">{c.patient_name}</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet/10 text-violet">
          {STATUS_LABEL[c.status] || c.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-ink/60 text-xs">
        <Building2 className="w-3.5 h-3.5" />
        <span>{c.hospital_name || "—"}{c.ward_or_room ? ` · ${c.ward_or_room}` : ""}</span>
      </div>
      <div className="flex items-center gap-2 text-ink/60 text-xs">
        <Calendar className="w-3.5 h-3.5" />
        <span>Admitted {c.admission_date}</span>
      </div>
      {c.status === "pending_discharge" && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Hospital's confirmation: {c.hospital_discharge_at ? new Date(c.hospital_discharge_at).toLocaleString() : "waiting…"}
          {" · "}Your confirmation: {c.officer_discharge_at ? new Date(c.officer_discharge_at).toLocaleString() : "not yet confirmed"}
          {c.discharge_link_token && !c.officer_discharge_at && (
            <a
              href={`/officer/discharge/${c.discharge_link_token}`}
              className="block mt-2 font-bold text-violet hover:underline"
            >
              Confirm this patient's discharge →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
