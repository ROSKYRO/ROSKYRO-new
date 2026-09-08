import { Link, useParams, Navigate } from "react-router-dom";
import { getPostBySlug, getRelatedPosts } from "../data/blogPosts";
import useSEO, { SITE_URL } from "../hooks/useSEO";
import { BOOK_WA_LINK } from "../config";

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  // Hooks must run unconditionally, so compute a safe fallback for useSEO's
  // inputs when the post doesn't exist, then redirect after.
  const related = post ? getRelatedPosts(post.slug) : [];

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BlogPosting",
            headline: post.title,
            description: post.metaDescription,
            image: `${SITE_URL}/brand/logo.png`,
            author: { "@type": "Organization", name: "ROSKYRO" },
            publisher: {
              "@type": "Organization",
              name: "ROSKYRO",
              logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo.png` },
            },
            mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
          },
          {
            "@type": "Service",
            name: post.name,
            serviceType: post.category,
            provider: { "@type": "Organization", name: "ROSKYRO" },
            areaServed: "IN",
            ...(post.hourly_rate
              ? {
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "INR",
                    price: post.hourly_rate,
                    unitText: "HOUR",
                  },
                }
              : {}),
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
              { "@type": "ListItem", position: 3, name: post.name, item: `${SITE_URL}/blog/${post.slug}` },
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
      }
    : null;

  useSEO({
    title: post ? post.metaTitle : undefined,
    description: post ? post.metaDescription : undefined,
    path: post ? `/blog/${post.slug}` : undefined,
    type: "article",
    jsonLd,
  });

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      {/* Breadcrumb */}
      <nav className="text-xs text-ink/40 mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-violet">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-violet">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/60">{post.name}</span>
      </nav>

      <span className="text-xs font-semibold tracking-wide text-magenta">{post.category}</span>
      <h1 className="font-display text-3xl sm:text-4xl text-ink mt-3 mb-3">{post.title}</h1>
      <p className="text-ink/60 text-lg mb-6">{post.heroTagline}</p>

      <div className="flex items-center gap-4 text-xs text-ink/40 mb-10 pb-6 border-b border-ink/10">
        <span className="text-2xl">{post.icon}</span>
        <span>{post.readTime}</span>
        {post.hourly_rate && (
          <span className="font-semibold text-ink/60">From ₹{post.hourly_rate}/hr</span>
        )}
      </div>

      {/* Article body */}
      <article className="prose-none space-y-8">
        {post.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-xl text-ink mb-3">{s.heading}</h2>
            <p className="text-ink/70 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </article>

      {/* CTA */}
      <div className="bg-violet text-parchment rounded-card p-6 my-12 text-center">
        <div className="font-display text-lg mb-2">Book {post.name} on WhatsApp</div>
        <p className="text-parchment/70 text-sm mb-4">
          Verified Partner, transparent pricing, pay after the visit — no advance payment.
        </p>
        <a
          href={BOOK_WA_LINK}
          target="_blank"
          rel="noreferrer"
          className="inline-block px-6 py-3 rounded-full bg-parchment text-ink font-semibold hover:opacity-90 transition-opacity"
        >
          Book now
        </a>
      </div>

      {/* FAQs */}
      <section className="mb-12">
        <h2 className="font-display text-2xl text-ink mb-6">Frequently asked questions</h2>
        <div className="space-y-5">
          {post.faqs.map((f) => (
            <div key={f.q} className="border-b border-ink/10 pb-5">
              <div className="font-semibold text-ink mb-2">{f.q}</div>
              <div className="text-sm text-ink/60 leading-relaxed">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section>
          <h2 className="font-display text-xl text-ink mb-5">Other ROSKYRO services</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/blog/${r.slug}`}
                className="group bg-parchment border border-ink/10 rounded-card p-4 hover:border-violet transition-colors"
              >
                <div className="text-2xl mb-2">{r.icon}</div>
                <div className="font-semibold text-sm text-ink group-hover:text-violet transition-colors">
                  {r.name}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
