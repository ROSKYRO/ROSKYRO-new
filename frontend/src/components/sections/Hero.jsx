import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { BOOK_WA_LINK, PILOT_CITY } from "../../config";

export default function Hero() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data)).catch(() => {});
  }, []);

  return (
    <section id="top" className="max-w-6xl mx-auto px-5 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
      <div>
        <span className="inline-block text-xs font-semibold tracking-wide text-magenta bg-mist px-3 py-1 rounded-full mb-5">
          {PILOT_CITY}'s trusted care network
        </span>
        <h1 className="font-display text-4xl md:text-5xl leading-tight text-ink mb-5">
          When you can't be there, <span className="bg-brand-gradient bg-clip-text text-transparent">we are.</span>
        </h1>
        <p className="text-ink/70 text-lg leading-relaxed mb-8 max-w-md">
          Background-verified, trained care Partners for elder care, hospital visits and
          urgent support — caring for the people you love in {PILOT_CITY}, and updating you after every visit.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={BOOK_WA_LINK}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <img src="/brand/logo.png" alt="ROSKYRO" className="inline-block w-4 h-4 align-[-3px] mr-1" /> Book a Partner on WhatsApp
          </a>
          <a href="#services" className="px-6 py-3 rounded-full border border-ink/15 font-semibold hover:border-violet hover:text-violet transition-colors">
            See services
          </a>
        </div>
        <p className="text-sm text-ink/50 mt-6">
          💬 Just send us a <strong>Hi</strong> on WhatsApp — we'll take it from there, in your language.
        </p>
        <p className="text-sm text-ink/50 mt-2">
          ⚡ A verified Partner at your doorstep in as little as <strong>20 minutes</strong>.
        </p>
      </div>
      <div className="bg-ink text-parchment rounded-card p-8">
        <div className="text-sm text-parchment/60 mb-4">Live pricing — pay after service</div>
        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{s.icon}</span>
                <span className="font-medium">{s.name}</span>
              </div>
              <span className="font-display text-lg">₹{s.hourly_rate}/hr</span>
            </div>
          ))}
          {services.length === 0 && (
            <p className="text-parchment/60 text-sm">Connect the API to see live pricing here.</p>
          )}
        </div>
        <p className="text-xs text-parchment/40 mt-4">
          Prices exclude GST (18%). A small one-time arrival fee may apply based on distance.
        </p>
        <a
          href={BOOK_WA_LINK}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block text-center px-5 py-2.5 rounded-full bg-white text-ink font-semibold hover:bg-parchment transition-colors"
        >
          Book now
        </a>
      </div>
    </section>
  );
}
