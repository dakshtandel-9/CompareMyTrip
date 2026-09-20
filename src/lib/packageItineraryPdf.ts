
import { plainPackageText } from "@/lib/packageRichText";
import { jsPDF } from "jspdf";
import { getPackagePageSections, isVisiblePackageSection, type PackageSectionPlacement } from "./packageDetailSections";
import { getPackageFacts } from "./packageFacts";
import { departureDaysLabel, getPackageDetails, getPackageItinerary, type TravelPackage } from "./packageData";

// Use readable equivalents for symbols outside the PDF's built-in Latin font.
function pdfText(value: string) {
  return plainPackageText(value).replace(/₹/g, "INR ").replace(/[★☆]/g, "-star")
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/•/g, "-")
    .replace(/→/g, " to ").replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...").replace(/\u00a0/g, " ");
}

export function itineraryFilename(title: string) {
  const name = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
  return `${name || "package"}-itinerary.pdf`;
}

export function createPackageItineraryPdf(pkg: TravelPackage, packageUrl: string) {
  const details = getPackageDetails(pkg);
  const itinerary = getPackageItinerary(details);
  const page = getPackagePageSections(details);
  const hidden = new Set(page.hiddenSections);
  const hasItinerary = !hidden.has("itinerary") && itinerary.length > 0;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const width = 174;
  const bottom = 272;
  let y = 36;

  doc.setProperties({ title: `${pkg.title} - ${hasItinerary ? "Detailed itinerary" : "Package overview"}`, author: "CompareMyTrip", subject: "Package itinerary and travel details" });

  function header() {
    doc.setFillColor("#ffc400");
    doc.rect(0, 0, 210, 3, "F");
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor("#0f172a");
    doc.text("COMPAREMYTRIP", margin, 17);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor("#64748b");
    doc.text(hasItinerary ? "DETAILED TRIP ITINERARY" : "PACKAGE OVERVIEW", 192, 17, { align: "right" });
    doc.setDrawColor("#e2e8f0").line(margin, 23, 192, 23);
  }

  function ensureSpace(height: number) {
    if (y + height <= bottom) return;
    doc.addPage();
    header();
    y = 34;
  }

  function paragraph(text: string, size = 10, bold = false, color = "#334155", gap = 3) {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size);
    const lines: string[] = doc.splitTextToSize(pdfText(text || "Not specified"), width);
    const lineHeight = size * 0.3528 * 1.5;
    for (const line of lines) {
      ensureSpace(lineHeight);
      // A new page's header changes the current font and color.
      doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size).setTextColor(color);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += gap;
  }

  function section(title: string) {
    ensureSpace(27);
    y += 5;
    doc.setFillColor("#ffc400").rect(margin, y - 4, 1.5, 6, "F");
    doc.setFont("helvetica", "bold").setFontSize(14).setTextColor("#0f172a");
    doc.text(title, margin + 5, y);
    y += 11;
  }

  function list(items: string[]) {
    if (!items.length) paragraph("Not specified");
    for (const item of items) paragraph(`- ${item}`);
  }

  function customSections(placement: PackageSectionPlacement) {
    for (const item of page.sections.filter((item) => (item.placement ?? "extras") === placement && isVisiblePackageSection(item))) {
      section(item.title);
      if (item.body.trim()) paragraph(item.body);
      if (item.layout !== "box") for (const entry of item.items.filter((entry) => entry.visible !== false)) {
        if (entry.title.trim()) paragraph(entry.title, 11, true);
        if (entry.body.trim()) paragraph(entry.body);
      }
    }
  }
  function snapshot() {
    const facts = getPackageFacts(pkg);
    if (!facts.length) return;
    section("Trip snapshot");
    for (const fact of facts) paragraph(`${fact.label}: ${fact.value}`, 9);
  }

  header();
  paragraph(pkg.title, 25, true, "#0f172a", 4);
  if (page.tagline?.trim()) paragraph(page.tagline, 12, false, "#64748b", 5);
  paragraph(pkg.location, 12, false, "#64748b", 5);
  if (page.introduction?.trim()) paragraph(page.introduction);
  if (page.snapshotPlacement !== "about") snapshot();
  if (!hidden.has("about") && details.summary.trim()) { section("About this trip"); paragraph(details.summary); }
  customSections("overview");
  if (page.snapshotPlacement === "about") snapshot();
  if (!hidden.has("highlights") && details.highlights.length) { section("Trip highlights"); list(details.highlights); }
  customSections("highlights");

  if (hasItinerary) {
    ensureSpace(42);
    section("Day-by-day itinerary");
    for (const day of itinerary) {
      ensureSpace(30);
      paragraph(`Day ${day.day} - ${day.title}`, 12, true, "#0f172a");
      if (day.route) paragraph(`Route: ${day.route}`, 9, false, "#64748b");
      if (day.description.trim()) paragraph(day.description);
      for (const activity of day.activities ?? []) {
        if (!activity.title.trim()) continue;
        paragraph([activity.time, activity.title].filter(Boolean).join(" | "), 10, true);
        if (activity.description.trim()) paragraph(activity.description);
      }
      if (day.meals.trim()) paragraph(`Meals: ${day.meals}`, 9, true, "#334155", 7);
    }
    if (page.itineraryNote?.trim()) paragraph(page.itineraryNote, 9);
  }
  if (!hidden.has("stays") && details.stays.length) {
    section("Hotels & accommodation");
    for (const stay of details.stays) {
      ensureSpace(24);
      const rating = stay.stars && stay.stars > 0 ? ` (${Math.round(stay.stars)} star)` : "";
      paragraph(`${stay.name}${rating}${stay.nights > 0 ? ` - ${stay.nights} night${stay.nights === 1 ? "" : "s"}` : ""}`, 11, true);
      paragraph(`${stay.place}\n${stay.comfort}`);
      for (const [label, value] of [["Room", stay.roomType], ["Meal plan", stay.mealPlan], ["Room inclusion", stay.roomInclusion], ["Check-in", stay.checkIn], ["Check-out", stay.checkOut]]) {
        if (value?.trim()) paragraph(`${label}: ${value}`, 9);
      }
    }
    if (page.stayNote?.trim()) paragraph(page.stayNote, 9);
  }
  if (!hidden.has("transfers") && details.transfers.trim()) { section("Transfers"); paragraph(details.transfers); }
  customSections("transfers");
  customSections("carry");
  customSections("guidelines");
  customSections("practical");
  const locations = page.locations.enabled ? page.locations.items.filter((item) => item.visible && item.name.trim()) : [];
  if (locations.length) {
    section("Pickup & drop locations");
    for (const location of locations) {
      paragraph(location.name, 11, true);
      if (location.address.trim()) paragraph(location.address);
      if (location.notes.trim()) paragraph(location.notes, 9);
    }
  }
  const included = !hidden.has("inclusions") && details.inclusions.length > 0;
  const excluded = !hidden.has("exclusions") && details.exclusions.length > 0;
  if (included) { section("Included"); list(details.inclusions); }
  if (excluded) { section("Not included"); list(details.exclusions); }
  if ((included || excluded) && page.inclusionNote?.trim()) paragraph(page.inclusionNote, 9);
  customSections("faq");
  const reviews = page.reviews.enabled ? page.reviews.items.filter((review) => review.visible && review.name.trim() && review.text.trim() && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5) : [];
  if (reviews.length) {
    section("Traveller reviews");
    for (const review of reviews) { paragraph(`${review.name} - ${review.rating}/5`, 10, true); paragraph(review.text); }
  }
  if (!hidden.has("cancellation") && details.cancellationPolicy.trim()) { section("Cancellation policy"); paragraph(details.cancellationPolicy); }
  customSections("extras");
  section("Plan your trip");
  paragraph(pkg.price > 0 ? `INR ${pkg.price.toLocaleString("en-IN")} per person` : "Contact the travel team for pricing.", 18, true, "#0f172a");
  if (page.bookingNote?.trim()) paragraph(page.bookingNote, 9);
  const departures = departureDaysLabel(pkg);
  if (departures) paragraph(`Departures: ${departures}`);

  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setDrawColor("#e2e8f0").line(margin, 280, 192, 280);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor("#64748b");
    doc.textWithLink("CompareMyTrip | View package online", margin, 287, { url: packageUrl });
    doc.text(`${page} / ${count}`, 192, 287, { align: "right" });
  }
  return doc;
}
