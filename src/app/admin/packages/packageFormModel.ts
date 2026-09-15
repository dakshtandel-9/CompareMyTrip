import { changePackageContent } from "@/lib/packagePreviewEditing";
import { departureDays, getPackageDetails, setPackageDayZero, isPackageDayZeroEnabled, type PackageItineraryDay, type TravelPackage } from "@/lib/packageData";
import { defaultPackageFacts } from "@/lib/packageFacts";
import { defaultPackagePageSections, getPackagePageSections } from "@/lib/packageDetailSections";
import type { PackageForm } from "./catalogueEditorState";
const lines = (value: string) => value.split("\n").map(item => item.trim()).filter(Boolean);
const splitPlaces = (value: string) => value.split(/[,·]/).map(item => item.trim()).filter(Boolean);
export const makeDays = (count = 5): PackageItineraryDay[] => Array.from({ length: count }, (_, index) => ({
  day: index + 1,
  title: index === 0 ? "Arrival and check-in" : index === count - 1 ? "Departure" : "Local experiences",
  route: "", description: "", meals: "",
}));

const initialForm: PackageForm = {
  facts: defaultPackageFacts(), factsHidden: false, permitRequired: false,
  pageSections: defaultPackagePageSections(),
  title: "", location: "", destination: "", operator: "CompareMyTrip Partner", region: "India",
  gallery: [],
  nights: "2", days: "3", pax: "", hotelStars: "3", originalPrice: "", price: "", discount: "0", deal: false, tags: ["Family"],
  summary: "", places: "", highlights: "",
  inclusions: "", exclusions: "",
  meals: "", transfers: "", flights: "",
  cancellationPolicy: "",
  dayZeroEnabled: false, itinerary: makeDays(3), stays: [],
  // Every day, until somebody narrows it.
  departureDays: [0, 1, 2, 3, 4, 5, 6],
  /* New packages start as drafts: nothing reaches the website or the sitemap
     until somebody has read it back and chosen to publish. */
  status: "draft",
};

export function formFromPackage(pkg?: TravelPackage): PackageForm {
  if (!pkg) return JSON.parse(JSON.stringify(initialForm)) as PackageForm;
  const details = getPackageDetails(pkg);
  return {
    facts: details.facts ?? defaultPackageFacts(), factsHidden: details.factsHidden ?? false, permitRequired: details.permitRequired === true,
    pageSections: getPackagePageSections(details),
    title: pkg.title, location: pkg.location, destination: pkg.destination, operator: pkg.operator,
    region: pkg.region, gallery: details.gallery, nights: String(pkg.nights), days: String(pkg.days), pax: pkg.pax,
    hotelStars: String(pkg.hotelStars), originalPrice: String(pkg.originalPrice), price: String(pkg.price),
    discount: String(pkg.discount), deal: Boolean(pkg.deal), tags: pkg.tags, summary: details.summary,
    places: details.places.join(", "), highlights: details.highlights.join("\n"), inclusions: details.inclusions.join("\n"),
    exclusions: details.exclusions.join("\n"), meals: details.meals, transfers: details.transfers, flights: details.flights,
    dayZeroEnabled: isPackageDayZeroEnabled(details), cancellationPolicy: details.cancellationPolicy, itinerary: details.itinerary, stays: details.stays,
    status: pkg.status === "draft" ? "draft" : "published",
    /* An empty list on the package means "no restriction", which shows here
       as every day ticked — the form is the editable view of the rule, not a
       copy of how it is stored. */
    departureDays: departureDays(pkg).length ? departureDays(pkg) : [0, 1, 2, 3, 4, 5, 6],
  };
}


