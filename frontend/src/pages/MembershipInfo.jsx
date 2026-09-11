import { Link } from "react-router-dom";
import useSEO from "../hooks/useSEO";
import { SUPPORT_EMAIL, WHATSAPP_SUPPORT_NUMBER, waLink, BRAND } from "../config";

// Full membership information page — everything a member should read before
// subscribing: what each plan includes/excludes, the free Relationship Officer-visit quota,
// billing & cancellation terms, and the privacy policy for health data.
// Linked from the homepage teaser (ConciergeMembershipSection) and required
// reading (checkbox gate) on the signup page (MembershipSignup) — this is the
// page of record, everywhere else is just a summary pointing here.

const PLANS = [
  {
    id: "care",
    name: "ROSKYRO Care",
    tag: "Individual",
    price: "₹1,999",
    who: "Anyone with regular check-ups, follow-ups, or an ongoing health condition who wants one person handling the coordination.",
    desc: "A personal healthcare concierge for one member.",
    included: [
      "Personal healthcare concierge",
      "Appointment coordination",
      "Doctor & specialist coordination",
      "Diagnostic booking",
      "Follow-up reminders",
      "Medical records coordination",
      "WhatsApp concierge support",
    ],
    freeVisits: "2 free Relationship Officer visits/month",
    popular: false,
  },
  {
    id: "family",
    name: "ROSKYRO Family",
    tag: "Up to 4 members",
    price: "₹4,999",
    who: "Families where parents/elders live in the same city as the rest of the family, and everyone's healthcare needs a single point of coordination.",
    desc: "Everything in Care, for the whole family, with a dedicated care manager.",
    included: [
      "Everything in Care, for up to 4 members",
      "Priority coordination",
      "Hospital & discharge coordination",
      "Dedicated family care manager",
      "Family WhatsApp updates",
    ],
    freeVisits: "5 free Relationship Officer visits/month (shared across your 4 members)",
    popular: true,
  },
  {
    id: "nri",
    name: "ROSKYRO NRI Care",
    tag: "Family abroad, parents in India",
    price: "₹7,999",
    who: "Families living abroad who want a trusted, always-on concierge looking after parents back home.",
    desc: "Everything in Family, built for long-distance peace of mind.",
    included: [
      "Everything in Family",
      "Priority Relationship Officer booking",
      "Medical document coordination",
      "Live family updates dashboard",
    ],
    freeVisits: "8 free Relationship Officer visits/month (shared across your members)",
    popular: false,
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
  "ROSKYRO Relationship Officer visits beyond your monthly free quota (at published hourly rate)",
];

const GOOD_TO_KNOW = [
  {
    icon: "💳",
    title: "Billing",
    body: "Your monthly price is locked in at the price you sign up for — it won't increase even if plan prices change later. Payment is confirmed via UPI on WhatsApp; no card details are collected on this site.",
  },
  {
    icon: "🔄",
    title: "Cancellation",
    body: "You can cancel your membership anytime by messaging your concierge on WhatsApp. Your membership stays active till the end of the billing period already paid for; the current period is non-refundable once billing is confirmed.",
  },
  {
    icon: "🚗",
    title: "Transport",
    body: "Same-city coordination is included in every plan. If a member is outside the city, your concierge still manages the full visit — but travel to the city is arranged and paid for by the member, not ROSKYRO.",
  },
  {
    icon: "👨‍⚕️",
    title: "Not medical treatment",
    body: "ROSKYRO Concierge coordinates your healthcare journey. It does not replace a doctor, nurse, or emergency service. For any medical emergency, always call 108/112 first.",
  },
];

const PRIVACY_POINTS = [
  <>Health details you share (conditions, prescriptions, reports) are used <b>only to complete the specific coordination task</b> — like booking an appointment or arranging a diagnostic test.</>,
  <>Any document you share is <b>forwarded directly to your concierge</b> to act on — it is not kept as a permanent medical record in our systems.</>,
  <>We do keep basic contact details (name, phone, address) needed to deliver the service, and a simple status log of requests (e.g. "appointment booked", "resolved") for your own reference/history.</>,
  <>We never sell or share your information with third parties for marketing.</>,
  <>You can ask your concierge to delete any specific note or document reference at any time.</>,
];

const STEPS = [
  "Pick the plan that fits your family — Care, Family, or NRI Care.",
  "Create your ROSKYRO account (name, phone number) or log in if you already have one.",
  "Confirm your membership — your first invoice is created as pending.",
  "A concierge confirms your payment via UPI on WhatsApp, same as any ROSKYRO booking.",
  "Your concierge reaches out to set up your family profile and starts coordinating from day one.",
];

export default function MembershipInfo() {
  useSEO({
    path: "/membership/info",
    title: `${BRAND} Concierge — Membership Information`,
    description:
      "What each ROSKYRO Concierge plan includes, what's billed separately, free Relationship Officer-visit quotas, billing & cancellation terms, and how we handle your health data.",
  });

  return (
    <div>
      {/* Hero */}
      <div className="bg-brand-gradient text-white text-center py-16 px-5">
        <div className="text-xs font-bold tracking-widest uppercase opacity-85 mb-2">Before you join</div>
        <h1 className="font-display text-3xl sm:text-[34px] mb-3">{BRAND} Concierge — Membership Information</h1>
        <p className="max-w-xl mx-auto text-[15.5px] opacity-95">
          Please read this page fully before subscribing. It explains exactly what each plan includes, what's
          billed separately, how billing &amp; cancellation work, and how we handle your information.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-5">

        {/* What is Concierge */}
        <section className="py-11">
          <h2 className="font-display text-[22px] text-ink mb-1.5">What is ROSKYRO Concierge?</h2>
          <p className="text-ink/60 text-[14.5px] leading-relaxed">
            ROSKYRO Concierge is a <b className="text-ink">recurring healthcare coordination membership</b> — a
            dedicated concierge who manages appointments, diagnostics, hospital visits and follow-ups for you or
            your family, end to end. It is <b className="text-ink">not medical treatment or medical advice</b>,
            and it is separate from ROSKYRO Relationship Officer (our pay-per-use attendant/companion booking service).
          </p>
        </section>

        <div className="h-px bg-border bg-mist" />

        {/* Plans */}
        <section className="py-11">
          <h2 className="font-display text-[22px] text-ink mb-1.5">Choose your plan</h2>
          <p className="text-ink/60 text-[14.5px] mb-6 max-w-xl">
            Every plan includes a dedicated concierge. The difference is how many people are covered and how much
            coordination priority you get.
          </p>

          <div className="grid sm:grid-cols-3 gap-5">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={
                  "relative rounded-2xl bg-white p-6 flex flex-col " +
                  (p.popular ? "p-[2px] bg-brand-gradient" : "border border-mist")
                }
              >
                <div className={p.popular ? "bg-white rounded-[14px] p-6 flex flex-col h-full" : "flex flex-col h-full"}>
                  {p.popular && (
                    <span className="absolute -top-2.5 left-5 bg-brand-gradient text-white text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                      Most popular
                    </span>
                  )}
                  <div className="text-[19px] font-bold text-ink">{p.name}</div>
                  <div className="text-magenta text-xs font-semibold mb-3.5">{p.tag}</div>
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-ink">{p.price}</span>
                    <span className="text-sm text-ink/50 font-medium">/month</span>
                  </div>
                  <div className="bg-mist rounded-lg px-3 py-2.5 text-[13px] text-ink my-3.5">
                    <b className="text-violet">Best for:</b> {p.who}
                  </div>
                  <p className="text-[13.5px] text-ink/60 mb-4">{p.desc}</p>
                  <ul className="space-y-1.5 mb-2 flex-1">
                    {p.included.map((item) => (
                      <li key={item} className="text-[13.5px] text-ink pl-5 relative">
                        <span className="absolute left-0 top-0.5 text-violet font-bold">✓</span>
                        {item}
                      </li>
                    ))}
                    <li className="text-[13.5px] text-ink pl-5 relative font-semibold">
                      <span className="absolute left-0 top-0.5 text-violet font-bold">✓</span>
                      {p.freeVisits}
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-mist" />

        {/* What's included / separate */}
        <section className="py-11">
          <h2 className="font-display text-[22px] text-ink mb-1.5">What's included, what's billed separately</h2>
          <p className="text-ink/60 text-[14.5px] mb-6 max-w-xl">
            This applies to all three plans — there are no hidden charges beyond what's listed here.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white border border-mist rounded-2xl p-5">
              <h4 className="text-violet text-xs font-semibold uppercase tracking-wide mb-3">✅ Your membership covers</h4>
              <ul className="space-y-1.5 text-[13.5px] text-ink list-disc pl-4">
                {COVERED.map((item) => <li key={item}>{item}</li>)}
                <li><b>Free ROSKYRO Relationship Officer visits every month (see below)</b></li>
              </ul>
            </div>
            <div className="bg-white border border-mist rounded-2xl p-5">
              <h4 className="text-ink/50 text-xs font-semibold uppercase tracking-wide mb-3">Billed separately (published rates)</h4>
              <ul className="space-y-1.5 text-[13.5px] text-ink list-disc pl-4">
                {SEPARATE.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="bg-mist rounded-2xl px-5 py-4.5 text-[13.5px] text-ink border-l-4 border-violet mt-5">
            <b className="text-violet">Free Relationship Officer visits included every month:</b>
            <br />
            ROSKYRO Care — <b>2 visits/month</b> &nbsp;·&nbsp; ROSKYRO Family — <b>5 visits/month</b> (shared
            across all covered members) &nbsp;·&nbsp; ROSKYRO NRI Care — <b>8 visits/month</b> (shared across
            all covered members)
            <br />
            Any Relationship Officer visit beyond your plan's monthly quota is billed at our published hourly rate, just like
            a regular booking. The free quota resets at the start of each billing month and does not carry
            forward.
          </div>
        </section>

        <div className="h-px bg-mist" />

        {/* Good to know */}
        <section className="py-11">
          <h2 className="font-display text-[22px] text-ink mb-6">Good to know before you sign up</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {GOOD_TO_KNOW.map((c) => (
              <div key={c.title} className="bg-white border border-mist rounded-2xl p-5">
                <span className="text-xl block mb-2">{c.icon}</span>
                <h5 className="text-[14.5px] font-semibold text-ink mb-1.5">{c.title}</h5>
                <p className="text-[13.3px] text-ink/60 m-0">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-mist" />

        {/* Privacy */}
        <section className="py-11">
          <h2 className="font-display text-[22px] text-ink mb-6">Your data &amp; privacy</h2>
          <div className="bg-white border border-mist rounded-2xl p-6">
            <h4 className="text-[15px] font-semibold text-ink mt-0 mb-3">
              We do not permanently store your medical/health information.
            </h4>
            <ul className="space-y-2 text-[13.5px] text-ink list-disc pl-4">
              {PRIVACY_POINTS.map((point, i) => <li key={i}>{point}</li>)}
            </ul>
          </div>
        </section>

        <div className="h-px bg-mist" />

        {/* How signup works */}
        <section className="py-11">
          <h2 className="font-display text-[22px] text-ink mb-6">How signing up works</h2>
          <ol className="space-y-1">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink py-1.5">
                <span className="flex-none w-[26px] h-[26px] rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="pb-11">
          <div className="bg-ink text-white rounded-2xl px-8 py-9 text-center">
            <h3 className="font-display text-xl mb-2">Ready to join?</h3>
            <p className="text-white/70 text-[13.5px] mb-5">Talk to us first on WhatsApp, or sign up directly on the site.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/membership/join"
                className="inline-block bg-brand-gradient text-white font-bold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
              >
                Sign up for ROSKYRO Concierge
              </Link>
              <a
                href={waLink(WHATSAPP_SUPPORT_NUMBER, `Hi ${BRAND}, I have a question about the Concierge membership.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-block border border-white/25 text-white font-semibold text-sm px-6 py-3 rounded-full hover:border-white/50 transition-colors"
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </section>

        <footer className="text-center text-[11.5px] text-ink/50 pb-10 pt-2">
          By subscribing to {BRAND} Concierge, you agree to the terms described on this page along with our
          general Terms of Service. Questions? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-violet">{SUPPORT_EMAIL}</a> or message us on
          WhatsApp.
        </footer>

      </div>
    </div>
  );
}
