import { BOOK_WA_LINK, CALL_TEL_LINK, SUPPORT_PHONE_DISPLAY, SUPPORT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL, PILOT_CITY, PILOT_STATE } from "../config";

export default function Footer() {
  return (
    <footer className="bg-ink text-parchment/80 mt-24">
      <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-3"><img src="/brand/logo.png" alt="ROSKYRO" className="w-8 h-8 object-contain" /><span className="font-display text-xl text-parchment">ROSKYRO</span></div>
          <p className="text-sm leading-relaxed text-parchment/60">Trusted Care & Assistance, When You Need It Most. ROSKYRO helps people and families access practical support and companionship during hospital visits, recovery, elderly care needs, and urgent situations.</p>
        </div>
        <div><div className="text-sm font-semibold text-parchment mb-3">Services</div><ul className="space-y-2 text-sm text-parchment/60"><li><a href="/#services">Hospital Assistance</a></li><li><a href="/#services">Elder Care & Companionship</a></li><li><a href="/#services">Home Recovery Support</a></li><li><a href="/#services">Urgent Assistance</a></li><li><a href="/#services">Travel Assistance</a></li></ul></div>
        <div><div className="text-sm font-semibold text-parchment mb-3">Company</div><ul className="space-y-2 text-sm text-parchment/60"><li><a href="/#story">About ROSKYRO</a></li><li><a href="/#how">How It Works</a></li><li><a href="/#trust">Safety & Trust</a></li><li><a href="/#join">Become a Partner</a></li><li><a href="/#faq">FAQs</a></li><li><a href="/#complaint">Complaints & Feedback</a></li></ul></div>
        <div><div className="text-sm font-semibold text-parchment mb-3">Support</div><ul className="space-y-2 text-sm text-parchment/60"><li><a href={BOOK_WA_LINK} target="_blank" rel="noreferrer">Help Centre / WhatsApp</a></li><li><a href={CALL_TEL_LINK}>Emergency Support: {SUPPORT_PHONE_DISPLAY}</a></li><li>{SUPPORT_EMAIL}</li><li>{PILOT_CITY}, {PILOT_STATE}</li><li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram @{INSTAGRAM_HANDLE}</a></li></ul></div>
      </div>
      <div className="border-t border-parchment/10 text-center text-xs text-parchment/40 py-5 px-5"><strong>Care. Support. Presence.</strong><br/>You may not always be there. But with ROSKYRO, support can be.<br/><br/>© {new Date().getFullYear()} ROSKYRO. All Rights Reserved. For medical emergencies, call an ambulance / 102 first. ROSKYRO provides practical support and companionship — not medical treatment.</div>
    </footer>
  );
}
