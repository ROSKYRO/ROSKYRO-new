import { useEffect, useState } from "react";
import api from "../../api/client";
import { BOOK_WA_LINK, CALL_TEL_LINK, SUPPORT_PHONE_DISPLAY } from "../../config";

export default function ServicesSection() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data)).catch(() => {});
  }, []);

  return (
    <section id="services" className="max-w-6xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">Meet the Partners</span>
      <h2 className="font-display text-3xl text-ink mt-3 mb-3">A trusted name for every kind of help.</h2>
      <p className="text-ink/60 mb-10 max-w-2xl">
        Three services live in our INDIA pilot today, with more on the way. Pricing is simple and
        published — pay only after the service.
      </p>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {services.map((s) => (
          <div key={s.id} className="bg-parchment border border-ink/10 rounded-card p-6 flex flex-col">
            <div className="text-3xl mb-4">{s.icon}</div>
            <div className="font-display text-lg text-ink mb-1">{s.name}</div>
            <div className="text-sm text-ink/60 mb-4 flex-1">{s.short_description}</div>
            <div className="font-display text-2xl text-ink mb-4">₹{s.hourly_rate}<span className="text-sm font-body text-ink/50">/hr</span></div>
            <a
              href={BOOK_WA_LINK}
              target="_blank"
              rel="noreferrer"
              className="text-center px-4 py-2 rounded-full bg-ink text-parchment text-sm font-semibold hover:bg-violet transition-colors"
            >
              Book now
            </a>
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-ink/50 text-sm col-span-full">Connect the API to load live services here.</p>
        )}
      </div>

      <p className="text-sm text-ink/50 max-w-3xl">
        Prices are per hour, exclusive of GST (18%), shown separately on your bill. A one-time
        <strong> Partner Arrival Fee</strong> (₹0–₹99, based on travel distance) and, if the service
        ends at a different location, a flat <strong>₹49 Return Support Fee</strong> may apply —
        always shown before you confirm. No other hidden charges.
      </p>
      <p className="text-sm text-ink/50 mt-3">
        📱 One number. Two minutes. Booked. Just say <strong>hi</strong> on WhatsApp — our booking
        assistant confirms your Partner in under 2 minutes, 24×7, in English · हिन्दी · भोजपुरी.
        Prefer to talk? Call{" "}
        <a href={CALL_TEL_LINK} className="text-violet font-semibold">{SUPPORT_PHONE_DISPLAY}</a>.
      </p>
    </section>
  );
}
