const CHECKS = [
  { icon: "🆔", num: "01", title: "Aadhaar", desc: "Government identity confirmed before onboarding." },
  { icon: "👮", num: "02", title: "Police check", desc: "Formal background verification on record." },
  { icon: "📞", num: "03", title: "2 references", desc: "Past work called and checked directly, by us." },
  { icon: "💬", num: "04", title: "Interview", desc: "Character and temperament assessed in person." },
  { icon: "🎓", num: "05", title: "Training", desc: "Care, conduct and boundaries training completed." },
  { icon: "🪪", num: "06", title: "Photo ID", desc: "Shown at your door, every single visit." },
];

export default function TrustSection() {
  return (
    <section id="trust" className="py-20">
      <div className="max-w-6xl mx-auto px-5">
        <span className="text-xs font-semibold tracking-wide text-magenta">Why families trust us</span>
        <h2 className="font-display text-3xl text-ink mt-3 mb-3">Every Partner passes six checks before they reach your door.</h2>
        <p className="text-ink/60 mb-10 max-w-2xl">
          In a market where "verified" usually means nothing, we make trust the product. Here's
          exactly what every Partner goes through.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {CHECKS.map((c) => (
            <div key={c.title} className="bg-parchment rounded-card border border-ink/10 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-xs font-semibold text-ink/30">{c.num}</span>
              </div>
              <div className="font-semibold text-ink mb-1">{c.title}</div>
              <div className="text-sm text-ink/60">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
