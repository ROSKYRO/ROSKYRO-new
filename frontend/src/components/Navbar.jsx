import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  Sparkles, 
  MessageSquare, 
  PhoneCall, 
  Menu, 
  X, 
  Crown, 
  Stethoscope, 
  CalendarCheck, 
  LogOut, 
  User, 
  ShieldCheck,
  ChevronRight,
  Globe,
  Languages,
  Building2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { BOOK_WA_LINK, SUPPORT_PHONE_DISPLAY, CALL_TEL_LINK, PILOT_CITY } from "../config";

export default function Navbar({ onOpenQuickBook }) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/#services", label: t("nav_services") },
    { href: "/#membership", label: t("nav_membership") },
    { href: "/priority-access", label: t("nav_doctors") },
    { href: "/#how", label: t("nav_how_it_works") },
    { href: "/become-a-partner", label: t("nav_partner") },
  ];

  const loggedInLinks = [
    { to: "/my-bookings", label: t("nav_my_bookings"), icon: CalendarCheck },
    { to: "/member", label: t("nav_my_membership"), icon: Crown },
    ...(user?.role === "admin" ? [{ to: "/admin", label: t("nav_admin"), icon: ShieldCheck }] : []),
    ...(user?.role === "hospital_staff" ? [{ to: "/hospital/dashboard", label: "Hospital Console", icon: Building2 }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink/8 shadow-xs">
      
      {/* Upper Announcement & Language Bar */}
      <div className="bg-ink text-white/80 text-[11px] font-medium border-b border-white/10 px-3 sm:px-6 py-1.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Pilot Status & Helpline */}
          <div className="flex items-center gap-2.5 sm:gap-4 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t("top_location")}</span>
            </span>
            <span className="text-white/20 hidden md:inline">•</span>
            <span className="text-white/60 hidden lg:inline truncate">
              {t("top_instant_care")}
            </span>
          </div>

          {/* Right: Phone & Language Selector */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <a 
              href={CALL_TEL_LINK} 
              className="text-white/75 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-flare" />
              <span className="hidden sm:inline">{t("top_helpline")}:</span>
              <span className="font-bold text-white">{SUPPORT_PHONE_DISPLAY}</span>
            </a>

            {/* Language Switcher in Upper Bar */}
            <div className="flex items-center bg-white/10 p-0.5 rounded-full border border-white/15">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  language === "en" 
                    ? "bg-white text-ink shadow-xs" 
                    : "text-white/70 hover:text-white"
                }`}
                title="Switch to English"
                aria-label="Switch language to English"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  language === "hi" 
                    ? "bg-brand-gradient text-white shadow-xs" 
                    : "text-white/70 hover:text-white"
                }`}
                title="हिंदी में बदलें"
                aria-label="Switch language to Hindi"
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3">
        {/* Brand & Live status */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img 
                src="/brand/logo.png" 
                alt="ROSKYRO — Healthcare Concierge" 
                className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" 
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl font-bold tracking-tight text-ink group-hover:text-violet transition-colors">
                ROSKYRO
              </span>
              <span className="text-[10px] font-sans font-semibold tracking-wider text-violet uppercase">
                Healthcare Concierge
              </span>
            </div>
          </Link>

          {/* Live Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t("nav_pilot_badge")}</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        {!user ? (
          <nav className="hidden lg:flex items-center gap-5">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-ink/75 hover:text-violet transition-colors whitespace-nowrap"
              >
                {l.label}
              </a>
            ))}
          </nav>
        ) : (
          <nav className="hidden lg:flex items-center gap-5">
            <Link to="/services" className="text-sm font-medium text-ink/75 hover:text-violet transition-colors">
              {t("nav_services")}
            </Link>
            {loggedInLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-medium text-ink/75 hover:text-violet transition-colors flex items-center gap-1.5"
              >
                <l.icon className="w-4 h-4 text-violet" />
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Language Toggle Pill in Navbar */}
          <div className="flex items-center bg-slate-100 hover:bg-slate-200/70 p-0.5 rounded-full border border-ink/10 transition-colors">
            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-ink hover:text-violet transition-all"
              title={language === "en" ? "हिंदी में देखें" : "Switch to English"}
            >
              <Globe className="w-3.5 h-3.5 text-violet" />
              <span>{language === "en" ? "हिन्दी" : "English"}</span>
            </button>
          </div>

          {/* Instant Book Trigger Button */}
          <button
            type="button"
            onClick={onOpenQuickBook}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold px-4 py-2 rounded-full bg-brand-gradient text-white hover:shadow-md hover:shadow-violet/25 hover:opacity-95 transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("nav_instant_book")}</span>
          </button>

          {/* WhatsApp Direct */}
          <a
            href={BOOK_WA_LINK}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold px-3 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300/80 hover:bg-emerald-100 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("nav_whatsapp")}</span>
          </a>

          {/* User Auth state */}
          {user ? (
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-ink/10">
              <span className="text-xs font-medium text-ink/70 max-w-[100px] truncate">
                {user.full_name || user.phone}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-xs text-clay hover:bg-clay/10 p-1.5 rounded-lg transition-colors"
                title={t("nav_logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1 pl-1">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-ink/70 hover:text-violet px-3 py-1.5 rounded-full hover:bg-violet/5 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>{t("nav_login")}</span>
              </Link>
              <Link
                to="/hospital/login"
                className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-ink/70 hover:text-violet px-3 py-1.5 rounded-full hover:bg-violet/5 transition-colors border border-ink/10"
                title="Hospital partner login"
              >
                <Building2 className="w-4 h-4" />
                <span>Hospital Login</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-ink rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden border-t border-ink/10 bg-white/98 backdrop-blur-xl px-5 py-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto animate-fadeIn shadow-xl">
          
          {/* Language Switcher in Mobile Drawer */}
          <div className="p-3 bg-violet/5 rounded-2xl border border-violet/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-violet" />
              <span className="text-xs font-bold text-ink">भाषा / Language:</span>
            </div>
            <div className="flex items-center bg-white rounded-full p-1 border border-ink/10 shadow-2xs">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  language === "en" ? "bg-violet text-white shadow-xs" : "text-ink/60"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  language === "hi" ? "bg-violet text-white shadow-xs" : "text-ink/60"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Quick Book Highlight on Mobile */}
          <div className="p-3 bg-mist/60 rounded-2xl border border-violet/15 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-ink">{t("mob_need_care")}</div>
              <div className="text-xs text-ink/60">{t("mob_verified_partner")}</div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                if (onOpenQuickBook) onOpenQuickBook();
              }}
              className="px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm"
            >
              {t("mob_book_now")}
            </button>
          </div>

          {!user ? (
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink/40 px-2 pt-1">{t("mob_navigation")}</div>
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-violet/5 hover:text-violet transition-colors"
                >
                  <span>{l.label}</span>
                  <ChevronRight className="w-4 h-4 text-ink/30" />
                </a>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink/40 px-2 pt-1">Account &amp; Care</div>
              <Link
                to="/services"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-violet/5 hover:text-violet transition-colors"
              >
                <Stethoscope className="w-4 h-4 text-violet" />
                <span>{t("nav_services")}</span>
              </Link>
              {loggedInLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-violet/5 hover:text-violet transition-colors"
                >
                  <l.icon className="w-4 h-4 text-violet" />
                  <span>{l.label}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-ink/10 flex flex-col gap-2">
            <a
              href={BOOK_WA_LINK}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t("mob_book_whatsapp")}</span>
            </a>

            <a
              href={CALL_TEL_LINK}
              className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-100 text-ink hover:bg-slate-200 transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-clay" />
              <span>{t("mob_emergency_support")}: {SUPPORT_PHONE_DISPLAY}</span>
            </a>

            {user ? (
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                  navigate("/");
                }}
                className="text-center text-xs font-medium text-clay hover:underline py-2"
              >
                {t("nav_logout")}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-4 py-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="text-center text-xs font-semibold text-ink/70 hover:text-violet"
                >
                  {t("nav_login")} →
                </Link>
                <span className="text-ink/20">|</span>
                <Link
                  to="/hospital/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 text-center text-xs font-semibold text-ink/70 hover:text-violet"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Hospital Login →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
