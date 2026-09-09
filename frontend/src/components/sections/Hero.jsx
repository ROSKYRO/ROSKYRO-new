import { BOOK_WA_LINK, BRAND } from "../../config";

const MEMBERSHIP_HIGHLIGHTS = [
  "Appointment & specialist coordination",
  "Hospital & diagnostic coordination",
  "Follow-up reminders, family updates",
];

export default function Hero() {
  return (
    <section id="top" className="max-w-6xl mx-auto px-5 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
      <div>
        <span className="inline-block text-xs font-semibold tracking-wide text-magenta bg-mist px-3 py-1 rounded-full mb-5">
          Trusted Care & Assistance, When You Need It Most.
        </span>
        <h1 className="font-display text-4xl md:text-5xl leading-tight text-ink mb-5">
          Healthcare, <span className="bg-brand-gradient bg-clip-text text-transparent">Without the Hassle.</span>
        </h1>
        <p className="text-ink/70 text-lg leading-relaxed mb-8 max-w-md">
          Your personal concierge for appointments, hospitals, diagnostics, specialists and
          everyday healthcare assistance — one trusted layer coordinating the entire journey.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="#membership"
            className="px-6 py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Become a Member
          </a>
          <a
            href={BOOK_WA_LINK}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full border border-ink/15 font-semibold hover:border-violet hover:text-violet transition-colors"
          >
            Hire an Assist
          </a>
        </div>
        <p className="text-sm text-ink/50 mt-6">
          💬 Just send us a <strong>Hi</strong> on WhatsApp — we'll take it from there, in your language.
        </p>
        <p className="text-sm text-ink/50 mt-2">
          ⚡ A verified Partner at your doorstep in as little as <strong>20 minutes</strong>.
        </p>
      </div>

      <div className="p-[1.5px] rounded-card bg-brand-gradient">
        <div className="bg-ink text-parchment rounded-[13px] p-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">👑</span>
            <span className="text-[10px] font-semibold tracking-wide bg-brand-gradient text-white px-2 py-0.5 rounded-full">
              MEMBERSHIP
            </span>
          </div>

          <div className="font-display text-2xl mb-2">{BRAND} Concierge</div>
          <p className="text-sm text-parchment/60 mb-6 max-w-sm">
            A dedicated concierge who coordinates your entire healthcare journey — appointments,
            hospitals, diagnostics and specialists, in one place.
          </p>

          <div className="space-y-3 mb-6">
            {MEMBERSHIP_HIGHLIGHTS.map((item) => (
              <div key={item} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                <span className="text-magenta">✓</span>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-parchment/40 mb-5">
            Plans start at ₹1,999/month — Care, Family and NRI Care plans available.
          </p>

          <a
            href="#membership"
            className="block text-center px-5 py-2.5 rounded-full bg-white text-ink font-semibold hover:bg-parchment transition-colors"
          >
            See Membership Plans
          </a>
        </div>
      </div>
    </section>
  );
}
