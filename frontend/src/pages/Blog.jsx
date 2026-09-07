import { useEffect } from "react";
import { Link } from "react-router-dom";
import { posts } from "../content/blog/manifest.js";

export default function Blog() {
  useEffect(() => {
    document.title = "Blog | ROSKYRO — India's Healthcare Operating System";
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-5 py-14">
      <h1 className="font-display text-3xl text-ink mb-3">The ROSKYRO Blog</h1>
      <p className="text-ink/60 mb-10 max-w-2xl">
        A closer look at each ROSKYRO service — what it covers, who it's for, and how to book it.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="group rounded-card overflow-hidden border border-ink/10 hover:border-violet transition-colors bg-white flex flex-col"
          >
            <img
              src={p.image}
              alt={p.imageAlt}
              className="w-full h-44 object-cover bg-mist"
              loading="lazy"
            />
            <div className="p-5 flex-1 flex flex-col">
              <h2 className="font-display text-lg text-ink mb-2 group-hover:text-violet transition-colors">
                {p.title.split(":")[0]}
              </h2>
              <p className="text-sm text-ink/60 flex-1">{p.metaDescription}</p>
              <span className="mt-4 text-sm font-semibold text-violet">Read more →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
