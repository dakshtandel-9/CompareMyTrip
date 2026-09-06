/* ------------------------------------------------------------------ */
/* Google Business Profile — the half that holds secrets.               */
/*                                                                      */
/* NEVER import this into a client component. It reads the OAuth client */
/* secret and the refresh token, either of which is enough to act as    */
/* the business on Google.                                              */
/*                                                                      */
/* Those two live in Firestore at integrations/googleBusiness, which    */
/* firestore.rules denies to every client — reads included. Only the    */
/* Admin SDK, which bypasses rules, can see them. They deliberately do  */
/* NOT live in siteContent/homepage: that document is `allow read: if   */
/* true` because the homepage subscribes to it from the browser, so     */
/* anything written there is published to every visitor on the site.    */
/* ------------------------------------------------------------------ */

import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import {
  GOOGLE_BUSINESS_SCOPE,
  GOOGLE_INTEGRATION_DOC,
  GOOGLE_REVIEWS_DOC,
  toReview,
  type GoogleLocation,
  type GoogleReview,
} from "@/lib/googleBusiness";
import type { Review } from "@/lib/siteContent";

const ACCOUNTS_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const INFO_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const REVIEWS_API = "https://mybusiness.googleapis.com/v4";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** The stored record. Only ever read and written through this module. */
type StoredIntegration = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  account: string;
  locations: GoogleLocation[];
  lastSyncedAt: string;
  lastSyncCount: number;
  error: string;
  awaitingApproval: boolean;
  /* One-use CSRF token for the consent round trip; see the oauth route. */
  oauthState: string;
  oauthStateExpiresAt: number;
};

const BLANK: StoredIntegration = {
  clientId: "",
  clientSecret: "",
  refreshToken: "",
  account: "",
  locations: [],
  lastSyncedAt: "",
  lastSyncCount: 0,
  error: "",
  awaitingApproval: false,
  oauthState: "",
  oauthStateExpiresAt: 0,
};

/**
 * Where Google sends the browser back after consent.
 *
 * Must match a redirect URI registered on the OAuth client character for
 * character, which is the single most common reason a first connection
 * fails, so the CRM shows this string for copying rather than describing it.
 */
export function redirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (!base) return "";
  return `${base}/api/integrations/google-business/callback`;
}

export async function loadIntegration(): Promise<StoredIntegration> {
  const db = getAdminDb();
  if (!db) return BLANK;

  const snapshot = await db
    .collection(GOOGLE_INTEGRATION_DOC.collection)
    .doc(GOOGLE_INTEGRATION_DOC.id)
    .get();

  if (!snapshot.exists) return BLANK;
  return { ...BLANK, ...(snapshot.data() as Partial<StoredIntegration>) };
}

export async function saveIntegration(patch: Partial<StoredIntegration>): Promise<void> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin is not configured on the server.");

  await db
    .collection(GOOGLE_INTEGRATION_DOC.collection)
    .doc(GOOGLE_INTEGRATION_DOC.id)
    .set(patch, { merge: true });
}

export async function clearIntegration(): Promise<void> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin is not configured on the server.");

  await db
    .collection(GOOGLE_INTEGRATION_DOC.collection)
    .doc(GOOGLE_INTEGRATION_DOC.id)
    .set(BLANK);
}

/* ---------------------------- OAuth ------------------------------- */

/** The consent URL. `access_type=offline` + `prompt=consent` is what makes
    Google return a refresh token; without both, a re-connection silently
    yields an access token that expires in an hour and never renews. */
export function consentUrl(clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GOOGLE_BUSINESS_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function postToken(body: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const detail = typeof payload.error_description === "string" ? payload.error_description : "";
    throw new Error(detail || `Google refused the token request (${response.status}).`);
  }
  return payload;
}

/** Consent code → refresh token, at the end of the callback. */
export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const payload = await postToken({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });

  const refresh = payload.refresh_token;
  if (typeof refresh !== "string" || !refresh) {
    throw new Error(
      "Google did not return a refresh token. Remove this app at myaccount.google.com/permissions and connect again.",
    );
  }
  return refresh;
}

/** Refresh token → a short-lived access token for one batch of calls. */
async function accessToken(integration: StoredIntegration): Promise<string> {
  const payload = await postToken({
    client_id: integration.clientId,
    client_secret: integration.clientSecret,
    refresh_token: integration.refreshToken,
    grant_type: "refresh_token",
  });

  const token = payload.access_token;
  if (typeof token !== "string" || !token) throw new Error("Google returned no access token.");
  return token;
}

/* --------------------------- API calls ---------------------------- */

/** Raised when Google authenticates the caller but refuses the data —
    the shape an unapproved project takes. Carried as its own class so the
    CRM can tell "waiting on Google" apart from "wired up wrong". */
