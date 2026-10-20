/* Budgets and trip lengths in a package search ("trip under 1k", "beach
   below ₹10,000", "3 nights", "5k-10k"), read in code rather than left to
   the model: a price limit is arithmetic, and arithmetic should never be a
   judgment call. What is left over ("beach", "honeymoon abroad") is the
   part Jev is asked about.

   Self-contained on purpose so tests/search-constraints.test.mjs can run it
   without a bundler. */

export type SearchConstraints = {
  minPrice?: number;
  maxPrice?: number;
  /** Trip length in days, read as the longer of days and nights so an
      overnight-bus "3N / 2D" weekend counts as three days away. */
  minSpan?: number;
  maxSpan?: number;
  nights?: number;
  /** The search with budgets and lengths taken out. */
  remainder: string;
  /** The remainder asks for nothing beyond "a trip", so every package that
      meets the limits is a match and there is nothing to ask Jev. */
  generic: boolean;
};

type Sized = { price: number; days: number; nights: number };

const NUMBER_WORDS: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
};

/* Words that only say "a trip" — a remainder made of nothing else is generic. */
const FILLER = new Set(
  ("trip trips travel travels tour tours package packages pkg holiday holidays vacation vacations " +
    "getaway getaways plan plans place places destination destinations option options escape escapes " +
    "something anything any all some a an the for to of in on at with and or is are it " +
    "me my us our i we want need looking look show find give get suggest recommend please " +
    "best good nice great price prices cost costs budget rs inr rupees per person pp each " +
    "day days night nights long length duration trip's").split(" "),
);

const CURRENCY = String.raw`(?:₹|rs\.?|inr)`;
const AMOUNT = String.raw`${CURRENCY}?\s*(\d+(?:\.\d+)?)(?![\d.])\s*(k|thousand|lakhs?|lacs?|l)?(?:\s*(?:rs\.?|inr|rupees|\/-))?(?![a-z])`;

const MAX_WORDS = String.raw`under|below|less than|lesser than|cheaper than|within|upto|up to|max(?:imum)?|at most|no more than|not more than|not above|till|budget(?: of| is)?|<=?`;
const MIN_WORDS = String.raw`above|over|more than|at least|min(?:imum)?|starting(?: at| from)?|>=?`;
const ABOUT_WORDS = String.raw`around|about|approx(?:imately)?|roughly|near(?:ly)?`;

function rupees(digits: string, suffix: string | undefined) {
  const value = Number(digits);
  if (!suffix) return value;
  if (suffix === "k" || suffix === "thousand") return value * 1_000;
  return value * 100_000;
}

/* A bare number is only a price when it says so — a currency sign, a "k",
   or big enough that it cannot be a head count ("trip for 2"). */
function plausiblePrice(match: string, value: number, suffix: string | undefined) {
  return Boolean(suffix) || /₹|rs|inr|rupees|\/-/.test(match) || value >= 100;
}

