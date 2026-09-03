// Central site config — one place to update brand numbers, contact details and
// launch-offer copy. Mirrors the reference site's config surface (WhatsApp-first
// booking, published pricing, single pilot city).
//
// IMPORTANT: WHATSAPP_BOOKING_NUMBER / WHATSAPP_SUPPORT_NUMBER below are
// PLACEHOLDERS. Set the real numbers via .env (VITE_WHATSAPP_BOOKING_NUMBER /
// VITE_WHATSAPP_SUPPORT_NUMBER) before going live — see frontend/.env.example.

export const BRAND = "ROSKYRO";

// Admin login lives at a private, unlinked path instead of a guessable one
// like /admin/login. Anyone who knows the URL can still open the *login
// form*, but that's expected for any login page — the real protection is
// the backend (separate /admin/auth/login endpoint, its own rate limit,
// short-lived tokens) plus this path never being linked from the public
// site. CHANGE THIS per deployment via VITE_ADMIN_LOGIN_PATH so it isn't
// the same default for every ROSKYRO install — treat it like a secret.
export const ADMIN_LOGIN_PATH = import.meta.env.VITE_ADMIN_LOGIN_PATH || "/team-portal-9f3k";

export const WHATSAPP_BOOKING_NUMBER = import.meta.env.VITE_WHATSAPP_BOOKING_NUMBER || "919244166752";
export const WHATSAPP_SUPPORT_NUMBER = import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || "919244166752";
export const SUPPORT_PHONE_DISPLAY = import.meta.env.VITE_SUPPORT_PHONE_DISPLAY || "+91 92441 66752";
export const SUPPORT_EMAIL = "roskyroofficial@gmail.com";
export const PILOT_CITY = "INDIA";
export const PILOT_STATE = "Chhattisgarh";
export const INSTAGRAM_HANDLE = "roskyro.in";
export const INSTAGRAM_URL = "https://www.instagram.com/roskyro.in/";
export const GSTIN_PLACEHOLDER = "— add on registration —";

export function waLink(number, text) {
  const encoded = encodeURIComponent(text || "Hi");
  return `https://wa.me/${number}?text=${encoded}`;
}

export const BOOK_WA_LINK = waLink(WHATSAPP_BOOKING_NUMBER, "Hi");
export const JOIN_WA_LINK = waLink(
  WHATSAPP_SUPPORT_NUMBER,
  `Hi ${BRAND}, I'd like to apply as a Partner. Please guide me on the next steps.`
);
export const CALL_TEL_LINK = `tel:+${WHATSAPP_SUPPORT_NUMBER}`;
