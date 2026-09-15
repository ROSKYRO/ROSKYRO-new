import { useState } from "react";
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Star, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  UserCheck, 
  Activity, 
  Crown,
  PhoneCall
} from "lucide-react";
import { BOOK_WA_LINK, CALL_TEL_LINK, SUPPORT_PHONE_DISPLAY, BRAND } from "../../config";
import { useBookingModal } from "../../context/BookingModalContext";
import { useLanguage } from "../../context/LanguageContext";

const HERO_SERVICES = [
  { id: 2, name: "Hospital Concierge", rate: 249, icon: "🏥", tag: "Most Popular" },
  { id: 1, name: "24x7 Urgent Support", rate: 269, icon: "🆘", tag: "Immediate" },
  { id: 3, name: "Elderly Care Concierge", rate: 229, icon: "👴", tag: "Day Assistance" },
  { id: 5, name: "Diagnostic Concierge", rate: 179, icon: "🧪", tag: "Tests & Reports" },
];

export default function Hero() {
  const { openQuickBook } = useBookingModal();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("estimate"); // "estimate" | "live" | "membership"
  const [selectedService, setSelectedService] = useState(HERO_SERVICES[0]);
  const [calcHours, setCalcHours] = useState(3);

  const estimatedTotal = Math.round(selectedService.rate * calcHours * 1.18);

  return (
    <section id="top" className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-magenta/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Core Value & Calls to Action */}
          <div className="lg:col-span-7">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mist border border-violet/15 text-xs font-semibold text-violet mb-5 shadow-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet"></span>
              </span>
              <span>{t("hero_badge")}</span>
            </div>

            {/* Main Headline */}
            {language === "hi" ? (
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-ink tracking-tight mb-5">
                अस्पताल का काम हो या देखभाल, <br className="hidden sm:block" />
                <span className="bg-brand-gradient bg-clip-text text-transparent">
                  एक भरोसेमंद साथी आपके साथ।
                </span>
              </h1>
            ) : (
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] text-ink tracking-tight mb-5">
                Healthcare, <br className="hidden sm:block" />
                <span className="bg-brand-gradient bg-clip-text text-transparent">
                  Without the Hassle.
                </span>
              </h1>
            )}

            {/* Subtitle */}
            <p className="text-ink-muted text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
              {t("hero_subtitle")}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-8">
              <button
                type="button"
                onClick={() => openQuickBook(selectedService.id)}
                className="px-7 py-3.5 rounded-full bg-brand-gradient text-white font-semibold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-violet/25 hover:shadow-xl hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>{t("hero_book_btn")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={BOOK_WA_LINK}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-full border border-ink/15 bg-white text-ink font-semibold text-sm sm:text-base flex items-center gap-2 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/40 transition-all shadow-xs"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>{t("nav_whatsapp")}</span>
              </a>

              <a
                href={CALL_TEL_LINK}
                className="px-4 py-3.5 rounded-full text-ink-muted hover:text-clay text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
                title="Call 24x7 Helpline"
              >
                <PhoneCall className="w-4 h-4 text-clay" />
                <span>24x7: {SUPPORT_PHONE_DISPLAY}</span>
              </a>
            </div>

            {/* App Trust Metric Strip */}
            <div className="pt-6 border-t border-ink/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet/10 text-violet flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-ink leading-tight">20 Mins</div>
                  <div className="text-[11px] text-ink/50">{t("hero_arrival_guarantee")}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-ink leading-tight">100% Verified</div>
                  <div className="text-[11px] text-ink/50">{t("hero_verified_badge")}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-ink leading-tight">Pay After</div>
                  <div className="text-[11px] text-ink/50">{t("hero_pricing_badge")}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-fuchsia-100 text-magenta flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 fill-magenta" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-ink leading-tight">4.9 / 5.0</div>
                  <div className="text-[11px] text-ink/50">1,200+ Assisted</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive App Card & Simulation */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md w-full">
              {/* Decorative Gradient Border Container */}
              <div className="p-[1.5px] rounded-3xl bg-gradient-to-b from-violet via-magenta/50 to-flare/40 shadow-2xl shadow-violet/15">
                <div className="bg-white rounded-[23px] overflow-hidden">
                  
                  {/* Top Header / Tab Switcher */}
                  <div className="bg-slate-50 border-b border-ink/10 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl w-full">
                      <button
                        type="button"
                        onClick={() => setActiveTab("estimate")}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === "estimate" 
                            ? "bg-white text-violet shadow-xs" 
                            : "text-ink/60 hover:text-ink"
                        }`}
                      >
                        ⚡ {t("tab_fare")}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("live")}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === "live" 
                            ? "bg-white text-violet shadow-xs" 
                            : "text-ink/60 hover:text-ink"
                        }`}
                      >
                        🟢 {t("tab_tracker")}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("membership")}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === "membership" 
                            ? "bg-white text-violet shadow-xs" 
                            : "text-ink/60 hover:text-ink"
                        }`}
                      >
                        👑 {t("tab_vip")}
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Live Interactive Calculator */}
                  {activeTab === "estimate" && (
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-ink/50">
                          Select Service
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Pay Only After Visit
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {HERO_SERVICES.map((s) => {
                          const isSel = selectedService.id === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedService(s)}
                              className={`p-3 rounded-xl text-left border transition-all relative ${
                                isSel 
                                  ? "border-violet bg-violet/5 ring-1 ring-violet shadow-xs" 
                                  : "border-ink/10 hover:border-ink/20 bg-slate-50/50"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xl">{s.icon}</span>
                                <span className="text-[10px] font-medium text-ink/50 bg-white px-1.5 py-0.5 rounded-md border border-ink/5">
                                  {s.tag}
                                </span>
                              </div>
                              <div className="font-semibold text-xs text-ink leading-tight">{s.name}</div>
                              <div className="text-xs font-bold text-violet mt-1">₹{s.rate}<span className="text-[10px] font-normal text-ink/50">/hr</span></div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Hours Slider */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-ink/5">
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="font-semibold text-ink/70">Estimated Hours:</span>
                          <span className="font-display font-bold text-violet text-sm">
                            {calcHours} {calcHours === 1 ? "Hour" : "Hours"}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          step="1"
                          value={calcHours}
                          onChange={(e) => setCalcHours(Number(e.target.value))}
                          className="w-full accent-violet cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                        />
                      </div>

                      {/* Live Calculation Output */}
                      <div className="p-3.5 bg-brand-soft rounded-xl border border-violet/15 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-ink/60">Estimated Total (with 18% GST)</div>
                          <div className="font-display text-2xl font-bold text-ink">
                            ₹{estimatedTotal}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openQuickBook(selectedService.id)}
                          className="px-4 py-2 rounded-full bg-violet text-white text-xs font-bold hover:bg-violet-dark shadow-sm flex items-center gap-1"
                        >
                          <span>Confirm</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => openQuickBook(selectedService.id)}
                          className="w-full py-2.5 rounded-xl bg-ink text-white font-semibold text-xs hover:bg-violet transition-colors"
                        >
                          Book Online with Start/End PIN ⚡
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Live Tracking Simulation */}
                  {activeTab === "live" && (
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Booking #RO-8821 Active
                        </span>
                        <span className="text-xs text-ink/40">Ambikapur, Ring Rd</span>
                      </div>

                      {/* Partner Card */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-ink/10 flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-brand-gradient text-white flex items-center justify-center font-bold text-lg">
                            RK
                          </div>
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-ink">Rajesh Kumar</span>
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="text-xs text-ink/60">Verified Healthcare Concierge</div>
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium mt-0.5">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>4.95 • 340+ hospital visits</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Status Step */}
                      <div className="bg-mist p-4 rounded-xl border border-violet/15 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-violet flex items-center gap-1.5">
                            <Activity className="w-4 h-4 animate-spin text-violet" />
                            Status: En Route
                          </span>
                          <span className="font-bold text-ink">ETA: 6 mins</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-brand-gradient h-full w-3/4 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-ink/60 pt-1">
                          <span>Start PIN: <strong className="text-ink font-mono text-xs">4192</strong></span>
                          <span>End PIN: <strong className="text-ink font-mono text-xs">7821</strong></span>
                        </div>
                      </div>

                      <div className="text-[11px] text-ink/50 text-center italic">
                        PINs protect billing — never share until Partner arrives in person.
                      </div>
                    </div>
                  )}

                  {/* Tab 3: VIP Membership Pass */}
                  {activeTab === "membership" && (
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="bg-ink text-white rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-magenta/20 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-flare uppercase tracking-wider">
                            <Crown className="w-4 h-4" />
                            Annual Concierge Pass
                          </div>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-parchment/80">
                            VIP Care
                          </span>
                        </div>

                        <div className="font-display text-2xl font-bold mb-1">
                          ROSKYRO Care
                        </div>
                        <div className="text-xs text-parchment/70 mb-4">
                          Dedicated care manager + doctor consults &amp; hospital support.
                        </div>

                        <div className="space-y-2 text-xs text-parchment/90 mb-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-magenta shrink-0" />
                            <span>Personal dedicated Healthcare Concierge</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-magenta shrink-0" />
                            <span>4 Doctor Consultations + 2 Ambulance Assists</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-magenta shrink-0" />
                            <span>2 Concierge Visits included every month</span>
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-2xl font-bold text-white font-display">₹24,999</span>
                          <span className="text-xs text-parchment/60">/year</span>
                        </div>

                        <a
                          href="#membership"
                          className="block w-full text-center py-2.5 rounded-full bg-white text-ink text-xs font-bold hover:bg-parchment transition-colors"
                        >
                          Explore All 3 Membership Plans →
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Card Footer Strip */}
                  <div className="bg-slate-50 border-t border-ink/5 px-4 py-2.5 flex items-center justify-between text-[11px] text-ink/50">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      100% Secure &amp; Verified
                    </span>
                    <a href="#how" className="text-violet hover:underline font-medium">
                      How It Works
                    </a>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
