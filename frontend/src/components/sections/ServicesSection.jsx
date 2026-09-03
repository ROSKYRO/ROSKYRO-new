import { BOOK_WA_LINK } from "../../config";

const SERVICES = [
  { icon: "🏥", title: "Hospital Assistance", desc: "Practical support during hospital visits, admissions, appointments, diagnostic tests, and discharge processes." },
  { icon: "👴", title: "Elder Care & Companionship", desc: "Reliable companionship and everyday assistance for senior citizens when family members cannot be around." },
  { icon: "🏠", title: "Home Recovery Support", desc: "Non-medical assistance and companionship during recovery and everyday activities at home." },
  { icon: "🚨", title: "Urgent Assistance", desc: "Request support for urgent situations when you need a trusted person to be there." },
];

export default function ServicesSection() {
  return (
    <section id="services" className="max-w-6xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">WHAT DO YOU NEED HELP WITH?</span>
      <h2 className="font-display text-3xl text-ink mt-3 mb-3">One Platform. Multiple Ways to Get Support.</h2>
      <p className="text-ink/60 mb-10 max-w-2xl">Choose the kind of practical, non-medical support and companionship your family needs.</p>
      <div className="grid sm:grid-cols-2 gap-6">
        {SERVICES.map((s) => (
          <div key={s.title} className="bg-parchment border border-ink/10 rounded-card p-7 flex flex-col">
            <div className="text-3xl mb-4">{s.icon}</div>
            <h3 className="font-display text-xl text-ink mb-2">{s.title}</h3>
            <p className="text-sm text-ink/60 leading-relaxed flex-1">{s.desc}</p>
            <a href={BOOK_WA_LINK} target="_blank" rel="noreferrer" className="mt-5 text-violet font-semibold text-sm">Explore {s.title} →</a>
          </div>
        ))}
      </div>
    </section>
  );
}
