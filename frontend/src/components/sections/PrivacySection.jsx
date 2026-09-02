import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "../../config";

const CLAUSES = [
  { icon: "📋", title: "What we collect", body: "Your name, phone number, service address, and booking details — plus the times your Partner starts and ends, so we can bill fairly and resolve any disputes." },
  { icon: "🎯", title: "Why we collect it", body: "Only to schedule and deliver your service, send you updates over WhatsApp, take payment, and improve our care. Nothing else." },
  { icon: "🤝", title: "Who can see it", body: "Only the ROSKYRO team and the verified Partner assigned to you. We never sell or rent your data to advertisers or third parties." },
  { icon: "💬", title: "WhatsApp & payments", body: "Messages go through WhatsApp under their privacy terms. Payments are made directly via UPI — we don't store your bank or card details." },
  { icon: "🗂️", title: "How long we keep it", body: "We keep booking records for as long as needed for service, accounts, and legal requirements, then remove what we no longer need." },
  { icon: "✋", title: "Your choices", body: "You can ask us what we hold about you, correct it, or request deletion (where law allows). Just email or call us — we'll help." },
];

export default function PrivacySection() {
  return (
    <section id="privacy" className="bg-mist py-20">
      <div className="max-w-4xl mx-auto px-5">
        <span className="text-xs font-semibold tracking-wide text-magenta">Your information, handled with care</span>
        <h2 className="font-display text-3xl text-ink mt-3 mb-8">Privacy Policy</h2>
        <p className="text-ink/60 mb-8">
          We collect only what we need to deliver good care, and we never sell your data. Here's
          exactly what we keep and why.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {CLAUSES.map((c) => (
            <div key={c.title} className="bg-parchment rounded-card border border-ink/10 p-5">
              <div className="font-semibold text-ink mb-1">{c.icon} {c.title}</div>
              <p className="text-sm text-ink/60 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink/40 mt-8">
          Privacy questions? Email {SUPPORT_EMAIL} or call {SUPPORT_PHONE_DISPLAY}.
        </p>
      </div>
    </section>
  );
}
