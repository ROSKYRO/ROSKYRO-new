import { JOIN_WA_LINK, PILOT_CITY } from "../../config";

const BENEFITS = [
  { icon: "💸", title: "Weekly Payout", desc: "Money in your UPI every week" },
  { icon: "🛡️", title: "Fixed Base + Hourly", desc: "Steady base pay, plus earnings on every job" },
  { icon: "🚑", title: "Accident Insurance", desc: "Covered from day one" },
  { icon: "❤️‍🩹", title: "Health Insurance", desc: "For you, after you qualify" },
  { icon: "🏥", title: "Ayushman Bharat Help", desc: "We help you enrol" },
  { icon: "🌴", title: "12 Paid Leaves / Year", desc: "Rest without losing income" },
  { icon: "⭐", title: "Monthly Performance Bonus", desc: "Earn more for great work" },
  { icon: "🎁", title: "Annual Loyalty Bonus", desc: "Rewarded for staying with us" },
  { icon: "👕", title: "Free Uniform + ID", desc: "Look and feel professional" },
  { icon: "📜", title: "Skill Certificates", desc: "Build your career record" },
  { icon: "🪔", title: "Festival Advance", desc: "Cash help when it matters" },
  { icon: "🤝", title: "Refer & Earn", desc: "Bring a friend, earn a bonus" },
  { icon: "📈", title: "Promotion Ladder", desc: "Trainee → Lead Partner, earn more" },
  { icon: "🌱", title: "Wellness Workshops", desc: "Monthly sessions on health, money & daily life" },
  { icon: "💰", title: "Financial Awareness", desc: "Learn to save, budget & grow your money" },
  { icon: "📋", title: "Govt. Scheme Help", desc: "We help you enrol in schemes you're entitled to" },
];

export default function PartnerSection() {
  return (
    <section id="join" className="max-w-6xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">Work with us</span>
      <h2 className="font-display text-3xl text-ink mt-3 mb-4">Become a Partner. Earn with dignity.</h2>

      <div className="grid md:grid-cols-2 gap-10 mb-14 items-start">
        <ul className="space-y-3 text-ink/80">
          <li>✓ Guaranteed monthly support while you build your work</li>
          <li>✓ Paid every week, in full — straight to your UPI</li>
          <li>✓ Your own uniform & ID, and the respect of a professional</li>
          <li>✓ Bonus for every happy customer</li>
          <li>✓ Grow into a trainer or team-lead as we grow</li>
        </ul>
        <div className="bg-ink text-parchment rounded-card p-8 text-center">
          <div className="text-sm text-parchment/60 mb-1">Earn up to</div>
          <div className="font-display text-3xl mb-1">₹52,000+</div>
          <div className="text-xs text-parchment/50 mb-6">monthly earning potential</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="font-semibold text-parchment mb-1">Fixed</div>
              <div className="text-parchment/50">monthly base</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="font-semibold text-parchment mb-1">₹100+/hr</div>
              <div className="text-parchment/50">for hours worked</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="font-semibold text-parchment mb-1">Weekly</div>
              <div className="text-parchment/50">UPI payout</div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="font-display text-2xl text-ink mb-6">Why join ROSKYRO as a Partner?</h3>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 mb-14">
        {BENEFITS.map((b) => (
          <div key={b.title} className="bg-parchment border border-ink/10 rounded-card p-5">
            <div className="text-xl mb-2">{b.icon}</div>
            <div className="font-semibold text-sm text-ink mb-1">{b.title}</div>
            <div className="text-xs text-ink/60">{b.desc}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="text-sm font-semibold text-ink mb-3">📍 We're currently hiring Partners in {PILOT_CITY}.</div>
          <div className="font-semibold text-ink mb-2">✅ Who can apply</div>
          <ul className="text-sm text-ink/60 space-y-1 mb-6">
            <li>Minimum qualification: 12th pass</li>
            <li>Age 18 years or above</li>
            <li>All required documents in order</li>
            <li>Two local guardians/references</li>
            <li>A genuine passion for helping & caring for people</li>
          </ul>
          <div className="font-semibold text-ink mb-2">🔍 Our selection process</div>
          <ol className="text-sm text-ink/60 space-y-1 list-decimal list-inside">
            <li>Resume screening</li>
            <li>Personal interview</li>
            <li>Background verification</li>
            <li>Police verification</li>
            <li>Professional training & onboarding</li>
          </ol>
        </div>
        <div className="bg-mist rounded-card p-6">
          <div className="text-sm font-semibold text-ink mb-2">🕒 Flexible shifts — work on your terms</div>
          <p className="text-sm text-ink/60 mb-4">
            Complete flexibility to choose your shifts — full-time or part-time based on
            availability. 6, 9 and 12-hour shift options, day or night.
          </p>
          <p className="text-sm text-ink/60 mb-6">
            At ROSKYRO, trust is our foundation. Above all, we look for loyalty, integrity and
            genuine care for the people we serve. In return, we promise to support you, guide you
            and stand by you at every step.
          </p>
          <a
            href={JOIN_WA_LINK}
            target="_blank"
            rel="noreferrer"
            className="block text-center px-6 py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <img src="/brand/logo.png" alt="ROSKYRO" className="inline-block w-4 h-4 align-[-3px] mr-1" /> Apply to become a Partner on WhatsApp
          </a>
          <p className="text-xs text-ink/40 text-center mt-3">"You take care of our customers, and we'll take care of you." ❤️</p>
        </div>
      </div>
    </section>
  );
}
