import { BOOK_WA_LINK } from "../../config";

const STEPS = [
  { title: "Say hi on WhatsApp", desc: "Message us and pick your language — English, Hindi or Bhojpuri." },
  { title: "Choose & tell us", desc: "Pick the service, the time, the place, and who we should contact on arrival." },
  { title: "A verified Partner arrives", desc: "In uniform, with a photo ID to check at the door. We update your family throughout." },
  { title: "Pay after, via UPI", desc: "Only when the visit is done, based on actual time worked. No advance, never cash to the Partner." },
];

export default function HowItWorksSection() {
  return (
    <section id="how" className="max-w-6xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">Simple as a WhatsApp message</span>
      <h2 className="font-display text-3xl text-ink mt-3 mb-10">Booking takes about two minutes.</h2>
      <div className="grid md:grid-cols-4 gap-6">
        {STEPS.map((s, i) => (
          <div key={s.title} className="border-t-2 border-violet pt-4">
            <div className="text-sm text-magenta font-semibold mb-2">{i + 1}</div>
            <div className="font-semibold text-ink mb-1">{s.title}</div>
            <div className="text-sm text-ink/60 leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>
      <a
        href={BOOK_WA_LINK}
        target="_blank"
        rel="noreferrer"
        className="inline-block mt-10 px-6 py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity"
      >
        Try it yourself on WhatsApp
      </a>
    </section>
  );
}
