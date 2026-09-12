import type { TravelPackage } from "@/lib/packageData";

/* ------------------------------------------------------------------ */
/* Weekend treks, grouped into three tracks.                            */
/*                                                                      */
/* Like the destination list, this is derived from the live catalogue    */
/* rather than a fixed list of treks: a trek joins a track by what it is */
/* called, so the grouping survives a catalogue that is edited in /admin */
/* and re-imported with fresh ids. Matching on ids would only hold for   */
/* the sample data — the real packages come from Firestore.             */
/*                                                                      */
/* A trek belongs to exactly one track — the first that claims it — so   */
/* no card is rendered twice on a page showing all three. The last track */
/* is the catch-all, so a trek nobody thought to name here is still      */
/* reachable rather than silently invisible.                             */
/* ------------------------------------------------------------------ */

/** The category a package carries to count as a weekend trek at all. */
export const WEEKEND_TREKS_CATEGORY = "Weekend Treks";

/** Free-form so a new track is one entry in WEEKEND_TRACKS below and
    nothing else — no type to widen, no switch to extend. */
export type WeekendTrackId = string;

export type WeekendTrack = {
  id: WeekendTrackId;
  label: string;
  tagline: string;
  /** The catalogue masthead uses the menu's customer-facing wording rather
      than the shorter internal track label. */
  bannerTitle: string;
  bannerImage: string;
  /** Matched case-insensitively against the trek's title and location.
      First track to match wins, so keep these specific. */
  keywords: string[];
  /** Takes any weekend trek no other track claimed. Exactly one track has it. */
  catchAll?: boolean;
};

export const WEEKEND_TRACKS: WeekendTrack[] = [
  {
    id: "sunrise",
    label: "Sunrise Trek",
    tagline: "Pre-dawn starts on the hills nearest the city — summit for first light, home by lunch.",
    bannerTitle: "Sunrise Treks",
    bannerImage: "/weekend-treks/skandagiri.jpg",
    keywords: ["sunrise", "skandagiri", "nandi"],
  },
  {
    id: "monsoon",
    label: "Monsoon Trek",
    tagline: "Western Ghats trails at their greenest. Best walked June to September, leeches and all.",
    bannerTitle: "Monsoon Treks",
    bannerImage: "/weekend-treks/kodachadri.jpg",
    keywords: ["monsoon", "kodachadri", "tadiandamol"],
  },
  {
    id: "escapes",
    label: "Weekend Escape",
    tagline: "One night on the trail, back in time for Monday.",
    bannerTitle: "Weekend Escape",
    bannerImage: "/weekend-treks/kumara-parvatha.jpg",
    keywords: ["kumara parvatha", "savandurga"],
    catchAll: true,
  },
];

/** Every weekend trek in the catalogue, whatever track it belongs to. */
export function weekendTreks(packages: TravelPackage[]): TravelPackage[] {
  return packages.filter((pkg) => pkg.tags.includes(WEEKEND_TREKS_CATEGORY));
}

export type WeekendTrackGroup = {
  track: WeekendTrack;
  items: TravelPackage[];
};

/** The treks under each track, in the order the tracks are declared. */
export function groupWeekendTracks(packages: TravelPackage[]): WeekendTrackGroup[] {
  const treks = weekendTreks(packages);
  const groups = new Map<WeekendTrackId, TravelPackage[]>(
    WEEKEND_TRACKS.map((track) => [track.id, []]),
  );

  const fallback = WEEKEND_TRACKS.find((track) => track.catchAll) ?? WEEKEND_TRACKS.at(-1);

  for (const trek of treks) {
    const haystack = `${trek.title} ${trek.location}`.toLowerCase();
    const claimed = WEEKEND_TRACKS.find((track) =>
      track.keywords.some((keyword) => haystack.includes(keyword)),
    );

    const target = claimed ?? fallback;
    if (target) groups.get(target.id)!.push(trek);
  }

  return WEEKEND_TRACKS.map((track) => ({ track, items: groups.get(track.id)! }));
}


/* ------------------------------------------------------------------ */
/* Card summaries.                                                      */
/*                                                                      */
/* Shaped like DestinationSummary on purpose: a track reads as another   */
/* way into the catalogue, so it gets the same card as India and         */
/* International rather than a list of trek names.                       */
/* ------------------------------------------------------------------ */

export type WeekendTrackSummary = {
  id: WeekendTrackId;
  label: string;
  tagline: string;
  /** How many treks are on this track. */
  count: number;
  fromPrice: number;
  /** First trek photo on the track; empty when none of them has one. */
  image: string;
  minDays: number;
  maxDays: number;
  /** Travel styles across the track's treks, commonest first. */
  styles: string[];
};

