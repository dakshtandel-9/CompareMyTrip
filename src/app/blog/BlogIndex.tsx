"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Clock, MapPin, PenLine, Search } from "lucide-react";

import ContentImage from "@/app/home/_components/ContentImage";
import {
  blogPostImage,
  formatBlogDate,
  readingMinutes,
  type BlogPost,
} from "@/lib/blogData";
import { usePublishedBlogPosts } from "@/lib/useBlog";

/* ------------------------------------------------------------------ */
/* Travel guides index. Posts come from the same live Firestore feed    */
/* the CRM writes to, so publishing in /admin/blog puts an article here  */
/* without a rebuild. Card layout follows the guides rail on the         */
/* homepage (design.md §15.5 C-1) so the two read as one section.        */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 9;

function PostMeta({ post, className = "" }: { post: BlogPost; className?: string }) {
  const published = formatBlogDate(post.publishedAt);
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-cmt-neutral-500 ${className}`}>
      {published && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {published}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-3.5" strokeWidth={2} aria-hidden="true" />
        <span className="tabular-nums">{readingMinutes(post)} min read</span>
      </span>
      {post.destination && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {post.destination}
        </span>
      )}
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const image = blogPostImage(post);

  return (
    <article className="group h-full">
      <Link
        href={`/blog/${post.id}`}
        className="flex h-full flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-cmt-neutral-100">
          <ContentImage
            src={image}
            alt={post.coverAlt || post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute left-3 top-3 rounded-cmt-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-cmt-neutral-700 backdrop-blur-sm">
            {post.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h2 className="font-display text-lg font-semibold leading-snug text-cmt-neutral-900">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-cmt-neutral-600">
              {post.excerpt}
            </p>
          )}

          <div className="mt-auto border-t border-cmt-neutral-100 pt-4">
            <PostMeta post={post} />
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-cmt-neutral-900 transition-colors group-hover:text-cmt-primary-900">
              Read guide
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function BlogIndex() {
  const { posts, loading, error } = usePublishedBlogPosts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  /* Only categories that actually have a post behind them — an empty filter
     chip is a dead end for the reader. */
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [posts]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (category !== "All" && post.category !== category) return false;
      if (!needle) return true;
      return [post.title, post.excerpt, post.destination, post.author, ...post.tags]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [posts, query, category]);

  /* The lead card only makes sense on an unfiltered first page; once the
     reader narrows the list they want a plain, comparable grid. */
  const showLead = page === 1 && !query.trim() && category === "All" && filtered.length > 3;
  const lead = showLead ? filtered.find((post) => post.featured) ?? filtered[0] : undefined;
  const rest = lead ? filtered.filter((post) => post.id !== lead.id) : filtered;

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = rest.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetTo = (next: () => void) => {
    next();
    setPage(1);
  };

  return (
    <main className="w-full bg-white font-body text-cmt-neutral-900">
      <section className="w-full border-b border-cmt-neutral-100 bg-cmt-neutral-50 px-4 py-12 sm:px-5 sm:py-16 lg:px-6">
        <div className="mx-auto w-full max-w-[1440px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-700 sm:text-sm">
            Travel guides
          </p>
          <h1 className="mt-2 max-w-[20ch] font-display text-3xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
            Stories, routes and honest advice.
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-cmt-neutral-600 sm:text-base">
            Destination guides and trip notes written by our travel desk — the
            practical detail we would want before booking a trip ourselves.
          </p>
        </div>
      </section>

      <section className="w-full px-4 py-8 sm:px-5 lg:px-6">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="group"
            aria-label="Filter guides by topic"
            className="flex flex-wrap gap-2"
          >
            <button
              type="button"
              aria-pressed={category === "All"}
              onClick={() => resetTo(() => setCategory("All"))}
              className={`inline-flex h-9 items-center gap-1.5 rounded-cmt-full border px-3.5 text-xs font-semibold transition-colors ${
                category === "All"
                  ? "border-cmt-neutral-900 bg-cmt-neutral-900 text-white"
                  : "border-cmt-neutral-200 bg-white text-cmt-neutral-600 hover:border-cmt-neutral-300"
              }`}
            >
              All guides <span className="tabular-nums opacity-70">{posts.length}</span>
            </button>
            {categories.map(([name, count]) => (
              <button
                key={name}
                type="button"
                aria-pressed={category === name}
                onClick={() => resetTo(() => setCategory(name))}
                className={`inline-flex h-9 items-center gap-1.5 rounded-cmt-full border px-3.5 text-xs font-semibold transition-colors ${
                  category === name
                    ? "border-cmt-neutral-900 bg-cmt-neutral-900 text-white"
                    : "border-cmt-neutral-200 bg-white text-cmt-neutral-600 hover:border-cmt-neutral-300"
                }`}
              >
                {name} <span className="tabular-nums opacity-70">{count}</span>
              </button>
            ))}
          </div>

          <label className="relative block lg:w-72">
            <span className="sr-only">Search guides</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => resetTo(() => setQuery(event.target.value))}
              placeholder="Search guides…"
              className="h-11 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition-colors focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
            />
          </label>
        </div>
      </section>

      <section className="w-full px-4 pb-14 sm:px-5 sm:pb-20 lg:px-6">
        <div className="mx-auto w-full max-w-[1440px]">
          {error && (
            <p role="alert" className="rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">
              The guides could not be loaded right now. Please try again shortly.
            </p>
          )}

          {loading && !posts.length && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-cmt-md border border-cmt-neutral-200 bg-cmt-neutral-100" />
              ))}
            </div>
          )}

          {!loading && !posts.length && !error && (
            <div className="rounded-cmt-md border border-dashed border-cmt-neutral-300 bg-cmt-neutral-50 px-6 py-16 text-center">
              <PenLine className="mx-auto size-7 text-cmt-neutral-400" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-semibold">No guides published yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-cmt-neutral-600">
                Our travel desk is writing the first destination guides. In the
                meantime, the full package catalogue is ready to browse.
              </p>
              <Link
                href="/packages"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold shadow-cmt-primary transition-colors hover:bg-cmt-primary-600"
              >
                Browse packages <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}

          {lead && (
            <article className="group mb-10">
              <Link
                href={`/blog/${lead.id}`}
                className="grid overflow-hidden rounded-cmt-lg border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[box-shadow,border-color] duration-200 hover:border-cmt-neutral-300 hover:shadow-cmt-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 lg:grid-cols-2"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-cmt-neutral-100 lg:aspect-auto lg:h-full lg:min-h-[340px]">
                  <ContentImage
                    src={blogPostImage(lead)}
                    alt={lead.coverAlt || lead.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                  <span className="inline-flex w-fit items-center rounded-cmt-full bg-cmt-primary-500 px-3 py-1 text-[11px] font-semibold text-cmt-neutral-900">
                    {lead.featured ? "Featured guide" : "Latest guide"}
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                    {lead.title}
                  </h2>
                  {lead.excerpt && (
                    <p className="mt-3 max-w-prose text-sm leading-relaxed text-cmt-neutral-600 sm:text-base">
                      {lead.excerpt}
                    </p>
                  )}
                  <PostMeta post={lead} className="mt-5" />
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cmt-neutral-900 transition-colors group-hover:text-cmt-primary-900">
                    Read the guide
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          )}

          {visible.length > 0 && (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}

          {!loading && posts.length > 0 && filtered.length === 0 && (
            <p className="rounded-cmt-md border border-cmt-neutral-200 bg-cmt-neutral-50 px-6 py-14 text-center text-sm text-cmt-neutral-600">
              No guides match that search yet.
            </p>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-cmt-neutral-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="inline-flex h-10 items-center rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold transition-colors hover:bg-cmt-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  className="inline-flex h-10 items-center rounded-cmt-control bg-cmt-neutral-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-cmt-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
