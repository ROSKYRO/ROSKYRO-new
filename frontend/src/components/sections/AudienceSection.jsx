const AUDIENCES = [
  { icon: "🌍", title: "Families living away", desc: "You're in another city or country, and your parents are here. Arrange care from anywhere, pay from anywhere, and get an update after every visit — so the distance feels a little smaller." },
  { icon: "🏠", title: "Busy families nearby", desc: "You're here, but stretched between work, children and an elderly parent. A trusted Partner takes the hospital trip or the afternoon care off your plate, without the worry of who's coming." },
];

export default function AudienceSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">Who we're for</span>
      <h2 className="font-display text-3xl text-ink mt-3 mb-10">Built for the family that can't always be present.</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {AUDIENCES.map((a) => (
          <div key={a.title} className="bg-parchment border border-ink/10 rounded-card p-8">
            <div className="text-3xl mb-4">{a.icon}</div>
            <div className="font-display text-xl text-ink mb-2">{a.title}</div>
            <p className="text-sm text-ink/60 leading-relaxed">{a.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
