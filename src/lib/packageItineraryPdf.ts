
import { plainPackageText } from "@/lib/packageRichText";
import { jsPDF } from "jspdf";
import { getPackagePageSections, isVisiblePackageSection, type PackageSectionPlacement } from "./packageDetailSections";
import { getPackageFacts } from "./packageFacts";
import { departureDaysLabel, getPackageDetails, getPackageItinerary, type TravelPackage } from "./packageData";

export type PdfImage = { data: string; format: "JPEG" | "PNG"; width: number; height: number };
/** Pictures are fetched before drawing so the layout itself stays synchronous. */
/** Images are keyed by pdfImageKey, since each slot crops a photo to its own shape.
    The gallery arrives already combined into one picture. */
export type ItineraryPdfAssets = { logo?: PdfImage; gallery?: PdfImage; images?: Record<string, PdfImage> };

// Canvas size of each crop, in pixels, matching the aspect of its slot on the page.
const IMAGE_SLOTS = { hotel: [264, 204], activity: [240, 240] } as const;
type ImageSlot = keyof typeof IMAGE_SLOTS;
export const pdfImageKey = (slot: ImageSlot, url: string) => `${slot}:${url}`;
// The main photo plus up to four beside it.
const GALLERY_LIMIT = 5;
const ACTIVITY_PHOTO_LIMIT = 3;

// Candidates, main photo first. The same picture often sits in both fields under
// different URLs, so the loader also drops repeats by what they look like.
function galleryPhotos(pkg: TravelPackage) {
  const details = getPackageDetails(pkg);
  return [...new Set([pkg.image, ...details.gallery].map((url) => url?.trim() ?? "").filter(Boolean))];
}

const activityPhotos = (activity: { images?: string[] }) =>
  (activity.images ?? []).map((url) => url.trim()).filter(Boolean).slice(0, ACTIVITY_PHOTO_LIMIT);

// The letterhead printed on CompareMyTrip's booking vouchers.
const COMPANY = {
  address: ["WorkFlo Ranka Junction, No. 224, 3rd Floor, Old Madras", "Road, K R Puram, Bengaluru, Karnataka - 560016"],
  email: "support@comparemytrip.in",
  website: "www.comparemytrip.in",
  helpline: "+91 80 6927 7012",
  tel: "tel:+918069277012",
};

const COLOR = {
  navy: "#394b87", ink: "#222222", text: "#333333", muted: "#7d7d7d", icon: "#b3b3b3",
  border: "#cfcfcf", rule: "#d4d4d4", dash: "#9ca3af", frame: "#dddddd", panel: "#e3eefa",
  star: "#f5b301", green: "#43a047", red: "#e5533d", placeholder: "#dbe9f7",
};

// A4 in millimetres. Each page carries a light frame like the voucher.
const FRAME = { x: 5, y: 5, width: 200, bottom: 292 };
const LEFT = 10;
const RIGHT = 200;
const WIDTH = RIGHT - LEFT;
const TOP = 14;
const BOTTOM = 284;

// Use readable equivalents for symbols outside the PDF's built-in Latin font.
function pdfText(value: string) {
  return plainPackageText(value).replace(/₹/g, "INR ").replace(/[★☆]/g, "-star")
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/•/g, "-")
    .replace(/\s*→\s*/g, " to ").replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...").replace(/\u00a0/g, " ");
}

export function itineraryFilename(title: string) {
  const name = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
  return `${name || "package"}-itinerary.pdf`;
}

