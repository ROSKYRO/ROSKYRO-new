import { Link } from "react-router-dom";
import { BOOK_WA_LINK, CALL_TEL_LINK, SUPPORT_PHONE_DISPLAY, SUPPORT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL, PILOT_CITY, PILOT_STATE } from "../config";

export default function Footer() {
  return (
    <footer className="bg-ink text-parchment/80 mt-24">
      <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src="/brand/logo.png" alt="ROSKYRO" className="w-8 h-8 object-contain" />
            <span className="font-display text-xl text-parchment">ROSKYRO</span>
          </div>
          <p className="text-sm leading-relaxed text-parchment/60">
            Trusted Care. Anywhere. Always. Background-verified, trained care for families in {PILOT_CITY}.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold text-parchment mb-3">Services</div>
          <ul className="space-y-2 text-sm text-parchment/60">
            <li><a href="/#services">Hospital Assist</a></li>
            <li><a href="/#services">Elder Companion Care</a></li>
            <li><a href="/#services">24×7 Urgent Support</a></li>
            <li><a href="/#services">More, coming soon</a></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-parchment mb-3">Company</div>
          <ul className="space-y-2 text-sm text-parchment/60">
            <li><a href="/#trust">Why trust us</a></li>
            <li><a href="/#how">How it works</a></li>
            <li><a href="/#join">Become a Partner</a></li>
            <li><a href="/#investor">Investors</a></li>
            <li><a href="/#faq">FAQ</a></li>
            <li><a href="/#terms">Terms of Service</a></li>
            <li><a href="/#privacy">Privacy Policy</a></li>
            <li><a href="/#complaint">Raise a complaint</a></li>
            <li><Link to="/login">Web login</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-parchment mb-3">Contact</div>
          <ul className="space-y-2 text-sm text-parchment/60">
            <li><a href={BOOK_WA_LINK} target="_blank" rel="noreferrer">Book: on WhatsApp</a></li>
            <li><a href={CALL_TEL_LINK}>Support: {SUPPORT_PHONE_DISPLAY}</a></li>
            <li>{SUPPORT_EMAIL}</li>
            <li>{PILOT_CITY}, {PILOT_STATE}</li>
            <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram @{INSTAGRAM_HANDLE}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-parchment/10 text-center text-xs text-parchment/40 py-5 px-5">
        © {new Date().getFullYear()} ROSKYRO · {PILOT_CITY}, {PILOT_STATE}. For medical emergencies, call an
        ambulance / 102 first. ROSKYRO provides a trusted person by your side — not medical treatment.
      </div>
    </footer>
  );
}
