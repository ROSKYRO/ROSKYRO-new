# ROSKYRO Blog

SEO-friendly blog posts for all 8 services from `backend/app/seed.py`, live at `/blog` and `/blog/:slug`.

## How it's wired up

- **`manifest.js`** — auto-generated metadata for every post (meta title/description, keywords, hero image + alt text, FAQ entries). `Blog.jsx` and `BlogPost.jsx` both import this.
- **`*.md`** — the post body only (heading, hero image, sections). Meta tags and FAQ schema live in `manifest.js` instead of being re-parsed from the file, so they can't drift.
- **`frontend/src/pages/Blog.jsx`** — listing page (`/blog`), cards linking to each post.
- **`frontend/src/pages/BlogPost.jsx`** — detail page (`/blog/:slug`). Loads the matching `.md` body via `import.meta.glob(...,{ query: "?raw" })`, renders it with `react-markdown` using Tailwind-styled components (no typography plugin needed), sets `document.title` / the meta-description tag, and injects the post's `FAQPage` JSON-LD from `manifest.js`.
- **Routes**: added to `App.jsx`. **Nav link**: "Blog" added to `Navbar.jsx` for both logged-out and logged-in states.
- **New dependency**: `react-markdown` (added to `package.json`) — run `npm install` in `frontend/` before building.

Images referenced in each post live in `frontend/public/blog/images/` and are linked with root-relative paths (`/blog/images/...`).

## Image status

| Service | Image | Type |
|---|---|---|
| Hospital Relationship Officer | `hospital-relationship-officer.png` | Real branded photo |
| Elder Companion Care | `elder-companion-care.png` | Real branded photo |
| 24x7 Urgent Support | `urgent-support-1.png`, `urgent-support-2.png` | Real branded photo (2) |
| Hospital Concierge | `hospital-concierge-1.png`, `hospital-concierge-2.png` | Real branded photo (2) |
| Elderly Care Concierge | `elderly-care-concierge.svg` | Placeholder illustration |
| Medical Travel Concierge | `medical-travel-concierge.svg` | Placeholder illustration |
| Diagnostic Concierge | `diagnostic-concierge.svg` | Placeholder illustration |
| Post-Discharge Concierge | `post-discharge-concierge.png` | Real branded photo |

To swap a placeholder for a real photo later: drop the new file into `frontend/public/blog/images/`, then update that post's `image` / `imageAlt` fields in `manifest.js` (and its hero `![...](...)` line in the `.md` file, which is only used for the in-body copy — the manifest is the source of truth for the listing card and `<head>` tags).

## Adding a new post later

1. Add a new `.md` file here (body only — start with the H1 and hero image).
2. Add a matching entry to the `posts` array in `manifest.js` (slug, title, metaTitle, metaDescription, keywords, image, imageAlt, faqs).
3. Drop its image(s) into `frontend/public/blog/images/`.

No route changes needed — `/blog/:slug` picks up any slug present in the manifest automatically.