export function createPackageItineraryPdf(pkg: TravelPackage, packageUrl: string, assets: ItineraryPdfAssets = {}) {
  const details = getPackageDetails(pkg);
  const itinerary = getPackageItinerary(details);
  const page = getPackagePageSections(details);
  const hidden = new Set(page.hiddenSections);
  const hasItinerary = !hidden.has("itinerary") && itinerary.length > 0;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  // Layout tracks the top of the next line, not its baseline.
  let y = TOP;

  doc.setProperties({ title: `${pkg.title} - ${hasItinerary ? "Detailed itinerary" : "Package overview"}`, author: "CompareMyTrip", subject: "Package itinerary and travel details" });

  function font(size: number, style: "normal" | "bold" = "normal", color = COLOR.text) {
    doc.setFont("helvetica", style).setFontSize(size).setTextColor(color);
  }
  const lineHeight = (size: number) => size * 0.3528 * 1.45;
  const baseline = (top: number, size: number) => top + size * 0.3528 * 1.05;
  const wrap = (text: string, width: number): string[] => doc.splitTextToSize(text, width);

  function ensureSpace(height: number) {
    if (y + height <= BOTTOM) return;
    doc.addPage();
    y = TOP;
  }

  function dashed(at: number) {
    doc.setDrawColor(COLOR.dash).setLineWidth(0.25).setLineDashPattern([1.2, 1.1], 0);
    doc.line(FRAME.x + 2, at, FRAME.x + FRAME.width - 2, at);
    doc.setLineDashPattern([], 0);
  }

  function rule() {
    // Leave room for the next heading too, so a divider never ends a page alone.
    ensureSpace(22);
    doc.setDrawColor(COLOR.rule).setLineWidth(0.25).line(LEFT, y + 2, RIGHT, y + 2);
    y += 6;
  }

  function lines(text: string, { x = LEFT, width = WIDTH, size = 8.5, style = "normal" as "normal" | "bold", color = COLOR.muted } = {}) {
    font(size, style, color);
    for (const line of wrap(text, width)) {
      ensureSpace(lineHeight(size));
      font(size, style, color);
      doc.text(line, x, baseline(y, size));
      y += lineHeight(size);
    }
  }

  function bullet(text: string, { size = 8.5, color = COLOR.muted, dot = COLOR.muted } = {}) {
    font(size);
    const wrapped = wrap(text, WIDTH - 9);
    ensureSpace(lineHeight(size));
    doc.setFillColor(dot).circle(LEFT + 5, y + lineHeight(size) / 2, 0.6, "F");
    lines(wrapped.join("\n"), { x: LEFT + 8, width: WIDTH - 9, size, color });
  }

  // Authored copy keeps its paragraphs, and "- item" lines print as bullets.
  // Operators often type a list on one line ("Cap • Torch • ID"); split it first.
  function prose(value: string, { size = 8.5, color = COLOR.muted, gap = 3 } = {}) {
    let blank = true;
    for (const raw of pdfText(plainPackageText(value).replace(/\s*•\s*/g, "\n- ")).split("\n")) {
      const line = raw.trim();
      if (!line) {
        if (!blank) y += 1.6;
        blank = true;
        continue;
      }
      blank = false;
      const marker = /^[-*]\s+/.exec(line);
      if (marker) bullet(line.slice(marker[0].length), { size, color });
      else lines(line, { size, color });
    }
    y += gap;
  }

  function list(items: string[], dot = COLOR.muted) {
    for (const item of items) bullet(pdfText(item), { dot });
    y += 2;
  }

  // "Room Type - Superior Room": grey label, dark value, value wraps under itself.
  function labelled(label: string, value: string, { x = LEFT, width = WIDTH, size = 8.5, gap = 1.6 } = {}) {
    font(size);
    // Measured without the trailing space, which jsPDF under-counts.
    const labelWidth = doc.getTextWidth(label.trimEnd()) + 1.2;
    const wrapped = wrap(pdfText(value), width - labelWidth);
    ensureSpace(lineHeight(size));
    font(size, "normal", COLOR.muted);
    doc.text(label, x, baseline(y, size));
    lines(wrapped.join("\n"), { x: x + labelWidth, width: width - labelWidth, size, color: COLOR.ink });
    y += gap;
  }

  function labelledRight(label: string, value: string, top: number, size = 8.5) {
    font(size, "normal", COLOR.ink);
    const valueWidth = doc.getTextWidth(value);
    doc.text(value, RIGHT - 3, baseline(top, size), { align: "right" });
    font(size, "normal", COLOR.muted);
    doc.text(label.trimEnd(), RIGHT - 4.2 - valueWidth, baseline(top, size), { align: "right" });
  }

  function section(title: string) {
    ensureSpace(26);
    if (y > TOP + 1) {
      dashed(y + 2);
      y += 8;
    }
    font(11, "normal", COLOR.text);
    doc.text(title, LEFT, baseline(y, 11));
    y += 6.2;
    doc.setDrawColor(COLOR.navy).setLineWidth(0.4).line(LEFT, y, RIGHT, y);
    y += 5;
  }

  function pin(x: number, top: number, color = COLOR.icon) {
    doc.setFillColor(color).circle(x, top + 1.1, 1.1, "F");
    doc.triangle(x - 0.95, top + 1.6, x + 0.95, top + 1.6, x, top + 3.3, "F");
    doc.setFillColor("#ffffff").circle(x, top + 1.1, 0.42, "F");
  }

  function star(cx: number, cy: number, radius: number) {
    const points = Array.from({ length: 10 }, (_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI) / 5;
      const r = index % 2 ? radius * 0.45 : radius;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    });
    const deltas = points.slice(1).map(([px, py], index) => [px - points[index][0], py - points[index][1]]);
    doc.setFillColor(COLOR.star).lines(deltas, points[0][0], points[0][1], [1, 1], "F", true);
  }

  function stars(count: number, x: number, cy: number, size = 3.6) {
    for (let index = 0; index < count; index++) star(x + size / 2 + index * (size + 0.4), cy, size / 2);
  }

  const loaded = (slot: ImageSlot, url: string) => assets.images?.[pdfImageKey(slot, url)];

  function drawPicture(slot: ImageSlot, url: string, x: number, top: number, width: number, height: number) {
    const picture = loaded(slot, url);
    if (picture) doc.addImage(picture.data, picture.format, x, top, width, height, pdfImageKey(slot, url), "FAST");
    return Boolean(picture);
  }

  // Photos that failed to load are left out rather than shown as empty boxes.
  function photoRows(slot: ImageSlot, urls: string[], width: number, height: number, perRow: number, gap: number) {
    const ready = urls.filter((url) => loaded(slot, url));
    for (let start = 0; start < ready.length; start += perRow) {
      ensureSpace(height + 3);
      ready.slice(start, start + perRow).forEach((url, index) => drawPicture(slot, url, LEFT + index * (width + gap), y, width, height));
      y += height + gap;
    }
    return ready.length > 0;
  }

  function image(url: string | undefined, x: number, top: number, width: number, height: number) {
    if (url && drawPicture("hotel", url, x, top, width, height)) return;
    // Stays without a photo get a neutral bed, as the voucher does.
    doc.setFillColor(COLOR.placeholder).roundedRect(x, top, width, height, 1.2, 1.2, "F");
    const cx = x + width / 2;
    const cy = top + height / 2;
    doc.setFillColor("#8fa7c9");
    doc.rect(cx - 6, cy - 3.2, 1.2, 7, "F");
    doc.rect(cx - 6, cy + 0.6, 12, 2.4, "F");
    doc.rect(cx + 4.8, cy + 0.6, 1.2, 3.2, "F");
    doc.roundedRect(cx - 4.3, cy - 1.2, 3.4, 1.6, 0.6, 0.6, "F");
  }

  function badge(label: string, url: string, x: number, top: number) {
    doc.setFillColor("#111111").roundedRect(x, top, 27, 6.8, 1.2, 1.2, "F");
    font(6.8, "bold", "#ffffff");
    doc.text(label, x + 13.5, top + 4.4, { align: "center" });
    doc.link(x, top, 27, 6.8, { url });
  }

  function letterhead() {
    const logo = assets.logo;
    const logoWidth = 66;
    if (logo) {
      const logoHeight = Math.min(16, (logoWidth * logo.height) / logo.width);
      doc.addImage(logo.data, logo.format, LEFT, 19 - logoHeight / 2, logoWidth, logoHeight, "logo", "FAST");
    } else {
      font(18, "bold", COLOR.ink);
      doc.text("COMPAREMYTRIP", LEFT, 21);
    }
    font(7.6, "bold", COLOR.ink);
    const rows = [...COMPANY.address, `Email: ${COMPANY.email}`, `Website: ${COMPANY.website}`, `Helpline: ${COMPANY.helpline}`];
    rows.forEach((row, index) => doc.text(row, RIGHT, 11.5 + index * 4.4, { align: "right" }));
    doc.setFillColor(COLOR.navy).rect(LEFT, 33.5, WIDTH, 1.6, "F");
    y = 41;
  }

  function overviewBox() {
    font(13, "normal", COLOR.text);
    for (const line of wrap(pdfText(pkg.title), WIDTH)) {
      doc.text(line, LEFT, baseline(y, 13));
      y += lineHeight(13);
    }
    if (page.tagline?.trim()) lines(pdfText(page.tagline), { size: 9 });
    y += 2.5;

    const left = [["Destination: ", pkg.destination], ["Location: ", pkg.location], ["Group Size: ", pkg.pax]]
      .filter(([, value], index, rows) => value?.trim() && (index !== 1 || value !== rows[0][1]));
    const departures = departureDaysLabel(pkg);
    const right = [
      ...(pkg.days > 0 ? [["Duration: ", `${pkg.nights} Night${pkg.nights === 1 ? "" : "s"} / ${pkg.days} Day${pkg.days === 1 ? "" : "s"}`]] : []),
      ["Starting Price: ", pkg.price > 0 ? `INR ${pkg.price.toLocaleString("en-IN")} per person` : "On request"],
      ...(departures ? [["Departures: ", departures]] : []),
    ];
    const top = y;
    let leftY = top + 3.5;
    const saved = y;
    y = leftY;
    for (const [label, value] of left) labelled(label, value, { x: LEFT + 3, width: 104, gap: 1.65 });
    leftY = y;
    y = saved;
    right.forEach(([label, value], index) => labelledRight(label, pdfText(value), top + 3.5 + index * 6));
    const height = Math.max(leftY - top, 3.5 + right.length * 6) + 1.5;
    doc.setDrawColor(COLOR.border).setLineWidth(0.3).roundedRect(LEFT, top, WIDTH, height, 1.4, 1.4, "S");
    y = top + height + 3;
    if (page.bookingNote?.trim()) labelled("Remarks - ", page.bookingNote, { size: 8 });
  }

  function contactPanel() {
    ensureSpace(52);
    dashed(y + 2);
    y += 7;
    const top = y;
    doc.setFillColor(COLOR.panel).roundedRect(LEFT, top, WIDTH, 41, 2, 2, "F");
    doc.setFillColor(COLOR.navy).circle(LEFT + 6.5, top + 7.5, 3.3, "F");
    doc.setDrawColor("#ffffff").setLineWidth(0.6);
    doc.lines([[1.1, 1.1], [2, -2.2]], LEFT + 4.9, top + 7.6);
    font(10.5, "bold", COLOR.ink);
    doc.text("Plan & Book This Trip With a Travel Expert", LEFT + 12.5, top + 6.8);
    doc.text("Custom Quotes by CompareMyTrip", LEFT + 12.5, top + 11.8);
    badge("VIEW ONLINE", packageUrl, RIGHT - 30, top + 3);
    badge("CALL US", COMPANY.tel, RIGHT - 30, top + 11.2);

    font(8.3, "normal", COLOR.ink);
    doc.text("Talk to us for:", LEFT + 3, top + 20);
    ["Custom Quotes", "Secure Payment", "Trip Support"].forEach((label, index) => {
      const x = LEFT + 4.5 + index * 42;
      doc.setDrawColor(COLOR.muted).setLineWidth(0.3).circle(x + 1.4, top + 25, 1.5, "S");
      doc.setFillColor(COLOR.muted).circle(x + 1.4, top + 25, 0.5, "F");
      font(8.3, "normal", COLOR.ink);
      doc.text(label, x + 5, top + 26.1);
    });

    font(8.3, "normal", COLOR.muted);
    doc.text("Package link:", LEFT + 3, top + 32.5);
    doc.text("Helpline", RIGHT - 3, top + 32.5, { align: "right" });
    font(8.3, "normal", COLOR.ink);
    const shortUrl = wrap(packageUrl.replace(/^https?:\/\//, ""), 120)[0] ?? "";
    doc.textWithLink(shortUrl, LEFT + 3, top + 37.5, { url: packageUrl });
    doc.text(COMPANY.helpline, RIGHT - 3, top + 37.5, { align: "right" });
    y = top + 44;
  }

  function customSections(placement: PackageSectionPlacement) {
    for (const item of page.sections.filter((item) => (item.placement ?? "extras") === placement && isVisiblePackageSection(item))) {
      section(item.title);
      if (item.body.trim()) prose(item.body);
      if (item.layout !== "box") for (const entry of item.items.filter((entry) => entry.visible !== false)) {
        if (entry.title.trim()) lines(pdfText(entry.title), { size: 9, color: COLOR.ink });
        if (entry.body.trim()) prose(entry.body);
      }
    }
  }

  function snapshot() {
    const facts = getPackageFacts(pkg);
    if (!facts.length) return;
    section("Trip snapshot");
    for (const fact of facts) labelled(`${pdfText(fact.label)} - `, fact.value);
    y += 1.5;
  }

  function hotels() {
    section("Hotels");
    details.stays.forEach((stay, index) => {
      ensureSpace(34);
      if (index > 0) y += 3;
      const top = y;
      image(stay.image?.trim(), LEFT, top, 22, 17);
      const textX = LEFT + 26;
      font(10, "normal", COLOR.text);
      const name = wrap(pdfText(stay.name), 104);
      name.forEach((line, row) => doc.text(line, textX, baseline(top + row * 4.4, 10)));
      let lineTop = top + name.length * 4.4 + 0.6;
      const rating = stay.stars && stay.stars > 0 ? Math.min(5, Math.round(stay.stars)) : 0;
      if (rating) {
        stars(rating, textX, lineTop + 1.8);
        lineTop += 4.8;
      }
      if (stay.place.trim()) {
        pin(textX + 1.2, lineTop);
        font(8.5, "normal", COLOR.muted);
        doc.text(pdfText(stay.place), textX + 4.5, baseline(lineTop, 8.5));
        lineTop += 4.5;
      }
      const facts = [
        ["Nights - ", stay.nights > 0 ? `${stay.nights} Night${stay.nights === 1 ? "" : "s"}` : ""],
        ["Check in - ", stay.checkIn ?? ""], ["Check out - ", stay.checkOut ?? ""],
      ].filter(([, value]) => value.trim());
      facts.forEach(([label, value], row) => labelledRight(label, pdfText(value), top + row * 4.6));
      y = Math.max(top + 20, lineTop + 2, top + facts.length * 4.6 + 2);
      for (const [label, value] of [["Room Type - ", stay.roomType], ["Meal Type - ", stay.mealPlan], ["Room Inclusion - ", stay.roomInclusion], ["Remarks - ", stay.comfort]] as const) {
        if (value?.trim()) labelled(label, value);
      }
    });
    if (page.stayNote?.trim()) {
      y += 1.5;
      labelled("Note - ", page.stayNote, { size: 8 });
    }
  }

  function days() {
    section("Itinerary");
    itinerary.forEach((day, index) => {
      ensureSpace(30);
      if (index > 0) {
        dashed(y + 1);
        y += 6;
      }
      font(8.8);
      const heading = wrap(pdfText(`Day ${day.day}: ${day.title}`), WIDTH - 4);
      doc.setFillColor(COLOR.navy).rect(LEFT, y + 0.3, 0.7, 3.6, "F");
      lines(heading.join("\n"), { x: LEFT + 2.5, width: WIDTH - 4, size: 8.8, color: COLOR.text });
      y += 2.5;
      if (day.route.trim()) {
        pin(LEFT + 1.4, y + 0.2);
        labelled("Route - ", day.route, { x: LEFT + 5, width: WIDTH - 5 });
        y += 1;
      }
      if (day.description.trim()) prose(day.description);
      (day.activities ?? []).filter((activity) => activity.title.trim()).forEach((activity, position) => {
        if (position > 0) rule();
        ensureSpace(14);
        lines(pdfText([activity.time, activity.title].filter(Boolean).join(" | ")), { size: 9.3, color: COLOR.ink });
        y += 1.2;
        if (activity.description.trim()) prose(activity.description, { gap: 1.5 });
        if (photoRows("activity", activityPhotos(activity), 22, 22, ACTIVITY_PHOTO_LIMIT, 4)) y -= 1.5;
      });
      if (day.meals.trim()) {
        y += 1;
        labelled("Meals - ", day.meals);
      }
      y += 2;
    });
    if (page.itineraryNote?.trim()) {
      y += 1;
      labelled("Note - ", page.itineraryNote, { size: 8 });
    }
  }

  function locations() {
    const items = page.locations.enabled ? page.locations.items.filter((item) => item.visible && item.name.trim()) : [];
    if (!items.length) return;
    section("Pickup & Drop Locations");
    items.forEach((location, index) => {
      ensureSpace(16);
      if (index > 0) y += 2.5;
      const pickup = location.type !== "drop";
      pin(LEFT + 1.4, y + 0.3, pickup ? COLOR.green : COLOR.red);
      font(8.5, "normal", COLOR.muted);
      doc.text(pickup ? "Pickup point" : "Drop point", RIGHT - 3, baseline(y, 8.5), { align: "right" });
      lines(pdfText(location.name), { x: LEFT + 5, width: WIDTH - 32, size: 9.3, color: COLOR.ink });
      y += 0.8;
      if (location.address.trim()) lines(pdfText(location.address), { x: LEFT + 5, width: WIDTH - 5 });
      if (location.notes.trim()) {
        y += 0.8;
        labelled("Remarks - ", location.notes, { x: LEFT + 5, width: WIDTH - 5 });
      }
    });
    y += 2;
  }

  function reviews() {
    const items = page.reviews.enabled ? page.reviews.items.filter((review) => review.visible && review.name.trim() && review.text.trim() && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5) : [];
    if (!items.length) return;
    section("Traveller Reviews");
    for (const review of items) {
      ensureSpace(14);
      font(9.3, "normal", COLOR.ink);
      const name = pdfText(review.name);
      doc.text(name, LEFT, baseline(y, 9.3));
      stars(review.rating, LEFT + doc.getTextWidth(name) + 2.5, y + 1.7, 3);
      y += lineHeight(9.3) + 0.8;
      prose(review.text);
    }
  }

  function closingBand() {
    ensureSpace(16);
    y += 5;
    doc.setFillColor(COLOR.navy).rect(FRAME.x, y, FRAME.width, 9, "F");
    font(10, "normal", "#ffffff");
    doc.text("Thank you for choosing CompareMyTrip. Have a safe journey", 105, y + 5.9, { align: "center" });
    y += 9;
  }

  letterhead();
  overviewBox();
  contactPanel();
  if (assets.gallery) {
    const height = (WIDTH * assets.gallery.height) / assets.gallery.width;
    section("Photo Gallery");
    ensureSpace(height + 2);
    doc.addImage(assets.gallery.data, assets.gallery.format, LEFT, y, WIDTH, height, "gallery", "FAST");
    y += height + 3;
  }
  if (page.introduction?.trim()) { section("Trip overview"); prose(page.introduction); }
  if (page.snapshotPlacement !== "about") snapshot();
  if (!hidden.has("about") && details.summary.trim()) { section("About this trip"); prose(details.summary); }
  customSections("overview");
  if (page.snapshotPlacement === "about") snapshot();
  if (!hidden.has("highlights") && details.highlights.length) { section("Highlights"); list(details.highlights); }
  customSections("highlights");
  if (!hidden.has("stays") && details.stays.length) hotels();
  if (hasItinerary) days();
  if (!hidden.has("transfers") && details.transfers.trim()) { section("Transfers"); prose(details.transfers); }
  customSections("transfers");
  customSections("carry");
  customSections("guidelines");
  customSections("practical");
  locations();
  const included = !hidden.has("inclusions") && details.inclusions.length > 0;
  const excluded = !hidden.has("exclusions") && details.exclusions.length > 0;
  if (included) { section("Inclusions"); list(details.inclusions, COLOR.green); }
  if (excluded) { section("Exclusions"); list(details.exclusions, COLOR.red); }
  if ((included || excluded) && page.inclusionNote?.trim()) labelled("Note - ", page.inclusionNote, { size: 8 });
  customSections("faq");
  reviews();
  if (!hidden.has("cancellation") && details.cancellationPolicy.trim()) { section("Cancellation Policy"); prose(details.cancellationPolicy); }
  customSections("extras");
  closingBand();

  // The last page's frame closes under the thank-you band, as on the voucher.
  const count = doc.getNumberOfPages();
  for (let number = 1; number <= count; number++) {
    doc.setPage(number);
    const bottom = number === count ? y : FRAME.bottom;
    doc.setDrawColor(COLOR.frame).setLineWidth(0.3).rect(FRAME.x, FRAME.y, FRAME.width, bottom - FRAME.y, "S");
  }
  return doc;
}

/* ------------------------------------------------------------------ */
/* Browser-only image loading. jsPDF needs pixel data, so each picture  */
/* is drawn to a canvas and re-encoded; one that cannot be read (CORS,  */
/* timeout, broken link) is skipped, and a hotel prints a placeholder.  */
/* ------------------------------------------------------------------ */

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => reject(new Error("Image timed out")), 8000);
    image.onload = () => { window.clearTimeout(timer); resolve(image); };
    image.onerror = () => { window.clearTimeout(timer); reject(new Error("Image failed")); };
    image.src = src;
  });
}

