import { jsPDF } from "jspdf";
import { departureDaysLabel, getPackageDetails, type TravelPackage } from "./packageData";

// Use readable equivalents for symbols outside the PDF's built-in Latin font.
function pdfText(value: string) {
  return value.replace(/₹/g, "INR ").replace(/[★☆]/g, "-star")
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
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const width = 174;
  const bottom = 272;
  let y = 36;

  doc.setProperties({ title: `${pkg.title} - Detailed itinerary`, author: "CompareMyTrip", subject: "Package itinerary and travel details" });

  function header() {
    doc.setFillColor("#ffc400");
    doc.rect(0, 0, 210, 3, "F");
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor("#0f172a");
    doc.text("COMPAREMYTRIP", margin, 17);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor("#64748b");
    doc.text("DETAILED TRIP ITINERARY", 192, 17, { align: "right" });
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

  header();
  paragraph(pkg.title, 25, true, "#0f172a", 4);
  paragraph(pkg.location, 12, false, "#64748b", 5);
  paragraph(`${pkg.nights} nights / ${pkg.days} days  |  ${pkg.pax}  |  ${pkg.hotelStars}-star stays`, 10, true);
  paragraph(`INR ${pkg.price.toLocaleString("en-IN")} per person`, 18, true, "#0f172a");
  if (pkg.originalPrice > pkg.price) paragraph(`Original price: INR ${pkg.originalPrice.toLocaleString("en-IN")} per person`, 9);
  paragraph("Listed package price; your final quote depends on dates, availability and customizations.", 9, false, "#64748b");

  section("About this trip");
  paragraph(details.summary);
  section("Travel details");
  paragraph(`Destination: ${pkg.destination || pkg.location}`);
  paragraph(`Places covered: ${details.places.join(" / ") || pkg.location}`);
  paragraph(`Meals: ${details.meals}`);
  paragraph(`Transfers: ${details.transfers}`);
  paragraph(`Flights: ${details.flights}`);
  const departures = departureDaysLabel(pkg);
  if (departures) paragraph(`Departures: ${departures}`);
  section("Trip highlights");
  list(details.highlights);

  // Leave room for the opening day without creating a nearly empty page
  // when a long overview has already continued onto the next one.
  ensureSpace(90);
  section("Day-by-day itinerary");
  if (!details.itinerary.length) paragraph("A detailed daily itinerary has not been provided for this package.");
  for (const day of details.itinerary) {
    ensureSpace(30);
    paragraph(`Day ${day.day} - ${day.title}`, 12, true, "#0f172a");
    if (day.route) paragraph(`Route: ${day.route}`, 9, false, "#64748b");
    paragraph(day.description);
    paragraph(`Meals: ${day.meals || "Not specified"}`, 9, true, "#334155", 7);
  }

  section("Comfort stays");
  if (!details.stays.length) paragraph("Stay details have not been provided for this package.");
  for (const stay of details.stays) {
    ensureSpace(24);
    paragraph(`${stay.name} - ${stay.nights} night${stay.nights === 1 ? "" : "s"}`, 11, true);
    paragraph(`${stay.place}\n${stay.comfort}`);
  }
  section("Included");
  list(details.inclusions);
  section("Not included");
  list(details.exclusions);
  section("Cancellation policy");
  paragraph(details.cancellationPolicy);

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
