import { useState } from "react";

const FAQS = [
  { q: "Are your Partners really verified?", a: "Yes — every Partner passes six checks before they reach you: Aadhaar, police verification, two reference calls, an interview, training, and a photo ID they carry at all times. No ID, no entry." },
  { q: "How do I pay?", a: "You pay only after the service, through a ROSKYRO UPI link or QR sent on WhatsApp — then share a screenshot. No advance, and never cash directly to the Partner." },
  { q: "What does it cost?", a: "Hospital Assist ₹219/hr, Elder Companion Care ₹199/hr, 24×7 Urgent Support ₹269/hr, plus 18% GST shown separately on your bill. No other hidden charges." },
  { q: "What is the Partner Arrival Fee?", a: "To reach you fast, we assign the nearest available Partner. A small one-time Arrival Fee may apply based on how far your Partner travels — ₹0 within 3 km, up to ₹99 beyond 18 km. It's a one-time charge (never hourly), shown and confirmed when your Partner is assigned." },
  { q: "What is the Return Support Fee?", a: "If your service ends at the same arrival location, there's no return fee. If you need the Partner to complete the service at a different location, a flat ₹49 Return Support Fee applies — shown before you confirm. Arrival and return charges are GST-exempt." },
  { q: "Which areas do you cover?", a: "We're starting across all of INDIA — our first Hive. Once we've made care reliable here, we'll expand city by city across Bihar and beyond. Message us to check availability in your area." },
  { q: "Do you help in a medical emergency?", a: "For any medical emergency, call an ambulance / 102 first. ROSKYRO provides a trusted person by your side — admission help, paperwork, companionship — alongside, never instead of, real medical care." },
  { q: "Can I book for a parent while I'm away?", a: "Absolutely — that's exactly who we're built for. Book from anywhere, pay from anywhere, and we'll update you after every visit." },
  { q: "What languages can I book in?", a: "English, Hindi and Bhojpuri — just message us and pick your language to begin." },
  { q: "How do I change or cancel a booking?", a: "Reply on WhatsApp with your Booking ID (or type modify, change or cancel), and tell us what to change. During our launch pilot, you can modify or cancel free of charge any time before your Partner's visit begins (before the Start PIN is entered). Once in progress, you can end early anytime by sharing the End PIN, and you only pay for time actually worked." },
  { q: "What are the Start PIN and End PIN?", a: "When you book, we send you two 4-digit PINs on WhatsApp. Share the Start PIN with your Partner only when they arrive — that's when the clock and your bill begin. Share the End PIN only when the work is fully done. Never share PINs before those moments." },
  { q: "Do I pay for the full booked time if my Partner finishes early?", a: "No — you pay for actual time worked, measured from Start PIN to End PIN. A free 15-minute cushion applies past your booked time. The only floor: a minimum of half your booked hours (75% for bookings of 4+ hours) — always shown before you confirm." },
  { q: "What is the first-hour-FREE launch offer?", a: "Our first 50 families get their first hour of service free — automatically applied to your first booking, no code needed. One per family, valid till 30 Sep 2026 or while the 50 spots last." },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink/10 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left font-semibold text-ink"
      >
        <span>{q}</span>
        <span className="text-violet text-xl leading-none ml-4">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="text-sm text-ink/60 mt-3 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function FaqSection() {
  return (
    <section id="faq" className="max-w-4xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">Questions, answered</span>
      <h2 className="font-display text-3xl text-ink mt-3 mb-8">Frequently asked questions.</h2>
      <div>
        {FAQS.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
        ))}
      </div>
    </section>
  );
}
