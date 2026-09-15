import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Stethoscope,
  Crown
} from "lucide-react";
import api from "../../api/client";
import { BOOK_WA_LINK, CALL_TEL_LINK, SUPPORT_PHONE_DISPLAY, PILOT_CITY, waLink, WHATSAPP_BOOKING_NUMBER } from "../../config";
import { getPostBySlug } from "../../data/blogPosts";
import { useBookingModal } from "../../context/BookingModalContext";

const CATEGORIES = [
  { id: "all", label: "All Services" },
  { id: "hospital", label: "Hospital & Surgery" },
  { id: "elderly", label: "Elderly Care" },
  { id: "urgent", label: "24x7 Urgent" },
  { id: "diagnostic", label: "Diagnostics" },
  { id: "travel", label: "Medical Travel" },
];

export default function ServicesSection() {
  const { openQuickBook } = useBookingModal();
  const [services, setServices] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data)).catch(() => {});
  }, []);

  const filteredServices = services.filter((s) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "hospital") return s.slug.includes("hospital") || s.slug.includes("discharge");
    if (activeCategory === "elderly") return s.slug.includes("elderly");
    if (activeCategory === "urgent") return s.slug.includes("urgent");
    if (activeCategory === "diagnostic") return s.slug.includes("diagnostic");
    if (activeCategory === "travel") return s.slug.includes("travel");
    return true;
  });

  return (
    <section id="services" className="py-16 md:py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-magenta bg-fuchsia-50 border border-magenta/20 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              On-Demand Healthcare Assistance
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">
              Choose Your Dedicated Concierge
            </h2>
            <p className="text-ink-muted text-base max-w-2xl mt-2">
              Background-verified care companions active in {PILOT_CITY}. Pay only after service completion with transparent published rates and 15-minute free cushion.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="#membership" 
              className="text-xs sm:text-sm font-semibold text-violet hover:text-violet-dark flex items-center gap-1 px-4 py-2 rounded-full bg-white border border-violet/20 hover:bg-violet/5 transition-all shadow-xs"
            >
              <Crown className="w-4 h-4 text-violet" />
              <span>Or Get Unlimited VIP Membership →</span>
            </a>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-violet text-white shadow-md shadow-violet/20"
                  : "bg-white text-ink/70 hover:text-ink border border-ink/10 hover:border-ink/20"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredServices.map((s) => {
            const open = openId === s.id;
            return (
              <div
                key={s.id}
                className="bg-white rounded-3xl border border-ink/10 hover:border-violet/40 hover:shadow-xl hover:shadow-violet/10 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Top Row: Icon & Hourly Rate */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mist to-violet/10 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                      {s.icon}
                    </div>
                    <div className="text-right">
                      <div className="inline-block bg-slate-100/90 text-ink/70 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1">
                        Pay After Visit
                      </div>
                      <div className="font-display text-2xl font-bold text-ink">
                        ₹{s.hourly_rate}
                        <span className="text-xs font-sans font-normal text-ink/50">/hr</span>
                      </div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-xl font-bold text-ink mb-2 group-hover:text-violet transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed mb-4">
                    {s.short_description}
                  </p>

                  {/* Accordion Details */}
                  {open && (
                    <div className="pt-3 pb-2 border-t border-ink/10 text-xs text-ink/75 space-y-2 animate-fadeIn">
                      <p className="leading-relaxed">
                        {s.description || s.short_description}
                      </p>
                      {getPostBySlug(s.slug) && (
                        <Link
                          to={`/blog/${s.slug}`}
                          className="inline-flex items-center gap-1 text-violet font-semibold hover:underline pt-1"
                        >
                          Read the complete patient guide <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : s.id)}
                    className="text-xs font-semibold text-ink/50 hover:text-violet flex items-center gap-1 transition-colors mt-1"
                  >
                    <span>{open ? "Show Less" : "Details & Scope"}</span>
                    {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-ink/5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openQuickBook(s.id)}
                    className="flex-1 py-2.5 px-3 rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Book Now ⚡</span>
                  </button>

                  <a
                    href={waLink(WHATSAPP_BOOKING_NUMBER, `Hi ROSKYRO, I want to book ${s.name}. Please share details.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-full border border-emerald-500/50 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 transition-colors"
                    title="Book via WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}

          {/* Membership Banner Card in Grid */}
          <div className="p-[1.5px] rounded-3xl bg-gradient-to-br from-violet via-magenta to-flare shadow-lg md:col-span-2 lg:col-span-3">
            <div className="bg-white rounded-[22px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-soft text-violet flex items-center justify-center text-3xl shrink-0">
                  👑
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-magenta uppercase tracking-wider mb-1">
                    <Crown className="w-3.5 h-3.5" />
                    Long-term &amp; Family Healthcare
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                    Need Continuous Healthcare Support?
                  </h3>
                  <p className="text-sm text-ink-muted max-w-xl mt-1">
                    Get a dedicated Concierge Manager for recurring hospital visits, doctor appointments, NRI parent checkups, and diagnostic follow-ups starting at ₹24,999/yr.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <a
                  href="#membership"
                  className="px-6 py-3 rounded-full bg-brand-gradient text-white text-xs sm:text-sm font-bold text-center hover:opacity-95 transition-opacity shadow-md shadow-violet/20"
                >
                  View Membership Plans
                </a>
                <Link
                  to="/membership/info"
                  className="px-5 py-3 rounded-full border border-ink/15 text-ink text-xs sm:text-sm font-bold text-center hover:bg-slate-50 transition-colors"
                >
                  Membership FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Transparency Bar */}
        <div className="p-5 rounded-2xl bg-white border border-ink/10 grid sm:grid-cols-3 gap-4 text-xs text-ink/70">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-ink block mb-0.5">Pay After Visit</strong>
              Never prepay a stranger. Your bill is generated after the verified End PIN is entered.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-violet shrink-0 mt-0.5" />
            <div>
              <strong className="text-ink block mb-0.5">15-Min Free Cushion</strong>
              No nickel-and-diming. Billing starts only after arrival and the Start PIN is shared.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-ink block mb-0.5">Transparent Arrival Fee</strong>
              Distance-based ₹0–₹99 arrival fee and flat ₹49 if return drop location differs.
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
