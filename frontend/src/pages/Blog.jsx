import { Link } from "react-router-dom";
import { BLOG_POSTS } from "../data/blogPosts";
import useSEO, { SITE_URL } from "../hooks/useSEO";
import { BOOK_WA_LINK } from "../config";

export default function Blog() {
  useSEO({
    title: "Blog | ROSKYRO — Guides on Hospital, Elder Care & Urgent Assistance",
    description:
      "Everything you need to know about ROSKYRO's care services — 24x7 urgent support, hospital concierge, elderly care, medical travel, diagnostics and post-discharge support.",
    path: "/blog",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "ROSKYRO Blog",
      url: `${SITE_URL}/blog`,
      description:
        "Guides on ROSKYRO's non-medical care services: urgent support, hospital concierge, elderly care, medical travel, diagnostics and post-discharge assistance.",
      blogPost: BLOG_POSTS.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `${SITE_URL}/blog/${p.slug}`,
        description: p.metaDescription,
      })),
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-5 py-16">
      <span className="text-xs font-semibold tracking-wide text-magenta">ROSKYRO Guides</span>
      <h1 className="font-display text-4xl text-ink mt-3 mb-3">The ROSKYRO Blog</h1>
      <p className="text-ink/60 max-w-2xl mb-12">
        Practical guides on every ROSKYRO service — what's included, who it's for, and how
        booking works. No jargon, just what you need to know before you book a verified Partner.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="group bg-parchment border border-ink/10 rounded-card p-6 flex flex-col hover:border-violet transition-colors"
          >
            <div className="text-3xl mb-4">{post.icon}</div>
            <div className="text-xs font-semibold text-violet mb-2">{post.category}</div>
            <h2 className="font-display text-lg text-ink mb-2 group-hover:text-violet transition-colors">
              {post.name}
            </h2>
            <p className="text-sm text-ink/60 mb-4 flex-1">{post.excerpt}</p>
            <div className="flex items-center justify-between text-xs text-ink/40">
              <span>{post.readTime}</span>
              <span className="font-semibold text-violet group-hover:translate-x-1 transition-transform">
                Read more →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-ink text-parchment rounded-card p-8 text-center">
        <div className="font-display text-xl mb-2">Ready to book a verified Partner?</div>
        <p className="text-parchment/60 text-sm mb-5 max-w-xl mx-auto">
          Two minutes on WhatsApp, no advance payment — pay only after the service is done.
        </p>
        <a
          href={BOOK_WA_LINK}
          target="_blank"
          rel="noreferrer"
          className="inline-block px-6 py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Book on WhatsApp
        </a>
      </div>
    </div>
  );
}
