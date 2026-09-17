import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Clock, ShieldCheck, AlertTriangle, Building2 } from "lucide-react";
import api from "../api/client";

const STATUS_COPY = {
  active: {
    title: "Confirm Discharge",
    body: "Once the patient has actually been discharged, confirm the date & time below. The hospital confirms their side too — the case only closes once both of you have confirmed.",
  },
  pending_discharge: {
    title: "Confirm Discharge",
    body: "The hospital hasn't confirmed their side yet, or is waiting on you. Enter the date & time the patient was actually discharged.",
  },
  discharged: {
    title: "Discharge Confirmed",
    body: "Both you and the hospital have confirmed. This case is closed and billing has stopped.",
  },
  cancelled: {
    title: "Case Cancelled",
    body: "This patient case was cancelled — there's nothing to discharge.",
  },
};

function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OfficerDischarge() {
  const { token } = useParams();
  const [patientCase, setPatientCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [datetime, setDatetime] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const { data } = await api.get(`/officer/discharge/${token}`);
      setPatientCase(data);
      if (!datetime) {
        setDatetime(toLocalInputValue(data.officer_discharge_at) || toLocalInputValue(new Date().toISOString()));
      }
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "This link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]); // eslint-disable-line

  async function confirm(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post(`/officer/discharge/${token}`, {
        discharge_datetime: datetime ? new Date(datetime).toISOString() : null,
      });
      setMessage(data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not confirm discharge. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink/60 text-sm font-medium">Loading…</p>
      </div>
    );
  }

  if (error && !patientCase) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-clay mx-auto" />
        <p className="text-ink font-semibold">{error}</p>
        <p className="text-ink/50 text-xs">Please check the link or contact ROSKYRO dispatch.</p>
      </div>
    );
  }

  const stage = STATUS_COPY[patientCase.status] || {};
  const canConfirm = ["active", "pending_discharge"].includes(patientCase.status);

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-5">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-violet bg-violet/10 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          Relationship Officer — Discharge Confirmation
        </div>
        <h1 className="font-display text-xl font-bold text-ink">{patientCase.patient_name}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-ink/10 p-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-ink/60 text-xs">
          <Building2 className="w-3.5 h-3.5" />
          <span>{patientCase.hospital_name || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-ink/60 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>Admitted {patientCase.admission_date}</span>
        </div>
        <div className="text-xs text-ink/50">
          Hospital's confirmation: {patientCase.hospital_discharge_at
            ? new Date(patientCase.hospital_discharge_at).toLocaleString()
            : "waiting…"}
        </div>
        <div className="text-xs text-ink/50">
          Your confirmation: {patientCase.officer_discharge_at
            ? new Date(patientCase.officer_discharge_at).toLocaleString()
            : "not yet confirmed"}
        </div>
      </div>

      <div className="bg-slate-50 border border-ink/10 rounded-2xl p-5 text-center space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">{stage.title}</h2>
        <p className="text-xs text-ink/60 leading-relaxed">{stage.body}</p>

        {canConfirm && (
          <form onSubmit={confirm} className="space-y-3 text-left">
            <label className="block">
              <span className="text-xs font-semibold text-ink/60">Discharge date & time</span>
              <input
                type="datetime-local"
                required
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full mt-1 text-sm border border-ink/15 rounded-lg px-3 py-2 bg-white"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-5 py-3.5 rounded-full bg-brand-gradient text-white text-sm font-bold shadow-md shadow-violet/20 hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Confirming…" : "Confirm Discharge"}
            </button>
          </form>
        )}

        {patientCase.status === "discharged" && (
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
        )}
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium text-center">
          {message}
        </div>
      )}
      {error && patientCase && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
          {error}
        </div>
      )}
    </div>
  );
}