export function packageFromForm(form: PackageForm, initialPackage?: TravelPackage): TravelPackage {
  const isTrek = form.tags.some(tag => tag === "Treks" || tag === "Weekend Treks");
  return {
      id: initialPackage?.id ?? "preview",
      title: form.title.trim(), location: form.location.trim(), operator: initialPackage?.operator || "CompareMyTrip", region: form.region,
      /* Headline destination for the catalogue's destination filter: the first
         place of the route unless one was typed explicitly. */
      destination: form.destination.trim() || splitPlaces(form.places)[0] || form.location.trim(),
      image: form.gallery[0], nights: Number(form.nights), days: Number(form.days), pax: form.pax.trim(), hotelStars: Number(form.hotelStars), tags: form.tags,
      rating: initialPackage?.rating ?? 5, reviews: initialPackage?.reviews ?? 0, discount: Number(form.discount), originalPrice: Number(form.originalPrice), price: Number(form.price), deal: form.deal, status: form.status,
      /* Stored empty when every day is ticked: "departs any day" is the
         absence of a rule, not a list of seven. */
      departureDays: form.departureDays.length === 7 ? [] : [...form.departureDays].sort((a, b) => a - b),
      details: { facts: form.facts.map((fact) => ({ ...fact, label: fact.label.trim(), ...(fact.value !== undefined ? { value: fact.value.trim() } : {}) })), factsHidden: form.factsHidden, gallery: form.gallery, summary: form.summary.trim(), places: splitPlaces(form.places), highlights: lines(form.highlights),
        dayZeroEnabled: form.dayZeroEnabled,
        itinerary: form.itinerary.map((day) => ({ ...day, title: day.title.trim(), route: day.route.trim(), description: day.description.trim() })),
        stays: form.stays.map((stay) => ({ ...stay, name: stay.name.trim(), place: stay.place.trim() || form.destination.trim() || form.location.trim() })),
        inclusions: lines(form.inclusions), exclusions: lines(form.exclusions), meals: form.meals.trim(), transfers: form.transfers.trim(),
        flights: form.flights.trim(), permitRequired: form.permitRequired, cancellationPolicy: form.cancellationPolicy.trim(), pageSections: { ...form.pageSections, snapshotPlacement: isTrek ? "intro" : "about" } },
    };
}

export function applyPackagePreviewChange(current: PackageForm, path: (string | number)[], value: unknown, initialPackage?: TravelPackage): PackageForm {
    const snapshot = packageFromForm(current, initialPackage);
    if (path.join(".") === "details.places" && typeof value === "string") value = value.split(/[,·]/).map(item => item.trim()).filter(Boolean);
    if (path[path.length - 1] === "image" && Array.isArray(value)) value = value[0] ?? "";
    let next = changePackageContent(snapshot, path, value);
    if (path.join(".") === "details.dayZeroEnabled") next = { ...next, details: { ...next.details!, ...setPackageDayZero(next.details!, Boolean(value)) } };
    if (path.join(".") === "details.itinerary") {
      const zero = next.details!.itinerary.find(day => day.day === 0);
      const days = next.details!.itinerary.filter(day => day.day !== 0).map((day, index) => ({ ...day, day: index + 1 }));
      next.details!.itinerary = [...(zero ? [zero] : []), ...days];
      if (!zero) next.details!.dayZeroEnabled = false;
      next.days = Math.max(1, days.length);
    }
    if (path.join(".") === "days") {
      const count = Math.max(1, Math.min(30, Math.trunc(Number(value)) || 1));
      const zero = next.details!.itinerary.find(day => day.day === 0);
      const previous = next.details!.itinerary.filter(day => day.day !== 0);
      next.days = count;
      next.details!.itinerary = [...(zero ? [zero] : []), ...makeDays(count).map((day, index) => previous[index] ?? day)];
    }
    if (path[0] === "price" || path[0] === "originalPrice") {
      if (path[0] === "price" && next.originalPrice < next.price) next.originalPrice = next.price;
      next.discount = next.originalPrice > 0 ? Math.round((1 - next.price / next.originalPrice) * 100) : 0;
    }
    return formFromPackage(next);
}
