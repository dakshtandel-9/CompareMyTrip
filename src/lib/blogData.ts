/* ------------------------------------------------------------------ */
/* Blog / travel-guide content model.                                   */
/*                                                                      */
/* A post is a cover image plus an ordered list of sections, where every */
/* section can carry its own image. That shape is what the CRM edits and */
/* what /blog renders, so the two never need a conversion step — the     */
/* same normaliser guards both against half-written Firestore documents. */
/* ------------------------------------------------------------------ */

export const BLOG_CATEGORIES = [
  "Destination Guide",
  "Itinerary",
  "Travel Tips",
  "Budget Travel",
  "Food & Culture",
  "Trekking",
  "Beaches",
  "Honeymoon",
  "Family Travel",
  "News",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** One block of the article body. Heading, text and image are each
    optional, so a section can be a photo with a caption, a run of copy, or
    both together. */
export type BlogSection = {
  id: string;
  heading: string;
  /** Paragraphs, separated by blank lines. Rendered as <p> per paragraph. */
  body: string;
  /** Cloudflare R2 URL, or empty when the section is text only. */
  image: string;
  imageAlt: string;
  imageCaption: string;
};

export type BlogPost = {
  /** Also the URL slug: /blog/<id>. */
  id: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  coverImage: string;
  coverAlt: string;
  author: string;
  authorRole: string;
  /** Optional destination name; links the article back to /packages. */
  destination: string;
  tags: string[];
  /** ISO date (yyyy-mm-dd) the post is dated with on the website. */
  publishedAt: string;
  status: "draft" | "published";
  /** Pulls the post into the large lead card at the top of /blog. */
  featured: boolean;
  sections: BlogSection[];
  seoTitle: string;
  seoDescription: string;
};

/* ----------------------------- Helpers ---------------------------- */

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Paragraph split shared by the reading-time estimate and the renderer, so
    the count and the layout always agree on what a paragraph is. */
export const toParagraphs = (body: string) =>
  body
    .split(/\n\s*\n|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const countWords = (value: string) => value.split(/\s+/).filter(Boolean).length;

/** Derived rather than typed in by the editor — one less field to keep
    honest when the copy is rewritten. Always at least a minute. */
export function readingMinutes(post: BlogPost): number {
  const words = post.sections.reduce(
    (total, section) => total + countWords(section.heading) + countWords(section.body),
    countWords(post.excerpt),
  );
  return Math.max(1, Math.round(words / 200));
}

export function formatBlogDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** First image the article actually has: its cover, else the first section
    photo. Keeps a card from rendering an empty frame when the editor only
    illustrated the body. */
export function blogPostImage(post: BlogPost): string {
  return post.coverImage || post.sections.find((section) => section.image)?.image || "";
}

/** Every image the post owns, for cleaning up R2 when it is deleted. */
export function blogPostImages(post: BlogPost): string[] {
  return [...new Set([post.coverImage, ...post.sections.map((section) => section.image)].filter(Boolean))];
}

export function makeBlogSection(): BlogSection {
  return {
    id: `section-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    heading: "",
    body: "",
    image: "",
    imageAlt: "",
    imageCaption: "",
  };
}

/* --------------------------- Normalising -------------------------- */
/* Firestore hands back `unknown`, and a document written by an older
   version of the CRM may be missing fields the page reads. Everything the
   website renders goes through here first. */

const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const bool = (value: unknown, fallback = false) => (typeof value === "boolean" ? value : fallback);

function normalizeSection(value: unknown, index: number): BlogSection {
  const section = (value ?? {}) as Partial<BlogSection>;
  return {
    id: str(section.id, `section-${index + 1}`),
    heading: str(section.heading),
    body: str(section.body),
    image: str(section.image),
    imageAlt: str(section.imageAlt),
    imageCaption: str(section.imageCaption),
  };
}

export function normalizeBlogPost(id: string, value: unknown): BlogPost {
  const post = (value ?? {}) as Partial<BlogPost>;
  const category = BLOG_CATEGORIES.includes(post.category as BlogCategory)
    ? (post.category as BlogCategory)
    : "Destination Guide";
  const sections = Array.isArray(post.sections) ? post.sections.map(normalizeSection) : [];

  return {
    id: str(post.id, id) || id,
    title: str(post.title, "Untitled post"),
    excerpt: str(post.excerpt),
    category,
    coverImage: str(post.coverImage),
    coverAlt: str(post.coverAlt, str(post.title)),
    author: str(post.author, "CompareMyTrip"),
    authorRole: str(post.authorRole, "Travel desk"),
    destination: str(post.destination),
    tags: Array.isArray(post.tags) ? post.tags.filter((tag): tag is string => typeof tag === "string") : [],
    publishedAt: str(post.publishedAt, new Date().toISOString().slice(0, 10)),
    status: post.status === "draft" ? "draft" : "published",
    featured: bool(post.featured),
    sections: sections.length ? sections : [makeBlogSection()],
    seoTitle: str(post.seoTitle),
    seoDescription: str(post.seoDescription),
  };
}

/** Newest first, and a post without a valid date sorts last rather than
    jumping to the top of the index. */
export function sortBlogPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    const left = new Date(a.publishedAt).getTime();
    const right = new Date(b.publishedAt).getTime();
    if (Number.isNaN(left) && Number.isNaN(right)) return a.title.localeCompare(b.title);
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    return right - left;
  });
}

/** Same destination first, then same category, then simply recent — so a
    new blog with three posts still fills its "keep reading" rail. */
export function relatedBlogPosts(post: BlogPost, posts: BlogPost[], limit = 3): BlogPost[] {
  const score = (candidate: BlogPost) =>
    (candidate.destination && candidate.destination === post.destination ? 2 : 0) +
    (candidate.category === post.category ? 1 : 0);

  return posts
    .filter((candidate) => candidate.id !== post.id)
    .sort((a, b) => score(b) - score(a) || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}
