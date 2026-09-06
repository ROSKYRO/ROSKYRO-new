import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BOOK_WA_LINK } from "../config";

const NAV_LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#story", label: "Our story" },
  { href: "/#how", label: "How it works" },
  { href: "/#demo", label: "Live demo" },
  { href: "/#trust", label: "Why trust us" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#join", label: "Become a Partner" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Signed-in users (customers/admins using the actual booking app) get a
  // short, app-style nav instead of the long marketing anchor list — the
  // marketing links only make sense on the logged-out landing page.
  const loggedInLinks = [
    { to: "/my-bookings", label: "My bookings" },
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-parchment/95 backdrop-blur border-b border-ink/10">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-ink shrink-0">
          <img src="/brand/logo.png" alt="ROSKYRO" className="w-9 h-9 object-contain" />
          ROSKYRO
        </Link>

        {!user && (
          <nav className="hidden lg:flex items-center gap-5 overflow-x-auto">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-ink/70 hover:text-violet transition-colors whitespace-nowrap">
                {l.label}
              </a>
            ))}
          </nav>
        )}

        {user && (
          <nav className="hidden lg:flex items-center gap-5">
            {loggedInLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-ink/70 hover:text-violet transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {user ? (
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="text-sm font-medium px-4 py-2 rounded-full border border-ink/15 hover:border-violet hover:text-violet transition-colors"
            >
              Log out
            </button>
          ) : (
            <Link to="/login" className="text-sm font-medium text-ink/50 hover:text-violet whitespace-nowrap">Web login</Link>
          )}
          <a
            href={BOOK_WA_LINK}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold px-4 py-2 rounded-full bg-brand-gradient text-white hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Book on WhatsApp
          </a>
        </div>

        <button className="lg:hidden text-2xl text-ink shrink-0" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-ink/10 bg-parchment px-5 py-4 flex flex-col gap-4">
          {!user && NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-ink/70 hover:text-violet">
              {l.label}
            </a>
          ))}
          <a
            href={BOOK_WA_LINK}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="text-center text-sm font-semibold px-4 py-2 rounded-full bg-brand-gradient text-white"
          >
            Book on WhatsApp
          </a>
          {user ? (
            <>
              {loggedInLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium text-ink/70">{l.label}</Link>
              ))}
              <button onClick={() => { logout(); setOpen(false); navigate("/"); }} className="text-left text-sm font-medium text-clay">Log out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-ink/50">Web login</Link>
          )}
        </div>
      )}
    </header>
  );
}
