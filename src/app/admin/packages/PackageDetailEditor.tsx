"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { PACKAGE_CATEGORIES, type TravelPackage, type PackageCategory } from "@/lib/packageData";
import type { PackageBuiltinSection, PackageSectionPlacement } from "@/lib/packageDetailSections";
import { getVisiblePackageReviews } from "@/app/packages/_components/PackagePageSections";
import type { ContentPath } from "@/app/packages/_components/PackageInlineEditing";
import { FieldLabel, inputClass, TextField } from "../_components/ui";
import type { PackageForm } from "./catalogueEditorState";
import PackageBookingFields from "./PackageBookingFields";
import PackageImagesEditor from "./PackageImagesEditor";
import PackageFactsEditor from "./PackageFactsEditor";
import PackagePageSectionsEditor from "./PackagePageSectionsEditor";
import PackageContentField from "./PackageContentField";
import PackageDestinationSelect from "./PackageDestinationSelect";
import styles from "./AdminPackageBuilder.module.css";

export const PACKAGE_EDITOR_AREAS = [
  { id: "basics", label: "Package details", group: "Set up" },
  { id: "images", label: "Images", group: "Set up" },
  { id: "booking", label: "Price & booking card", group: "Set up" },
  { id: "facts", label: "Quick facts & permit", group: "Page content" },
  { id: "overview", label: "Overview & story", group: "Page content" },
  { id: "highlights", label: "Highlights", group: "Page content" },
  { id: "itinerary", label: "Itinerary", group: "Page content" },
  { id: "stays", label: "Hotels & stays", group: "Page content" },
  { id: "practical", label: "Transfers & trek details", group: "Page content" },
  { id: "locations", label: "Pickup & drop", group: "Page content" },
  { id: "coverage", label: "Inclusions & exclusions", group: "Page content" },
  { id: "faq", label: "FAQs", group: "Finishing touches" },
  { id: "reviews", label: "Traveller reviews", group: "Finishing touches" },
  { id: "policy", label: "Cancellation policy", group: "Finishing touches" },
  { id: "extras", label: "Additional sections", group: "Finishing touches" },
] as const;
export type PackageEditorArea = typeof PACKAGE_EDITOR_AREAS[number]["id"];
const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold disabled:opacity-40";

