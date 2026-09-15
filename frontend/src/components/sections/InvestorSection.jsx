import { waLink, WHATSAPP_SUPPORT_NUMBER, BRAND } from "../../config";

const investorWaLink = waLink(
  WHATSAPP_SUPPORT_NUMBER,
  `Hi ${BRAND}, I'd like to talk about investing / partnering with you.`
);

export default function InvestorSection() {
  return (
    <section id="investor" className="bg-ink text-parchment py-20">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <span className="text-xs font-semibold tracking-wide text-magenta inline-flex items-center gap-1"><img src="/brand/logo.png" alt="ROSKYRO" className="w-3.5 h-3.5 object-contain" /> Be part of the journey</span>
        <h2 className="font-display text-3xl mt-3 mb-4">
          We're building trusted care for the families who can't always be there.
        </h2>
        <p className="text-parchment/60 max-w-xl mx-auto mb-8">
          ROSKYRO is on a mission to bring verified, on-demand care to every tier-2 family across
          India — starting in INDIA. We've built the product, onboarded verified Partners, and
          we're proving the model city by city. If our vision resonates with you, we'd love to talk.
        </p>
        <a
          href={investorWaLink}
          target="_blank"
          rel="noreferrer"
          className="inline-block px-6 py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Start the conversation →
        </a>
        <p className="text-xs text-parchment/40 mt-4">
          Tapping opens WhatsApp with a ready message to our founding team — every message is read personally.
        </p>
      </div>
    </section>
  );
}
