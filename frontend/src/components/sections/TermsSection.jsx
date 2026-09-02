import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY, GSTIN_PLACEHOLDER, PILOT_CITY } from "../../config";

const CLAUSES = [
  { icon: <img src="/brand/logo.png" alt="ROSKYRO" className="inline-block w-4 h-4 align-[-3px]" />, title: "What we provide", body: "Partners are trained assistants who provide non-medical help — hospital assistance, elderly companionship, driver help, errands, and more. Partners are not doctors or nurses and do not give medical treatment." },
  { icon: "🚑", title: "Emergencies", body: "For any medical emergency, call 102 / 108 (ambulance) first. A Partner may assist by being present, but ROSKYRO never replaces professional medical or emergency care." },
  { icon: "⏱️", title: "Time & billing", body: "You pay for actual time worked, measured start to end. A free 15-minute cushion applies past your booked time. Minimum charge: half your booked hours — or 75% for bookings of 4 hours or more. Rates are exclusive of GST (18%), shown as a separate line on your bill. A one-time Arrival Charge (₹0–₹99) and, if applicable, a flat ₹49 Return Support Fee may apply; both are GST-exempt." },
  { icon: "🔄", title: "Cancellations", body: "During our launch pilot you can modify or cancel any booking free of charge, anytime. To change or cancel, reply on WhatsApp or call us with your Booking ID and our team will update it." },
  { icon: "🤝", title: "Your responsibilities", body: "Provide a safe, lawful setting and accurate task details, and treat your Partner with respect. We may end a service and decline future bookings in cases of abuse or unsafe conditions." },
  { icon: "🛡️", title: "Liability & disputes", body: "We take reasonable care selecting and verifying Partners. To the extent allowed by law, our liability for any booking is limited to that booking's value. Please report any incident within 24 hours so we can document and resolve it fairly." },
  { icon: "🚨", title: "Safety, property & incidents", body: "For a medical or safety emergency, always call 108/112 first. Safety concerns during a service reach our founders directly. For minor accidental damage caused by a Partner, we may at our discretion make a goodwill payment of up to ₹2,000 per incident. For loss or damage where a Partner's fault is established, our aggregate liability is limited to ₹10,000 per incident. Partners do not handle cash, cards, OTPs or valuables and do not administer medicines. Incidents must be reported within 24 hours of the service ending." },
];

export default function TermsSection() {
  return (
    <section id="terms" className="max-w-4xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">The fine print, in plain words</span>
      <h2 className="font-display text-3xl text-ink mt-3 mb-8">Terms of Service</h2>
      <p className="text-ink/60 mb-8">
        Short, clear, and fair — these keep both you and our Partners safe. By booking a ROSKYRO
        service, you agree to these terms.
      </p>
      <div className="space-y-6">
        {CLAUSES.map((c) => (
          <div key={c.title}>
            <div className="font-semibold text-ink mb-1">{c.icon} {c.title}</div>
            <p className="text-sm text-ink/60 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink/40 mt-10">
        Questions about these terms? Email {SUPPORT_EMAIL} or call {SUPPORT_PHONE_DISPLAY}.
        GSTIN: {GSTIN_PLACEHOLDER} · Pilot terms, {PILOT_CITY} — last updated {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}.
      </p>
    </section>
  );
}