export default function PackageDetailEditor({ lockedCategory, form, pkg, section, onSectionChange, onChange, change, onUploadImages, disabled, filedUnderOptions, compact = false }: {
  lockedCategory?: PackageCategory;
  form: PackageForm; pkg: TravelPackage; section: PackageEditorArea; onSectionChange: (section: PackageEditorArea) => void;
  onChange: (next: PackageForm) => void; change: (path: ContentPath, value: unknown) => void;
  onUploadImages: (files: File[]) => Promise<string[]>; disabled: boolean;
  filedUnderOptions: Record<TravelPackage["region"], string[]>; compact?: boolean;
}) {
  const set = <K extends keyof PackageForm>(key: K, value: PackageForm[K]) => onChange({ ...form, [key]: value });
  const note = (key: "tagline" | "introduction" | "itineraryNote" | "stayNote" | "inclusionNote", value: string) => set("pageSections", { ...form.pageSections, [key]: value });
  const visibility = (id: PackageBuiltinSection) => <label className={styles.visibility}><input type="checkbox" checked={!form.pageSections.hiddenSections.includes(id)} onChange={event => set("pageSections", { ...form.pageSections, hiddenSections: event.target.checked ? form.pageSections.hiddenSections.filter(item => item !== id) : [...form.pageSections.hiddenSections, id] })} />Show this section on the website<span>Hiding keeps your content saved.</span></label>;
  const custom = (focus: PackageSectionPlacement | "locations" | "reviews" | "gallery") => <PackagePageSectionsEditor key={focus} focus={focus} value={form.pageSections} onChange={value => set("pageSections", value)} onUploadImages={onUploadImages} busy={disabled} allowReviews />;
  const text = (label: string, key: "summary" | "places" | "highlights" | "transfers" | "inclusions" | "exclusions" | "cancellationPolicy", hint?: string) => <PackageContentField label={label} value={form[key]} onChange={value => set(key, value)} hint={hint} disabled={disabled} plain={key === "places"} lineItems={["highlights", "inclusions", "exclusions"].includes(key)} />;
  const current = PACKAGE_EDITOR_AREAS.find(area => area.id === section)!;
  const move = <T,>(items: T[], index: number, direction: number) => {
    const next = [...items]; const target = index + direction;
    if (target < 0 || target >= next.length) return items;
    [next[index], next[target]] = [next[target], next[index]]; return next;
  };

  return <div className={`${styles.workspace} ${compact ? styles.compact : ""}`}>
    {!compact && <nav className={styles.sectionNav} aria-label="Package editor sections">
      {PACKAGE_EDITOR_AREAS.map((area, index) => <div key={area.id}>
        {(index === 0 || area.group !== PACKAGE_EDITOR_AREAS[index - 1].group) && <p>{area.group}</p>}
        <button type="button" aria-current={section === area.id ? "page" : undefined} disabled={disabled} onClick={() => onSectionChange(area.id)}>{area.label}</button>
      </div>)}
    </nav>}
    <section className={styles.formPanel} aria-labelledby="package-editor-heading">
      <header><p className={styles.eyebrow}>{current.group}</p><h2 id="package-editor-heading" tabIndex={-1}>{current.label}</h2><p>Changes appear on the page as you edit. Save the package to apply them.</p></header>
      <fieldset disabled={disabled} className={styles.fields} aria-busy={disabled}>
        <legend className="sr-only">{current.label}</legend>
        {section === "basics" && <>
          <TextField label="Package title" value={form.title} onChange={value => set("title", value)} />
          <TextField label="Destination / route shown on the page" value={form.location} onChange={value => set("location", value)} hint="Also shown beside the photo in the booking card." />
          <div className={styles.fieldGrid}>
            <label><FieldLabel>Region</FieldLabel><select className={inputClass} value={form.region} onChange={event => set("region", event.target.value as PackageForm["region"])}><option>India</option><option>International</option></select></label>
            <PackageDestinationSelect key={form.region} value={form.destination} options={filedUnderOptions[form.region]} onChange={value => set("destination", value)} disabled={disabled} />
            <label><FieldLabel>Nights</FieldLabel><input className={inputClass} type="number" min="0" step="1" value={form.nights} onChange={event => set("nights", event.target.value)} /></label>
            <label><FieldLabel>Days</FieldLabel><input className={inputClass} type="number" min="1" max="30" step="1" value={form.days} onChange={event => change(["days"], event.target.value)} /></label>
            <TextField label="Group size" value={form.pax} onChange={value => set("pax", value)} placeholder="e.g. 11–40 travellers" />
            <TextField label="Operator (internal)" value={form.operator} onChange={value => set("operator", value)} hint="The operating partner is not named on the public booking card." />
          </div>
          <fieldset><legend className="mb-3 text-sm font-semibold">Categories</legend><div className={styles.checks}>{PACKAGE_CATEGORIES.map(category => <label key={category}><input type="checkbox" disabled={category === lockedCategory} checked={form.tags.includes(category)} onChange={event => set("tags", event.target.checked ? [...form.tags, category] : form.tags.filter(tag => tag !== category))} />{category}</label>)}</div>{lockedCategory && <p className="mt-3 text-xs text-cmt-neutral-500">{lockedCategory} is set automatically for this section. Use Travel packages to move a listing to another category.</p>}</fieldset>
        </>}
        {section === "images" && <><PackageImagesEditor pkg={pkg} change={change} disabled={disabled} onUploadImages={onUploadImages} onChangeImages={({ image, gallery }) => onChange({ ...form, image, gallery })} />{custom("gallery")}</>}
        {section === "booking" && <PackageBookingFields pkg={pkg} pricing={{ price: form.price, originalPrice: form.originalPrice }} change={change} disabled={disabled} />}
        {section === "facts" && <>
          <TextField label="Meals" value={form.meals} onChange={value => set("meals", value)} hint="Used by the automatic meals fact. Flights are set under Price & booking card; transport is set under Transfers & trek details." />
          <PackageFactsEditor facts={form.facts} hidden={form.factsHidden} permitRequired={form.permitRequired} values={{ ...pkg, meals: form.meals, transfers: form.transfers, flights: form.flights, hasStay: form.stays.length > 0 }} onChange={value => set("facts", value)} onHiddenChange={value => set("factsHidden", value)} onPermitRequiredChange={value => set("permitRequired", value)} />
          <label className={styles.visibility}><input type="checkbox" checked={!form.permitHidden} onChange={event => set("permitHidden", !event.target.checked)} />Show permit status and booking link</label>
          <label><FieldLabel>Quick facts position</FieldLabel><select className={inputClass} value={form.pageSections.snapshotPlacement ?? (form.tags.some(tag => tag === "Treks" || tag === "Weekend Treks") ? "intro" : "about")} onChange={event => set("pageSections", { ...form.pageSections, snapshotPlacement: event.target.value as "intro" | "about" })}><option value="intro">Below the package title</option><option value="about">Below the overview</option></select></label>
        </>}
        {section === "overview" && <>
          <PackageContentField disabled={disabled} label="Tagline (optional)" value={form.pageSections.tagline ?? ""} onChange={value => note("tagline", value)} />
          <PackageContentField disabled={disabled} label="Introduction (optional)" value={form.pageSections.introduction ?? ""} onChange={value => note("introduction", value)} />
          {visibility("about")}{text("About this trip", "summary")}{text("Places visited", "places", "Separate places with commas. They appear as location labels below the overview.")}
          {custom("overview")}
        </>}
        {section === "highlights" && <>{visibility("highlights")}{text("Trip highlights", "highlights", "Enter one highlight per line. Each line becomes a separate highlight.")}{custom("highlights")}</>}
        {section === "itinerary" && <>
          {visibility("itinerary")}
          <label className={styles.visibility}><input type="checkbox" checked={form.dayZeroEnabled} onChange={event => change(["details", "dayZeroEnabled"], event.target.checked)} />Include Day 0 / overnight departure<span>Turn off to hide Day 0 without deleting its content.</span></label>
          {form.itinerary.map((day, index) => <details key={`day-${index}`} open={index === 0} className={styles.item}>
            <summary>Day {day.day} · {day.title || "Untitled day"}{day.day === 0 && !form.dayZeroEnabled ? " · Hidden" : ""}</summary>
            <div className={styles.itemFields}>
              <div className={styles.fieldGrid}><TextField label={`Day ${day.day} title`} value={day.title} onChange={value => change(["details", "itinerary", index, "title"], value)} /><TextField label={`Day ${day.day} route / subtitle`} value={day.route} onChange={value => change(["details", "itinerary", index, "route"], value)} /></div>
              <PackageContentField disabled={disabled} label={`Day ${day.day} description`} value={day.description} onChange={value => change(["details", "itinerary", index, "description"], value)} />
              <TextField label={`Day ${day.day} meals`} value={day.meals} onChange={value => change(["details", "itinerary", index, "meals"], value)} />
              {(day.activities ?? []).map((activity, activityIndex) => <div key={activityIndex} className={styles.itemFields}>
                <h3>Activity {activityIndex + 1}</h3>
                <div className={styles.fieldGrid}><TextField label={`Day ${day.day}, activity ${activityIndex + 1}: time`} value={activity.time} onChange={value => change(["details", "itinerary", index, "activities", activityIndex, "time"], value)} /><TextField label={`Day ${day.day}, activity ${activityIndex + 1}: title`} value={activity.title} onChange={value => change(["details", "itinerary", index, "activities", activityIndex, "title"], value)} /></div>
                <PackageContentField disabled={disabled} label={`Day ${day.day}, activity ${activityIndex + 1}: description`} value={activity.description} onChange={value => change(["details", "itinerary", index, "activities", activityIndex, "description"], value)} />
                <div className={styles.rowActions}><button type="button" className={button} disabled={activityIndex === 0} aria-label={`Move activity ${activityIndex + 1} up in Day ${day.day}`} onClick={() => change(["details", "itinerary", index, "activities"], move(day.activities!, activityIndex, -1))}><ArrowUp size={14} /></button><button type="button" className={button} disabled={activityIndex === day.activities!.length - 1} aria-label={`Move activity ${activityIndex + 1} down in Day ${day.day}`} onClick={() => change(["details", "itinerary", index, "activities"], move(day.activities!, activityIndex, 1))}><ArrowDown size={14} /></button><button type="button" className={button} onClick={() => change(["details", "itinerary", index, "activities"], day.activities!.filter((_, i) => i !== activityIndex))}><Trash2 size={14} />Remove activity {activityIndex + 1}</button></div>
              </div>)}
              <div className={styles.rowActions}><button type="button" className={button} onClick={() => change(["details", "itinerary", index, "activities"], [...(day.activities ?? []), { time: "", title: "", description: "" }])}><Plus size={14} />Add timed activity</button><button type="button" className={button} onClick={() => change(["details", "itinerary"], form.itinerary.filter((_, i) => i !== index))}><Trash2 size={14} />Remove Day {day.day}</button></div>
            </div>
          </details>)}
          <button type="button" className={button} onClick={() => change(["details", "itinerary"], [...form.itinerary, { day: form.itinerary.filter(day => day.day !== 0).length + 1, title: "", route: "", description: "", meals: "" }])}><Plus size={14} />Add itinerary day</button>
          <PackageContentField disabled={disabled} label="Itinerary note (optional)" value={form.pageSections.itineraryNote ?? ""} onChange={value => note("itineraryNote", value)} />
        </>}
        {section === "stays" && <>
          {visibility("stays")}
          {form.stays.map((stay, index) => <details key={index} open={index === 0} className={styles.item}><summary>{stay.name || `Stay ${index + 1}`}</summary><div className={styles.itemFields}>
            <div className={styles.fieldGrid}>{([['Name', 'name'], ['Location', 'place'], ['Room type', 'roomType'], ['Meal plan', 'mealPlan'], ['Check-in', 'checkIn'], ['Check-out', 'checkOut']] as const).map(([label, key]) => <TextField key={key} label={`Stay ${index + 1}: ${label}`} value={stay[key] ?? ""} onChange={value => change(["details", "stays", index, key], value)} />)}<label><FieldLabel>Stay {index + 1}: Nights</FieldLabel><input className={inputClass} type="number" min="1" value={stay.nights} onChange={event => change(["details", "stays", index, "nights"], Number(event.target.value))} /></label></div>
            <PackageContentField disabled={disabled} label={`Stay ${index + 1}: description`} value={stay.comfort} onChange={value => change(["details", "stays", index, "comfort"], value)} />
            <div className={styles.rowActions}><button type="button" className={button} disabled={index === 0} aria-label={`Move stay ${index + 1} up`} onClick={() => set("stays", move(form.stays, index, -1))}><ArrowUp size={14} /></button><button type="button" className={button} disabled={index === form.stays.length - 1} aria-label={`Move stay ${index + 1} down`} onClick={() => set("stays", move(form.stays, index, 1))}><ArrowDown size={14} /></button><button type="button" className={button} onClick={() => set("stays", form.stays.filter((_, i) => i !== index))}><Trash2 size={14} />Remove stay</button></div>
          </div></details>)}
          {!form.stays.length && <p>No stays added. This section stays off the website until you add a stay.</p>}
          <button type="button" className={button} onClick={() => set("stays", [...form.stays, { name: "", nights: 1, place: "", comfort: "" }])}><Plus size={14} />Add hotel / stay</button>
          <PackageContentField disabled={disabled} label="Stay note (optional)" value={form.pageSections.stayNote ?? ""} onChange={value => note("stayNote", value)} />
        </>}
        {section === "practical" && <>{visibility("transfers")}{text("Transport summary", "transfers", "Used by the transfers section and automatic transport fact.")}{custom("transfers")}{custom("carry")}{custom("guidelines")}{custom("practical")}</>}
        {section === "locations" && custom("locations")}
        {section === "coverage" && <>{visibility("inclusions")}{text("Included", "inclusions", "One included service per line.")}{visibility("exclusions")}{text("Not included", "exclusions", "One excluded service per line.")}<PackageContentField disabled={disabled} label="Inclusions note (optional)" value={form.pageSections.inclusionNote ?? ""} onChange={value => note("inclusionNote", value)} /></>}
        {section === "faq" && custom("faq")}
        {section === "reviews" && <>{custom("reviews")}{getVisiblePackageReviews(form.pageSections).length ? <p className="text-sm text-cmt-neutral-500">The rating and review count beside the package title are calculated from your visible traveller reviews.</p> : <details className={styles.item}><summary>Rating summary when no written reviews are shown</summary><div className={styles.itemFields}><p className="text-xs text-cmt-neutral-500">Use your existing verified review summary. Written reviews take priority when displayed.</p><div className={styles.fieldGrid}><label><FieldLabel>Average rating (0–5)</FieldLabel><input className={inputClass} type="number" min="0" max="5" step="0.1" value={form.rating} onChange={event => set("rating", event.target.value)} /></label><label><FieldLabel>Number of reviews</FieldLabel><input className={inputClass} type="number" min="0" step="1" value={form.reviews} onChange={event => set("reviews", event.target.value)} /></label></div></div></details>}</>}
        {section === "policy" && <>{visibility("cancellation")}{text("Cancellation policy", "cancellationPolicy")}</>}
        {section === "extras" && custom("extras")}
      </fieldset>
    </section>
  </div>;
}
