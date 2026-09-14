import type { PackageCategory, PackageFact, PackageItineraryDay, PackageStay } from "@/lib/packageData";

export type PackageForm = {
  facts: PackageFact[]; factsHidden: boolean; permitRequired: boolean;
  title: string; location: string; destination: string; operator: string; region: "India" | "International";
  gallery: string[]; nights: string; days: string; pax: string; hotelStars: string;
  originalPrice: string; price: string; discount: string; deal: boolean; tags: PackageCategory[];
  summary: string; places: string; highlights: string; inclusions: string; exclusions: string;
  meals: string; transfers: string; flights: string; cancellationPolicy: string;
  itinerary: PackageItineraryDay[]; stays: PackageStay[];
  status: "draft" | "published";
  /** Weekdays the trip departs on. All seven selected means no restriction,
      which is what a package that runs daily should have. */
  departureDays: number[];
};

export type EditorIssue = { message: string; step: number };

/** Returns the section that needs attention before either draft or live saves. */
export function packageValidationIssue(form: PackageForm): EditorIssue | null {
  const issue = (message: string, step: number): EditorIssue => ({ message, step });
  if (!form.title.trim() || !form.location.trim()) return issue("Add a package title and destination / route before saving.", 0);
  if (form.gallery.length < 3 || form.gallery.length > 10) return issue("Add a minimum of 3 and a maximum of 10 package images.", 2);
  if (!form.summary.trim() || !form.places.split(/[,·]/).some((place) => place.trim())) return issue("Add a package overview and at least one place.", 3);
  if (!form.itinerary.length || form.itinerary.some((day) => !day.title.trim())) return issue("Add a title for every itinerary day.", 4);
  if (!form.stays.length || form.stays.some((stay) => !stay.name.trim())) return issue("Add a name for every hotel or stay.", 4);
  if (!form.tags.length) return issue("Select at least one package category.", 0);
  if (!form.factsHidden && form.facts.some((fact) => fact.visible !== false && (!fact.label.trim() || (fact.value !== undefined && !fact.value.trim()) || (!fact.source && !fact.value?.trim())))) return issue("Add a name and value for each visible details box, or hide or remove the box.", 5);
  // Nothing ticked would leave a package nobody can pick a date for.
  if (!form.departureDays.length) return issue("Choose at least one departure day.", 1);
  if (!Number.isInteger(Number(form.nights)) || Number(form.nights) < 1 || !Number.isInteger(Number(form.days)) || Number(form.days) < 2 || Number(form.days) > 30) return issue("Enter a valid duration: at least 1 night and 2–30 whole days.", 0);
  if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0 || !Number.isFinite(Number(form.originalPrice)) || Number(form.originalPrice) < Number(form.price)) return issue("Enter a sale price above ₹0 and an original price at least as high as the sale price.", 1);
  if (!Number.isFinite(Number(form.discount)) || Number(form.discount) < 0 || Number(form.discount) > 90) return issue("Enter a discount between 0% and 90%.", 1);
  if (form.stays.some((stay) => !Number.isInteger(stay.nights) || stay.nights < 1)) return issue("Enter at least 1 whole night for each stay.", 4);
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
