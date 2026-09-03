/**
 * Regenerates the imported half of src/lib/packageData.ts from
 * tourbazaar.in/api/packages.
 *
 *   node scripts/import-packages.mjs > /tmp/packages.txt
 *
 * It prints the TravelPackage literals for 16 India + 16 international
 * packages on stdout and a summary on stderr; paste the literals in below the
 * hand-written entries at the top of DUMMY_PACKAGES.
 *
 * Ratings and pre-discount prices are deliberately left at 0: the source
 * publishes neither, and the cards hide those elements rather than invent them.
 */

const API = "https://tourbazaar.in/api/packages";

const load = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return (await res.json()).packages;
};

const all = await load(API);
/* Only used to seed the India check — the source's own region flag is
   incomplete, so it is a hint rather than the answer. */
const intlIds = new Set((await load(`${API}?region=international`)).map((p) => p.id));

/* The source's ?region=india is really "everything", so India is decided here
   from the destination rather than trusted from the endpoint. */
const INDIA_DESTINATIONS = new Set([
  "nainital", "kashmir", "srinagar", "kochi", "kerala", "munnar", "coorg", "mysore",
  "ooty", "jaisalmer", "jaipur", "jibhi", "manali", "kasol", "ladakh", "leh",
  "pangong", "lakshadweep", "andaman", "north goa", "south goa", "goa", "guwahati",
  "gangtok", "sikkim", "darjeeling", "shimla", "rishikesh", "agra", "himachal",
  "meghalaya", "rajasthan", "jodhpur", "udaipur", "shillong", "spiti", "dharamshala",
]);

const isIndia = (p) => {
  if (intlIds.has(p.id)) return false;
  const names = [p.destinationName, ...(p.destinations || []).map((d) => d.name)]
    .filter(Boolean)
    .map((n) => n.trim().toLowerCase().replace(/,$/, ""));
  return names.some((n) => INDIA_DESTINATIONS.has(n));
};

/* Source themes are Adventure|Beach|Heritage|Honeymoon|Mountains|Wildlife.
   Beach/Heritage/Wildlife are renamed to this repo's spelling; Treks, Luxury
   and Family have no source theme and are inferred below. */
const THEME_MAP = {
  Beach: "Beaches",
  Mountains: "Mountains",
  Adventure: "Adventure",
  Honeymoon: "Honeymoon",
  Heritage: "Heritage",
  Wildlife: "Wildlife",
};

/* Read against the whole record, not just the title: the treks in this data
   live in day-by-day itinerary text ("trek to Jalori Pass", "sunrise hike"). */
const TREK_HINT = /\btrek(k|s|king)?\b|\bhike(s|ing)?\b|base camp|jalori|kedarkantha|triund|valley of flowers/i;
const TREK_PLACES = /ladakh|leh|nubra|pangong|manali|kasol|jibhi|spiti|sikkim|gangtok|darjeeling/i;

const toCategories = (p) => {
  const out = new Set();
  for (const t of p.themes || []) if (THEME_MAP[t]) out.add(THEME_MAP[t]);

  const places = `${p.title} ${p.destinationName} ${(p.destinations || []).map((d) => d.name).join(" ")}`;
  const themes = p.themes || [];
  const body = JSON.stringify(p.itinerary || []) + JSON.stringify(p.highlights || []) + p.title;

  // Treks: a trek named anywhere in the itinerary, or a high-altitude route
  // already sold as Adventure + Mountains.
  if (TREK_HINT.test(body) || (TREK_PLACES.test(places) && themes.includes("Adventure") && themes.includes("Mountains"))) {
    out.add("Treks");
    out.add("Mountains");
    out.add("Adventure");
  }
  if (p.hotelRating >= 5 || /luxury/i.test(p.title)) out.add("Luxury");
  // Kept narrow — a large group cap alone does not make a package a family one.
  if (/family|senior|kids/i.test(p.title) || (p.groupMax || 0) >= 12) out.add("Family");
  if (out.size === 0) out.add("Adventure");
  return [...out];
};

