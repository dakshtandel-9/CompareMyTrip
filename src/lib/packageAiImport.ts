import type { PackageForm } from "@/app/admin/packages/catalogueEditorState";
import { PACKAGE_CATEGORIES } from "./packageData";
import { BUILTIN_PACKAGE_SECTIONS, PACKAGE_SECTION_PLACEMENTS, packagePageSectionsIssue } from "./packageDetailSections";
import iconNames from "./packageIconNames.json";

export const PACKAGE_IMPORT_MAX_BYTES = 1024 * 1024;

type Schema = {
  type: "object" | "array" | "string" | "number" | "integer" | "boolean";
  properties?: Record<string, Schema>; required?: string[]; additionalProperties?: false;
  items?: Schema; enum?: readonly (string | number | boolean)[];
  minLength?: number; maxLength?: number; minItems?: number; maxItems?: number;
  minimum?: number; maximum?: number; description?: string;
};
const str = (description = "", required = false): Schema => ({ type: "string", maxLength: 20000, ...(required ? { minLength: 1 } : {}), ...(description ? { description } : {}) });
const choice = (values: readonly string[]): Schema => ({ type: "string", enum: values });
const bool: Schema = { type: "boolean" };
const number = (minimum: number, maximum: number, integer = true): Schema => ({ type: integer ? "integer" : "number", minimum, maximum });
const array = (items: Schema, maxItems = 100, minItems = 0): Schema => ({ type: "array", items, minItems, maxItems });
const object = (properties: Record<string, Schema>): Schema => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const textList = array(str("", true));
const id = str("Unique ID within this list, for example item-1", true);
const productSchema = object({
  title: str("Package title", true), location: str("Display route", true), destination: str("Destination used for catalogue grouping", true),
  region: choice(["India", "International"]), tags: array(choice(PACKAGE_CATEGORIES), 11, 1),
  nights: number(0, 30), days: number(1, 30), pax: str("Group size or per-person basis", true), hotelStars: number(0, 5),
  price: number(0, 100000000, false), originalPrice: number(0, 100000000, false),
  departureDays: array(number(0, 6), 7, 1),
  factsHidden: bool, permitRequired: bool,
  facts: array(object({ id, icon: choice(iconNames), label: str("", true), value: str("Exact display value", true), visible: bool }), 30),
  summary: str("About the trip", true), places: array(str("", true), 100, 1), highlights: textList,
  dayZeroEnabled: bool,
  itinerary: array(object({ day: number(0, 30), title: str("", true), route: str(), description: str(), meals: str(),
    activities: array(object({ time: str(), title: str("", true), description: str() })) }), 31, 1),
  stays: array(object({ name: str("", true), nights: number(1, 30), place: str(), comfort: str(), roomType: str(), mealPlan: str(), checkIn: str(), checkOut: str() }), 30),
  inclusions: textList, exclusions: textList, meals: str(), transfers: str(), flights: str(), cancellationPolicy: str(),
  pageSections: object({
    tagline: str(), introduction: str(), itineraryNote: str(), stayNote: str(), inclusionNote: str(), bookingNote: str(),
    hiddenSections: array(choice(BUILTIN_PACKAGE_SECTIONS.map(section => section.id)), 8),
    sections: array(object({ id, title: str("", true), layout: choice(["box", "boxes", "dropdown"]), visible: bool,
      placement: choice(PACKAGE_SECTION_PLACEMENTS.map(section => section.id)), body: str(),
      items: array(object({ id, title: str("", true), body: str(), visible: bool })) }), 40),
    locations: object({ enabled: bool, items: array(object({ id, type: choice(["pickup", "drop"]), name: str("", true), address: str(), notes: str(), mapUrl: str("Verified HTTPS Google, Apple or OpenStreetMap URL, or empty string"), visible: bool }), 50) }),
    reviews: object({ enabled: bool, items: array(object({ id, name: str("", true), rating: number(1, 5), text: str("", true), visible: bool }), 50) }),
  }),
});

export const PACKAGE_IMPORT_SCHEMA = object({ kind: choice(["comparemytrip.product"]), version: { type: "integer", enum: [1] }, product: productSchema });

type Replaced = "gallery" | "operator" | "deal" | "status" | "nights" | "days" | "hotelStars" | "price" | "originalPrice" | "discount" | "places" | "highlights" | "inclusions" | "exclusions" | "pageSections";
export type ImportedProduct = Omit<PackageForm, Replaced> & {
  nights: number; days: number; hotelStars: number; price: number; originalPrice: number;
  places: string[]; highlights: string[]; inclusions: string[]; exclusions: string[];
  pageSections: Omit<PackageForm["pageSections"], "gallery" | "locations"> & {
    locations: { enabled: boolean; items: Omit<PackageForm["pageSections"]["locations"]["items"][number], "image">[] };
  };
};

