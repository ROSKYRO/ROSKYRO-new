import { BOOK_WA_LINK, CALL_TEL_LINK, SUPPORT_PHONE_DISPLAY } from "../../config";

export default function FinalCtaSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 pb-24">
      <div className="bg-brand-gradient rounded-card p-10 text-center text-white">
        <h3 className="font-display text-2xl md:text-3xl mb-3">Someone you love needs a hand?</h3>
        <p className="opacity-90 mb-8">Book a trusted Partner in about two minutes — or just call us.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={BOOK_WA_LINK} target="_blank" rel="noreferrer"
            className="px-6 py-3 rounded-full bg-white text-ink font-semibold hover:opacity-90 transition-opacity">
            <img src="/brand/logo.png" alt="ROSKYRO" className="inline-block w-4 h-4 align-[-3px] mr-1" /> Book on WhatsApp
          </a>
          <a href={CALL_TEL_LINK}
            className="px-6 py-3 rounded-full border-2 border-white font-semibold hover:bg-white/10 transition-colors">
            📞 Call {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}
