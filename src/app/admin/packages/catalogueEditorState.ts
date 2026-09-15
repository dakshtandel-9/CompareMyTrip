import { getPackageItinerary } from "@/lib/packageData";
import type { PackageCategory, PackageFact, PackageItineraryDay, PackageStay } from "@/lib/packageData";
import { packagePageSectionsIssue, type PackagePageSections } from "@/lib/packageDetailSections";

export type PackageForm = {
  facts: PackageFact[]; factsHidden: boolean; permitRequired: boolean;
  pageSections: PackagePageSections;
  title: string; location: string; destination: string; operator: string; region: "India" | "International";
  gallery: string[]; nights: string; days: string; pax: string; hotelStars: string;
  originalPrice: string; price: string; discount: string; deal: boolean; tags: PackageCategory[];
  summary: string; places: string; highlights: string; inclusions: string; exclusions: string;
  meals: string; transfers: string; flights: string; cancellationPolicy: string;
  dayZeroEnabled: boolean;
  itinerary: PackageItineraryDay[]; stays: PackageStay[];
  status: "draft" | "published";
  /** Weekdays the trip departs on. All seven selected means no restriction,
      which is what a package that runs daily should have. */
  departureDays: number[];
};

export type EditorIssue = { message: string; step: number };

export function packageEditorSteps(tags: PackageCategory[]) {
  const trek = tags.some((tag) => tag === "Treks" || tag === "Weekend Treks");
  return [
    { id: "intro", label: "Title & quick details" },
    { id: "about", label: "About the trip" },
    { id: "highlights", label: "Highlights" },
    { id: "itinerary", label: "Itinerary" },
    trek ? { id: "carry", label: "Things to carry" } : { id: "stays", label: "Hotels" },
    trek ? { id: "guidelines", label: "Trail guidelines" } : { id: "transfers", label: "Transfers" },
    { id: "locations", label: "Pickup & drop" },
    { id: "inclusions", label: "Inclusions" },
    { id: "exclusions", label: "Exclusions" },
    { id: "faq", label: "FAQs" },
    { id: "reviews", label: "Reviews" },
    { id: "booking", label: "Price & booking" },
    { id: "extras", label: "Policies & extras" },
    { id: "save", label: "Review & save" },
  ];
}

/** Returns the section that needs attention before either draft or live saves. */
export function packageValidationIssue(form: PackageForm): EditorIssue | null {
  const steps = packageEditorSteps(form.tags);
  const issue = (message: string, id: string): EditorIssue => ({ message, step: Math.max(0, steps.findIndex((step) => step.id === id)) });
  const hidden = form.pageSections?.hiddenSections ?? [];
  const itinerary = getPackageItinerary(form);
  if (!form.title.trim() || !form.location.trim()) return issue("Add a package title and destination / route before saving.", "intro");
  if (form.gallery.length < 1 || form.gallery.length > 10) return issue("Add at least 1 and at most 10 package images.", "intro");
  if (!hidden.includes("about") && (!form.summary.trim() || !form.places.split(/[,·]/).some((place) => place.trim()))) return issue("Add a package overview and at least one place.", "about");
  if (!hidden.includes("itinerary") && (!itinerary.length || itinerary.some((day) => !day.title.trim()))) return issue("Add a title for every itinerary day.", "itinerary");
  if (!hidden.includes("itinerary") && itinerary.some((day) => day.activities?.some((activity) => !activity.title.trim()))) return issue("Add a title for each timed activity, or remove the empty activity.", "itinerary");
  const stayStep = steps.some((step) => step.id === "stays") ? "stays" : "extras";
  if (!hidden.includes("stays") && form.stays.some((stay) => !stay.name.trim())) return issue("Add a name for every hotel or stay.", stayStep);
  if (!form.tags.length) return issue("Select at least one package category.", "intro");
  if (!form.factsHidden && form.facts.some((fact) => fact.visible !== false && (!fact.label.trim() || (fact.value !== undefined && !fact.value.trim()) || (!fact.source && !fact.value?.trim())))) return issue("Add a name and value for each visible details box, or hide or remove the box.", "intro");
  if (form.pageSections) {
    // Validate each group independently so Continue takes the author to the actual field.
    const empty = { ...form.pageSections, sections: [], gallery: { enabled: false, images: [] }, locations: { enabled: false, items: [] }, reviews: { enabled: false, items: [] } };
    for (const section of form.pageSections.sections) {
      const message = packagePageSectionsIssue({ ...empty, sections: [section] });
      if (message) {
        const position = section.placement === "overview" ? "about" : section.placement ?? "extras";
        return issue(message, steps.some((step) => step.id === position) ? position : "extras");
      }
    }
    for (const area of ["locations", "reviews", "gallery"] as const) {
      const message = packagePageSectionsIssue({ ...empty, [area]: form.pageSections[area] });
      if (message) return issue(message, area === "gallery" ? "extras" : area);
    }
  }
  if (!form.departureDays.length) return issue("Choose at least one departure day.", "booking");
  if (!form.nights.trim() || !form.days.trim() || !Number.isInteger(Number(form.nights)) || Number(form.nights) < 0 || !Number.isInteger(Number(form.days)) || Number(form.days) < 1 || Number(form.days) > 30) return issue("Enter a valid duration: 0 or more nights and 1–30 whole days.", "intro");
  const priceMissing = !form.price.trim() || Number(form.price) === 0;
  if (!(form.status === "draft" && priceMissing) && (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0 || !Number.isFinite(Number(form.originalPrice)) || Number(form.originalPrice) < Number(form.price))) return issue("Enter a sale price above ₹0 and an original price at least as high as the sale price.", "booking");
  if (!Number.isFinite(Number(form.discount)) || Number(form.discount) < 0 || Number(form.discount) > 90) return issue("Enter a discount between 0% and 90%.", "booking");
  if (!hidden.includes("stays") && form.stays.some((stay) => !Number.isInteger(stay.nights) || stay.nights < 1)) return issue("Enter at least 1 whole night for each stay.", stayStep);
  return null;
}

/** Query-driven creation closes naturally when browser Back removes create=1. */
export function catalogueEditorMode<T>(editing: T | null, create: string | null, ready: boolean): T | "new" | null {
  return editing ?? (create === "1" && ready ? "new" : null);
}

/** Leave create mode without changing other filters or adding another history entry. */
export function catalogueListHref(pathname: string, query: string): string {
  const params = new URLSearchParams(query);
  params.delete("create");
  const remaining = params.toString();
  return remaining ? `${pathname}?${remaining}` : pathname;
}
