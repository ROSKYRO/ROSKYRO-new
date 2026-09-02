import { SUPPORT_EMAIL } from "../../config";

const PROMISES = [
  { icon: "📞", title: "A founder calls you — fast.", desc: "Any safety concern during a service reaches our founders directly. Emergencies get a call within 5 minutes; anything else, same day. You'll never explain your problem to a call centre." },
  { icon: "🔑", title: "You control every visit.", desc: "Your Partner's name and photo ID before arrival. Service starts only with your Start PIN and ends only with your End PIN. An SOS option is available in every active booking." },
  { icon: "🛡️", title: "Property is protected.", desc: "Minor accidental damage is made good within 48 hours. For anything serious, every Partner is identity- and police-verified, and we cooperate fully with you and the authorities." },
  { icon: "📋", title: "Everything is on the record.", desc: "Every booking has a live timeline — who came, when service started and ended, what was billed. If there's ever a dispute, the facts are already written down." },
  { icon: "🚫", title: "Clear rules for every Partner.", desc: "Partners never handle your cash, cards, OTPs or valuables, and never administer medicines — they assist. These rules are signed by every Partner before their first visit." },
];

export default function PromiseSection() {
  return (
    <section className="bg-ink text-parchment py-20">
      <div className="max-w-6xl mx-auto px-5">
        <span className="text-xs font-semibold tracking-wide text-magenta">Your safety, in writing</span>
        <h2 className="font-display text-3xl mt-3 mb-3">If something ever goes wrong, here's exactly what we do.</h2>
        <p className="text-parchment/60 mb-10 max-w-2xl">Most services hide this page. We'd rather you read ours before you book.</p>
        <div className="grid sm:grid-cols-2 gap-6">
          {PROMISES.map((p) => (
            <div key={p.title} className="bg-white/5 rounded-card p-6">
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="font-semibold mb-1">{p.title}</div>
              <div className="text-sm text-parchment/60 leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-parchment/40 mt-8">
          Full incident-response policy available on request at {SUPPORT_EMAIL} · Emergencies: always
          call 108 / 112 first — we act alongside them, never instead of them.
        </p>
      </div>
    </section>
  );
}
