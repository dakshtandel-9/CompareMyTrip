"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  Clock,
  ImagePlus,
  PenLine,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  BLOG_CATEGORIES,
  makeBlogSection,
  readingMinutes,
  slugify,
  toParagraphs,
  type BlogCategory,
  type BlogPost,
  type BlogSection,
} from "@/lib/blogData";
import { saveBlogPost, uploadBlogImage } from "@/lib/firebase/blog";
import { BLOG_DRAFT_IMAGE_KEY_PREFIX, deleteImageFromCloudflare } from "@/lib/cloudflareUpload";

const inputClass = "h-12 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]";
const textareaClass = "min-h-28 w-full resize-y rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-cmt-neutral-500">{children}</span>;
}

function SectionTitle({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-cmt-control bg-cmt-primary-50 text-cmt-primary-900">{icon}</span>
      <div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="text-xs text-cmt-neutral-500">{copy}</p>
      </div>
    </div>
  );
}

/* One uploader, used for the cover photo and for every in-article image, so
   both obey exactly the rules the package gallery does: JPG/PNG/WebP, 5 MB
   ceiling, stored in Cloudflare R2, only the URL kept in Firestore. */
function BlogImageUpload({
  value,
  label,
  hint,
  aspect = "aspect-[16/9]",
  busy,
  onUpload,
  onRemove,
}: {
  value: string;
  label: string;
  hint: string;
  aspect?: string;
  busy: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {value ? (
        <div className={`relative ${aspect} w-full overflow-hidden rounded-cmt-md bg-cmt-neutral-100`}>
          <Image src={value} alt="" fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" unoptimized={value.startsWith("data:")} />
          <button
            type="button"
            onClick={onRemove}
            aria-label="Delete image"
            className="absolute right-3 top-3 inline-flex h-9 items-center gap-1.5 rounded-cmt-control bg-cmt-neutral-900/85 px-3 text-xs font-semibold text-white"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="block w-full cursor-pointer rounded-cmt-md border border-dashed border-cmt-neutral-300 bg-cmt-neutral-50 p-6 text-center transition-colors hover:border-cmt-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ImagePlus className="mx-auto size-6 text-cmt-neutral-500" />
          <span className="mt-2 block text-sm font-semibold">{busy ? "Processing and uploading…" : "Upload image"}</span>
          <span className="mt-1 block text-xs text-cmt-neutral-500">{hint}</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onUpload(file);
        }}
      />
    </div>
  );
}

function emptyPost(): BlogPost {
  return {
    id: "",
    title: "",
    excerpt: "",
    category: "Destination Guide",
    coverImage: "",
    coverAlt: "",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "",
    tags: [],
    publishedAt: new Date().toISOString().slice(0, 10),
    status: "draft",
    featured: false,
    sections: [makeBlogSection()],
    seoTitle: "",
    seoDescription: "",
  };
}