export class NotApprovedError extends Error {}

async function googleGet<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 403 || response.status === 429) {
    throw new NotApprovedError(
      "Google accepted the sign-in but refused the data. This is what an unapproved project looks like: quota sits at 0 until Google grants API access.",
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(body.error?.message || `Google returned ${response.status}.`);
  }

  return (await response.json()) as T;
}

/** The first account the authorised user manages. */
async function firstAccount(token: string): Promise<string> {
  const data = await googleGet<{ accounts?: Array<{ name?: string }> }>(
    `${ACCOUNTS_API}/accounts`,
    token,
  );

  const name = data.accounts?.[0]?.name;
  if (!name) throw new Error("That Google account manages no Business Profile.");
  return name;
}

/* readMask is required on this endpoint; omitting it is a 400, not a
   default. Only the fields the CRM actually shows are asked for. */
const LOCATION_MASK = "name,title,storefrontAddress";

type RawLocation = {
  name?: string;
  title?: string;
  storefrontAddress?: { addressLines?: string[]; locality?: string; postalCode?: string };
};

function formatAddress(location: RawLocation): string {
  const address = location.storefrontAddress;
  if (!address) return "";
  return [...(address.addressLines ?? []), address.locality, address.postalCode]
    .filter(Boolean)
    .join(", ");
}

/** Every location on the account, following pagination to the end. */
async function listLocations(account: string, token: string): Promise<GoogleLocation[]> {
  const locations: GoogleLocation[] = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({ readMask: LOCATION_MASK, pageSize: "100" });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await googleGet<{ locations?: RawLocation[]; nextPageToken?: string }>(
      `${INFO_API}/${account}/locations?${params}`,
      token,
    );

    for (const raw of data.locations ?? []) {
      if (!raw.name) continue;
      locations.push({
        /* v1 returns "locations/456" but the reviews API is v4 and wants
           "accounts/123/locations/456". Compose it here so the rest of the
           module only ever handles the full name. */
        name: raw.name.startsWith("accounts/") ? raw.name : `${account}/${raw.name}`,
        title: raw.title ?? "Untitled location",
        address: formatAddress(raw),
        averageRating: 0,
        totalReviewCount: 0,
      });
    }

    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return locations;
}

/** Every review for one location, paginated, mapped to the homepage shape. */
async function listReviews(
  location: GoogleLocation,
  token: string,
): Promise<{ reviews: Review[]; averageRating: number; totalReviewCount: number }> {
  const reviews: Review[] = [];
  let pageToken = "";
  let averageRating = 0;
  let totalReviewCount = 0;

  do {
    const params = new URLSearchParams({ pageSize: "50" });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await googleGet<{
      reviews?: GoogleReview[];
      averageRating?: number;
      totalReviewCount?: number;
      nextPageToken?: string;
    }>(`${REVIEWS_API}/${location.name}/reviews?${params}`, token);

    averageRating = data.averageRating ?? averageRating;
    totalReviewCount = data.totalReviewCount ?? totalReviewCount;

    for (const raw of data.reviews ?? []) {
      const mapped = toReview(raw, location.title);
      if (mapped) reviews.push(mapped);
    }

    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return { reviews, averageRating, totalReviewCount };
}

/* ----------------------------- Sync ------------------------------- */

/**
 * Pull every location and its reviews, publish them, and record what
 * happened on the integration document for the CRM to read back.
 *
 * The published document is separate from siteContent/homepage on purpose:
 * a sync must never be able to overwrite what the travel desk wrote by
 * hand, and the homepage merges the two at render time instead.
 */
export async function syncGoogleReviews(): Promise<{ count: number; locations: GoogleLocation[] }> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin is not configured on the server.");

  const integration = await loadIntegration();
  if (!integration.refreshToken) throw new Error("No Google account is connected yet.");

  const token = await accessToken(integration);
  const account = integration.account || (await firstAccount(token));
  const locations = await listLocations(account, token);

  const collected: Review[] = [];
  for (const location of locations) {
    const result = await listReviews(location, token);
    location.averageRating = result.averageRating;
    location.totalReviewCount = result.totalReviewCount;
    collected.push(...result.reviews);
  }

  /* Newest first, so the rail opens on the most recent word about the
     business rather than whatever Google happened to return first. */
  collected.sort((a, b) => b.travelled.localeCompare(a.travelled));

  await db
    .collection(GOOGLE_REVIEWS_DOC.collection)
    .doc(GOOGLE_REVIEWS_DOC.id)
    .set({ items: collected, syncedAt: new Date().toISOString() });

  await saveIntegration({
    account,
    locations,
    lastSyncedAt: new Date().toISOString(),
    lastSyncCount: collected.length,
    error: "",
    awaitingApproval: false,
  });

  return { count: collected.length, locations };
}