export function parseSearch(query: string): SearchConstraints {
  const result: Omit<SearchConstraints, "remainder" | "generic"> = {};
  let text = ` ${query.toLowerCase()} `
    .replace(/(\d),(\d)/g, "$1$2")
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g, (word) => NUMBER_WORDS[word]);

  const take = (pattern: RegExp, handle: (...groups: string[]) => boolean) => {
    text = text.replace(pattern, (whole, ...groups: string[]) => (handle(whole, ...groups) ? " " : whole));
  };

  /* Lengths first, so "2-3 days" is never read as a price range. */
  take(/(\d+)\s*n\s*(?:\/|and|&)?\s*(\d+)\s*d\b/g, (_, n, d) => {
    result.nights = Number(n);
    result.minSpan = result.maxSpan = Math.max(Number(n), Number(d));
    return true;
  });
  take(new RegExp(String.raw`(?:${MAX_WORDS})\s*(\d+)\s*-?\s*(days?|nights?|weeks?)\b`, "g"), (_, n, unit) => {
    result.maxSpan = Number(n) * (unit.startsWith("week") ? 7 : 1);
    return true;
  });
  take(new RegExp(String.raw`(?:${MIN_WORDS})\s*(\d+)\s*-?\s*(days?|nights?|weeks?)\b`, "g"), (_, n, unit) => {
    result.minSpan = Number(n) * (unit.startsWith("week") ? 7 : 1);
    return true;
  });
  take(/(\d+)\s*(?:-|to)\s*(\d+)\s*(days?|nights?)\b/g, (_, a, b) => {
    result.minSpan = Math.min(Number(a), Number(b));
    result.maxSpan = Math.max(Number(a), Number(b));
    return true;
  });
  take(/(\d+)\s*-?\s*(weeks?)\b/g, (_, n) => {
    result.minSpan = Number(n) * 7 - 1;
    result.maxSpan = Number(n) * 7 + 1;
    return true;
  });
  take(/(\d+)\s*-?\s*(days?|nights?|d|n)\b/g, (_, n, unit) => {
    if (unit.startsWith("n")) result.nights = Number(n);
    else result.minSpan = result.maxSpan = Number(n);
    return true;
  });
  take(/\b(?:a|one)\s+week\b/g, () => {
    result.minSpan = 6;
    result.maxSpan = 8;
    return true;
  });

  /* Then prices: ranges, limits either way, "around", and a bare "1k". */
  take(new RegExp(String.raw`(?:between\s*)?${AMOUNT}\s*(?:-|to|and)\s*${AMOUNT}`, "g"), (whole, a, aSuffix, b, bSuffix) => {
    /* "5-10k": a suffix on one side carries to the other. */
    const low = rupees(a, aSuffix ?? bSuffix);
    const high = rupees(b, bSuffix ?? aSuffix);
    if (!plausiblePrice(whole, high, bSuffix ?? aSuffix)) return false;
    result.minPrice = Math.min(low, high);
    result.maxPrice = Math.max(low, high);
    return true;
  });
  take(new RegExp(String.raw`(?:${MAX_WORDS})\s*${AMOUNT}`, "g"), (whole, digits, suffix) => {
    const value = rupees(digits, suffix);
    if (!plausiblePrice(whole, value, suffix)) return false;
    result.maxPrice = value;
    return true;
  });
  take(new RegExp(String.raw`(?:${MIN_WORDS}|from)\s*${AMOUNT}`, "g"), (whole, digits, suffix) => {
    const value = rupees(digits, suffix);
    if (!plausiblePrice(whole, value, suffix)) return false;
    result.minPrice = value;
    return true;
  });
  take(new RegExp(String.raw`(?:${ABOUT_WORDS})\s*${AMOUNT}`, "g"), (whole, digits, suffix) => {
    const value = rupees(digits, suffix);
    if (!plausiblePrice(whole, value, suffix)) return false;
    result.minPrice = Math.round(value * 0.75);
    result.maxPrice = Math.round(value * 1.25);
    return true;
  });
  /* "1k trip", "₹5000 packages", "trip for 5k" — a stated price with no
     direction is a ceiling. Needs a currency sign or suffix: a bare "2" is
     far more often people than rupees. */
  take(new RegExp(String.raw`(?:for\s*)?${AMOUNT}`, "g"), (whole, digits, suffix) => {
    if (!suffix && !/₹|rs|inr|rupees|\/-/.test(whole)) return false;
    result.maxPrice = rupees(digits, suffix);
    return true;
  });

  const remainder = text.replace(/[^\p{L}\p{N}' ]+/gu, " ").replace(/\s+/g, " ").trim();
  const generic = remainder.split(" ").every((word) => !word || FILLER.has(word));

  return { ...result, remainder, generic };
}

export function hasConstraints(constraints: SearchConstraints) {
  return [constraints.minPrice, constraints.maxPrice, constraints.minSpan, constraints.maxSpan, constraints.nights]
    .some((value) => value !== undefined);
}

export function meetsConstraints(pkg: Sized, constraints: SearchConstraints) {
  const span = Math.max(pkg.days, pkg.nights);
  return (
    (constraints.minPrice === undefined || pkg.price >= constraints.minPrice) &&
    (constraints.maxPrice === undefined || pkg.price <= constraints.maxPrice) &&
    (constraints.minSpan === undefined || span >= constraints.minSpan) &&
    (constraints.maxSpan === undefined || span <= constraints.maxSpan) &&
    (constraints.nights === undefined || pkg.nights === constraints.nights)
  );
}