export default function AdminBlogEditor({
  initialPost,
  existingIds,
  onCancel,
  onSaved,
}: {
  initialPost?: BlogPost;
  /** Slugs already in use, so a new post cannot overwrite an old one. */
  existingIds: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const draftStorageKey = `${BLOG_DRAFT_IMAGE_KEY_PREFIX}${initialPost?.id ?? "new"}`;
  const draftImagesRef = useRef<string[]>([]);
  /** Last version written to Firestore, so an image delete can be applied
      to it without dragging unsaved edits along. */
  const persistedRef = useRef<BlogPost | undefined>(initialPost);
  const [post, setPost] = useState<BlogPost>(() => initialPost ?? emptyPost());
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost));
  const [tagsText, setTagsText] = useState(() => (initialPost?.tags ?? []).join(", "));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  /** Which uploader is busy: "cover" or a section id. */
  const [uploadingKey, setUploadingKey] = useState("");

  /* Retry anything a previous session failed to clean up before the tab was
     closed — same recovery the package builder does. */
  useEffect(() => {
    const stored = sessionStorage.getItem(draftStorageKey);
    if (!stored) return;
    sessionStorage.removeItem(draftStorageKey);
    try {
      const abandonedImages = [...new Set(JSON.parse(stored) as string[])];
      void Promise.allSettled(abandonedImages.map(deleteImageFromCloudflare)).then((results) => {
        const failed = abandonedImages.filter((_, index) => results[index].status === "rejected");
        if (failed.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(failed));
      });
    } catch {
      sessionStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey]);

  const rememberDraftImage = (image: string) => {
    draftImagesRef.current = [...new Set([...draftImagesRef.current, image])];
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draftImagesRef.current));
  };
  const forgetDraftImage = (image: string) => {
    draftImagesRef.current = draftImagesRef.current.filter((item) => item !== image);
    if (draftImagesRef.current.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(draftImagesRef.current));
    else sessionStorage.removeItem(draftStorageKey);
  };
  const abandonDraft = async () => {
    const images = [...draftImagesRef.current];
    const results = await Promise.allSettled(images.map(deleteImageFromCloudflare));
    const failed = images.filter((_, index) => results[index].status === "rejected");
    draftImagesRef.current = failed;
    if (failed.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(failed));
    else sessionStorage.removeItem(draftStorageKey);
  };

  const update = <Key extends keyof BlogPost>(key: Key, value: BlogPost[Key]) => {
    setPost((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  };

  /* While the post is new the slug tracks the title, which is what an editor
     expects; once they type one by hand — or the post already exists — it is
     left alone, because the slug is the article's public URL. */
  const handleTitleChange = (title: string) => {
    setPost((current) => ({ ...current, title, id: slugTouched ? current.id : slugify(title) }));
    setMessage("");
    setError("");
  };

  const updateSection = (id: string, patch: Partial<BlogSection>) =>
    setPost((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    }));

  const moveSection = (index: number, direction: -1 | 1) =>
    setPost((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.sections.length) return current;
      const sections = [...current.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...current, sections };
    });

  const handleUpload = async (file: File, apply: (url: string) => void, key: string) => {
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > 5_000_000) return setError("Each image must be 5 MB or smaller.");
    try {
      setUploadingKey(key);
      setError("");
      const url = await uploadBlogImage(file);
      rememberDraftImage(url);
      apply(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be uploaded.");
    } finally {
      setUploadingKey("");
    }
  };

  /* Deleting removes the object from R2 immediately, so a post that is
     already live has to stop pointing at the file in the same step. Only the
     image change is written: the editor's other unsaved edits stay unsaved
     until Save is pressed, which is why the transform is replayed against
     the last persisted copy rather than against the draft. */
  const handleImageDelete = async (image: string, transform: (target: BlogPost) => BlogPost) => {
    try {
      setError("");
      await deleteImageFromCloudflare(image);
      forgetDraftImage(image);
      setPost(transform);
      const persisted = persistedRef.current;
      if (persisted) {
        const next = transform(persisted);
        await saveBlogPost(next);
        persistedRef.current = next;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be deleted.");
    }
  };

  const clearCover = (target: BlogPost): BlogPost => ({ ...target, coverImage: "" });
  const clearSectionImage = (id: string) => (target: BlogPost): BlogPost => ({
    ...target,
    sections: target.sections.map((item) => (item.id === id ? { ...item, image: "" } : item)),
  });
  /* An article always keeps one block, so removing the last one leaves an
     empty replacement rather than nothing to type into. */
  const dropSection = (id: string) => (target: BlogPost): BlogPost => {
    const sections = target.sections.filter((item) => item.id !== id);
    return { ...target, sections: sections.length ? sections : [makeBlogSection()] };
  };

  const removeCover = () => {
    if (post.coverImage) void handleImageDelete(post.coverImage, clearCover);
  };

  const removeSectionImage = (id: string) => {
    const image = post.sections.find((item) => item.id === id)?.image;
    if (image) void handleImageDelete(image, clearSectionImage(id));
  };

  const removeSection = (id: string) => {
    const image = post.sections.find((item) => item.id === id)?.image;
    if (image) void handleImageDelete(image, dropSection(id));
    else setPost(dropSection(id));
  };

  const preview = useMemo(
    () => ({
      ...post,
      title: post.title || "Your guide headline",
      excerpt: post.excerpt || "A short summary shown on the guides index and in search results.",
      image: post.coverImage || post.sections.find((section) => section.image)?.image || "",
    }),
    [post],
  );

  const wordCount = useMemo(
    () => post.sections.reduce((total, section) => total + toParagraphs(section.body).join(" ").split(/\s+/).filter(Boolean).length, 0),
    [post.sections],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const slug = slugify(post.id || post.title);
    if (!post.title.trim()) return setError("Add a headline before saving.");
    if (!slug) return setError("Add a URL slug — it becomes the address of the article.");
    if (!initialPost && existingIds.includes(slug)) return setError(`The slug “${slug}” is already used by another post. Choose a different one.`);
    if (!post.excerpt.trim()) return setError("Add a short summary — it is what the guides index and search results show.");
    if (!post.coverImage) return setError("Upload a cover image for the article.");
    const sections = post.sections.filter((section) => section.heading.trim() || section.body.trim() || section.image);
    if (!sections.length) return setError("Write at least one content block.");
    if (!Number.isFinite(new Date(post.publishedAt).getTime())) return setError("Choose a valid publish date.");

    const nextPost: BlogPost = {
      ...post,
      id: slug,
      title: post.title.trim(),
      excerpt: post.excerpt.trim(),
      coverAlt: post.coverAlt.trim() || post.title.trim(),
      author: post.author.trim() || "CompareMyTrip",
      authorRole: post.authorRole.trim(),
      destination: post.destination.trim(),
      tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
      seoTitle: post.seoTitle.trim(),
      seoDescription: post.seoDescription.trim(),
      sections: sections.map((section) => ({
        ...section,
        heading: section.heading.trim(),
        body: section.body.trim(),
        imageAlt: section.imageAlt.trim() || section.heading.trim(),
        imageCaption: section.imageCaption.trim(),
      })),
    };

    try {
      setSaving(true);
      await saveBlogPost(nextPost);
      persistedRef.current = nextPost;
      draftImagesRef.current = [];
      sessionStorage.removeItem(draftStorageKey);
      setMessage(`“${nextPost.title}” is saved.`);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This post could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    await abandonDraft();
    onCancel();
  };

  const uploadHint = "JPG, PNG or WebP · up to 5 MB · files under 800 KB stay unchanged · larger files are compressed";

  return (
    <div className="font-body text-cmt-neutral-900">
      <div className="mb-8">
        <button
          type="button"
          disabled={saving || Boolean(uploadingKey)}
          onClick={() => void handleCancel()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cmt-neutral-500 disabled:opacity-50"
        >
          <ArrowLeft className="size-3.5" /> Back to blog posts
        </button>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {initialPost ? "Edit blog post" : "Write blog post"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">
          Everything here appears on the travel guides section of the website. Images are stored in Cloudflare R2 and only their address is kept in the database.
        </p>
      </div>

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
            <SectionTitle icon={<PenLine className="size-5" />} title="Headline and summary" copy="What a reader sees on the guides index." />
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <FieldLabel>Headline</FieldLabel>
                <input required value={post.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Three days in Munnar, without the crowds" className={inputClass} />
              </label>

              <label className="sm:col-span-2">
                <FieldLabel>URL slug</FieldLabel>
                <input
                  value={post.id}
                  onChange={(e) => { setSlugTouched(true); update("id", slugify(e.target.value)); }}
                  disabled={Boolean(initialPost)}
                  placeholder="three-days-in-munnar"
                  className={`${inputClass} disabled:bg-cmt-neutral-50 disabled:text-cmt-neutral-500`}
                />
                <span className="mt-1.5 block text-xs text-cmt-neutral-500">
                  {initialPost
                    ? "The address is fixed once a post is published, so existing links keep working."
                    : `Published at /blog/${post.id || "your-slug"}`}
                </span>
              </label>

              <label className="sm:col-span-2">
                <FieldLabel>Short summary</FieldLabel>
                <textarea value={post.excerpt} onChange={(e) => update("excerpt", e.target.value)} placeholder="Two or three sentences describing what the reader gets from this guide." className={textareaClass} />
              </label>

              <label>
                <FieldLabel>Category</FieldLabel>
                <select value={post.category} onChange={(e) => update("category", e.target.value as BlogCategory)} className={inputClass}>
                  {BLOG_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>

              <label>
                <FieldLabel>Destination (optional)</FieldLabel>
                <input value={post.destination} onChange={(e) => update("destination", e.target.value)} placeholder="Kerala" className={inputClass} />
                <span className="mt-1.5 block text-xs text-cmt-neutral-500">Links the article to matching packages.</span>
              </label>

              <label>
                <FieldLabel>Author</FieldLabel>
                <input value={post.author} onChange={(e) => update("author", e.target.value)} className={inputClass} />
              </label>

              <label>
                <FieldLabel>Author role</FieldLabel>
                <input value={post.authorRole} onChange={(e) => update("authorRole", e.target.value)} placeholder="Travel desk" className={inputClass} />
              </label>

              <label>
                <FieldLabel>Publish date</FieldLabel>
                <input type="date" value={post.publishedAt} onChange={(e) => update("publishedAt", e.target.value)} className={inputClass} />
              </label>

              <label>
                <FieldLabel>Tags (comma separated)</FieldLabel>
                <input value={tagsText} onChange={(e) => { setTagsText(e.target.value); setMessage(""); setError(""); }} placeholder="munnar, tea estates, monsoon" className={inputClass} />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => update("status", post.status === "published" ? "draft" : "published")}
                className={`inline-flex h-10 items-center gap-2 rounded-cmt-full border px-4 text-xs font-semibold ${
                  post.status === "published"
                    ? "border-cmt-success-500/30 bg-cmt-success-100 text-cmt-success-700"
                    : "border-cmt-neutral-200 bg-white text-cmt-neutral-600"
                }`}
              >
                {post.status === "published" ? <><Check className="size-3.5" /> Published — live on the website</> : "Draft — hidden from the website"}
              </button>
              <button
                type="button"
                onClick={() => update("featured", !post.featured)}
                className={`inline-flex h-10 items-center gap-2 rounded-cmt-full border px-4 text-xs font-semibold ${
                  post.featured ? "border-cmt-neutral-900 bg-cmt-neutral-900 text-white" : "border-cmt-neutral-200 bg-white text-cmt-neutral-600"
                }`}
              >
                {post.featured && <Check className="size-3.5" />} Feature at the top of /blog
              </button>
            </div>
          </section>

          <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
            <SectionTitle icon={<ImagePlus className="size-5" />} title="Cover image" copy="Used on the guides index, the article header and link previews." />
            <div className="mt-6 space-y-4">
              <BlogImageUpload
                label="Cover photo"
                hint={uploadHint}
                value={post.coverImage}
                busy={uploadingKey === "cover"}
                onUpload={(file) => void handleUpload(file, (url) => update("coverImage", url), "cover")}
                onRemove={removeCover}
              />
              <label>
                <FieldLabel>Cover image description (alt text)</FieldLabel>
                <input value={post.coverAlt} onChange={(e) => update("coverAlt", e.target.value)} placeholder="Tea estates on the hills above Munnar" className={inputClass} />
              </label>
            </div>
          </section>

          <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionTitle icon={<PenLine className="size-5" />} title="Article content" copy="Each block is a heading, its text and an optional photograph." />
              <button
                type="button"
                onClick={() => setPost((current) => ({ ...current, sections: [...current.sections, makeBlogSection()] }))}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-cmt-control bg-cmt-neutral-900 px-3 text-xs font-semibold text-white"
              >
                <Plus className="size-3.5" /> Add block
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {post.sections.map((section, index) => (
                <article key={section.id} className="rounded-cmt-md border border-cmt-neutral-200 bg-cmt-neutral-50 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="font-display text-base font-semibold">Block {index + 1}</p>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label="Move block up" disabled={index === 0} onClick={() => moveSection(index, -1)} className="grid size-8 place-items-center rounded-cmt-control border border-cmt-neutral-200 bg-white disabled:opacity-40">
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button type="button" aria-label="Move block down" disabled={index === post.sections.length - 1} onClick={() => moveSection(index, 1)} className="grid size-8 place-items-center rounded-cmt-control border border-cmt-neutral-200 bg-white disabled:opacity-40">
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button type="button" aria-label="Delete block" onClick={() => removeSection(section.id)} className="grid size-8 place-items-center rounded-cmt-control border border-cmt-error-500/30 bg-white text-cmt-error-700">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <label>
                      <FieldLabel>Heading (optional)</FieldLabel>
                      <input value={section.heading} onChange={(e) => updateSection(section.id, { heading: e.target.value })} placeholder="Where to stay" className={inputClass} />
                    </label>

                    <label>
                      <FieldLabel>Text</FieldLabel>
                      <textarea
                        value={section.body}
                        onChange={(e) => updateSection(section.id, { body: e.target.value })}
                        placeholder="Write the block. Leave a blank line between paragraphs."
                        className={`${textareaClass} min-h-40`}
                      />
                    </label>

                    <BlogImageUpload
                      label="Block image (optional)"
                      hint={uploadHint}
                      aspect="aspect-[16/10]"
                      value={section.image}
                      busy={uploadingKey === section.id}
                      onUpload={(file) => void handleUpload(file, (url) => updateSection(section.id, { image: url }), section.id)}
                      onRemove={() => removeSectionImage(section.id)}
                    />

                    {section.image && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label>
                          <FieldLabel>Image description (alt text)</FieldLabel>
                          <input value={section.imageAlt} onChange={(e) => updateSection(section.id, { imageAlt: e.target.value })} className={inputClass} />
                        </label>
                        <label>
                          <FieldLabel>Caption (optional)</FieldLabel>
                          <input value={section.imageCaption} onChange={(e) => updateSection(section.id, { imageCaption: e.target.value })} className={inputClass} />
                        </label>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
            <SectionTitle icon={<Search className="size-5" />} title="Search engine listing" copy="Leave blank to use the headline and summary." />
            <div className="mt-6 grid gap-5">
              <label>
                <FieldLabel>Search title</FieldLabel>
                <input value={post.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} placeholder={post.title || "Three days in Munnar"} className={inputClass} />
              </label>
              <label>
                <FieldLabel>Search description</FieldLabel>
                <textarea value={post.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} placeholder={post.excerpt || "A short description for Google results."} className={textareaClass} />
              </label>
            </div>
          </section>

          {error && <p role="alert" className="rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm font-medium text-cmt-error-700">{error}</p>}
          {message && <p role="status" className="rounded-cmt-control border border-cmt-success-500/20 bg-cmt-success-100 px-4 py-3 text-sm font-medium text-cmt-success-700">{message}</p>}

          <button
            disabled={saving || Boolean(uploadingKey)}
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-6 text-sm font-semibold shadow-cmt-primary hover:bg-cmt-primary-600 disabled:opacity-50 sm:w-auto"
          >
            <Save className="size-4" /> {saving ? "Saving…" : initialPost ? "Save changes" : "Save post"}
          </button>
        </form>

        <aside className="xl:sticky xl:top-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-neutral-500">Live card preview</p>
            <span className="text-[11px] text-cmt-success-700">● Updating</span>
          </div>

          <article className="overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-md">
            <div className="relative aspect-[16/10] bg-cmt-neutral-100">
              {preview.image ? (
                <Image src={preview.image} alt="" fill sizes="390px" className="object-cover" unoptimized={preview.image.startsWith("data:")} />
              ) : (
                <span className="grid size-full place-items-center text-cmt-neutral-400"><ImagePlus className="size-6" /></span>
              )}
              <span className="absolute left-3 top-3 rounded-cmt-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-cmt-neutral-700 backdrop-blur-sm">
                {post.category}
              </span>
            </div>
            <div className="p-5">
              <h2 className="font-display text-lg font-semibold leading-snug">{preview.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-cmt-neutral-600">{preview.excerpt}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-cmt-neutral-100 pt-4 text-xs text-cmt-neutral-500">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />{post.publishedAt}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" /><span className="tabular-nums">{readingMinutes(post)} min read</span></span>
              </div>
            </div>
          </article>

          <div className="mt-4 rounded-cmt-md bg-cmt-neutral-900 p-5 text-white">
            <div className="flex gap-3">
              <Sparkles className="size-5 shrink-0 text-cmt-primary-500" />
              <div>
                <p className="text-sm font-semibold">
                  {wordCount} words · {post.sections.length} block{post.sections.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-xs leading-5 text-cmt-neutral-300">
                  {post.status === "published"
                    ? "Saving publishes this article to /blog immediately."
                    : "Saved as a draft — switch it to Published when the copy is ready."}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
