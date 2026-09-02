import { useState } from "react";
import api from "../../api/client";
import { PILOT_CITY, PILOT_STATE } from "../../config";

const CITY_OPTIONS = [PILOT_CITY, "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Ranchi", "Lucknow", "Delhi NCR", "Kolkata", "Other"];

export default function CityExpansionSection() {
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("idle");

  const submit = async () => {
    if (!city) return;
    setStatus("sending");
    try {
      await api.post("/cities/interest", { city_name: city });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="bg-ink text-parchment py-20">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <span className="text-xs font-semibold tracking-wide text-magenta inline-flex items-center gap-1">
          <img src="/brand/logo.png" alt="ROSKYRO" className="w-3.5 h-3.5 object-contain" /> {PILOT_CITY} is just our first Hive
        </span>
        <h2 className="font-display text-3xl mt-3 mb-4">
          We're starting in {PILOT_CITY} — your city could be next.
        </h2>
        <p className="text-parchment/60 max-w-xl mx-auto mb-8">
          ROSKYRO launches one city at a time. Once we've made trusted care reliable in {PILOT_CITY},
          {" "}{PILOT_STATE} and beyond gets our full attention. Want ROSKYRO in your city sooner? Tell
          us, and we'll know where the demand is.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-white/10 border border-parchment/20 rounded-full px-5 py-3 text-sm"
          >
            <option value="">Select your city…</option>
            {CITY_OPTIONS.map((c) => (
              <option key={c} value={c} className="text-ink">{c}</option>
            ))}
          </select>
          <button
            onClick={submit}
            disabled={!city || status === "sending"}
            className="px-6 py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            I'm interested →
          </button>
        </div>
        {status === "sent" && <p className="text-sm text-parchment/70 mt-4">Thanks — we'll factor {city} into where we launch next. <img src="/brand/logo.png" alt="ROSKYRO" className="inline-block w-4 h-4 align-[-3px]" /></p>}
        {status === "error" && <p className="text-sm text-clay mt-4">Couldn't reach the server — try again shortly.</p>}
      </div>
    </section>
  );
}
