import { useEffect } from "react";

const SITE_URL = "https://roskyro.in"; // update if the production domain differs
const SITE_NAME = "ROSKYRO";
const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/logo.png`;

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

const DEFAULT_TITLE = "ROSKYRO | Verified Care, On Call";
const DEFAULT_DESCRIPTION =
  "Background-verified, trained care partners for elder care, hospital assistance and urgent support. Book in minutes, pay after the visit.";

/**
 * Sets per-page SEO tags (title, meta description, canonical URL, Open Graph,
 * Twitter card, JSON-LD structured data) on mount / when deps change, and
 * restores the site defaults on unmount so navigating away from a blog post
 * doesn't leave stale tags behind for the next page.
 *
 * This is a small, dependency-free stand-in for react-helmet — it only
 * affects tags on the currently rendered document (client-side), which
 * covers on-page SEO and social sharing previews for a Vite SPA without
 * adding a new package. For full crawlability of dynamic routes, pairing
 * this with prerendering / SSR at build time is recommended down the line.
 */
export default function useSEO({ title, description, path, image, jsonLd, type = "website" }) {
  useEffect(() => {
    const fullTitle = title || DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;
    const url = path ? `${SITE_URL}${path}` : SITE_URL;
    const ogImage = image || DEFAULT_OG_IMAGE;

    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertLink("canonical", url);

    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:image", ogImage);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", ogImage);

    upsertJsonLd("seo-jsonld", jsonLd || null);

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta("name", "description", DEFAULT_DESCRIPTION);
      upsertJsonLd("seo-jsonld", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, type, JSON.stringify(jsonLd)]);
}

export { SITE_URL };
