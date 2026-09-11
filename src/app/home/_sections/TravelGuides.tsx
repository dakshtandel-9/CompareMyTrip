"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { blogPostImage, readingMinutes } from "@/lib/blogData";
import { usePublishedBlogPosts } from "@/lib/useBlog";
import { useSiteContent } from "@/lib/useSiteContent";
import ContentImage from "../_components/ContentImage";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Travel guides — design.md §15.5 C-1 article index.                    */
/*                                                                       */
/* The three cards are the newest published posts from /admin/blog, so    */
/* writing an article puts it on the homepage without a second edit. The  */
/* hand-written cards in the homepage CRM stay as the fallback for a      */
/* database with nothing published yet, which is what a fresh install and */
/* a dropped Firestore connection both look like. Header copy is always   */
/* the CRM's.                                                            */
/* ------------------------------------------------------------------ */

export default function TravelGuides() {
  const { guides } = useSiteContent();
  const { posts } = usePublishedBlogPosts();

  if (!guides.enabled) return null;

  const { header } = guides;
  const items = posts.length
    ? posts.slice(0, 3).map((post) => ({
        id: post.id,
        category: post.category,
        title: post.title,
        excerpt: post.excerpt,
        image: blogPostImage(post),
        alt: post.coverAlt || post.title,
        readMinutes: readingMinutes(post),
        href: `/blog/${post.id}`,
      }))
    : guides.items;

  return (
    <section
      id="travel-guides"
      aria-labelledby="travel-guides-title"
      className="w-full border-t border-cmt-neutral-100 bg-white px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow={header.eyebrow}
          title={<span id="travel-guides-title">{header.title}</span>}
          description={header.description}
          actionLabel={header.actionLabel}
          actionHref={header.actionHref}
        />

        <ul className="cmt-mobile-rail mt-8 grid grid-cols-1 gap-6 sm:mt-10 md:grid-cols-3">
          {items.map((guide) => (
            <li key={guide.id}>
              <article className="group h-full">
                <Link
                  href={guide.href}
                  className="flex h-full flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                >
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
                    <ContentImage
                      src={guide.image}
                      alt={guide.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />

                    {guide.category && (
                      <span className="absolute left-3 top-3 rounded-cmt-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-cmt-neutral-700 backdrop-blur-sm">
                        {guide.category}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-semibold leading-snug text-cmt-neutral-900">
                      {guide.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-cmt-neutral-600">
                      {guide.excerpt}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-cmt-neutral-100 pt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-cmt-neutral-500">
                        <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                        <span className="tabular-nums">{guide.readMinutes} min read</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-cmt-neutral-900 transition-colors group-hover:text-cmt-primary-900">
                        Read guide
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
