"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, BedDouble, CalendarDays, Check, ChevronDown, Hotel, MapPin, Moon, ShieldCheck, Star, Utensils, X } from "lucide-react";
import { getDiscountPercent, getPackageDetails, getPackageItinerary } from "@/lib/packageData";
import { getPackageFacts } from "@/lib/packageFacts";
import { bypassesImageOptimizer, isDisplayableImage } from "@/lib/displayableImage";
import { getPackagePageSections, isVisiblePackageSection } from "@/lib/packageDetailSections";
import PackageFactsBar from "../_components/PackageFactsBar";
import { InlineText, EditableGallery, EditableImage, EditorOnly, EditAction, usePackageEditing } from "../_components/PackageInlineEditing";
import styles from "../_components/SimplePackagePage.module.css";
import presentation from "../_components/ProductDetailPresentation.module.css";
import PackagePageSections, { getVisiblePackageReviews, PackageDescription, PracticalSection } from "../_components/PackagePageSections";
import PackageShareButton from "../_components/PackageShareButton";
import ItineraryDownloadButton from "../_components/ItineraryDownloadButton";
import CompareButton from "@/components/CompareButton";
import BookingCard from "./BookingCard";
import QuoteModal from "./QuoteModal";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import type { PackageStay, TravelPackage } from "@/lib/packageData";
import { usePackagesState } from "@/lib/usePackages";
import { getSimilarPackages } from "@/lib/similarPackages";
import PackageCard from "@/app/home/_components/PackageCard";

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function PackageDetailClient({ initialPackage, initialSimilarPackages = [], preview = false, publicPreview = false, previewSidebar, bookingUnavailableReason }: { initialPackage: TravelPackage; initialSimilarPackages?: TravelPackage[]; preview?: boolean; publicPreview?: boolean; previewSidebar?: ReactNode; bookingUnavailableReason?: string }) {
  const editor = usePackageEditing();
  const PageRoot = preview ? "div" : "main";
  const legacyPreview = preview && !publicPreview;
  const { packageId } = useParams<{ packageId: string }>();
  const authUser = useAuthUser();
  const packageState = usePackagesState();
  const [travellers, setTravellers] = useState(2);
  /* Asked once in the booking card and carried from there into the quote
     form and the checkout, so the traveller states their dates a single
     time however they choose to go on. */
  const [travelDate, setTravelDate] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const router = useRouter();
  const livePackage = packageState.packages.find((item) => item.id === packageId);
  const pkg = preview ? initialPackage : packageState.loading || packageState.error
    ? livePackage ?? initialPackage
    : livePackage;

  if (!pkg) {
    return <main className="grid min-h-[60vh] place-items-center bg-cmt-neutral-50 px-4"><div className="text-center"><h1 className="font-display text-3xl font-semibold">Package not found</h1><Link href="/packages" className="mt-5 inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold"><ArrowLeft className="size-4" /> All packages</Link></div></main>;
  }

  const details = getPackageDetails(pkg);
  const similarPackages = preview ? [] : getSimilarPackages(pkg,
    packageState.loading || packageState.error ? initialSimilarPackages : packageState.packages);
  const itinerary = getPackageItinerary(details);
  const discount = getDiscountPercent(pkg);
  const facts = getPackageFacts(pkg);
  const pageSections = getPackagePageSections(details);
  const writtenReviews = getVisiblePackageReviews(pageSections);
  const reviewCount = writtenReviews.length || pkg.reviews;
  const reviewRating = writtenReviews.length
    ? Math.round(writtenReviews.reduce((total, review) => total + review.rating, 0) / writtenReviews.length * 10) / 10
    : pkg.rating;
  const hiddenSections = new Set(pageSections.hiddenSections);
  const showInclusions = Boolean(editor) || (!hiddenSections.has("inclusions") && details.inclusions.length > 0);
  const showExclusions = Boolean(editor) || (!hiddenSections.has("exclusions") && details.exclusions.length > 0);
  const showAbout = Boolean(editor) || (!hiddenSections.has("about") && Boolean(details.summary.trim() || details.places.length));
  const showHighlights = Boolean(editor) || (!hiddenSections.has("highlights") && details.highlights.length > 0);
  const showItinerary = Boolean(editor) || (!hiddenSections.has("itinerary") && itinerary.length > 0);
  const showStays = Boolean(editor) || (!hiddenSections.has("stays") && details.stays.length > 0);
  const showTransfers = Boolean(editor) || (!hiddenSections.has("transfers") && Boolean(details.transfers.trim()));
  const customLinks = (area: string) => pageSections.sections
    .filter((section) => (section.placement ?? "extras") === area && isVisiblePackageSection(section))
    .map((section) => ({ id: `package-section-${section.id}`, label: section.title }));
  const navigation = [
    ...(showAbout ? [{ id: "package-about", label: "Overview" }] : []),
    ...customLinks("overview"),
    ...(showHighlights ? [{ id: "package-highlights", label: "Highlights" }] : []),
    ...customLinks("highlights"),
    ...(showItinerary ? [{ id: "package-itinerary", label: "Itinerary" }] : []),
    ...(showStays ? [{ id: "package-stays", label: "Hotels" }] : []),
    ...(showTransfers ? [{ id: "package-transfers", label: "Transfers" }] : []),
    ...customLinks("transfers"),
    ...customLinks("carry"),
    ...customLinks("guidelines"),
    ...customLinks("practical"),
    ...(pageSections.locations.enabled && pageSections.locations.items.some((item) => item.visible && item.name.trim()) ? [{ id: "package-locations", label: "Pickup & drop" }] : []),
    ...(showInclusions ? [{ id: "package-inclusions", label: "Inclusions" }] : []),
    ...(showExclusions ? [{ id: "package-exclusions", label: "Exclusions" }] : []),
    ...customLinks("faq"),
    ...(writtenReviews.length ? [{ id: "package-reviews", label: "Reviews" }] : []),
  ];
  /* A customized quote is filed against the customer's account, so it needs a
     real sign-in — the timed pop-up captures leads and cannot supply one. */
  const requestQuote = () => {
    if (bookingUnavailableReason) return;
    if (authUser === null) {
      router.push(`/login?next=${encodeURIComponent(`/packages/${packageId}`)}`);
      return;
    }
    if (authUser === undefined) return;
    setQuoteOpen(true);
  };

  const packageMetadata = (<div className="cmt-package-metadata flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-cmt-neutral-600"><span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" /><InlineText value={pkg.location} path={["location"]} label="Destination / route" /></span>{reviewCount > 0 && reviewRating > 0 ? <span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-cmt-primary-500 text-cmt-primary-500" aria-hidden="true" /><b className="text-cmt-neutral-900">{reviewRating}</b> {reviewCount} traveller review{reviewCount === 1 ? "" : "s"}</span> : <span className="text-cmt-neutral-500">Newly listed &middot; no traveller reviews yet</span>}</div>);

  const packageHeader = (
    <div className="cmt-package-header flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0"><h1 className="max-w-5xl font-display text-3xl font-semibold tracking-tight sm:text-5xl"><InlineText value={pkg.title} path={["title"]} label="Package title" /></h1></div>
          {/* The booking box carries the same control, but it sits below the
              fold behind the gallery — this is the one a visitor sees while
              they are still deciding whether this trip is worth comparing. */}
          {!preview && <div className="cmt-package-actions flex shrink-0 flex-wrap items-center gap-2 self-start">
            <CompareButton packageId={pkg.id} className="h-11 px-4 shadow-cmt-xs" labels={{ added: "Added to compare", idle: "Compare" }} />
            <PackageShareButton title={pkg.title} />
            <ItineraryDownloadButton pkg={pkg} />
            <Link href="/packages" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold shadow-cmt-xs"><ArrowLeft className="size-4" /> All packages</Link>
          </div>}
        </div>
  );

  return (
    <PageRoot className={`${legacyPreview ? styles.page : presentation.page + " cmt-package-public"} cmt-package-detail bg-white pb-24 font-body text-cmt-neutral-900 lg:pb-0`}>
      <div className="cmt-package-shell mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {legacyPreview && packageHeader}
        {!preview && <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-cmt-neutral-500"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/packages">Packages</Link><span aria-hidden="true">/</span>{pkg.destination ? <><Link href={`/packages?destination=${encodeURIComponent(pkg.destination)}`} className="hover:text-cmt-neutral-900">{pkg.destination}</Link><span aria-hidden="true">/</span></> : null}<span className="line-clamp-1">{pkg.title}</span></nav>}
        {!legacyPreview && packageHeader}
        <div className="cmt-package-columns mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="cmt-package-content min-w-0 space-y-6">
        <EditableGallery images={details.gallery} />
        {!legacyPreview && packageMetadata}
        <div className="cmt-package-intro mt-6 space-y-4">
          {(editor || pageSections.tagline?.trim()) && <p className="max-w-3xl whitespace-pre-wrap break-words text-lg leading-7 text-cmt-neutral-600"><InlineText value={pageSections.tagline ?? ""} path={["details", "pageSections", "tagline"]} label="Tagline" multiline /></p>}{legacyPreview && packageMetadata}
          {(editor || pageSections.introduction?.trim()) && <p className="max-w-4xl whitespace-pre-wrap break-words text-sm leading-7 text-cmt-neutral-600"><InlineText value={pageSections.introduction ?? ""} path={["details", "pageSections", "introduction"]} label="Introduction" multiline /></p>}
        </div>

        {pageSections.snapshotPlacement !== "about" && <PackageFactsBar facts={facts} permitRequired={details.permitRequired} permitHidden={details.permitHidden} className="mt-6" />}

            {pageSections.snapshotPlacement === "about" && (editor || facts.length > 0) && <PackageFactsBar facts={facts} permitRequired={details.permitRequired} permitHidden={details.permitHidden} />}
            {navigation.length > 0 && <TripSectionNavigation items={navigation} />}
            {showAbout && <Section id="package-about" title="About this trip" eyebrow="THE EXPERIENCE">
              <PackageDescription value={details.summary} path={["details", "summary"]} label="About this trip" />
              {editor ? <p className="mt-4 text-sm text-cmt-neutral-500"><InlineText value={details.places.join(", ")} path={["details", "places"]} label="Places (separate with commas)" /></p> : details.places.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{details.places.map((place, index) => <span key={`${place}-${index}`} className="rounded-full border border-cmt-neutral-200 bg-cmt-neutral-50 px-3 py-1.5 text-xs font-semibold"><MapPin className="mr-1 inline size-3.5 text-cmt-primary-700" aria-hidden="true" />{place}</span>)}</div>}
            </Section>}
            <PackagePageSections value={pageSections} area="overview" />
            {showHighlights && <Section id="package-highlights" title="Trip highlights">
              <div className="cmt-highlights-grid grid gap-3 sm:grid-cols-2">{details.highlights.map((item, index) => <div key={`${item}-${index}`} className="flex min-w-0 gap-3 rounded-cmt-control bg-cmt-primary-50 p-4 text-sm font-medium"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-cmt-primary-500"><Check className="size-3.5" aria-hidden="true" /></span><span className="whitespace-pre-wrap break-words"><InlineText value={item} path={["details", "highlights", index]} label={`Highlight ${index + 1}`} /><EditAction kind="remove" label="Remove highlight" onClick={() => editor?.change(["details", "highlights"], details.highlights.filter((_, i) => i !== index))} /></span></div>)}</div><EditAction label="Add highlight" onClick={() => editor?.change(["details", "highlights"], [...details.highlights, "New highlight"])} />
            </Section>}
            <PackagePageSections value={pageSections} area="highlights" />
            {showItinerary && <Section id="package-itinerary" title="Day-by-day itinerary" eyebrow={`${pkg.nights} NIGHT${pkg.nights === 1 ? "" : "S"} / ${pkg.days} DAY${pkg.days === 1 ? "" : "S"}`}>
              <EditorOnly><label className="mb-4 flex items-center gap-2 text-xs"><input type="checkbox" checked={details.dayZeroEnabled ?? details.itinerary.some(day => day.day === 0)} onChange={event => editor?.change(["details", "dayZeroEnabled"], event.target.checked)} />Start with Day 0</label></EditorOnly>
              <div className="cmt-itinerary-days space-y-3">{itinerary.map((day, index) => <details key={`${day.day}-${index}`} open={index === 0} className="group rounded-cmt-md border border-cmt-neutral-200 bg-white">
                <summary className="flex cursor-pointer list-none items-start gap-4 rounded-cmt-md p-4 outline-offset-4 focus-visible:outline-2 focus-visible:outline-cmt-primary-700 sm:p-5 [&::-webkit-details-marker]:hidden">
                  <span className="grid size-12 shrink-0 place-items-center rounded-cmt-control bg-cmt-primary-500 text-xs font-bold">Day {day.day}</span>
                  <span className="min-w-0"><b className="block break-words font-display text-base"><InlineText value={day.title} path={["details", "itinerary", details.itinerary.indexOf(day), "title"]} label={`Day ${day.day} title`} /></b>{(editor || day.route) && <span className="mt-1 block break-words text-xs text-cmt-neutral-500"><InlineText value={day.route} path={["details", "itinerary", details.itinerary.indexOf(day), "route"]} label={`Day ${day.day} route`} /></span>}</span>
                  <ChevronDown className="ml-auto mt-1 size-5 shrink-0 text-cmt-neutral-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="border-t border-cmt-neutral-100 px-4 py-5 text-sm leading-7 text-cmt-neutral-600 sm:px-6">
                  {(editor || day.description.trim()) && <p className="whitespace-pre-wrap break-words"><InlineText value={day.description} path={["details", "itinerary", details.itinerary.indexOf(day), "description"]} label={`Day ${day.day} description`} multiline /></p>}
                  {(editor ? day.activities?.length : day.activities?.some((activity) => activity.title.trim())) && <ol className="mt-5 space-y-5 border-l-2 border-cmt-primary-100 pl-5">{(day.activities ?? []).filter((activity) => editor || activity.title.trim()).map((activity, activityIndex) => <li key={activityIndex} className="relative"><span className="absolute -left-[27px] top-2 size-3 rounded-full border-2 border-white bg-cmt-primary-500" aria-hidden="true" />{(editor || activity.time) && <p className="cmt-activity-time text-xs font-semibold text-cmt-primary-800"><InlineText value={activity.time} path={["details", "itinerary", details.itinerary.indexOf(day), "activities", activityIndex, "time"]} label="Activity time" /></p>}<h3 className="break-words font-semibold text-cmt-neutral-900"><InlineText value={activity.title} path={["details", "itinerary", details.itinerary.indexOf(day), "activities", activityIndex, "title"]} label="Activity title" /></h3>{(editor || activity.description) && <><p className="mt-1 whitespace-pre-wrap break-words"><InlineText value={activity.description} path={["details", "itinerary", details.itinerary.indexOf(day), "activities", activityIndex, "description"]} label="Activity description" multiline /></p><EditAction kind="remove" label="Remove activity" onClick={() => editor?.change(["details", "itinerary", details.itinerary.indexOf(day), "activities"], day.activities?.filter((_, i) => i !== activityIndex))} /></>}</li>)}</ol>}
                  <EditAction label="Add activity" onClick={() => editor?.change(["details", "itinerary", details.itinerary.indexOf(day), "activities"], [...(day.activities ?? []), { time: "", title: "New activity", description: "" }])} /><EditAction kind="remove" label={`Remove Day ${day.day}`} onClick={() => editor?.change(["details", "itinerary"], details.itinerary.filter(item => item !== day))} />
                  {(editor || day.meals.trim()) && <p className="mt-4 text-xs font-semibold text-cmt-neutral-900">Meals: <InlineText value={day.meals} path={["details", "itinerary", details.itinerary.indexOf(day), "meals"]} label={`Day ${day.day} meals`} /></p>}
                </div>
              </details>)}</div>
              <EditAction label="Add day" onClick={() => editor?.change(["details", "itinerary"], [...details.itinerary, { day: Math.max(0, ...details.itinerary.map(day => day.day)) + 1, title: "New day", route: "", description: "", meals: "", activities: [] }])} />
              {(editor || pageSections.itineraryNote?.trim()) && <Note><InlineText value={pageSections.itineraryNote ?? ""} path={["details", "pageSections", "itineraryNote"]} label="itineraryNote" multiline /></Note>}
            </Section>}
            {showStays && <Section id="package-stays" title="Stay and meal plan">
              <div className="cmt-package-stays space-y-5">{details.stays.map((stay, index) => <StayCard key={index} stay={stay} index={index} stays={details.stays} />)}</div>
              <EditAction label="Add stay" onClick={() => editor?.change(["details", "stays"], [...details.stays, { name: "New stay", place: "", nights: 1, comfort: "" }])} />
              {(editor || pageSections.stayNote?.trim()) && <Note><InlineText value={pageSections.stayNote ?? ""} path={["details", "pageSections", "stayNote"]} label="stayNote" multiline /></Note>}
            </Section>}
            {showTransfers && <PracticalSection id="package-transfers" title="Transfers" kind="transfers"><PackageDescription value={details.transfers} path={["details", "transfers"]} label="Transfers" easyEdit />{editor && <button type="button" disabled={editor.disabled} className="mt-4 text-xs underline" onClick={() => editor.change(["details", "pageSections", "hiddenSections"], hiddenSections.has("transfers") ? pageSections.hiddenSections.filter(id => id !== "transfers") : [...pageSections.hiddenSections, "transfers"])}>{hiddenSections.has("transfers") ? "Hidden on website · Show section" : "Hide section"}</button>}</PracticalSection>}
            <PackagePageSections value={pageSections} area="transfers" />
            <PackagePageSections value={pageSections} area="carry" />
            <PackagePageSections value={pageSections} area="guidelines" />
            <PackagePageSections value={pageSections} area="practical" />
            <PackagePageSections value={pageSections} area="locations" />
            {(showInclusions || showExclusions) && <div className="cmt-package-coverage">
              <div className={`grid gap-6 ${showInclusions && showExclusions ? "sm:grid-cols-2" : ""}`}>{showInclusions && <ListSection id="package-inclusions" title="Included" items={details.inclusions} path="inclusions" positive />}{showExclusions && <ListSection id="package-exclusions" title="Not included" items={details.exclusions} path="exclusions" />}</div>
              {(editor || pageSections.inclusionNote?.trim()) && <Note><InlineText value={pageSections.inclusionNote ?? ""} path={["details", "pageSections", "inclusionNote"]} label="inclusionNote" multiline /></Note>}
            </div>}
            <PackagePageSections value={pageSections} area="faq" />
            <PackagePageSections value={pageSections} area="reviews" />
            {(editor || !hiddenSections.has("cancellation") && details.cancellationPolicy.trim()) && <Section id="package-policy" title="Cancellation policy"><div className="cmt-policy-note flex gap-3 rounded-cmt-control p-4"><ShieldCheck className="size-5 shrink-0 text-cmt-success-700" aria-hidden="true" /><PackageDescription value={details.cancellationPolicy} path={["details", "cancellationPolicy"]} label="Cancellation policy" /></div></Section>}
            <PackagePageSections value={pageSections} area="extras" />

          </div>

          <aside id="booking-options" style={{ scrollMarginTop: "10rem" }} className="cmt-booking-panel scroll-mt-40 space-y-4 lg:sticky lg:top-40">
            {previewSidebar ?? <BookingCard bookingUnavailableReason={bookingUnavailableReason} pkg={pkg} details={details} travelDate={travelDate} onTravelDateChange={setTravelDate} travellers={travellers} onTravellersChange={setTravellers} onRequestQuote={requestQuote} />}

          </aside>
        </div>
        {similarPackages.length > 0 && <section aria-labelledby="similar-packages-title" className="cmt-similar-packages mt-12 border-t border-cmt-neutral-200 pt-10 sm:mt-16 sm:pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-cmt-primary-800">You may also like</p>
              <h2 id="similar-packages-title" className="font-display font-semibold">Similar packages</h2>
            </div>
            <Link href="/packages" className="text-sm font-semibold text-cmt-neutral-600 underline underline-offset-4 hover:text-cmt-neutral-900">View all packages</Link>
          </div>
          <div className="cmt-similar-grid mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {similarPackages.map(item => <PackageCard key={item.id} pkg={item} />)}
          </div>
        </section>}
      </div>
      {!preview && <div className="cmt-booking-dock fixed inset-x-0 bottom-0 z-40 border-t border-cmt-neutral-200 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-3">
          <div className="min-w-0">
            <p className="text-xs text-cmt-neutral-500">Per person</p>
            <p className="mt-0.5 flex items-baseline gap-1.5"><span className="font-display text-lg font-bold">{formatINR(pkg.price)}</span>{discount > 0 && <span className="rounded-cmt-full bg-cmt-success-100 px-2 py-0.5 text-xs font-semibold text-cmt-success-700">{discount}% off</span>}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/checkout?pkg=${encodeURIComponent(pkg.id)}&travellers=${travellers}${travelDate ? `&date=${travelDate}` : ""}`} className="flex h-11 items-center rounded-cmt-control border border-cmt-neutral-300 px-4 text-sm font-semibold">Book</Link>
            <button type="button" onClick={requestQuote} className="flex h-11 items-center rounded-cmt-control bg-cmt-primary-500 px-4 text-sm font-semibold"><span className="sm:hidden">Get quote</span><span className="hidden sm:inline">Get customized quote</span></button>
          </div>
        </div>
      </div>
      }
      {quoteOpen ? <QuoteModal pkg={pkg} initialTravellers={travellers} initialTravelDate={travelDate} onClose={() => setQuoteOpen(false)} /> : null}
    </PageRoot>
  );
}

function TripSectionNavigation({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const menu = useRef<HTMLDetailsElement>(null);
  const ids = items.map(item => item.id).join(",");
  const primaryIds = new Set(["package-about", "package-highlights", "package-itinerary", "package-reviews"]);
  const primary = items.filter(item => primaryIds.has(item.id));
  const more = items.filter(item => !primaryIds.has(item.id));

  useEffect(() => {
    const sections = ids.split(",").map(id => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
    let frame = 0;
    const update = () => {
      const threshold = (sections[0] ? parseFloat(window.getComputedStyle(sections[0]).scrollMarginTop) || 128 : 128) + 1;
      let current = sections[0]?.id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= threshold) current = section.id;
      }
      setActive(current);
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const onPointerDown = (event: PointerEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    const revealHash = () => {
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const section = sections.find(section => section.id === id);
      const disclosure = section?.querySelector<HTMLDetailsElement>(":scope > .cmt-practical-disclosure");
      if (disclosure) disclosure.open = true;
    };
    revealHash();
    update();
    window.addEventListener("hashchange", revealHash);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", revealHash);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [ids]);

  const link = (item: { id: string; label: string }) => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined} onClick={() => {
    const disclosure = document.getElementById(item.id)?.querySelector<HTMLDetailsElement>(":scope > .cmt-practical-disclosure");
    if (disclosure) disclosure.open = true;
    setActive(item.id);
    if (menu.current) menu.current.open = false;
  }}>{item.label}</a>;
  return <nav aria-label="Trip sections" onKeyDown={event => {
    if (event.key === "Escape" && menu.current?.open) {
      menu.current.open = false;
      menu.current.querySelector("summary")?.focus();
    }
  }}>
    {primary.length > 0 && <div className="cmt-trip-primary-links">{primary.map(link)}</div>}
    {more.length > 0 && <details ref={menu} className="cmt-trip-more" data-active={more.some(item => item.id === active) || undefined}>
      <summary>More details <ChevronDown className="size-4" aria-hidden="true" /></summary>
      <div className="cmt-trip-menu">{more.map(link)}</div>
    </details>}
  </nav>;
}

function Section({ id, title, eyebrow, children }: { id?: string; title: string; eyebrow?: string; children: React.ReactNode }) {
  const editor = usePackageEditing();
  const key = id?.replace("package-", "") === "policy" ? "cancellation" : id?.replace("package-", "");
  const hidden = editor?.value.details?.pageSections?.hiddenSections ?? [];
  const isHidden = hidden.some(item => item === key);
  return <section id={id} className="min-w-0 scroll-mt-40 border-b border-cmt-neutral-200 py-7">{eyebrow && <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-cmt-primary-800">{eyebrow}</p>}<h2 className="mb-5 font-display text-2xl font-semibold">{title}</h2>{editor && key && <button type="button" className="mb-4 text-xs text-cmt-neutral-500 underline" disabled={editor.disabled} onClick={() => editor.change(["details", "pageSections", "hiddenSections"], isHidden ? hidden.filter(item => item !== key) : [...hidden, key])}>{isHidden ? "Hidden on website · Show section" : "Hide section"}</button>}{children}</section>;
}
function ListSection({ id, title, items, path, positive = false }: { id: string; title: string; items: string[]; path: "inclusions" | "exclusions"; positive?: boolean }) {
  const editor = usePackageEditing();
  return <Section id={id} title={title}><ul className="space-y-3">{items.map((item, index) => <li key={index} className="flex gap-2.5 text-sm leading-6 text-cmt-neutral-600">{positive ? <Check className="mt-1 size-4 shrink-0 text-cmt-success-700" /> : <X className="mt-1 size-4 shrink-0 text-cmt-coral-700" />}<InlineText value={item} path={["details", path, index]} label={`${title} item ${index + 1}`} multiline /><EditAction kind="remove" label="Remove item" onClick={() => editor?.change(["details", path], items.filter((_, i) => i !== index))} /></li>)}</ul><EditAction label="Add item" onClick={() => editor?.change(["details", path], [...items, "New item"])} /></Section>;
}

function StayCard({ stay, index, stays }: { stay: PackageStay; index: number; stays: PackageStay[] }) {
  const editor = usePackageEditing();
  const path = (key: keyof PackageStay) => ["details", "stays", index, key];
  const stars = Math.max(0, Math.min(5, Math.round(stay.stars ?? 0)));
  const terms = ([["Room type", "roomType", BedDouble], ["Meal plan", "mealPlan", Utensils], ["Room inclusion", "roomInclusion", Check]] as const)
    .filter(([, key]) => editor || stay[key]?.toString().trim());
  const dates = ([["Check-in", "checkIn"], ["Check-out", "checkOut"]] as const)
    .filter(([, key]) => editor || stay[key]?.trim());
  const hasImage = Boolean(editor) || isDisplayableImage(stay.image);

  return (
    <article className={`cmt-package-stay ${presentation.stayCard}`}>
      <div className={`${presentation.stayHeader} ${!hasImage ? presentation.stayWithoutImage : ""}`}>
        {hasImage && <div className={presentation.stayPhoto}>
          {isDisplayableImage(stay.image)
            ? <Image src={stay.image} alt={stay.name.trim() || "Hotel photo"} fill sizes="(min-width: 640px) 220px, 100vw" className="object-cover" unoptimized={bypassesImageOptimizer(stay.image)} />
            : <span className={presentation.stayPlaceholder}><Hotel size={32} aria-hidden="true" /><span>Add a hotel photo</span></span>}
        </div>}
        <div className={presentation.stayIntro}>
          <div className={presentation.stayEyebrow}><Hotel size={14} aria-hidden="true" /> Your stay
            {(editor || stay.nights > 0) && <span className={presentation.stayNights}><Moon size={12} aria-hidden="true" /><InlineText value={stay.nights} numeric path={path("nights")} label="Stay nights" /> night{stay.nights === 1 ? "" : "s"}</span>}
          </div>
          <h3 className={presentation.stayName}><InlineText value={stay.name} path={path("name")} label="Stay name" /></h3>
          {(editor || stay.place.trim()) && <p className={presentation.stayLocation}><MapPin size={14} aria-hidden="true" /><span><InlineText value={stay.place} path={path("place")} label="Stay location" /></span></p>}
          {(editor || stars > 0) && <div className={presentation.stayStars}>
            {editor ? <span><InlineText value={stay.stars ?? 0} numeric path={path("stars")} label="Stay star rating" /> ★</span> : <><span className="sr-only">{stars} star hotel</span>{Array.from({ length: stars }, (_, star) => <Star key={star} size={14} fill="currentColor" aria-hidden="true" />)}</>}
          </div>}
        </div>
      </div>
      {(editor || stay.comfort.trim()) && <p className={presentation.stayDescription}><InlineText value={stay.comfort} path={path("comfort")} label="Stay description" multiline /></p>}
      {terms.length > 0 && <dl className={presentation.stayTerms}>
        {terms.map(([label, key, Icon]) => <div key={key} className={presentation.stayTerm}>
          <span className={presentation.stayTermIcon}><Icon size={17} aria-hidden="true" /></span>
          <div><dt>{label}</dt><dd><InlineText value={stay[key] ?? ""} path={path(key)} label={label} /></dd></div>
        </div>)}
      </dl>}
      {dates.length > 0 && <dl className={presentation.stayDates}>
        {dates.map(([label, key]) => <div key={key}><CalendarDays size={16} aria-hidden="true" /><div><dt>{label}</dt><dd><InlineText value={stay[key] ?? ""} path={path(key)} label={label} /></dd></div></div>)}
      </dl>}
      {editor && <div className={presentation.stayEditor}><EditableImage value={stay.image ?? ""} path={path("image")} label="hotel photo" /><EditAction kind="remove" label="Remove stay" onClick={() => editor.change(["details", "stays"], stays.filter((_, i) => i !== index))} /></div>}
    </article>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 whitespace-pre-wrap break-words rounded-cmt-control border-l-4 border-cmt-primary-500 bg-cmt-primary-50 px-4 py-3 text-xs leading-6 text-cmt-neutral-700">{children}</p>;
}