function validate(value: unknown, schema: Schema, path: string): void {
  const fail = (message: string): never => { throw new Error(`${path}: ${message}`); };
  if (schema.enum && !schema.enum.includes(value as string)) fail(path.endsWith(".icon") ? "choose an icon from the prompt’s supported list." : `choose one of ${schema.enum.join(", ")}.`);
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail("must be an object.");
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) if (!Object.hasOwn(schema.properties!, key)) fail(`unexpected field “${key}”. Use the product prompt format.`);
    for (const key of schema.required!) {
      if (!Object.hasOwn(record, key)) fail(`missing field “${key}”.`);
      validate(record[key], schema.properties![key], `${path}.${key}`);
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) fail("must be a list.");
    const values = value as unknown[];
    if (values.length < schema.minItems! || values.length > schema.maxItems!) fail(`must contain ${schema.minItems}–${schema.maxItems} items.`);
    values.forEach((item, index) => validate(item, schema.items!, `${path}[${index}]`));
  } else if (schema.type === "string") {
    if (typeof value !== "string") fail("must be text.");
    if ((value as string).trim().length < (schema.minLength ?? 0) || (value as string).length > schema.maxLength!) fail(`must contain ${schema.minLength ?? 0}–${schema.maxLength} characters.`);
  } else if (schema.type === "boolean") {
    if (typeof value !== "boolean") fail("must be true or false.");
  } else if (typeof value !== "number" || !Number.isFinite(value) || (schema.type === "integer" && !Number.isInteger(value)) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)) {
    fail(`must be ${schema.type === "integer" ? "a whole number" : "a number"}${schema.minimum !== undefined ? ` between ${schema.minimum} and ${schema.maximum}` : ""}.`);
  }
}

function unique(values: (string | number)[], path: string) {
  if (new Set(values).size !== values.length) throw new Error(`${path}: duplicate values or IDs are not allowed.`);
}

export function parsePackageImport(text: string): ImportedProduct {
  if (new TextEncoder().encode(text).length > PACKAGE_IMPORT_MAX_BYTES) throw new Error("Choose a JSON file smaller than 1 MB.");
  let data: unknown;
  try { data = JSON.parse(text.replace(/^\uFEFF/, "")); } catch { throw new Error("This file is not valid JSON. Upload the .json file from ChatGPT, without Markdown fences."); }
  validate(data, PACKAGE_IMPORT_SCHEMA, "file");
  const product = (data as { product: ImportedProduct }).product;
  if (product.originalPrice < product.price) throw new Error("product.originalPrice: must be at least the selling price.");
  if (product.originalPrice > 0 && (1 - product.price / product.originalPrice) * 100 > 90) throw new Error("product.price: discount cannot exceed 90%. For an unpriced draft, set both prices to 0.");
  unique(product.tags, "product.tags"); unique(product.departureDays, "product.departureDays");
  unique(product.facts.map(fact => fact.id), "product.facts");
  unique(product.itinerary.map(day => day.day), "product.itinerary");
  const days = product.itinerary.map(day => day.day).sort((a, b) => a - b);
  const start = product.dayZeroEnabled ? 0 : 1;
  if (days.length !== product.days + (start === 0 ? 1 : 0) || days.some((day, index) => day !== index + start)) throw new Error(`product.itinerary: include every day from Day ${start} through Day ${product.days}, matching days and the Day 0 toggle.`);
  const sections = product.pageSections;
  unique(sections.hiddenSections, "product.pageSections.hiddenSections");
  unique(sections.sections.map(section => section.id), "product.pageSections.sections");
  sections.sections.forEach(section => unique(section.items.map(item => item.id), `section ${section.id}`));
  unique(sections.locations.items.map(item => item.id), "product.pageSections.locations");
  unique(sections.reviews.items.map(item => item.id), "product.pageSections.reviews");
  const issue = packagePageSectionsIssue({ ...sections, gallery: { enabled: false, images: [] }, locations: { ...sections.locations, items: sections.locations.items.map(item => ({ ...item, image: "" })) } });
  if (issue) throw new Error(issue);
  return product;
}

/** Explicitly retain administrative state and all existing uploads. No save occurs here. */
export function applyPackageImport(current: PackageForm, product: ImportedProduct): PackageForm {
  const existingLocations = current.pageSections.locations.items;
  const match = (item: ImportedProduct["pageSections"]["locations"]["items"][number]) => existingLocations.find(old => old.type === item.type && old.name === item.name && old.address === item.address);
  const locations = product.pageSections.locations.items.map(item => ({ ...item, image: match(item)?.image ?? "" }));
  const unmatchedPhotos = existingLocations.filter(old => old.image && !locations.some(item => item.image === old.image)).map(old => old.image);
  return {
    ...current, ...product,
    nights: String(product.nights), days: String(product.days), hotelStars: String(product.hotelStars),
    price: product.price === 0 ? "" : String(product.price), originalPrice: product.originalPrice === 0 ? "" : String(product.originalPrice),
    discount: String(product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0),
    places: product.places.join(", "), highlights: product.highlights.join("\n"), inclusions: product.inclusions.join("\n"), exclusions: product.exclusions.join("\n"),
    pageSections: {
      ...product.pageSections,
      snapshotPlacement: product.tags.some(tag => tag === "Treks" || tag === "Weekend Treks") ? "intro" : "about",
      gallery: { ...current.pageSections.gallery, images: [...new Set([...current.pageSections.gallery.images, ...unmatchedPhotos])] },
      locations: { ...product.pageSections.locations, items: locations },
    },
  };
}
