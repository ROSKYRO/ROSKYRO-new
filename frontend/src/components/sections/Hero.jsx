import { BOOK_WA_LINK, WHATSAPP_BOOKING_NUMBER, waLink, BRAND } from "../../config";

const ELITE_WA_LINK = waLink(
  WHATSAPP_BOOKING_NUMBER,
  `Hi ${BRAND}, I'd like to inquire about the Elite membership.`
);

const ELITE_PERKS = [
  "Zero waiting time at partner hospitals",
  "Admission-to-discharge concierge escort",
  "Insurance & claim assistance",
  "Pick-up & drop-off, medicine delivery",
];

export default function Hero() {
  return (
    <section id="top" className="max-w-6xl mx-auto px-5 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
      <div>
        <span className="inline-block text-xs font-semibold tracking-wide text-magenta bg-mist px-3 py-1 rounded-full mb-5">
          Trusted Care & Assistance, When You Need It Most.
        </span>
        <h1 className="font-display text-4xl md:text-5xl leading-tight text-ink mb-5">
          Care and Assistance, <span className="bg-brand-gradient bg-clip-text text-transparent">Exactly When You Need It.</span>
        </h1>
        <p className="text-ink/70 text-lg leading-relaxed mb-8 max-w-md">
          Whether you need support at a hospital, assistance for an elderly family member, help during recovery, or a trusted companion during an urgent situation, ROSKYRO helps connect you with reliable assistance when it matters most.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={BOOK_WA_LINK}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <img src="/brand/logo.png" alt="ROSKYRO" className="inline-block w-4 h-4 align-[-3px] mr-1" /> Book Assistance
          </a>
          <a href="#services" className="px-6 py-3 rounded-full border border-ink/15 font-semibold hover:border-violet hover:text-violet transition-colors">
            Explore Services
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
              PREMIUM
            </span>
          </div>

          <div className="font-display text-2xl mb-2">{BRAND} Elite</div>
          <p className="text-sm text-parchment/60 mb-6 max-w-sm">
            Business class care at hospital level — a dedicated concierge handling your entire
            visit, from admission to discharge and claim settlement.
          </p>

          <div className="space-y-3 mb-6">
            {ELITE_PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                <span className="text-magenta">✓</span>
                <span className="text-sm font-medium">{perk}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-parchment/40 mb-5">
            Membership pricing shared on inquiry — a concierge will confirm the right plan for
            your city and family size.
          </p>

          <a
            href={ELITE_WA_LINK}
            target="_blank"
            rel="noreferrer"
            className="block text-center px-5 py-2.5 rounded-full bg-white text-ink font-semibold hover:bg-parchment transition-colors"
          >
            Inquire on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
