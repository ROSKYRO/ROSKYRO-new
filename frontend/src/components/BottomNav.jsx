import { Link, useLocation } from "react-router-dom";
import { Home, Stethoscope, Sparkles, Crown, CalendarCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function BottomNav({ onOpenQuickBook }) {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isHome = location.pathname === "/";
  const isServices = location.pathname === "/services";
  const isMembership = location.pathname.startsWith("/membership") || location.pathname === "/member";
  const isBookings = location.pathname === "/my-bookings";

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-ink/10 px-3 py-1.5 shadow-lg shadow-ink/10"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isHome ? "text-violet font-bold" : "text-ink/60 hover:text-ink"
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${isHome ? "stroke-[2.5]" : ""}`} />
          <span className="text-[10px]">{t("bottom_home")}</span>
        </Link>

        {/* Services */}
        <Link
          to="/services"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isServices ? "text-violet font-bold" : "text-ink/60 hover:text-ink"
          }`}
        >
          <Stethoscope className={`w-5 h-5 mb-0.5 ${isServices ? "stroke-[2.5]" : ""}`} />
          <span className="text-[10px]">{t("bottom_services")}</span>
        </Link>

        {/* Center Quick Book Action */}
        <button
          type="button"
          onClick={onOpenQuickBook}
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="Instant Book"
        >
          <div className="w-12 h-12 rounded-full bg-brand-gradient text-white flex items-center justify-center shadow-lg shadow-violet/30 active:scale-95 transition-transform">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-semibold text-violet mt-1">{t("bottom_book")}</span>
        </button>

        {/* Membership */}
        <Link
          to={user ? "/member" : "/membership/info"}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isMembership ? "text-violet font-bold" : "text-ink/60 hover:text-ink"
          }`}
        >
          <Crown className={`w-5 h-5 mb-0.5 ${isMembership ? "stroke-[2.5]" : ""}`} />
          <span className="text-[10px]">{t("bottom_vip")}</span>
        </Link>

        {/* My Bookings / Account */}
        <Link
          to={user ? "/my-bookings" : "/login"}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isBookings ? "text-violet font-bold" : "text-ink/60 hover:text-ink"
          }`}
        >
          <CalendarCheck className={`w-5 h-5 mb-0.5 ${isBookings ? "stroke-[2.5]" : ""}`} />
          <span className="text-[10px]">{user ? t("bottom_bookings") : t("bottom_login")}</span>
        </Link>
      </div>
    </nav>
  );
}
