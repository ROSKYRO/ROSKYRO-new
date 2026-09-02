const STEPS = [
  { title: "Choose a service", desc: "Hospital Assist, Elder Companion Care, or 24x7 Urgent Support — pick what you need and when." },
  { title: "Tell us the details", desc: "Address, date, time, and who the Partner should contact on arrival." },
  { title: "We match a verified Partner", desc: "A background-verified Partner near you is assigned. You get their name and photo in advance." },
  { title: "Start PIN begins billing", desc: "Your Partner arrives with photo ID. Share the Start PIN only when they're at your door — that's when the clock starts." },
  { title: "Service happens", desc: "Non-medical assistance: companionship, hospital support, errands, or urgent non-medical help." },
  { title: "End PIN closes billing", desc: "Share the End PIN when the work is done. You're billed for actual time worked, with a free cushion and a fair minimum floor." },
  { title: "Pay after, via UPI", desc: "No advance payment, ever. Pay only once the visit is complete." },
];

export default function HowItWorks() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-ink mb-3">How ROSKYRO works</h1>
      <p className="text-ink/60 mb-10">From request to payment, every step is on the record.</p>

      <div className="space-y-8">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex gap-5">
            <div className="w-9 h-9 rounded-full bg-violet text-parchment flex items-center justify-center font-display flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <div className="font-semibold text-ink mb-1">{s.title}</div>
              <div className="text-sm text-ink/60 leading-relaxed">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
