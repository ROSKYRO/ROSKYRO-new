// Runs after `vite build` (see package.json "build" script). Produces one
// real, crawlable index.html per SEO-important route inside dist/, on top of
// the normal client bundle. Nginx's `try_files $uri $uri/ /index.html` (see
// nginx.conf) already serves a matching directory's index.html first, so
// these prerendered pages are picked up automatically in production with no
// server changes — routes that AREN'T prerendered here still fall through to
// the plain client-rendered dist/index.html exactly as before.
//
// How it works: we SSR-bundle src/entry-server.jsx with Vite, render each
// route's component tree to an HTML string with React's renderToString, and
// splice that string plus route-specific <title>/<meta>/JSON-LD into a copy
// of the already-built dist/index.html. The client bundle is untouched — it
// still does a normal (non-hydrating) client render on top of this markup,
// so behaviour for real visitors doesn't change; only what a crawler or
// "view source" sees does.
import { build } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SITE_URL = "https://roskyro.in";

async function main() {
  // 1. Bundle the SSR entry so we can import a plain Node-runnable module.
  await build({
    root,
    logLevel: "warn",
    build: {
      ssr: "src/entry-server.jsx",
      outDir: "dist-ssr",
      rollupOptions: { output: { format: "es" } },
    },
  });

  // 2. The app touches localStorage (AuthContext, api client) — polyfill a
  // harmless stub since there's no browser here. Nothing else in the render
  // path touches browser-only globals (verified: only admin pages / event
  // handlers use window/document, and those never run during a static render).
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };

  const { render } = await import(path.resolve(root, "dist-ssr/entry-server.js"));
  const { BLOG_POSTS } = await import(path.resolve(root, "src/data/blogPosts.js"));

  const template = fs.readFileSync(path.resolve(root, "dist/index.html"), "utf-8");

  const staticPages = [
    {
      urlPath: "/",
      title: "ROSKYRO | Verified Care, On Call",
      description:
        "Background-verified, trained care partners for elder care, hospital assistance and urgent support. Book in minutes, pay after the visit.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "ROSKYRO",
        url: SITE_URL,
        logo: `${SITE_URL}/brand/logo.png`,
        description:
          "Background-verified, trained care partners for elder care, hospital assistance, urgent support, medical travel and diagnostics.",
      },
    },
    {
      urlPath: "/blog",
      title: "Blog | ROSKYRO — Guides on Hospital, Elder Care & Urgent Assistance",
      description:
        "Everything you need to know about ROSKYRO's care services — 24x7 urgent support, hospital concierge, elderly care, medical travel, diagnostics and post-discharge support.",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "ROSKYRO Blog",
        url: `${SITE_URL}/blog`,
        blogPost: BLOG_POSTS.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE_URL}/blog/${p.slug}`,
        })),
      },
    },
    {
      urlPath: "/how-it-works",
      title: "How ROSKYRO Works | Verified Care, On Call",
      description:
        "From booking to payment: how ROSKYRO's Start PIN / End PIN flow works, step by step, with no advance payment ever.",
    },
  ];

  for (const p of staticPages) {
    writePage(root, template, p.urlPath, render(p.urlPath), {
      title: p.title,
      description: p.description,
      jsonLd: p.jsonLd,
    });
  }

  for (const post of BLOG_POSTS) {
    const urlPath = `/blog/${post.slug}`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          headline: post.title,
          description: post.metaDescription,
          mainEntityOfPage: `${SITE_URL}${urlPath}`,
          author: { "@type": "Organization", name: "ROSKYRO" },
          publisher: { "@type": "Organization", name: "ROSKYRO" },
        },
        {
          "@type": "Service",
          name: post.name,
          serviceType: post.category,
          provider: { "@type": "Organization", name: "ROSKYRO" },
          areaServed: "IN",
          ...(post.hourly_rate
            ? { offers: { "@type": "Offer", priceCurrency: "INR", price: post.hourly_rate, unitText: "HOUR" } }
            : {}),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: post.name, item: `${SITE_URL}${urlPath}` },
          ],
        },
        {
          "@type": "FAQPage",
          mainEntity: post.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    };
    writePage(root, template, urlPath, render(urlPath), {
      title: post.metaTitle,
      description: post.metaDescription,
      jsonLd,
    });
  }

  fs.rmSync(path.resolve(root, "dist-ssr"), { recursive: true, force: true });
  console.log(`Prerendered ${staticPages.length + BLOG_POSTS.length} pages.`);
}

function escapeAttr(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function writePage(root, template, urlPath, bodyHtml, { title, description, jsonLd }) {
  const url = `${SITE_URL}${urlPath}`;
  let out = template.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  out = out.replace(/<title>.*?<\/title>/, `<title>${escapeAttr(title)}</title>`);
  out = out.replace(
    /<meta name="description" content=".*?"\s*\/?>/,
    `<meta name="description" content="${escapeAttr(description)}" />`
  );

  const extraTags = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="ROSKYRO" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : "",
  ]
    .filter(Boolean)
    .join("\n    ");
  out = out.replace("</head>", `    ${extraTags}\n  </head>`);

  const outDir =
    urlPath === "/" ? path.resolve(root, "dist") : path.resolve(root, "dist", urlPath.replace(/^\//, ""));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), out);
  console.log("  prerendered", urlPath);
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
