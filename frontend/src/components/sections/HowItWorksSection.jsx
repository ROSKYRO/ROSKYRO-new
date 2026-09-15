import { 
  MessageSquareText, 
  UserCheck, 
  HeartPulse, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight 
} from "lucide-react";
import { BOOK_WA_LINK } from "../../config";
import { useBookingModal } from "../../context/BookingModalContext";

const STEPS = [
  {
    number: "01",
    icon: MessageSquareText,
    title: "Say Hi or Tap Book",
    desc: "Book in under 60 seconds via WhatsApp in English, हिन्दी, or भोजपुरी — or click Instant Book online.",
    badge: "Quick Request",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Partner Dispatched",
    desc: "A police-verified, hospital-trained concierge is assigned. You receive their name, photo ID, and security Start PIN.",
    badge: "20 Min Arrival",
  },
  {
    number: "03",
    icon: HeartPulse,
    title: "Hands-On Care & Support",
    desc: "From standing in OPD queues to handling pharmacy, wheelchair escort, and updating worried family members live.",
    badge: "Live Family Updates",
  },
  {
    number: "04",
    icon: ShieldCheck,
    title: "Secure End PIN & Pay",
    desc: "Share your End PIN only when satisfied. Pay the exact published rate via UPI. Zero advance, zero cash to the partner.",
    badge: "Pay After Visit",
  },
];

export default function HowItWorksSection() {
  const { openQuickBook } = useBookingModal();

  return (
    <section id="how" className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-violet bg-mist px-3 py-1 rounded-full mb-3 border border-violet/15">
            <Sparkles className="w-3.5 h-3.5" />
            Simple &amp; Safe Process
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
            How ROSKYRO Works in 4 Steps
          </h2>
          <p className="text-ink-muted text-base mt-2">
            Designed for busy families and aging parents: no complicated forms, complete safety verification, and transparent billing.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.number}
                className="relative bg-slate-50 rounded-3xl p-6 sm:p-7 border border-ink/8 hover:border-violet/30 hover:bg-white hover:shadow-xl hover:shadow-violet/10 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Step Number & Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-display text-3xl font-bold text-violet/30 group-hover:text-violet transition-colors">
                      {s.number}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {s.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-white border border-ink/10 flex items-center justify-center text-violet mb-4 shadow-xs group-hover:scale-110 group-hover:bg-violet group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-lg font-bold text-ink mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Row */}
        <div className="mt-12 text-center flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => openQuickBook()}
            className="px-7 py-3.5 rounded-full bg-brand-gradient text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-violet/25 hover:shadow-xl hover:opacity-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try Instant Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href={BOOK_WA_LINK}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 rounded-full border border-ink/15 bg-white text-ink font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Chat with Booking Coordinator
          </a>
        </div>

      </div>
    </section>
  );
}
