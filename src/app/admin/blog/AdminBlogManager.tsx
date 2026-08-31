"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Edit3, ExternalLink, ImagePlus, PenLine, Search, Trash2 } from "lucide-react";

import { blogPostImage, blogPostImages, formatBlogDate, readingMinutes, type BlogPost } from "@/lib/blogData";
import { BLOG_SEED_POSTS } from "@/lib/blogSeed";
import { deleteBlogPost, saveBlogPost, seedBlogPosts } from "@/lib/firebase/blog";
import { cleanupAbandonedBlogImages, deleteImageFromCloudflare } from "@/lib/cloudflareUpload";
import { useBlogState } from "@/lib/useBlog";
import AdminBlogEditor from "./AdminBlogEditor";

const PAGE_SIZE = 10;

export default function AdminBlogManager() {
  const { posts, loading, error } = useBlogState();
  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* Images uploaded into an editor that was never saved are deleted here, so
     an abandoned draft cannot leave paid-for objects in the bucket. */
  useEffect(() => {
    void cleanupAbandonedBlogImages().then(({ failedCount }) => {
      if (failedCount) {
        setActionError(`${failedCount} abandoned blog image${failedCount === 1 ? "" : "s"} could not be deleted. Cleanup will retry next time.`);
      }
    });
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) =>
      [post.title, post.category, post.destination, post.author, post.id, ...post.tags]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [posts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const publishedCount = posts.filter((post) => post.status === "published").length;

  if (editing) {
    return (
      <AdminBlogEditor
        initialPost={editing === "new" ? undefined : editing}
        existingIds={posts.map((post) => post.id)}
        onCancel={() => setEditing(null)}
        onSaved={() => setEditing(null)}
      />
    );
  }

  const togglePublished = async (post: BlogPost) => {
    setWorking(post.id);
    setActionError("");
    try {
      await saveBlogPost({ ...post, status: post.status === "published" ? "draft" : "published" });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The post could not be updated.");
    } finally {
      setWorking("");
    }
  };

  const addStarterGuides = async () => {
    setWorking("seed");
    setActionError("");
    try {
      const { added, skipped } = await seedBlogPosts(BLOG_SEED_POSTS, posts.map((post) => post.id));
      if (!added) setActionError("Those starter guides are already in the database.");
      else if (skipped) setActionError(`Added ${added} guides. ${skipped} were already present and left untouched.`);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The starter guides could not be added.");
    } finally {
      setWorking("");
    }
  };

  const remove = async (post: BlogPost) => {
    if (!window.confirm(`Delete “${post.title}”? This removes it from the website too.`)) return;
    setWorking(post.id);
    setActionError("");
    try {
      await deleteBlogPost(post.id);
      await Promise.all(blogPostImages(post).map(deleteImageFromCloudflare));
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The post could not be deleted.");
    } finally {
      setWorking("");
    }
  };

  return (
    <div className="font-body text-cmt-neutral-900">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">Content</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Blog</h1>
          <p className="mt-2 text-sm text-cmt-neutral-600">
            Write and publish the travel guides shown at <Link href="/blog" className="font-semibold underline">/blog</Link>.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold shadow-cmt-primary hover:bg-cmt-primary-600"
        >
          <PenLine className="size-4" /> Write post
        </button>
      </div>

      {!loading && !posts.length && !error && (
        <section className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-cmt-md border border-cmt-primary-200 bg-cmt-primary-50 p-5">
          <div className="flex gap-3">
            <BookOpen className="mt-0.5 size-5 shrink-0 text-cmt-primary-800" />
            <div>
              <p className="font-semibold">Start with ten ready-made guides</p>
              <p className="mt-1 text-sm text-cmt-neutral-600">
                Destination guides for Kerala, Goa, Spiti, Rajasthan and more, using the photography already in the site. Edit or delete any of them afterwards — nothing is locked.
              </p>
            </div>
          </div>
          <button
            disabled={working === "seed"}
            onClick={() => void addStarterGuides()}
            className="h-10 shrink-0 rounded-cmt-control bg-cmt-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {working === "seed" ? "Adding…" : `Add ${BLOG_SEED_POSTS.length} guides`}
          </button>
        </section>
      )}

      {(error || actionError) && (
        <p role="alert" className="mt-5 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">
          {actionError || error}
        </p>
      )}

      <div className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cmt-neutral-200 px-5 py-4">
          <p className="text-sm font-semibold">
            {loading
              ? "Loading posts…"
              : search
                ? `${filtered.length} matching posts`
                : `${posts.length} posts · ${publishedCount} published`}
          </p>
          <label className="relative block w-full sm:w-80">
            <span className="sr-only">Search posts</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search posts…"
              className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
            />
          </label>
        </div>

        <div className="divide-y divide-cmt-neutral-200">
          {visible.map((post) => {
            const image = blogPostImage(post);
            const busy = working === post.id;

            return (
              <article key={post.id} className="grid gap-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
                  {image ? (
                    <Image src={image} alt="" fill sizes="88px" className="object-cover" unoptimized={image.startsWith("data:")} />
                  ) : (
                    <span className="grid size-full place-items-center text-cmt-neutral-400"><ImagePlus className="size-4" /></span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-base font-semibold">{post.title}</h2>
                    <span className={`rounded-cmt-full px-2 py-0.5 text-[10px] font-semibold ${
                      post.status === "published"
                        ? "bg-cmt-success-100 text-cmt-success-700"
                        : "bg-cmt-neutral-100 text-cmt-neutral-500"
                    }`}>
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                    {post.featured && (
                      <span className="rounded-cmt-full bg-cmt-primary-100 px-2 py-0.5 text-[10px] font-semibold text-cmt-primary-900">Featured</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-cmt-neutral-500">
                    {post.category}
                    {post.destination ? ` · ${post.destination}` : ""}
                    {formatBlogDate(post.publishedAt) ? ` · ${formatBlogDate(post.publishedAt)}` : ""}
                    {` · ${readingMinutes(post)} min read`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={busy}
                    onClick={() => void togglePublished(post)}
                    className="inline-flex h-9 items-center rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold disabled:opacity-40"
                  >
                    {post.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  {post.status === "published" && (
                    <Link
                      href={`/blog/${post.id}`}
                      target="_blank"
                      className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold"
                    >
                      <ExternalLink className="size-3.5" /> View
                    </Link>
                  )}
                  <button
                    onClick={() => setEditing(post)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold"
                  >
                    <Edit3 className="size-3.5" /> Edit
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void remove(post)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-error-500/30 px-3 text-xs font-semibold text-cmt-error-700 disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              </article>
            );
          })}

          {!loading && filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-cmt-neutral-500">
              {search ? "No posts match your search." : "No blog posts yet. Write your first travel guide."}
            </p>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cmt-neutral-200 px-5 py-4">
            <p className="text-xs text-cmt-neutral-500">
              Page {currentPage} of {totalPages} · Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" /> Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control bg-cmt-neutral-900 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