/** Every weekend trek, whatever track it is on. */
export const ALL_TRACKS = "all";

/** The ?category= value that asks for every weekend trek at once. */
export const WEEKEND_TREKS_SLUG = "weekend-treks";

/** Where a track opens in the catalogue.

    One parameter, and the track's own name in it: /packages?category=monsoon.
    The catalogue used to want the category *and* the track
    (?category=Weekend%20Treks&trek=monsoon), which said the same thing twice
    and read badly in the address bar. Those links still work — see
    trackFromParams — but nothing produces them any more. */
export const trackHref = (id: WeekendTrackId) =>
  `/packages?category=${encodeURIComponent(id === ALL_TRACKS ? WEEKEND_TREKS_SLUG : id)}`;

/** Reads a track out of one parameter value. Anything unrecognised means
    "not a track", so a stale or hand-typed link degrades to a plain
    category rather than an empty grid. */
export function parseTrackId(value: string | null): WeekendTrackId | null {
  const normalized = value?.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!normalized) return null;
  if (normalized === ALL_TRACKS || normalized === WEEKEND_TREKS_SLUG) return ALL_TRACKS;
  return WEEKEND_TRACKS.some((track) => track.id === normalized) ? normalized : null;
}

/** The track a /packages URL is asking for, across both spellings:
    ?category=monsoon today, ?category=Weekend%20Treks&trek=monsoon from
    older links and menus. The legacy ?trek= wins where both are present,
    since it is the more specific half of that pair. */
export function trackFromParams(
  category: string | null,
  trek: string | null,
): WeekendTrackId | null {
  return parseTrackId(trek) ?? parseTrackId(category);
}

/** The treks a ?trek= value selects. */
export function treksOnTrack(
  packages: TravelPackage[],
  trackId: WeekendTrackId,
): TravelPackage[] {
  if (trackId === ALL_TRACKS) return weekendTreks(packages);
  return groupWeekendTracks(packages).find((group) => group.track.id === trackId)?.items ?? [];
}

/** One card per track. Tracks with no treks are dropped rather than
    rendered as an empty card. */
export function buildWeekendTrackSummaries(
  packages: TravelPackage[],
): WeekendTrackSummary[] {
  return groupWeekendTracks(packages)
    .filter((group) => group.items.length > 0)
    .map(({ track, items }) => {
      const styleCounts = new Map<string, number>();
      for (const trek of items) {
        for (const tag of trek.tags) {
          if (tag === WEEKEND_TREKS_CATEGORY) continue;
          styleCounts.set(tag, (styleCounts.get(tag) ?? 0) + 1);
        }
      }

      const days = items.map((trek) => trek.days).filter((value) => value > 0);

      return {
        id: track.id,
        label: track.label,
        tagline: track.tagline,
        count: items.length,
        fromPrice: Math.min(...items.map((trek) => trek.price)),
        image: items.find((trek) => trek.image)?.image ?? "",
        minDays: days.length ? Math.min(...days) : 0,
        maxDays: days.length ? Math.max(...days) : 0,
        styles: [...styleCounts.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 3)
          .map(([style]) => style),
      };
    });
}

/* ------------------------------------------------------------------ */
/* Difficulty                                                           */
/*                                                                      */
/* The grade lives on the weekend-trek entries in site content, not on   */
/* the package, so a card has to be matched back to its trek. Ids line   */
/* up in the seed data; a live catalogue is re-imported from Firestore    */
/* with fresh ids, so fall back to the trek's name appearing in the       */
/* package — the same loose matching the tracks above use.               */
/* ------------------------------------------------------------------ */

export const TREK_GRADE_LABELS: Record<number, string> = {
  1: "Easy",
  2: "Moderate",
  3: "Difficult",
};

type GradedTrek = { id: string; name: string; grade: number };

/** The difficulty grade (1–3) of a package that is a weekend trek, or
    undefined for anything else — including a trek nothing matches, so the
    card says nothing rather than guessing a grade. */
export function trekGrade(
  pkg: TravelPackage,
  treks: readonly GradedTrek[],
): number | undefined {
  if (!pkg.tags.includes(WEEKEND_TREKS_CATEGORY)) return undefined;

  const byId = treks.find((trek) => trek.id === pkg.id);
  if (byId) return byId.grade;

  const haystack = `${pkg.title} ${pkg.location}`.toLowerCase();
  return treks.find((trek) => haystack.includes(trek.name.toLowerCase()))?.grade;
}
