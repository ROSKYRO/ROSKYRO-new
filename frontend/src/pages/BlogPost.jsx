import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getPostBySlug } from "../content/blog/manifest.js";

// Loads every post body as raw markdown text, keyed by file path, at build time.
const rawPosts = import.meta.glob("../content/blog/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function getBody(slug) {
  const entry = Object.entries(rawPosts).find(([path]) => path.endsWith(`/${slug}.md`));
  return entry ? entry[1] : "";
}

// Tailwind-styled renderers so posts look right without the typography plugin.
const markdownComponents = {
  h1: (props) => <h1 className="font-display text-3xl text-ink mt-2 mb-6" {...props} />,
  h2: (props) => <h2 className="font-display text-2xl text-ink mt-10 mb-4" {...props} />,
  h3: (props) => <h3 className="font-display text-xl text-ink mt-8 mb-3" {...props} />,
  p: (props) => <p className="text-ink/80 leading-relaxed mb-4" {...props} />,
  a: (props) => <a className="text-violet font-medium hover:text-magenta underline underline-offset-2" {...props} />,
  ul: (props) => <ul className="list-disc pl-6 mb-4 space-y-1 text-ink/80" {...props} />,
  ol: (props) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-ink/80" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="text-ink font-semibold" {...props} />,
  img: (props) => (
    <img className="w-full rounded-card my-6 border border-ink/10" loading="lazy" {...props} />
  ),
  hr: () => <hr className="my-10 border-ink/10" />,
  blockquote: (props) => (
    <blockquote className="border-l-4 border-violet/30 pl-4 italic text-ink/70 my-6" {...props} />
  ),
};

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);
  const body = post ? getBody(slug) : "";

  useEffect(() => {
    if (post) {
      document.title = post.metaTitle;
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", post.metaDescription);
    }
  }, [post]);

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-3xl text-ink mb-4">Post not found</h1>
        <p className="text-ink/60 mb-6">This blog post doesn't exist or may have moved.</p>
        <Link to="/blog" className="text-violet font-semibold">← Back to Blog</Link>
      </div>
    );
  }

  const faqSchema =
    post.faqs && post.faqs.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <article className="max-w-3xl mx-auto px-5 py-14">
      <Link to="/blog" className="text-sm font-medium text-ink/50 hover:text-violet">
        ← All services
      </Link>

      <div className="mt-6">
        <ReactMarkdown components={markdownComponents}>{body}</ReactMarkdown>
      </div>

      {faqSchema && (
        // Structured data for FAQ rich results — safe: content is built entirely
        // from this file's own known-good manifest data, never user input.
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </article>
  );
}
