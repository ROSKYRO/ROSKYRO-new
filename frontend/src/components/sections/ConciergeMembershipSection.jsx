import { Link } from "react-router-dom";
import { WHATSAPP_BOOKING_NUMBER, waLink, BRAND } from "../../config";

// ROSKYRO Concierge — the recurring-revenue membership layer that sits
// alongside the pay-per-use ROSKYRO Relationship Officer services (see ServicesSection).
// Positioning: membership = healthcare coordination, not unlimited
// transport/medical spend. Consultation, lab, imaging, medicines, hospital
// bills and Relationship Officer hours are always billed separately at published rates —
// there are no surprise charges beyond what's listed here.

function waFor(planName) {
  return waLink(
    WHATSAPP_BOOKING_NUMBER,
    `Hi ${BRAND}, I'd like to know more about the ${planName} plan.`
  );
}

const PLANS = [
  {
    id: "care",
    name: "ROSKYRO Care",
    price: "₹1,999",
    period: "/month",
    tagline: "Individual",
    desc: "A personal healthcare concierge for anyone with regular check-ups, follow-ups or ongoing treatment.",
    included: [
      "Personal healthcare concierge",
      "Appointment coordination",
      "Doctor & specialist coordination",
      "Diagnostic booking",
      "Follow-up reminders",
      "Medical records coordination",
      "WhatsApp concierge support",
    ],
    highlight: false,
  },
  {
    id: "family",
    name: "ROSKYRO Family",
    price: "₹4,999",
    period: "/month",
    tagline: "Up to 4 members",
    desc: "Everything in Care, for the whole family — with a dedicated care manager and hospital-level coordination.",
    included: [
      "Everything in Care, for 4 members",
      "Priority coordination",
      "Hospital & discharge coordination",
      "Dedicated family care manager",
      "Family WhatsApp updates",
    ],
    highlight: true,
  },
  {
    id: "nri",
    name: "ROSKYRO NRI Care",
    price: "₹7,999",
    period: "/month",
    tagline: "Family abroad, parents in India",
    desc: "For families living abroad who want a trusted, always-on concierge for parents back home.",
    included: [
      "Everything in Family",
      "Priority Relationship Officer booking",
      "Medical document coordination",
      "Live family updates dashboard",
    ],
    highlight: false,
  },
];

const COVERED = [
  "Healthcare concierge & coordination",
  "Appointment booking",
  "Hospital & discharge coordination",
  "Diagnostic coordination",
  "Follow-up reminders & family updates",
];

const SEPARATE = [
  "Doctor / specialist consultation fee",
  "Lab tests, MRI/CT & imaging",
  "Medicines & pharmacy",
  "Hospital bill",
  "Ambulance",
  "ROSKYRO Relationship Officer hours (billed at published hourly rate)",
];

export default function ConciergeMembershipSection() {
  return (
    <section id="membership" className="max-w-6xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">Recurring membership</span>
      <h2 className="font-display text-3xl text-ink mt-3 mb-3">
        {BRAND} Concierge — we coordinate your healthcare.
      </h2>
      <p className="text-ink/60 mb-10 max-w-2xl">
        From appointment to admission, from diagnostics to discharge — one concierge coordinating
        the entire journey. Need hands-on help right now instead? See{" "}
        <a href="#services" className="text-violet font-semibold">ROSKYRO Relationship Officer</a> below.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={
              p.highlight
                ? "p-[1.5px] rounded-card bg-brand-gradient"
                : "border border-ink/10 rounded-card"
            }
          >
            <div className={p.highlight ? "bg-white rounded-[13px] p-6 h-full flex flex-col" : "bg-white rounded-card p-6 h-full flex flex-col"}>
              {p.highlight && (
                <span className="self-start text-[10px] font-semibold tracking-wide bg-brand-gradient text-white px-2 py-0.5 rounded-full mb-3">
                  MOST POPULAR
                </span>
              )}
              <div className="font-display text-lg text-ink">{p.name}</div>
              <div className="text-xs text-magenta font-semibold mb-3">{p.tagline}</div>
              <div className="mb-3">
                <span className="font-display text-3xl text-ink">{p.price}</span>
                <span className="text-sm text-ink/50">{p.period}</span>
              </div>
              <p className="text-sm text-ink/60 mb-5">{p.desc}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {p.included.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-ink/70">
                    <span className="text-violet mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/membership/info"
                className="text-center px-4 py-2.5 rounded-full border border-violet/30 text-violet text-sm font-semibold hover:bg-violet/5 transition-colors mb-2"
              >
                📄 Membership Information
              </Link>
              <a
                href={waFor(p.name)}
                target="_blank"
                rel="noreferrer"
                className={
                  p.highlight
                    ? "text-center px-4 py-2.5 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    : "text-center px-4 py-2.5 rounded-full border border-ink/15 text-ink text-sm font-semibold hover:border-violet hover:text-violet transition-colors"
                }
              >
                Inquire on WhatsApp
              </a>
              <a
                href={`/membership/join?plan=${p.id}`}
                className="text-center mt-2 text-xs font-semibold text-violet hover:text-magenta transition-colors"
              >
                Sign up now →
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-mist rounded-card p-8 mb-6">
        <div className="font-display text-lg text-ink mb-4">What's included, what's separate</div>
        <div className="grid sm:grid-cols-2 gap-8">
          <div>
            <div className="text-xs font-semibold text-violet mb-3">✅ ROSKYRO covers</div>
            <ul className="space-y-2">
              {COVERED.map((item) => (
                <li key={item} className="text-sm text-ink/70">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-ink/50 mb-3">Billed separately</div>
            <ul className="space-y-2">
              {SEPARATE.map((item) => (
                <li key={item} className="text-sm text-ink/70">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="text-sm text-ink/50 max-w-3xl">
        📌 Transport: local (same-city) coordination is included in every plan. For members
        outside the city, your concierge still manages the entire visit end to end — travel to
        the city is arranged and paid for by the member. Beyond your membership price, the only
        other charges you'll ever see are published, optional ones — like a Relationship Officer hour or a
        medical bill — never a hidden or surprise fee.
      </p>
    </section>
  );
}
