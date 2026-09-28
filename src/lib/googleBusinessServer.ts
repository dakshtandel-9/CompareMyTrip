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
  selectedLocation: string;
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
  selectedLocation: "",
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
  const override = process.env.GOOGLE_BUSINESS_REDIRECT_URI?.trim();
  if (override) return override;
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

  const batch = db.batch();
  batch.set(db.collection(GOOGLE_INTEGRATION_DOC.collection).doc(GOOGLE_INTEGRATION_DOC.id), BLANK);
  batch.delete(db.collection(GOOGLE_REVIEWS_DOC.collection).doc(GOOGLE_REVIEWS_DOC.id));
  await batch.commit();
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

/** Raised only when Google explicitly reports zero quota. */
export class NotApprovedError extends Error {}

async function googleGet<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string; details?: Array<{ metadata?: { quota_limit_value?: string | number } }> };
    };
    const detail = body.error?.message || "";
    // 403 also means missing permissions/disabled APIs; 429 can be a temporary
    // rate limit. Only an explicit zero quota indicates approval is missing.
    const zeroQuota = body.error?.details?.some(item =>
      item.metadata?.quota_limit_value === "0" || item.metadata?.quota_limit_value === 0,
    );
    if ((response.status === 403 || response.status === 429) && (zeroQuota || /(?:quota|limit)[\s\S]*?(?:value[:=]?\s*0\b|\b0\s*(?:per|requests|queries|qpm))/i.test(detail))) {
      throw new NotApprovedError("Google reports zero API quota. Check Basic API Access approval for this Cloud project.");
    }
    if (response.status === 429) throw new Error("Google's request quota was exceeded. Retry later; if quota is 0 in Cloud Console, request Basic API Access.");
    if (response.status === 403) throw new Error(`Google denied access. Check the three Business Profile APIs are enabled, project approval, and this account's location permissions. ${detail}`);
    throw new Error(detail || `Google returned ${response.status}.`);
  }

  return (await response.json()) as T;
}

/** Follow account pagination; the business may belong to a business group. */
async function listAccounts(token: string): Promise<string[]> {
  const accounts: string[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({ pageSize: "20" });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await googleGet<{ accounts?: Array<{ name?: string }>; nextPageToken?: string }>(`${ACCOUNTS_API}/accounts?${params}`, token);
    for (const account of data.accounts ?? []) if (account.name) accounts.push(account.name);
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  if (!accounts.length) throw new Error("That Google account manages no Business Profile.");
  return accounts;
}

export async function discoverGoogleLocations(): Promise<GoogleLocation[]> {
  const integration = await loadIntegration();
  if (!integration.refreshToken) throw new Error("Connect your Google account first.");
  const token = await accessToken(integration);
  const locations: GoogleLocation[] = [];
  for (const account of await listAccounts(token)) locations.push(...await listLocations(account, token));
  const seen = new Set<string>();
  const unique = locations.filter(location => {
    const id = location.name.split("/locations/")[1];
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  await saveIntegration({ locations: unique, error: "", awaitingApproval: false });
  return unique;
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
    const params = new URLSearchParams({ pageSize: "50", orderBy: "updateTime desc" });
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
      if (mapped && !reviews.some(item => item.id === mapped.id)) reviews.push(mapped);
      if (reviews.length >= 100) break;
    }

    pageToken = data.nextPageToken ?? "";
  } while (pageToken && reviews.length < 100);

  return { reviews, averageRating, totalReviewCount };
}

/* ----------------------------- Sync ------------------------------- */

/**
 * Pull the selected location’s reviews, publish them, and record what
 * happened on the integration document for the CRM to read back.
 *
 * The published document is separate from siteContent/homepage on purpose:
 * a sync must never be able to overwrite what the travel desk wrote by
 * hand, and the homepage merges the two at render time instead.
 */
export async function syncGoogleReviews(selected?: string): Promise<{ count: number; locations: GoogleLocation[] }> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin is not configured on the server.");
  const integration = await loadIntegration();
  if (!integration.refreshToken) throw new Error("No Google account is connected yet.");
  const name = selected ?? integration.selectedLocation;
  // Accept only a location discovered via this connection, never an arbitrary
  // resource supplied by the browser or every business the account manages.
  const location = integration.locations.find(item => item.name === name);
  if (!location) throw new Error("Load your businesses and select CompareMyTrip before syncing.");
  const token = await accessToken(integration);
  const result = await listReviews(location, token);
  const updated = { ...location, averageRating: result.averageRating, totalReviewCount: result.totalReviewCount };
  const locations = integration.locations.map(item => item.name === name ? updated : item);
  const now = new Date();
  // A limited display cache, refreshed daily. The cleanup job removes it
  // before Google's 30-day storage limit even if authorization later fails.
  const expiresAt = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000).toISOString();
  const items = result.reviews.slice(0, 100);
  const batch = db.batch();
  batch.set(db.collection(GOOGLE_REVIEWS_DOC.collection).doc(GOOGLE_REVIEWS_DOC.id), {
    items, syncedAt: now.toISOString(), expiresAt,
  });
  batch.set(db.collection(GOOGLE_INTEGRATION_DOC.collection).doc(GOOGLE_INTEGRATION_DOC.id), {
    account: name.split("/locations/")[0], selectedLocation: name, locations,
    lastSyncedAt: now.toISOString(), lastSyncCount: items.length,
    error: "", awaitingApproval: false,
  }, { merge: true });
  await batch.commit();
  return { count: items.length, locations };
}

/** Runs before scheduled sync so repeated Google failures cannot retain old reviews. */
export async function removeExpiredGoogleReviews(): Promise<void> {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase Admin is not configured on the server.");
  const ref = db.collection(GOOGLE_REVIEWS_DOC.collection).doc(GOOGLE_REVIEWS_DOC.id);
  await db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return;
    const expiry = Date.parse(snapshot.data()?.expiresAt ?? "");
    if (!Number.isFinite(expiry) || expiry <= Date.now()) tx.delete(ref);
  });
}
