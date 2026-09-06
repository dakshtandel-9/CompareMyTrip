/* ------------------------------------------------------------------ */
/* Google Business Profile — shapes shared by the CRM and the server.   */
/*                                                                      */
/* This module is import-safe from the browser: it holds types and pure */
/* mapping, never a credential and never a network call. Everything     */
/* that touches the client secret or the refresh token lives in         */
/* googleBusinessServer.ts, which must stay server-only.                */
/* ------------------------------------------------------------------ */

import type { Review } from "@/lib/siteContent";

/** The one scope the Business Profile APIs read and write through. */
export const GOOGLE_BUSINESS_SCOPE = "https://www.googleapis.com/auth/business.manage";

/** Where the synced reviews are published for the homepage to read. */
export const GOOGLE_REVIEWS_DOC = { collection: "siteContent", id: "googleReviews" } as const;

/** Where the credentials live. Server-only: see firestore.rules. */
export const GOOGLE_INTEGRATION_DOC = { collection: "integrations", id: "googleBusiness" } as const;

/* --------------------------- CRM status --------------------------- */

/** One Business Profile location, as the CRM lists it. */
export type GoogleLocation = {
  /** "accounts/123/locations/456" — the name the reviews API wants. */
  name: string;
  title: string;
  address: string;
  /** Google's own average for the location, 0 when it has no reviews. */
  averageRating: number;
  totalReviewCount: number;
};

/**
 * What the CRM is allowed to know about the connection.
 *
 * Deliberately free of secrets: the client id is shown back so an admin can
 * confirm which Google project is wired up, but the client secret and the
 * refresh token never leave the server, so neither has a field here.
 */
export type GoogleBusinessStatus = {
  /** Credentials saved and an account authorised. */
  connected: boolean;
  /** Client id is stored, but nobody has finished the consent screen yet. */
  credentialsSaved: boolean;
  clientId: string;
  /** The Google account that granted consent. */
  account: string;
  locations: GoogleLocation[];
  /** ISO timestamp of the last successful sync, "" if never. */
  lastSyncedAt: string;
  /** How many reviews the last sync published. */
  lastSyncCount: number;
  /** Whatever went wrong last, in words an admin can act on. */
  error: string;
  /**
   * True when Google answered but refused the reviews scope — the signature
   * of an unapproved project, which is a waiting problem rather than a
   * wiring problem and needs different advice in the UI.
   */
  awaitingApproval: boolean;
  /** Whether the server has a redirect URI configured to complete OAuth. */
  redirectUri: string;
};

export const EMPTY_GOOGLE_STATUS: GoogleBusinessStatus = {
  connected: false,
  credentialsSaved: false,
  clientId: "",
  account: "",
  locations: [],
  lastSyncedAt: "",
  lastSyncCount: 0,
  error: "",
  awaitingApproval: false,
  redirectUri: "",
};

/* ------------------------- Google payloads ------------------------ */

/** Star ratings arrive as an enum, not a number. */
const STAR_VALUES: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export type GoogleReview = {
  reviewId?: string;
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewer?: {
    displayName?: string;
    profilePhotoUrl?: string;
    isAnonymous?: boolean;
  };
};

/** "Ananya Kulkarni" → "AK", for the disc shown when there is no photo. */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  const letters = parts.slice(0, 2).map((part) => part[0]!.toUpperCase());
  return letters.join("");
}

/** "2026-04-11T09:12:00Z" → "Reviewed April 2026". */
export function reviewedLabel(iso: string): string {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "";
  return `Reviewed ${date.toLocaleString("en-GB", { month: "long", year: "numeric" })}`;
}

/**
 * A Google review in the shape the homepage rail already renders.
 *
 * Returns null for the ones there is no honest way to show: an empty
 * comment would render as a blank card, and a rating Google did not
 * specify cannot be invented as five stars.
 *
 * Anonymous reviewers keep their anonymity — Google omits the name and
 * photo for them, so they show as "A Google reviewer" with an initial
 * rather than being dropped, because their star rating still counts.
 */
export function toReview(
  review: GoogleReview,
  locationTitle: string,
): Review | null {
  const quote = (review.comment ?? "").trim();
  const rating = STAR_VALUES[review.starRating ?? ""] ?? 0;
  if (!quote || !rating) return null;

  const anonymous = review.reviewer?.isAnonymous === true;
  const name = anonymous ? "A Google reviewer" : (review.reviewer?.displayName ?? "").trim();
  if (!name) return null;

  return {
    /* Prefixed so a Google review can never collide with a hand-written
       one, and so the merge can tell the two apart by id alone. */
    id: `google-${review.reviewId ?? review.createTime ?? name}`,
    quote,
    name,
    initials: initialsFrom(name),
    avatar: anonymous ? "" : (review.reviewer?.profilePhotoUrl ?? ""),
    trip: locationTitle,
    travelled: reviewedLabel(review.updateTime || review.createTime || ""),
    rating,
  };
}

/**
 * The homepage list: the CRM's own reviews first, then Google's.
 *
 * Order is the point — the travel desk chose which traveller's words open
 * the rail, and a sync must not be able to push that choice off the front.
 */
export function mergeReviews(curated: Review[], google: Review[]): Review[] {
  const taken = new Set(curated.map((review) => review.id));
  return [...curated, ...google.filter((review) => !taken.has(review.id))];
}