async function readImage<T>(src: string, render: (image: HTMLImageElement) => T, optimiserWidth = 384) {
  const absolute = new URL(src, window.location.href);
  const candidates = [absolute.href];
  // Hosts without CORS headers can still be read through the same-origin optimiser.
  if (absolute.origin !== window.location.origin) candidates.push(`/_next/image?url=${encodeURIComponent(absolute.href)}&w=${optimiserWidth}&q=75`);
  for (const candidate of candidates) {
    try {
      return render(await loadImage(candidate));
    } catch {
      // Try the next source; with none left the PDF prints a placeholder.
    }
  }
  return undefined;
}

function canvas(width: number, height: number) {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const context = element.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  return { element, context };
}

// Fill a box with the image, cropping the overflow like CSS object-fit: cover.
function drawCover(context: CanvasRenderingContext2D, image: CanvasImageSource & { naturalWidth: number; naturalHeight: number }, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  context.drawImage(image, (image.naturalWidth - sourceWidth) / 2, (image.naturalHeight - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
}

const cropTo = (slot: ImageSlot) => (image: HTMLImageElement): PdfImage => {
  const [slotWidth, slotHeight] = IMAGE_SLOTS[slot];
  const { element, context } = canvas(slotWidth, slotHeight);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, element.width, element.height);
  drawCover(context, image, 0, 0, element.width, element.height);
  return { data: element.toDataURL("image/jpeg", 0.85), format: "JPEG", width: element.width, height: element.height };
};

// A 64-bit difference hash: it survives resizing and re-encoding, so the same
// photo stored at two URLs (original and resized copy) still matches.
function fingerprint(image: HTMLImageElement) {
  // Shrink in smoothed steps; one jump from a large photo to 9 x 8 samples
  // arbitrary pixels, and two sizes of one photo would hash differently.
  const middle = canvas(144, 128);
  middle.context.imageSmoothingQuality = "high";
  middle.context.drawImage(image, 0, 0, 144, 128);
  const { context } = canvas(9, 8);
  context.imageSmoothingQuality = "high";
  context.drawImage(middle.element, 0, 0, 9, 8);
  const pixels = context.getImageData(0, 0, 9, 8).data;
  const grey = (at: number) => pixels[at * 4] * 0.299 + pixels[at * 4 + 1] * 0.587 + pixels[at * 4 + 2] * 0.114;
  const bits: boolean[] = [];
  for (let row = 0; row < 8; row++) for (let column = 0; column < 8; column++) bits.push(grey(row * 9 + column) > grey(row * 9 + column + 1));
  return bits;
}
const samePicture = (a: boolean[], b: boolean[]) => a.filter((bit, index) => bit !== b[index]).length <= 10;

// All gallery photos combined into one picture: the main photo large on the
// left, the rest beside it. A single photo fills the whole width.
async function galleryCollage(urls: string[]): Promise<PdfImage | undefined> {
  const photos: HTMLImageElement[] = [];
  const seen: boolean[][] = [];
  for (const read of await inBatches(urls, 6, (url) => readImage(url, (image) => ({ image, hash: fingerprint(image) }), 1080))) {
    if (!read || seen.some((hash) => samePicture(hash, read.hash))) continue;
    seen.push(read.hash);
    photos.push(read.image);
    if (photos.length === GALLERY_LIMIT) break;
  }
  if (!photos.length) return undefined;

  const [width, height, gap] = [1900, 760, 24];
  const { element, context } = canvas(width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  const [main, ...others] = photos;
  if (!others.length) {
    drawCover(context, main, 0, 0, width, height);
  } else {
    const mainWidth = 1250;
    const sideX = mainWidth + gap;
    const sideWidth = width - sideX;
    const half = (height - gap) / 2;
    const quarter = (sideWidth - gap) / 2;
    drawCover(context, main, 0, 0, mainWidth, height);
    const boxes = [
      [[sideX, 0, sideWidth, height]],
      [[sideX, 0, sideWidth, half], [sideX, half + gap, sideWidth, half]],
      [[sideX, 0, sideWidth, half], [sideX, half + gap, quarter, half], [sideX + quarter + gap, half + gap, quarter, half]],
      [[sideX, 0, quarter, half], [sideX + quarter + gap, 0, quarter, half], [sideX, half + gap, quarter, half], [sideX + quarter + gap, half + gap, quarter, half]],
    ][others.length - 1];
    others.forEach((photo, index) => drawCover(context, photo, ...(boxes[index] as [number, number, number, number])));
  }
  return { data: element.toDataURL("image/jpeg", 0.85), format: "JPEG", width, height };
}

// Load a few at a time so a long itinerary does not open dozens of requests at once.
async function inBatches<T, R>(items: T[], size: number, work: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let start = 0; start < items.length; start += size) results.push(...await Promise.all(items.slice(start, start + size).map(work)));
  return results;
}

// The logo file carries wide blank margins; trim them so it sits flush left.
function trimmedLogo(image: HTMLImageElement): PdfImage {
  const scale = Math.min(1, 1400 / image.naturalWidth);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const source = canvas(width, height);
  source.context.drawImage(image, 0, 0, width, height);
  const pixels = source.context.getImageData(0, 0, width, height).data;
  let [minX, minY, maxX, maxY] = [width, height, -1, -1];
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const at = (py * width + px) * 4;
      const blank = pixels[at + 3] < 16 || (pixels[at] > 245 && pixels[at + 1] > 245 && pixels[at + 2] > 245);
      if (blank) continue;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
  }
  if (maxX < 0) return { data: source.element.toDataURL("image/png"), format: "PNG", width, height };
  const cropped = canvas(maxX - minX + 1, maxY - minY + 1);
  cropped.context.drawImage(source.element, minX, minY, cropped.element.width, cropped.element.height, 0, 0, cropped.element.width, cropped.element.height);
  return { data: cropped.element.toDataURL("image/png"), format: "PNG", width: cropped.element.width, height: cropped.element.height };
}

