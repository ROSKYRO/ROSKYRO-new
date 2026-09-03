import { BOOK_WA_LINK } from "../../config";

const IDEAL_FOR = ["Working Professionals", "Families Living in Different Cities", "Senior Citizens", "Post-Recovery Support", "Busy Caregivers", "Families During Hospitalisation", "People Living Alone"];

export default function AudienceSection() {
  return (
    <section id="families" className="max-w-6xl mx-auto px-5 py-20">
      <div className="bg-ink text-parchment rounded-card p-8 md:p-12">
        <span className="text-xs font-semibold tracking-wide text-magenta">FOR FAMILIES</span>
        <h2 className="font-display text-3xl md:text-4xl mt-3 mb-5">You Can't Always Be There. But Support Can Be.</h2>
        <p className="text-parchment/70 leading-relaxed max-w-3xl mb-8">Whether you live in another city, have a demanding job, are travelling, or simply need additional support for your family member, ROSKYRO helps make trusted assistance more accessible.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {IDEAL_FOR.map((item) => <div key={item} className="text-sm bg-white/5 rounded-lg px-4 py-3">✓ {item}</div>)}
        </div>
        <a href={BOOK_WA_LINK} target="_blank" rel="noreferrer" className="inline-block px-6 py-3 rounded-full bg-white text-ink font-semibold">Find Support for Your Family</a>
      </div>
    </section>
  );
}
