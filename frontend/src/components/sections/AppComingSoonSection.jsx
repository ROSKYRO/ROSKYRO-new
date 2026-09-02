export default function AppComingSoonSection() {
  return (
    <section className="bg-mist py-20">
      <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="text-xs font-semibold tracking-wide text-magenta">On the way</span>
          <h2 className="font-display text-3xl text-ink mt-3 mb-4">The ROSKYRO app is coming soon.</h2>
          <p className="text-ink/60 max-w-md mb-2">
            Everything you love about booking on WhatsApp — now in one simple app. Track your
            Partner live, rebook in a tap, manage care for the whole family.
          </p>
          <p className="text-ink/40 text-sm mb-6">जल्द ही — आपकी जेब में ROSKYRO।</p>
          <div className="flex flex-wrap gap-3">
            <div className="px-5 py-3 rounded-xl border border-ink/15 text-sm text-ink/50">Coming soon on the App Store</div>
            <div className="px-5 py-3 rounded-xl border border-ink/15 text-sm text-ink/50">Coming soon on Google Play</div>
          </div>
          <p className="text-xs text-ink/40 mt-4">Until then, booking on WhatsApp takes about two minutes — no download needed.</p>
        </div>
        <div className="flex justify-center">
          <div className="w-48 h-96 bg-ink rounded-[2rem] p-3 relative shadow-xl">
            <div className="w-full h-full bg-parchment rounded-[1.5rem] flex flex-col items-center justify-center gap-3">
              <span className="text-[10px] font-bold tracking-widest text-magenta bg-mist px-2 py-1 rounded-full">SOON</span>
              <img src="/brand/logo.png" alt="ROSKYRO" className="w-14 h-14 object-contain" />
              <div className="font-display text-lg text-ink">ROSKYRO</div>
              <div className="text-[10px] tracking-widest text-ink/40">TRUSTED CARE</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