const slugId = (p) => p.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* Operators file packages under whichever place they sell — "Kochi", "Munnar"
   and "Kerala" are all the same shelf to a visitor, and "cairns" is Australia.
   Collapsing to one headline destination keeps the filter list short enough to
   scan; anything unlisted keeps its own name. */
/* India resolves to the state, never a town or district: the catalogue's
   destination filter files India by state, so "Coorg" is Karnataka. Runtime
   normalisation in src/lib/indiaStates.ts covers whatever slips through here. */
const DESTINATION_ALIASES = {
  kochi: "Kerala", munnar: "Kerala", thekkady: "Kerala", alleppey: "Kerala",
  srinagar: "Jammu & Kashmir", gulmarg: "Jammu & Kashmir", pahalgam: "Jammu & Kashmir", sonamarg: "Jammu & Kashmir",
  leh: "Ladakh", pangong: "Ladakh", nubra: "Ladakh",
  manali: "Himachal Pradesh", kasol: "Himachal Pradesh", jibhi: "Himachal Pradesh", shimla: "Himachal Pradesh",
  "north goa": "Goa", "south goa": "Goa",
  jaipur: "Rajasthan", jaisalmer: "Rajasthan", jodhpur: "Rajasthan", udaipur: "Rajasthan", bikaner: "Rajasthan",
  gangtok: "Sikkim", darjeeling: "West Bengal",
  nainital: "Uttarakhand", mukteswar: "Uttarakhand",
  guwahati: "Assam", shillong: "Meghalaya",
  mysore: "Karnataka", coorg: "Karnataka", ooty: "Tamil Nadu",
  hanoi: "Vietnam", sapa: "Vietnam", "halong bay": "Vietnam", "da nang": "Vietnam",
  phuket: "Thailand", krabi: "Thailand", bangkok: "Thailand",
  kandy: "Sri Lanka", colombo: "Sri Lanka", bentota: "Sri Lanka", "nuwara eliya": "Sri Lanka",
  "kuala lumpur": "Malaysia", langkawi: "Malaysia",
  taipei: "Taiwan", cairns: "Australia", goldcoast: "Australia", sydney: "Australia", melbourne: "Australia",
  auckland: "New Zealand", queenstown: "New Zealand", rotorua: "New Zealand",
  moscow: "Russia", "st.petersburg": "Russia", murmansk: "Russia",
  kuta: "Bali", uluwatu: "Bali", "nusa dua": "Bali", ubud: "Bali",
  helsinki: "Arctic", rovaniemi: "Arctic", kiruna: "Arctic",
};

const destinationOf = (p) => {
  const raw = titleCase(p.destinationName);
  return DESTINATION_ALIASES[raw.toLowerCase()] ?? raw;
};

