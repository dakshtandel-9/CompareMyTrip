"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, MapPin, Tag } from "lucide-react";

import ContentImage from "@/app/home/_components/ContentImage";
import {
  blogPostImage,
  formatBlogDate,
  readingMinutes,
  relatedBlogPosts,
  toParagraphs,
} from "@/lib/blogData";
import { usePublishedBlogPosts } from "@/lib/useBlog";

/* ------------------------------------------------------------------ */
/* One article. Body copy is rendered from the post's sections, each of  */
/* which may carry its own photograph — the same shape the CRM edits.    */
/* ------------------------------------------------------------------ */

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { posts, loading } = usePublishedBlogPosts();
  const post = posts.find((item) => item.id === slug);

  /* The document title is set here rather than in generateMetadata: posts
     are read from Firestore in the browser, so the server has no copy of
     the article to title the page with. */
  useEffect(() => {
    if (!post) return;
    const previous = document.title;
    document.title = `${post.seoTitle || post.title} | CompareMyTrip`;
    return () => { document.title = previous; };
  }, [post]);

  const related = useMemo(() => (post ? relatedBlogPosts(post, posts) : []), [post, posts]);

  if (loading && !post) {
    return (
      <main className="mx-auto w-full max-w-[760px] px-4 py-16">
        <div className="h-8 w-2/3 animate-pulse rounded-cmt-sm bg-cmt-neutral-100" />
        <div className="mt-4 h-64 animate-pulse rounded-cmt-md bg-cmt-neutral-100" />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-cmt-neutral-50 px-4 font-body">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold">Guide not found</h1>
          <p className="mt-2 text-sm text-cmt-neutral-600">
            This article may have been unpublished or moved.
          </p>
          <Link
            href="/blog"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> All travel guides
          </Link>
        </div>
      </main>
    );
  }

  const cover = blogPostImage(post);
  const published = formatBlogDate(post.publishedAt);

  return (
    <main className="w-full bg-white pb-16 font-body text-cmt-neutral-900">
      <article>
        <header className="w-full border-b border-cmt-neutral-100 bg-cmt-neutral-50 px-4 py-10 sm:px-5 sm:py-14 lg:px-6">
          <div className="mx-auto w-full max-w-[820px]">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-cmt-neutral-500">
              <Link href="/" className="hover:text-cmt-neutral-900">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/blog" className="hover:text-cmt-neutral-900">Travel guides</Link>
              <span aria-hidden="true">/</span>
              <span className="line-clamp-1 text-cmt-neutral-700">{post.title}</span>
            </nav>

            <span className="mt-6 inline-flex items-center rounded-cmt-full bg-cmt-primary-500 px-3 py-1 text-[11px] font-semibold text-cmt-neutral-900">
              {post.category}
            </span>

            <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-4 max-w-prose text-base leading-relaxed text-cmt-neutral-600">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-cmt-neutral-500">
              <span className="font-semibold text-cmt-neutral-900">
                {post.author}
                {post.authorRole && <span className="ml-1.5 font-normal text-cmt-neutral-500">· {post.authorRole}</span>}
              </span>
              {published && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden="true" /> {published}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                <span className="tabular-nums">{readingMinutes(post)} min read</span>
              </span>
              {post.destination && (
                <Link
                  href={`/packages?destination=${encodeURIComponent(post.destination)}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-cmt-neutral-900 hover:text-cmt-primary-900"
                >
                  <MapPin className="size-3.5" aria-hidden="true" /> {post.destination} packages
                </Link>
              )}
            </div>
          </div>
        </header>

        {cover && (
          <div className="w-full px-4 sm:px-5 lg:px-6">
            <div className="mx-auto w-full max-w-[1000px] pt-8 sm:pt-10">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-cmt-lg bg-cmt-neutral-100">
                <ContentImage
                  src={cover}
                  alt={post.coverAlt || post.title}
                  fill
                  priority
                  sizes="(max-width: 1000px) 100vw, 1000px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        )}

        <div className="w-full px-4 sm:px-5 lg:px-6">
          <div className="mx-auto w-full max-w-[760px] pt-10 sm:pt-12">
            {post.sections.map((section) => {
              const paragraphs = toParagraphs(section.body);
              if (!section.heading && !paragraphs.length && !section.image) return null;

              return (
                <section key={section.id} className="mb-10">
                  {section.heading && (
                    <h2 className="font-display text-xl font-semibold leading-snug text-cmt-neutral-900 sm:text-2xl">
                      {section.heading}
                    </h2>
                  )}

                  {paragraphs.map((paragraph, index) => (
                    <p key={index} className="mt-4 text-[15px] leading-8 text-cmt-neutral-700 sm:text-base">
                      {paragraph}
                    </p>
                  ))}

                  {section.image && (
                    <figure className="mt-6">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-cmt-md bg-cmt-neutral-100">
                        <ContentImage
                          src={section.image}
                          alt={section.imageAlt || section.heading || post.title}
                          fill
                          sizes="(max-width: 760px) 100vw, 760px"
                          className="object-cover"
                        />
                      </div>
                      {section.imageCaption && (
                        <figcaption className="mt-2.5 text-xs leading-5 text-cmt-neutral-500">
                          {section.imageCaption}
                        </figcaption>
                      )}
                    </figure>
                  )}
                </section>
              );
            })}

            {post.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-cmt-neutral-100 pt-6">
                <Tag className="size-4 text-cmt-neutral-400" aria-hidden="true" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-cmt-full border border-cmt-neutral-200 bg-cmt-neutral-50 px-3 py-1 text-xs font-semibold text-cmt-neutral-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* The article exists to sell trips, so it ends by handing the
                reader the catalogue — filtered to this destination when the
                post names one. */}
            <aside className="mt-10 rounded-cmt-md bg-cmt-neutral-900 p-6 text-white sm:p-8">
              <h2 className="font-display text-xl font-semibold">
                {post.destination ? `Ready to travel to ${post.destination}?` : "Ready to plan the trip?"}
              </h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-cmt-neutral-300">
                Compare packages from GST-verified operators side by side — full
                itineraries, inclusions and exclusions before you pay.
              </p>
              <Link
                href={post.destination ? `/packages?destination=${encodeURIComponent(post.destination)}` : "/packages"}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:bg-cmt-primary-600"
              >
                See packages <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-14 w-full border-t border-cmt-neutral-100 px-4 pt-12 sm:px-5 lg:px-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Keep reading</h2>
            <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/blog/${item.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:shadow-cmt-md"
                  >
                    <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-cmt-neutral-100">
                      <ContentImage
                        src={blogPostImage(item)}
                        alt={item.coverAlt || item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-cmt-primary-700">
                        {item.category}
                      </p>
                      <h3 className="mt-2 font-display text-lg font-semibold leading-snug">
                        {item.title}
                      </h3>
                      <span className="mt-auto pt-4 text-xs text-cmt-neutral-500">
                        <span className="tabular-nums">{readingMinutes(item)} min read</span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
