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
  trekGrade: 0, bookingLabel: "",
  facts: defaultPackageFacts(), factsHidden: false, permitRequired: false, permitHidden: false,
  pageSections: defaultPackagePageSections(),
  title: "", location: "", destination: "", operator: "CompareMyTrip Partner", region: "India",
  image: "", gallery: [],
  nights: "2", days: "3", pax: "", hotelStars: "3", originalPrice: "", price: "", discount: "0", deal: false, tags: ["Family"],
  rating: "0", reviews: "0",
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
    trekGrade: pkg.trekGrade, bookingLabel: details.bookingLabel,
    availabilityNote: details.availabilityNote, quoteNote: details.quoteNote,
    facts: details.facts ?? defaultPackageFacts(), factsHidden: details.factsHidden ?? false, permitRequired: details.permitRequired === true, permitHidden: details.permitHidden === true,
    pageSections: getPackagePageSections(details),
    title: pkg.title, location: pkg.location, destination: pkg.destination, operator: pkg.operator,
    region: pkg.region, image: pkg.image, gallery: details.gallery, nights: String(pkg.nights), days: String(pkg.days), pax: pkg.pax,
    hotelStars: String(pkg.hotelStars), originalPrice: String(pkg.originalPrice), price: String(pkg.price),
    rating: String(pkg.rating), reviews: String(pkg.reviews),
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


export function packageFromForm(form: PackageForm, initialPackage?: TravelPackage, { normalize = true }: { normalize?: boolean } = {}): TravelPackage {
  const text = (value: string) => normalize ? value.trim() : value;
  const list = (value: string) => normalize ? lines(value) : value.split("\n");
  const places = normalize ? splitPlaces(form.places) : form.places.split(/[,·]/);
  return {
      id: initialPackage?.id ?? "preview",
      ...(initialPackage?.href !== undefined ? { href: initialPackage.href } : {}),
      ...(form.trekGrade !== undefined ? { trekGrade: form.trekGrade } : {}),
      title: text(form.title), location: text(form.location), operator: text(form.operator), region: form.region,
      /* Headline destination for the catalogue's destination filter: the first
         place of the route unless one was typed explicitly. */
      destination: normalize ? form.destination.trim() || splitPlaces(form.places)[0] || form.location.trim() : form.destination,
      image: form.image ?? form.gallery[0] ?? "", nights: Number(form.nights), days: Number(form.days), pax: text(form.pax), hotelStars: Number(form.hotelStars), tags: form.tags,
      rating: Number(form.rating ?? initialPackage?.rating ?? 0), reviews: Number(form.reviews ?? initialPackage?.reviews ?? 0), discount: Number(form.discount), originalPrice: Number(form.originalPrice), price: Number(form.price), deal: form.deal, status: form.status,
      /* Stored empty when every day is ticked: "departs any day" is the
         absence of a rule, not a list of seven. */
      departureDays: form.departureDays.length === 7 ? [] : [...form.departureDays].sort((a, b) => a - b),
      details: { facts: form.facts.map((fact) => ({ ...fact, label: text(fact.label), ...(fact.value !== undefined ? { value: text(fact.value) } : {}) })), factsHidden: form.factsHidden, gallery: form.gallery, summary: text(form.summary), places, highlights: list(form.highlights),
        ...(form.bookingLabel !== undefined ? { bookingLabel: text(form.bookingLabel) } : {}),
        ...(form.availabilityNote !== undefined ? { availabilityNote: text(form.availabilityNote) } : {}),
        ...(form.quoteNote !== undefined ? { quoteNote: text(form.quoteNote) } : {}),
        dayZeroEnabled: form.dayZeroEnabled,
        itinerary: form.itinerary.map((day) => ({ ...day, title: text(day.title), route: text(day.route), description: text(day.description) })),
        stays: form.stays.map((stay) => ({ ...stay, name: text(stay.name), place: normalize ? stay.place.trim() || form.destination.trim() || form.location.trim() : stay.place })),
        inclusions: list(form.inclusions), exclusions: list(form.exclusions), meals: text(form.meals), transfers: text(form.transfers),
        flights: text(form.flights), permitRequired: form.permitRequired, permitHidden: form.permitHidden, cancellationPolicy: text(form.cancellationPolicy), pageSections: { ...form.pageSections } },
    };
}

export function applyPackagePreviewChange(current: PackageForm, path: (string | number)[], value: unknown, initialPackage?: TravelPackage): PackageForm {
    const snapshot = packageFromForm(current, initialPackage, { normalize: false });
    const field = path.join(".");
    const originalValue = value;
    if (field === "details.places" && typeof value === "string") value = value.split(/[,·]/);
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
      const count = Number(value);
      if (String(value).trim() && Number.isInteger(count) && count >= 1 && count <= 30) {
        const zero = next.details!.itinerary.find(day => day.day === 0);
        const previous = next.details!.itinerary.filter(day => day.day !== 0);
        // Changing a duration must not delete an authored day. Authors can
        // remove unwanted days explicitly in the itinerary editor.
        next.details!.itinerary = [...(zero ? [zero] : []), ...makeDays(Math.max(count, previous.length)).map((day, index) => previous[index] ?? day)];
      }
    }
    const updateDiscount = (field === "price" || field === "originalPrice")
      && String(originalValue).trim() !== "" && Number.isFinite(Number(originalValue)) && Number(next.price) > 0;
    if (updateDiscount) {
      if (path[0] === "price" && next.originalPrice < next.price) next.originalPrice = next.price;
      next.discount = next.originalPrice > 0 ? Math.round((1 - next.price / next.originalPrice) * 100) : 0;
    }
    const result = formFromPackage(next);
    // Preserve raw input while typing, including commas, trailing newlines,
    // an empty price, and a decimal point. Normalization belongs to Save.
    result.places = field === "details.places" ? typeof originalValue === "string" ? originalValue : result.places : current.places;
    for (const key of ["nights", "days", "hotelStars", "price", "originalPrice", "discount", "rating", "reviews"] as const) {
      const derived = key === "days" && field === "details.itinerary"
        || key === "discount" && updateDiscount
        || key === "originalPrice" && field === "price" && Number(current.originalPrice) < Number(originalValue);
      if (field === key && typeof originalValue === "string") result[key] = originalValue;
      else if (field !== key && !derived) result[key] = current[key];
    }
    return result;
}
