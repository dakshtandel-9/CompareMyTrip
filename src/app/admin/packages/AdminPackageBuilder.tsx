"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, BedDouble, Check, Clock3, ImagePlus, MapPin, PackagePlus, Plus, Save, ShieldCheck, Sparkles, Star, Trash2, Users } from "lucide-react";
import { PACKAGE_CATEGORIES, discountToPrice, getDiscountPercent, getPackageDetails, type PackageCategory, type PackageItineraryDay, type PackageStay, type TravelPackage } from "@/lib/packageData";
import { savePackage, uploadPackageImage } from "@/lib/firebase/packages";
import { deleteImageFromCloudflare, PACKAGE_DRAFT_IMAGE_KEY_PREFIX } from "@/lib/cloudflareUpload";

type PackageForm = {
  title: string; location: string; destination: string; operator: string; region: "India" | "International";
  gallery: string[]; nights: string; days: string; pax: string; hotelStars: string;
  originalPrice: string; price: string; discount: string; deal: boolean; tags: PackageCategory[];
  summary: string; places: string; highlights: string; inclusions: string; exclusions: string;
  meals: string; transfers: string; flights: string; cancellationPolicy: string;
  itinerary: PackageItineraryDay[]; stays: PackageStay[];
};

const makeDays = (count = 5): PackageItineraryDay[] => Array.from({ length: count }, (_, index) => ({
  day: index + 1,
  title: index === 0 ? "Arrival and check-in" : index === count - 1 ? "Departure" : "Local experiences",
  route: "", description: "", meals: index === 0 ? "Dinner" : "Breakfast",
}));

const initialForm: PackageForm = {
  title: "", location: "", destination: "", operator: "CompareMyTrip Partner", region: "India",
  gallery: [],
  nights: "4", days: "5", pax: "2–10 pax", hotelStars: "4", originalPrice: "24999", price: "19999", discount: "20", deal: false, tags: ["Family"],
  summary: "", places: "", highlights: "Curated local experiences\nComfortable verified stays\nPrivate transfers",
  inclusions: "Accommodation\nDaily breakfast\nTransfers and sightseeing", exclusions: "Flights or train tickets\nPersonal expenses\nTravel insurance",
  meals: "Daily breakfast", transfers: "Private transfers included", flights: "Not included",
  cancellationPolicy: "Free cancellation up to 15 days before departure. Date changes are subject to availability.",
  itinerary: makeDays(), stays: [{ name: "Comfort hotel", nights: 4, place: "", comfort: "4-star room with daily breakfast" }],
};