export async function loadItineraryPdfAssets(pkg: TravelPackage): Promise<ItineraryPdfAssets> {
  const details = getPackageDetails(pkg);
  const hidden = getPackagePageSections(details).hiddenSections;
  const wanted: [ImageSlot, string][] = [
    ...(hidden.includes("stays") ? [] : details.stays.map((stay) => ["hotel", stay.image?.trim() ?? ""] as [ImageSlot, string])),
    ...(hidden.includes("itinerary") ? [] : getPackageItinerary(details).flatMap((day) => (day.activities ?? []).flatMap(activityPhotos))
      .map((url) => ["activity", url] as [ImageSlot, string])),
  ];
  const unique = [...new Map(wanted.filter(([, url]) => url).map((entry) => [pdfImageKey(...entry), entry])).values()];
  const [logo, pictures, gallery] = await Promise.all([
    readImage("/comparemytrip-logo.png", trimmedLogo),
    inBatches(unique, 6, ([slot, url]) => readImage(url, cropTo(slot))),
    galleryCollage(galleryPhotos(pkg)),
  ]);
  const images: Record<string, PdfImage> = {};
  unique.forEach((entry, index) => { if (pictures[index]) images[pdfImageKey(...entry)] = pictures[index]; });
  return { logo, gallery, images };
}
