export default function StorySection() {
  return (
    <section id="story" className="bg-mist py-20">
      <div className="max-w-4xl mx-auto px-5 text-center">
        <span className="text-xs font-semibold tracking-wide text-magenta">Why {"ROSKYRO"} exists</span>
        <p className="font-display text-2xl md:text-3xl text-ink leading-snug mt-4">
          "There was a moment my own family needed help back home, and I was too far away to give it.
          I could send money and make calls — but I couldn't send someone I trusted to just be there."
        </p>
        <p className="text-ink/60 mt-6 max-w-xl mx-auto">
          I could send money. I could make calls. But I could not send someone I trusted to simply
          sit with them, help with the paperwork, and keep me updated. I built ROSKYRO so that no
          one else has to feel that helplessness.
        </p>
        <p className="text-ink/50 mt-4 max-w-xl mx-auto text-sm">
          अपनों से दूर रहकर भी, अब आप उनके साथ हैं।
        </p>
        <p className="text-ink/40 mt-6 text-sm font-semibold">— Founder, ROSKYRO</p>

        <div className="grid sm:grid-cols-2 gap-6 mt-12 text-left">
          <div className="bg-parchment rounded-card border border-ink/10 p-6">
            <div className="font-semibold text-ink mb-2">The ROSKYRO promise</div>
            <p className="text-sm text-ink/60 leading-relaxed">
              Distance shouldn't mean absence. Whether you're across the city or across the world,
              your parents and loved ones deserve someone reliable beside them. We're not a
              replacement for your presence — we're the next best thing when you genuinely can't be there.
            </p>
          </div>
          <div className="bg-parchment rounded-card border border-ink/10 p-6">
            <div className="font-semibold text-ink mb-2">Accountable, always</div>
            <p className="text-sm text-ink/60 leading-relaxed">
              Every Partner is verified, trained and accountable — and your family hears from us
              after every visit, so you're never left wondering how it went.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