function formFromPackage(pkg?: TravelPackage): PackageForm {
  if (!pkg) return initialForm;
  const details = getPackageDetails(pkg);
  return {
    title: pkg.title, location: pkg.location, destination: pkg.destination, operator: pkg.operator,
    region: pkg.region, gallery: details.gallery, nights: String(pkg.nights), days: String(pkg.days), pax: pkg.pax,
    hotelStars: String(pkg.hotelStars), originalPrice: String(pkg.originalPrice), price: String(pkg.price),
    discount: String(pkg.discount), deal: Boolean(pkg.deal), tags: pkg.tags, summary: details.summary,
    places: details.places.join(", "), highlights: details.highlights.join("\n"), inclusions: details.inclusions.join("\n"),
    exclusions: details.exclusions.join("\n"), meals: details.meals, transfers: details.transfers, flights: details.flights,
    cancellationPolicy: details.cancellationPolicy, itinerary: details.itinerary, stays: details.stays,
  };
}

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const splitPlaces = (value: string) => value.split(/[,·]/).map((item) => item.trim()).filter(Boolean);
const inputClass = "h-12 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]";
const textareaClass = "min-h-28 w-full resize-y rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-cmt-neutral-500">{children}</span>;
}
function SectionTitle({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-cmt-control bg-cmt-primary-50 text-cmt-primary-900">{icon}</span><div><h2 className="font-display text-xl font-semibold">{title}</h2><p className="text-xs text-cmt-neutral-500">{copy}</p></div></div>;
}
function TextList({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><FieldLabel>{label}</FieldLabel><textarea value={value} onChange={(event) => onChange(event.target.value)} className={textareaClass} /></label>;
}

export default function AdminPackageBuilder({ initialPackage, filedUnderOptions, onCancel, onSaved }: { initialPackage?: TravelPackage; filedUnderOptions: string[]; onCancel: () => void; onSaved: () => void }) {
  const draftStorageKey = `${PACKAGE_DRAFT_IMAGE_KEY_PREFIX}${initialPackage?.id ?? "new"}`;
  const draftImagesRef = useRef<string[]>([]);
  const [form, setForm] = useState<PackageForm>(() => formFromPackage(initialPackage));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(draftStorageKey);
    if (!stored) return;
    sessionStorage.removeItem(draftStorageKey);
    try {
      const abandonedImages = [...new Set(JSON.parse(stored) as string[])];
      void Promise.allSettled(abandonedImages.map(deleteImageFromCloudflare)).then((results) => {
        const failed = abandonedImages.filter((_, index) => results[index].status === "rejected");
        if (failed.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(failed));
      });
    } catch {
      sessionStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey]);

  const rememberDraftImages = (images: string[]) => {
    draftImagesRef.current = [...new Set([...draftImagesRef.current, ...images])];
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draftImagesRef.current));
  };
  const forgetDraftImage = (image: string) => {
    draftImagesRef.current = draftImagesRef.current.filter((item) => item !== image);
    if (draftImagesRef.current.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(draftImagesRef.current));
    else sessionStorage.removeItem(draftStorageKey);
  };
  const abandonDraft = async () => {
    const images = [...draftImagesRef.current];
    const results = await Promise.allSettled(images.map(deleteImageFromCloudflare));
    const failed = images.filter((_, index) => results[index].status === "rejected");
    draftImagesRef.current = failed;
    if (failed.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(failed));
    else sessionStorage.removeItem(draftStorageKey);
  };
  const update = <Key extends keyof PackageForm>(key: Key, value: PackageForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value })); setMessage(""); setError("");
  };
  const preview = useMemo(() => ({
    title: form.title || "Your package title", location: form.location || "Destination · Route",
    operator: form.operator || "Travel partner", nights: Number(form.nights) || 0, days: Number(form.days) || 0,
    price: Number(form.price) || 0, originalPrice: Number(form.originalPrice) || 0,
    discount: Number(form.discount) || 0, hotelStars: Number(form.hotelStars) || 3,
    image: form.gallery[0] || "/destinations/kerala.jpg",
  }), [form]);

  const toggleTag = (tag: PackageCategory) => update("tags", form.tags.includes(tag) ? form.tags.filter((item) => item !== tag) : [...form.tags, tag]);
  const updateDay = (index: number, key: keyof PackageItineraryDay, value: string | number) =>
    update("itinerary", form.itinerary.map((day, dayIndex) => dayIndex === index ? { ...day, [key]: value } : day));
  const updateStay = (index: number, key: keyof PackageStay, value: string | number) =>
    update("stays", form.stays.map((stay, stayIndex) => stayIndex === index ? { ...stay, [key]: value } : stay));
  /* Pricing is one number and one percentage: the operator names the
     discount and the sale price follows, or types a sale price and the
     percentage follows. Whichever they touch last is the one we trust. */
  const setPricing = (patch: Partial<Pick<PackageForm, "originalPrice" | "price" | "discount">>) => {
    setForm((current) => ({ ...current, ...patch })); setMessage(""); setError("");
  };
  const handleOriginalPriceChange = (value: string) =>
    setPricing({ originalPrice: value, price: String(discountToPrice(Number(value) || 0, Number(form.discount) || 0)) });
  const handleDiscountChange = (value: string) => {
    const percent = Math.max(0, Math.min(90, Number(value) || 0));
    setPricing({ discount: value, price: String(discountToPrice(Number(form.originalPrice) || 0, percent)) });
  };
  const handleSalePriceChange = (value: string) =>
    setPricing({
      price: value,
      discount: String(getDiscountPercent({ discount: 0, originalPrice: Number(form.originalPrice) || 0, price: Number(value) || 0 })),
    });

  const handleDaysChange = (value: string) => {
    const count = Math.max(2, Math.min(30, Number(value) || 2));
    const defaults = makeDays(count);
    setForm((current) => ({ ...current, days: value, itinerary: Array.from({ length: count }, (_, index) => current.itinerary[index] ?? defaults[index]) }));
  };
  const handleImageUpload = async (files?: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, 10 - form.gallery.length);
    if (selected.some((file) => !file.type.startsWith("image/"))) return setError("Please choose image files only.");
    if (selected.some((file) => file.size > 5_000_000)) return setError("Each image must be 5 MB or smaller.");
    try {
      setUploading(true); setError("");
      const results = await Promise.allSettled(selected.map(uploadPackageImage));
      const uploaded = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      if (uploaded.length) {
        rememberDraftImages(uploaded);
        update("gallery", [...form.gallery, ...uploaded].slice(0, 10));
      }
      const failed = results.find((result) => result.status === "rejected");
      if (failed?.status === "rejected") {
        setError(failed.reason instanceof Error ? failed.reason.message : "Some images could not be uploaded.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The images could not be uploaded."); }
    finally { setUploading(false); }
  };
  const handleImageDelete = async (image: string) => {
    try {
      setError("");
      await deleteImageFromCloudflare(image);
      forgetDraftImage(image);
      const gallery = form.gallery.filter((item) => item !== image);
      update("gallery", gallery);
      if (initialPackage) {
        await savePackage({
          ...initialPackage,
          image: gallery[0] || "/destinations/kerala.jpg",
          details: { ...getPackageDetails(initialPackage), gallery },
        });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The image could not be deleted."); }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(""); setError("");
    if (!form.title.trim() || !form.location.trim()) return setError("Add a title and destination before publishing.");
    if (form.gallery.length < 3 || form.gallery.length > 10) return setError("Add a minimum of 3 and a maximum of 10 package images.");
    if (!form.summary.trim() || !splitPlaces(form.places).length) return setError("Add a package overview and at least one place.");
    if (!form.itinerary.length || form.itinerary.some((day) => !day.title.trim())) return setError("Add a title for every itinerary day.");
    if (!form.stays.length || form.stays.some((stay) => !stay.name.trim())) return setError("Add at least one stay name.");
    if (!form.tags.length) return setError("Select at least one package category.");
    const newPackage: TravelPackage = {
      id: initialPackage?.id ?? `${form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`,
      title: form.title.trim(), location: form.location.trim(), operator: initialPackage?.operator || "CompareMyTrip", region: form.region,
      /* Headline destination for the catalogue's destination filter: the first
         place of the route unless one was typed explicitly. */
      destination: form.destination.trim() || splitPlaces(form.places)[0] || form.location.trim(),
      image: form.gallery[0], nights: Number(form.nights), days: Number(form.days), pax: form.pax.trim(), hotelStars: Number(form.hotelStars), tags: form.tags,
      rating: initialPackage?.rating ?? 5, reviews: initialPackage?.reviews ?? 0, discount: Number(form.discount), originalPrice: Number(form.originalPrice), price: Number(form.price), deal: form.deal,
      details: { gallery: form.gallery, summary: form.summary.trim(), places: splitPlaces(form.places), highlights: lines(form.highlights),
        itinerary: form.itinerary.map((day) => ({ ...day, title: day.title.trim(), route: day.route.trim(), description: day.description.trim() || day.route.trim() || day.title.trim() })),
        stays: form.stays.map((stay) => ({ ...stay, name: stay.name.trim(), place: stay.place.trim() || form.destination.trim() || form.location.trim() })),
        inclusions: lines(form.inclusions), exclusions: lines(form.exclusions), meals: form.meals.trim(), transfers: form.transfers.trim(),
        flights: form.flights.trim(), cancellationPolicy: form.cancellationPolicy.trim() },
    };
    try {
      setSaving(true); await savePackage(newPackage);
      draftImagesRef.current = [];
      sessionStorage.removeItem(draftStorageKey);
      setMessage(`“${newPackage.title}” is saved in Firebase and live on the website.`); onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This package could not be saved."); }
    finally { setSaving(false); }
  };

  const handleCancel = async () => {
    setSaving(true);
    await abandonDraft();
    onCancel();
  };

  return (
    <div className="font-body text-cmt-neutral-900">
      <div>
        <div className="mb-8">
          <div><button type="button" disabled={saving || uploading} onClick={() => void handleCancel()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-cmt-neutral-500 disabled:opacity-50"><ArrowLeft className="size-3.5" /> Back to packages</button><h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{initialPackage ? "Edit package" : "Create package"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">Only information displayed on the product listing and package page is requested here.</p></div>
        </div>
        <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
              <SectionTitle icon={<PackagePlus className="size-5" />} title="Listing and pricing" copy="Details travellers use to compare package cards." />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2"><FieldLabel>Package title</FieldLabel><input required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Kerala Backwaters & Hills Escape" className={inputClass} /></label>
                <label><FieldLabel>Destination / route</FieldLabel><input required value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Kochi · Munnar · Alleppey" className={inputClass} /></label>
                {/* The single name this package is filed under in the catalogue's
                    destination filter — the region, not the full route. */}
                <label><FieldLabel>Filed under</FieldLabel><input list="filed-under-options" value={form.destination} onChange={(e) => update("destination", e.target.value)} placeholder="Select or type a destination" autoComplete="off" className={inputClass} /><datalist id="filed-under-options">{filedUnderOptions.map((destination) => <option key={destination} value={destination} />)}</datalist><span className="mt-1.5 block text-xs text-cmt-neutral-500">Choose an existing destination or type a new one. New destinations are created when this package is saved.</span></label>
                <label><FieldLabel>Region</FieldLabel><select value={form.region} onChange={(e) => update("region", e.target.value as PackageForm["region"])} className={inputClass}><option>India</option><option>International</option></select></label>
                <label><FieldLabel>Group size</FieldLabel><input value={form.pax} onChange={(e) => update("pax", e.target.value)} placeholder="2–10 pax" className={inputClass} /></label>
                <label><FieldLabel>Nights</FieldLabel><input type="number" min="1" value={form.nights} onChange={(e) => update("nights", e.target.value)} className={inputClass} /></label>
                <label><FieldLabel>Days</FieldLabel><input type="number" min="2" max="30" value={form.days} onChange={(e) => handleDaysChange(e.target.value)} className={inputClass} /></label>
                <label><FieldLabel>Hotel stars</FieldLabel><select value={form.hotelStars} onChange={(e) => update("hotelStars", e.target.value)} className={inputClass}><option value="3">3 star</option><option value="4">4 star</option><option value="5">5 star</option></select></label>
                <label><FieldLabel>Original price</FieldLabel><input type="number" min="1" value={form.originalPrice} onChange={(e) => handleOriginalPriceChange(e.target.value)} className={inputClass} /></label>
                <label className="sm:col-span-2"><FieldLabel>How much discount do you want to give? (%)</FieldLabel><div className="flex flex-wrap items-center gap-2"><input type="number" min="0" max="90" value={form.discount} onChange={(e) => handleDiscountChange(e.target.value)} className={`${inputClass} sm:max-w-40`} />{[10, 15, 20, 25, 30].map((percent) => <button key={percent} type="button" onClick={() => handleDiscountChange(String(percent))} className={`inline-flex h-9 items-center rounded-cmt-full border px-3.5 text-xs font-semibold ${Number(form.discount) === percent ? "border-cmt-neutral-900 bg-cmt-neutral-900 text-white" : "border-cmt-neutral-200 bg-white text-cmt-neutral-600"}`}>{percent}%</button>)}</div><p className="mt-2 text-xs text-cmt-neutral-500">Shown as the “{Number(form.discount) || 0}% off” badge on the card and the booking box. Changing it recalculates the sale price below.</p></label>
                <label><FieldLabel>Sale price (per person)</FieldLabel><input type="number" min="1" value={form.price} onChange={(e) => handleSalePriceChange(e.target.value)} className={inputClass} /></label>
              </div>
              <div className="mt-5"><FieldLabel>Categories</FieldLabel><div className="flex flex-wrap gap-2">{PACKAGE_CATEGORIES.map((tag) => <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`inline-flex h-9 items-center gap-1.5 rounded-cmt-full border px-3.5 text-xs font-semibold ${form.tags.includes(tag) ? "border-cmt-neutral-900 bg-cmt-neutral-900 text-white" : "border-cmt-neutral-200 bg-white text-cmt-neutral-600"}`}>{form.tags.includes(tag) && <Check className="size-3.5" />}{tag}</button>)}</div></div>
              {/* Flags the package into the catalogue's "Best deals" toggle and
                  puts a badge on its price card. */}
              <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-cmt-neutral-700"><input type="checkbox" checked={form.deal} onChange={(e) => update("deal", e.target.checked)} className="size-4 accent-[var(--cmt-color-primary-500)]" />Mark as a best deal</label>
            </section>

            <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
              <SectionTitle icon={<ImagePlus className="size-5" />} title="Package gallery" copy="Minimum 3 images, maximum 10. The first image becomes the card cover." />
              <label className="mt-6 block cursor-pointer rounded-cmt-md border border-dashed border-cmt-neutral-300 bg-cmt-neutral-50 p-5 text-center hover:border-cmt-primary-500"><ImagePlus className="mx-auto size-6 text-cmt-neutral-500" /><span className="mt-2 block text-sm font-semibold">{uploading ? "Processing and uploading…" : `Add gallery images (${form.gallery.length}/10)`}</span><span className="mt-1 block text-xs text-cmt-neutral-500">Up to 5 MB · files under 800 KB stay unchanged · larger files use 70% quality</span><input disabled={uploading} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e.target.files)} className="sr-only" /></label>
              {error && <p className="mt-3 text-sm font-medium text-cmt-error-700">{error}</p>}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{form.gallery.map((image, index) => <div key={`${image}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-cmt-sm bg-cmt-neutral-100"><Image src={image} alt={`Gallery ${index + 1}`} fill className="object-cover" unoptimized={image.startsWith("data:")} />{index === 0 && <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-semibold">Cover</span>}<button type="button" aria-label={`Delete image ${index + 1}`} onClick={() => handleImageDelete(image)} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-cmt-neutral-900/80 text-white"><Trash2 className="size-3.5" /></button></div>)}</div>
            </section>

            <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
              <SectionTitle icon={<MapPin className="size-5" />} title="Overview and trip facts" copy="Explain the experience, places and what is covered." />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2"><FieldLabel>Package overview</FieldLabel><textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Describe the pace, experience and ideal traveller..." className={textareaClass} /></label>
                <label className="sm:col-span-2"><FieldLabel>Places covered (comma separated)</FieldLabel><input value={form.places} onChange={(e) => update("places", e.target.value)} placeholder="Kochi, Munnar, Thekkady, Alleppey" className={inputClass} /></label>
                <TextList label="Highlights (one per line)" value={form.highlights} onChange={(value) => update("highlights", value)} />
                <TextList label="Inclusions (one per line)" value={form.inclusions} onChange={(value) => update("inclusions", value)} />
                <TextList label="Exclusions (one per line)" value={form.exclusions} onChange={(value) => update("exclusions", value)} />
                <label><FieldLabel>Meal plan</FieldLabel><input value={form.meals} onChange={(e) => update("meals", e.target.value)} className={inputClass} /></label>
                <label><FieldLabel>Transfers</FieldLabel><input value={form.transfers} onChange={(e) => update("transfers", e.target.value)} className={inputClass} /></label>
                <label><FieldLabel>Flights</FieldLabel><input value={form.flights} onChange={(e) => update("flights", e.target.value)} className={inputClass} /></label>
                <label className="sm:col-span-2"><FieldLabel>Cancellation policy</FieldLabel><textarea value={form.cancellationPolicy} onChange={(e) => update("cancellationPolicy", e.target.value)} className={textareaClass} /></label>
              </div>
            </section>

            <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
              <SectionTitle icon={<Clock3 className="size-5" />} title="Day-by-day itinerary" copy="A card is created for every travel day." />
              <div className="mt-6 space-y-4">{form.itinerary.map((day, index) => <article key={day.day} className="rounded-cmt-md border border-cmt-neutral-200 bg-cmt-neutral-50 p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><p className="font-display text-base font-semibold">Day {index + 1}</p><span className="rounded-full bg-cmt-primary-100 px-2.5 py-1 text-[10px] font-semibold text-cmt-primary-900">ITINERARY CARD</span></div><div className="grid gap-4 sm:grid-cols-2"><label><FieldLabel>Day title</FieldLabel><input value={day.title} onChange={(e) => updateDay(index, "title", e.target.value)} placeholder="Arrival in Kochi" className={inputClass} /></label><label><FieldLabel>Route / place</FieldLabel><input value={day.route} onChange={(e) => updateDay(index, "route", e.target.value)} placeholder="Kochi → Munnar" className={inputClass} /></label><label className="sm:col-span-2"><FieldLabel>What happens this day</FieldLabel><textarea value={day.description} onChange={(e) => updateDay(index, "description", e.target.value)} placeholder="Pickup, sightseeing, experiences and check-in..." className={textareaClass} /></label><label><FieldLabel>Meals</FieldLabel><input value={day.meals} onChange={(e) => updateDay(index, "meals", e.target.value)} className={inputClass} /></label></div></article>)}</div>
            </section>

            <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
              <div className="flex items-start justify-between gap-4"><SectionTitle icon={<BedDouble className="size-5" />} title="Comfort stays" copy="Hotels, locations, nights and room comfort." /><button type="button" onClick={() => update("stays", [...form.stays, { name: "", nights: 1, place: "", comfort: "" }])} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-cmt-control bg-cmt-neutral-900 px-3 text-xs font-semibold text-white"><Plus className="size-3.5" /> Add stay</button></div>
              <div className="mt-6 space-y-4">{form.stays.map((stay, index) => <article key={index} className="rounded-cmt-md border border-cmt-neutral-200 p-4"><div className="mb-4 flex items-center justify-between"><p className="font-semibold">Stay {index + 1}</p>{form.stays.length > 1 && <button type="button" onClick={() => update("stays", form.stays.filter((_, stayIndex) => stayIndex !== index))} className="text-cmt-error-700"><Trash2 className="size-4" /></button>}</div><div className="grid gap-4 sm:grid-cols-2"><label><FieldLabel>Hotel / stay name</FieldLabel><input value={stay.name} onChange={(e) => updateStay(index, "name", e.target.value)} className={inputClass} /></label><label><FieldLabel>Place</FieldLabel><input value={stay.place} onChange={(e) => updateStay(index, "place", e.target.value)} className={inputClass} /></label><label><FieldLabel>Nights</FieldLabel><input type="number" min="1" value={stay.nights} onChange={(e) => updateStay(index, "nights", Number(e.target.value))} className={inputClass} /></label><label><FieldLabel>Comfort / room details</FieldLabel><input value={stay.comfort} onChange={(e) => updateStay(index, "comfort", e.target.value)} className={inputClass} /></label></div></article>)}</div>
            </section>

            {error && <p role="alert" className="rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm font-medium text-cmt-error-700">{error}</p>}
            {message && <p role="status" className="rounded-cmt-control border border-cmt-success-500/20 bg-cmt-success-100 px-4 py-3 text-sm font-medium text-cmt-success-700">{message}</p>}
            <button disabled={saving} type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-6 text-sm font-semibold shadow-cmt-primary hover:bg-cmt-primary-600 disabled:opacity-50 sm:w-auto"><Save className="size-4" /> {saving ? "Saving…" : initialPackage ? "Save changes" : "Create package"}</button>
          </form>

          <aside className="xl:sticky xl:top-6">
            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-neutral-500">Live card preview</p><span className="text-[11px] text-cmt-success-700">● Updating</span></div>
            <article className="overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-md"><div className="relative aspect-[4/3] bg-cmt-neutral-100"><Image src={preview.image} alt="Package preview" fill className="object-cover" unoptimized={preview.image.startsWith("data:")} /><span className="absolute left-3 top-3 rounded-full bg-cmt-coral-100 px-2.5 py-1 text-[11px] font-semibold text-cmt-coral-700">{preview.discount}% off</span><span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-cmt-success-700"><ShieldCheck className="size-3.5" /> GST Verified</span></div><div className="p-4"><div className="flex justify-between gap-3"><p className="flex min-w-0 items-center gap-1 truncate text-xs text-cmt-neutral-500"><MapPin className="size-3.5" />{preview.location}</p><span className="inline-flex items-center gap-1 text-xs font-semibold"><Star className="size-3.5 fill-cmt-primary-500 text-cmt-primary-500" />5.0</span></div><h2 className="mt-2 font-display text-lg font-semibold">{preview.title}</h2><div className="mt-3 flex flex-wrap gap-3 text-xs text-cmt-neutral-600"><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{preview.nights}N / {preview.days}D</span><span className="inline-flex items-center gap-1"><Users className="size-3.5" />{form.pax}</span><span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" />{preview.hotelStars}★</span></div><div className="mt-4 flex items-end justify-between border-t pt-4"><div><p className="text-xs text-cmt-neutral-400 line-through">{formatINR(preview.originalPrice)}</p><p className="font-display text-xl font-bold">{formatINR(preview.price)}<span className="ml-1 text-[11px] font-normal text-cmt-neutral-500">/person</span></p></div><span className="rounded-cmt-control bg-cmt-primary-500 px-4 py-2.5 text-sm font-semibold">View package</span></div></div></article>
            <div className="mt-4 rounded-cmt-md bg-cmt-neutral-900 p-5 text-white"><div className="flex gap-3"><Sparkles className="size-5 text-cmt-primary-500" /><div><p className="text-sm font-semibold">Complete publishing funnel</p><p className="mt-1 text-xs leading-5 text-cmt-neutral-300">One publish action creates a listing card and its full product detail page in this browser.</p></div></div></div>
          </aside>
        </div>
      </div>
    </div>
  );
}
