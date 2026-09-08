import { BOOK_WA_LINK, BRAND } from "../../config";

// A premium, membership-tier hospital concierge offering — sits above the
// hourly Partner services in ServicesSection. Same visual language as the
// rest of the page (violet/magenta/flare palette, font-display headings,
// rounded-card panels) but framed as a top-tier, "business class" hospital
// experience for members who want white-glove handling of an entire visit.

const PERKS = [
  { icon: "⏱️", title: "Zero Waiting Time", desc: "Priority slots at partner hospitals — appointments, diagnostics and consultations without queueing." },
  { icon: "🛋️", title: "Private Lounge Access", desc: "A quiet, comfortable space to wait or recover, away from crowded hospital corridors." },
  { icon: "🗓️", title: "Appointment Management", desc: "We book every appointment and handle payment/billing coordination on your behalf." },
  { icon: "🚗", title: "Pick-up & Drop-off", desc: "Door-to-hospital-to-door transport arranged for every visit." },
  { icon: "💊", title: "Medicine Delivery", desc: "Prescriptions sourced and delivered straight to your home." },
  { icon: "🧑‍⚕️", title: "Bystander Support", desc: "A trained companion for attendants, so no family member has to manage the visit alone." },
  { icon: "🍽️", title: "Meals & Refreshments", desc: "Meals and beverages arranged during long hospital stays or waits." },
  { icon: "💻", title: "Online Doctor Access", desc: "Virtual consultations on demand, for follow-ups that don't need a hospital trip." },
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
          of the journey.
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

        <div className="bg-ink text-parchment rounded-card p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="font-display text-xl mb-1">Elite Membership</div>
            <p className="text-sm text-parchment/60 max-w-md">
              Annual membership covering concierge access, priority appointments, capped
              complimentary transport and family coverage options. Pricing shared on inquiry.
            </p>
          </div>
          <a
            href={BOOK_WA_LINK}
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap text-center px-6 py-3 rounded-full bg-brand-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Request Membership
          </a>
        </div>
      </div>
    </section>
  );
}
