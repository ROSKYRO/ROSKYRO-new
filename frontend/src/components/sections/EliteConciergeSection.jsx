import { BOOK_WA_LINK, BRAND } from "../../config";

// A premium, membership-tier hospital concierge offering — sits above the
// hourly Partner services in ServicesSection. Same visual language as the
// rest of the page (violet/magenta/flare palette, font-display headings,
// rounded-card panels) but framed as a top-tier, "business class" hospital
// experience for members who want white-glove handling of an entire visit.
// No prices are shown anywhere in this section by design — every tier and
// every perk routes to the same WhatsApp inquiry CTA used for bookings.

const PERKS = [
  { icon: "⏱️", title: "Zero Waiting Time", desc: "Priority slots at partner hospitals — appointments, diagnostics and consultations without queueing." },
  { icon: "🧾", title: "Insurance & Claim Assistance", desc: "We handle claim paperwork end to end with your insurer/TPA, so approvals don't stall your discharge." },
  { icon: "🛏️", title: "Admission-to-Discharge Escort", desc: "A dedicated concierge stays with your case from admission through discharge and settlement." },
  { icon: "🪑", title: "Priority Waiting Area", desc: "A calmer, faster-moving space to wait at partner hospitals, instead of a crowded general queue." },
  { icon: "🗓️", title: "Appointment Management", desc: "We book every appointment and coordinate billing on your behalf." },
  { icon: "🚗", title: "Pick-up & Drop-off", desc: "Door-to-hospital-to-door transport arranged for every visit." },
  { icon: "🧪", title: "Diagnostics at Home", desc: "Sample collection at your doorstep, with reports fast-tracked back to you." },
  { icon: "💊", title: "Medicine Delivery", desc: "Prescriptions sourced and delivered straight to your home." },
  { icon: "🧑‍⚕️", title: "Bystander Support", desc: "A trained companion for attendants, so no family member has to manage the visit alone." },
  { icon: "💻", title: "Online Doctor Access", desc: "Virtual consultations on demand, for follow-ups that don't need a hospital trip." },
  { icon: "🌐", title: "Multilingual Support", desc: "Assistance in Hindi, English and regional languages, so nothing gets lost at the hospital desk." },
  { icon: "📲", title: "Family Updates Dashboard", desc: "Live status shared with family over WhatsApp — built for out-of-station and NRI relatives." },
  { icon: "🩺", title: "Second Opinion Coordination", desc: "We arrange a second opinion with a partner specialist when a major decision is on the table." },
];

const TIERS = [
  {
    name: "Elite Pass",
    tagline: "For an occasional hospital visit",
    desc: "One-time coverage for a single admission-to-discharge episode — concierge escort, priority appointment and pickup-drop included.",
  },
  {
    name: "Elite Membership",
    tagline: "Individual or Family (up to 4, incl. parents)",
    desc: "Annual coverage for regular or elderly-care needs — full perks list, unlimited episodes, priority access across partner hospitals.",
  },
  {
    name: "NRI Care Plan",
    tagline: "For family abroad, parents in India",
    desc: "Everything in Elite Membership plus the Family Updates Dashboard, so you stay informed from anywhere in the world.",
  },
];

export default function EliteConciergeSection() {
  return (
    <section id="elite" className="bg-mist py-20">
      <div className="max-w-6xl mx-auto px-5">
        <span className="text-xs font-semibold tracking-wide text-magenta">Membership tier</span>
        <h2 className="font-display text-3xl text-ink mt-3 mb-3">
          {BRAND} Elite — business class care, at hospital level.
        </h2>
        <p className="text-ink/60 mb-10 max-w-2xl">
          For members who want an entire hospital visit handled end to end — not just an hour of
          help. One membership, priority access, and a dedicated concierge managing every detail
          of the journey, including the insurance paperwork.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {PERKS.map((p) => (
            <div key={p.title} className="bg-white border border-ink/10 rounded-card p-6">
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="font-display text-base text-ink mb-1">{p.title}</div>
              <div className="text-sm text-ink/60 leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {TIERS.map((t) => (
            <div key={t.name} className="bg-ink text-parchment rounded-card p-6 flex flex-col">
              <div className="font-display text-lg mb-1">{t.name}</div>
              <div className="text-xs text-magenta font-semibold mb-3">{t.tagline}</div>
              <p className="text-sm text-parchment/60 leading-relaxed mb-6 flex-1">{t.desc}</p>
              <a
                href={BOOK_WA_LINK}
                target="_blank"
                rel="noreferrer"
                className="text-center px-4 py-2 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Inquire on WhatsApp
              </a>
            </div>
          ))}
        </div>

        <p className="text-sm text-ink/50 max-w-3xl">
          Meals and beverages during hospital stays are included as a standard courtesy across all
          Elite tiers. Membership pricing is shared on inquiry — message us on WhatsApp and a
          concierge will confirm the right plan for your city and family size.
        </p>
      </div>
    </section>
  );
}