/* Operators type destination names inconsistently ("kuta", "MYSORE", "Taipei,"). */
const titleCase = (s) =>
  String(s || "")
    .replace(/[\s,]+$/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (/^[A-Z][a-z]/.test(w) ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");

const placeNames = (p) => {
  const names = (p.destinations || []).map((d) => titleCase(d.name)).filter(Boolean);
  const fallback = titleCase(p.destinationName);
  return [...new Set(names.length ? names : [fallback].filter(Boolean))];
};

const location = (p) => placeNames(p).slice(0, 4).join(" · ");

const pax = (p) => {
  const min = p.groupMin || 2;
  const max = p.groupMax || 0;
  return max > min ? `${min}–${max} pax` : `${min}+ pax`;
};

const cancellation = (p) =>
  Array.isArray(p.cancellationPolicy) && p.cancellationPolicy.length
    ? p.cancellationPolicy.map((c) => `${c.window}: ${c.charge}`).join(". ")
    : "Cancellation terms are confirmed with the operator at the time of booking.";

const itinerary = (p) =>
  (p.itinerary || []).map((d, i) => ({
    day: d.day || i + 1,
    title: (d.title || `Day ${i + 1}`).trim(),
    route: placeNames(p)[Math.min(i, placeNames(p).length - 1)] || titleCase(p.destinationName),
    description: (d.description || "").replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim(),
    meals: p.mealsIncluded ? "Breakfast, lunch and dinner" : i === 0 ? "Dinner" : "Breakfast",
  }));

const toPackage = (p, region) => ({
  id: slugId(p),
  title: p.title.replace(/\s*\|\s*/g, " · ").replace(/\s+/g, " ").trim(),
  location: location(p),
  destination: destinationOf(p),
  image: p.images[0],
  nights: p.durationNights,
  days: p.durationDays,
  pax: pax(p),
  hotelStars: p.hotelRating || 3,
  tags: toCategories(p),
  region,
  operator: p.operatorName,
  // The source publishes no ratings and no MRP, so these stay honest: the card
  // hides the stars and the discount pill when they are zero.
  rating: 0,
  reviews: 0,
  discount: 0,
  originalPrice: p.pricePerPerson,
  price: p.pricePerPerson,
  details: {
    gallery: p.images.slice(0, 10),
    // Deliberately does not name the operator — it is never shown to visitors.
    summary: `${p.title.replace(/\s*\|\s*/g, " · ")} is a ${p.durationDays}-day itinerary through ${location(p)}.`,
    places: placeNames(p),
    highlights: (p.highlights || []).length ? p.highlights : (p.otherDetails || []).slice(0, 4),
    itinerary: itinerary(p),
    stays: (p.stayHotels || []).map((h) => ({
      name: h.name,
      nights: 0,
      place: location(p),
      comfort: `${p.hotelRating || 3}-star category stay`,
    })),
    inclusions: p.inclusions || [],
    exclusions: p.exclusions || [],
    meals: p.mealsIncluded ? "All meals included" : "Daily breakfast",
    transfers: p.transfersIncluded ? "Transfers included" : "Not included",
    flights: p.flightsIncluded ? "Included" : "Not included",
    cancellationPolicy: cancellation(p),
  },
});

/* The source's own ?region=international under-reports (it misses Phuket, Kuala
   Lumpur, Taipei, Moscow, Auckland...), so international is everything that is
   not demonstrably an India itinerary. */
const india = all.filter(isIndia);
const intl = all.filter((p) => !isIndia(p));
const missedBySource = intl.filter((p) => !intlIds.has(p.id));

console.error(`india=${india.length} intl=${intl.length} (source region=international only knew ${intlIds.size})`);
console.error("MISSED BY SOURCE:", missedBySource.map((p) => p.destinationName).join(", "));

/* Deterministic "random" 16 — a fixed shuffle so repeat runs give one dataset,
   while still spreading destinations rather than taking the newest 16. */
const seeded = (arr, seed) => {
  const scored = arr.map((p, i) => {
    let h = seed;
    for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return { p, h, i };
  });
  return scored.sort((a, b) => a.h - b.h).map((s) => s.p);
};

/* Spread destinations first so 16 Maldives packages cannot crowd out the rest. */
const diversify = (arr, n) => {
  const byDest = new Map();
  for (const p of arr) {
    const k = (p.destinationName || "").toLowerCase().trim();
    if (!byDest.has(k)) byDest.set(k, []);
    byDest.get(k).push(p);
  }
  const out = [];
  let round = 0;
  while (out.length < n) {
    let added = false;
    for (const list of byDest.values()) {
      if (list[round]) {
        out.push(list[round]);
        added = true;
        if (out.length === n) break;
      }
    }
    if (!added) break;
    round++;
  }
  return out;
};

/* Treks are thin in the source, so they are seated first and the destination
   spread fills the remaining slots around them. */
const pick = (pool, seed, n) => {
  const ordered = seeded(pool, seed);
  const treks = ordered.filter((p) => toCategories(p).includes("Treks"));
  const seats = treks.slice(0, Math.min(4, n));
  const taken = new Set(seats.map((p) => p.id));
  const rest = diversify(ordered.filter((p) => !taken.has(p.id)), n - seats.length);
  return [...seats, ...rest];
};

const pickIndia = pick(india, 7, 16).map((p) => toPackage(p, "India"));
const pickIntl = pick(intl, 13, 16).map((p) => toPackage(p, "International"));

console.error(`\nPICKED india=${pickIndia.length} intl=${pickIntl.length}`);
console.error("\nINDIA:");
pickIndia.forEach((p, i) => console.error(` ${i + 1}. ${p.location.padEnd(42)} ${(p.nights + "N/" + p.days + "D").padEnd(8)} ₹${String(p.price).padEnd(7)} [${p.tags.join(",")}]`));
console.error("\nINTERNATIONAL:");
pickIntl.forEach((p, i) => console.error(` ${i + 1}. ${p.location.padEnd(42)} ${(p.nights + "N/" + p.days + "D").padEnd(8)} ₹${String(p.price).padEnd(7)} [${p.tags.join(",")}]`));
console.error("\nTreks in India pick:", pickIndia.filter((p) => p.tags.includes("Treks")).length);
console.error("Treks in Intl pick:", pickIntl.filter((p) => p.tags.includes("Treks")).length);


const s = (v) => JSON.stringify(v);
const indent = (n) => "  ".repeat(n);

const arr = (items, level, render) =>
  items.length === 0
    ? "[]"
    : `[\n${items.map((i) => indent(level + 1) + render(i)).join(",\n")}\n${indent(level)}]`;

function renderDetails(d, level) {
  const L = indent(level + 1);
  const parts = [];
  parts.push(`${L}gallery: ${arr(d.gallery, level + 1, s)},`);
  parts.push(`${L}summary: ${s(d.summary)},`);
  parts.push(`${L}places: ${arr(d.places, level + 1, s)},`);
  parts.push(`${L}highlights: ${arr(d.highlights, level + 1, s)},`);
  parts.push(
    `${L}itinerary: ${arr(
      d.itinerary,
      level + 1,
      (x) =>
        `{\n${indent(level + 3)}day: ${x.day},\n${indent(level + 3)}title: ${s(x.title)},\n${indent(level + 3)}route: ${s(x.route)},\n${indent(level + 3)}description: ${s(x.description)},\n${indent(level + 3)}meals: ${s(x.meals)},\n${indent(level + 2)}}`,
    )},`,
  );
  parts.push(
    `${L}stays: ${arr(
      d.stays,
      level + 1,
      (x) =>
        `{ name: ${s(x.name)}, nights: ${x.nights}, place: ${s(x.place)}, comfort: ${s(x.comfort)} }`,
    )},`,
  );
  parts.push(`${L}inclusions: ${arr(d.inclusions, level + 1, s)},`);
  parts.push(`${L}exclusions: ${arr(d.exclusions, level + 1, s)},`);
  parts.push(`${L}meals: ${s(d.meals)},`);
  parts.push(`${L}transfers: ${s(d.transfers)},`);
  parts.push(`${L}flights: ${s(d.flights)},`);
  parts.push(`${L}cancellationPolicy: ${s(d.cancellationPolicy)},`);
  return `{\n${parts.join("\n")}\n${indent(level)}}`;
}

function renderPackage(p) {
  const L = indent(2);
  const lines = [
    `${L}id: ${s(p.id)},`,
    `${L}title: ${s(p.title)},`,
    `${L}location: ${s(p.location)},`,
    `${L}destination: ${s(p.destination)},`,
    `${L}image: ${s(p.image)},`,
    `${L}nights: ${p.nights},`,
    `${L}days: ${p.days},`,
    `${L}pax: ${s(p.pax)},`,
    `${L}hotelStars: ${p.hotelStars},`,
    `${L}tags: [${p.tags.map(s).join(", ")}],`,
    `${L}region: ${s(p.region)},`,
    `${L}operator: ${s(p.operator)},`,
    `${L}rating: ${p.rating},`,
    `${L}reviews: ${p.reviews},`,
    `${L}discount: ${p.discount},`,
    `${L}originalPrice: ${p.originalPrice},`,
    `${L}price: ${p.price},`,
    `${L}details: ${renderDetails(p.details, 2)},`,
  ];
  return `  {\n${lines.join("\n")}\n  }`;
}


const renderAll = (list) => list.map(renderPackage).join(",\n");
process.stdout.write(renderAll([...pickIndia, ...pickIntl]) + ",\n");
