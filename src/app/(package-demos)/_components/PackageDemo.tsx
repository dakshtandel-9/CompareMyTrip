"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Backpack, Bus, CalendarDays, Check, ChevronDown, Clock3, Compass, Heart, MapPin, Moon, Mountain, ShieldCheck, Star, Sunrise, Ticket, Users, X, type LucideIcon } from "lucide-react";
import { getPackageDetails, getPackageItinerary, isDepartureAllowed, type TravelPackage } from "@/lib/packageData";
import { getPackagePageSections, isVisiblePackageSection, locationMapLink } from "@/lib/packageDetailSections";
import snapshot from "./skandagiri.json";
import styles from "./PackageDemo.module.css";

// A public-content snapshot keeps all four concepts comparable and independent of CMS changes.
const trip = snapshot as TravelPackage;
const details = getPackageDetails(trip);
const sections = getPackagePageSections(details);
const itinerary = getPackageItinerary(details);
const reviews = sections.reviews.enabled ? sections.reviews.items.filter(item => item.visible && item.name && item.text) : [];
const rating = reviews.length ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : trip.rating;
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const photos = [trip.image, "/weekend-treks/skandagiri.jpg"];
const designs = ["The essentials", "One topic at a time", "The editorial", "Trip chapters"];
const topics = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "itinerary", label: "Itinerary", icon: Sunrise },
  { id: "inclusions", label: "Inclusions", icon: Check },
  { id: "practical", label: "Before you go", icon: Backpack },
  { id: "reviews", label: "Reviews", icon: Star },
] as const;
type Topic = typeof topics[number]["id"];
type BookingState = { date: string; travellers: number; setDate: (date: string) => void; setTravellers: (travellers: number) => void; openBooking: () => void; openGallery: () => void };
const BookingContext = createContext<BookingState | null>(null);
function useBooking() { return useContext(BookingContext)!; }

export default function PackageDemo({ variant }: { variant: 1 | 2 | 3 | 4 }) {
  const [date, setDate] = useState("");
  const [travellers, setTravellers] = useState(2);
  const [saved, setSaved] = useState(false);
  const [photo, setPhoto] = useState(0);
  const bookingDialog = useRef<HTMLDialogElement>(null);
  const galleryDialog = useRef<HTMLDialogElement>(null);
  const booking = { date, travellers, setDate, setTravellers, openBooking: () => bookingDialog.current?.showModal(), openGallery: () => galleryDialog.current?.showModal() };

  return <BookingContext.Provider value={booking}>
    <div className={`${styles.demo} ${styles[`variant${variant}`]}`}>
      <div className={styles.previewBar} id="demo-switcher">
        <div className={styles.previewLabel}><span /> Local design preview <small>Bookings disabled</small></div>
        <nav aria-label="Package page demos">{designs.map((name, index) => <Link key={name} href={`/package-page-${index + 1}`} aria-current={variant === index + 1 ? "page" : undefined}><span>0{index + 1}</span>{name}</Link>)}</nav>
      </div>
      <header className={styles.header}>
        <Link href="/package-page-1" aria-label="CompareMyTrip demos"><Image src="/comparemytrip-logo.png" width={225} height={44} alt="CompareMyTrip" className={styles.logo} /></Link>
        <span className={styles.headerNote}>A little closer to adventure.</span>
        <button type="button" className={styles.saveButton} aria-label={saved ? "Remove trip from saved" : "Save this trip"} aria-pressed={saved} onClick={() => setSaved(!saved)}><Heart size={17} fill={saved ? "currentColor" : "none"} />{saved ? "Saved" : "Save trip"}</button>
      </header>
      <main className={styles.main}>
        {variant === 1 && <EssentialPage />}
        {variant === 2 && <TabbedPage />}
        {variant === 3 && <EditorialPage />}
        {variant === 4 && <ChapterPage />}
      </main>
      <footer className={styles.footer}><span>CompareMyTrip</span><p>Same adventure. A fresh perspective.</p><span>Design 0{variant} / 04</span></footer>
      <div className={`${styles.bookingDock} ${variant === 3 ? styles.editorialDock : ""}`}>
        <div><small>{variant === 3 ? trip.title : "Per person"}</small><strong>{money(trip.price)} <span>/ person</span></strong></div>
        <span className={styles.dockNote}>An overnight escape from Bengaluru</span>
        <button type="button" onClick={booking.openBooking}>Choose your date <ArrowRight size={17} /></button>
      </div>
      <dialog ref={bookingDialog} className={styles.bookingDialog} aria-label="Preview your trip booking" onClick={event => { if (event.target === event.currentTarget) bookingDialog.current?.close(); }}>
        <button type="button" className={styles.closeButton} aria-label="Close booking preview" onClick={() => bookingDialog.current?.close()}><X size={20} /></button>
        <BookingCard modal />
      </dialog>
      <dialog ref={galleryDialog} className={styles.galleryDialog} aria-label="Skandagiri photo gallery" onClick={event => { if (event.target === event.currentTarget) galleryDialog.current?.close(); }}>
        <button type="button" className={styles.closeButton} aria-label="Close photo gallery" onClick={() => galleryDialog.current?.close()}><X size={20} /></button>
        <div className={styles.galleryImage}><Image src={photos[photo]} fill unoptimized sizes="90vw" alt={photo === 0 ? "Sunrise over the clouds at Skandagiri" : "The view across Skandagiri hills"} /></div>
        <div className={styles.galleryControls}><button type="button" aria-label="Previous photo" onClick={() => setPhoto((photo + photos.length - 1) % photos.length)}><ArrowLeft /></button><span>{photo + 1} / {photos.length} · Skandagiri</span><button type="button" aria-label="Next photo" onClick={() => setPhoto((photo + 1) % photos.length)}><ArrowRight /></button></div>
      </dialog>
    </div>
  </BookingContext.Provider>;
}

function Eyebrow({ children }: { children: ReactNode }) { return <p className={styles.eyebrow}>{children}</p>; }
function Rating() { return <span className={styles.rating}><Star size={15} fill="currentColor" /><b>{rating.toFixed(1)}</b><span>({reviews.length || trip.reviews} reviews)</span></span>; }
function Heading({ compact = false }: { compact?: boolean }) {
  return <div className={`${styles.heading} ${compact ? styles.compactHeading : ""}`}><Eyebrow>KARNATAKA / WEEKEND ESCAPES</Eyebrow><h1>{trip.title}</h1><div className={styles.meta}><span><MapPin size={15} /> Skandagiri Hills, near Bengaluru</span><Rating /></div></div>;
}
function Photo({ className = "", second = false, gallery = false, label }: { className?: string; second?: boolean; gallery?: boolean; label?: string }) {
  const { openGallery } = useBooking();
  return <div className={`${styles.photo} ${className}`}><Image src={photos[second ? 1 : 0]} alt={second ? "Rocky landscape seen from Skandagiri" : "Golden sunrise above the clouds at Skandagiri"} fill unoptimized sizes="(max-width: 700px) 100vw, 70vw" loading="eager" />{label && <span className={styles.photoLabel}>{label}</span>}{gallery && <button type="button" className={styles.galleryButton} onClick={openGallery}><span aria-hidden="true">▦</span> View photos</button>}</div>;
}
function Facts({ compact = false }: { compact?: boolean }) {
  return <div className={`${styles.facts} ${compact ? styles.compactFacts : ""}`}>{([
    [Moon, "Duration", `${trip.nights} night / ${trip.days} day`], [Mountain, "Experience", "Sunrise trek"], [Users, "Group size", `${trip.pax} travellers`], [Bus, "From Bengaluru", "Transfers included"],
  ] as [LucideIcon, string, string][]).map(([Icon, label, value]) => <div key={label}><Icon size={21} /><span><small>{label}</small><strong>{value}</strong></span></div>)}</div>;
}
function BookingCard({ modal = false }: { modal?: boolean }) {
  const { date, travellers, setDate, setTravellers } = useBooking();
  const [message, setMessage] = useState("");
  const dateId = useId();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isDepartureAllowed(trip, date)) { setMessage("Please choose a Friday or Saturday departure."); return; }
    setMessage(`Preview: ${travellers} traveller${travellers === 1 ? "" : "s"}, ${money(trip.price * travellers)} total. Availability has not been checked and no booking has been created.`);
  };
  return <aside className={styles.bookingCard} aria-label="Trip booking preview">
    <div className={styles.bookingTop}><span>YOUR NEXT LITTLE ESCAPE</span><Sunrise size={23} /></div>
    <div className={styles.price}><strong>{money(trip.price)}</strong><span>/ person</span><del>{money(trip.originalPrice)}</del></div>
    <p className={styles.priceCaption}>An early start. An unforgettable morning.</p>
    <form onSubmit={submit}>
      <label htmlFor={dateId}>When are you heading out?<span>Fri & Sat</span></label>
      <div className={styles.dateField}><CalendarDays size={17} /><input id={dateId} aria-label="Departure date" type="date" required value={date} onChange={event => { setDate(event.target.value); setMessage(""); }} /></div>
      <div className={styles.travellerField}><span>Travellers<small>Come solo or bring your people</small></span><div><button type="button" aria-label="Remove a traveller" disabled={travellers <= 1} onClick={() => { setTravellers(Math.max(1, travellers - 1)); setMessage(""); }}>−</button><output aria-label="Traveller count">{travellers}</output><button type="button" aria-label="Add a traveller" disabled={travellers >= 40} onClick={() => { setTravellers(Math.min(40, travellers + 1)); setMessage(""); }}>+</button></div></div>
      <div className={styles.total}><span>Total for {travellers}</span><b>{money(trip.price * travellers)}</b></div>
      <button type="submit" className={styles.primaryButton}>Check dates <ArrowRight size={18} /></button>
      <p role="status" className={styles.bookingStatus}>{message || (modal ? "Local demo · try the controls. No booking will be sent." : "Local demo · preview your selection")}</p>
    </form>
    {details.permitRequired && <div className={styles.permit}><Ticket size={17} /><span>Forest permit required <small>Booked separately</small></span></div>}
  </aside>;
}
function Disclosure({ title, hint, icon: Icon, children, open = false }: { title: string; hint?: string; icon?: LucideIcon; children: ReactNode; open?: boolean }) {
  return <details className={styles.disclosure} open={open || undefined}><summary>{Icon && <Icon size={20} />}<span>{title}{hint && <small>{hint}</small>}</span><ChevronDown size={17} /></summary><div className={styles.disclosureContent}>{children}</div></details>;
}
function TextBlocks({ text }: { text: string }) {
  return <div className={styles.prose}>{text.split(/\n\s*\n/).filter(Boolean).map((block, index) => <p key={index}>{block}</p>)}</div>;
}
function Overview({ editorial = false }: { editorial?: boolean }) {
  return <div className={styles.overview}><Eyebrow>THE EXPERIENCE</Eyebrow><h2>{editorial ? "Some mornings stay with you." : "Above the clouds. Away from the everyday."}</h2><p className={styles.intro}>Leave Bengaluru after dark. Follow the trail to Skandagiri’s summit, where the first light meets open skies and centuries of hill-fort history.</p><div className={styles.highlights}>{([
    [Sunrise, "Chase the first light", "A sunrise above the hills"], [Mountain, "Walk through history", "Explore Kalavara Durga"], [Users, "Share the adventure", "A small escape, together"],
  ] as [LucideIcon, string, string][]).map(([Icon, title, text]) => <div key={title}><Icon size={23} /><strong>{title}</strong><span>{text}</span></div>)}</div>
    <details className={styles.readMore}><summary>More about this trip <ChevronDown size={14} /></summary><TextBlocks text={details.summary} />{sections.sections.filter(section => section.placement === "overview" && isVisiblePackageSection(section)).map(section => <div key={section.id}><h3>{section.title}</h3><TextBlocks text={section.body} /></div>)}</details>
  </div>;
}
function Itinerary() {
  const [selected, setSelected] = useState(0);
  const day = itinerary[selected];
  if (!day) return null;
  return <div className={styles.itinerary}>
    <div className={styles.sectionTitle}><div><Eyebrow>FROM CITY LIGHTS TO FIRST LIGHT</Eyebrow><h2>Your overnight plan</h2></div><span className={styles.pill}>{trip.nights} night / {trip.days} day</span></div>
    <div className={styles.dayButtons} aria-label="Itinerary days">{itinerary.map((item, index) => <button type="button" key={item.day} aria-pressed={selected === index} onClick={() => setSelected(index)}><span>Day {item.day}</span>{item.title}</button>)}</div>
    <p className={styles.dayRoute}>{day.route}</p>
    <ol className={styles.timeline}>{day.activities?.map((activity, index) => <li key={index}><span className={styles.timelineDot} /><time>{activity.time}</time><details><summary>{activity.title}<ChevronDown size={14} /></summary><TextBlocks text={activity.description} /></details></li>)}</ol>
    {sections.itineraryNote && <p className={styles.note}><Clock3 size={16} />{sections.itineraryNote}</p>}
  </div>;
}
function Coverage() {
  return <div><Eyebrow>THE LITTLE DETAILS, UP FRONT</Eyebrow><h2>What comes with your trip</h2><div className={styles.coverage}>{[{ title: "You’re covered", items: details.inclusions, positive: true }, { title: "Plan for these", items: details.exclusions, positive: false }].map(group => <div key={group.title}><h3>{group.positive ? <Check size={19} /> : <span>+</span>}{group.title}</h3><ul>{group.items.map(item => <li key={item}>{group.positive ? <Check size={15} /> : <span>–</span>}{item}</li>)}</ul></div>)}</div></div>;
}
function PracticalInfo() {
  const extras = sections.sections.filter(section => ["transfers", "carry", "guidelines", "practical", "faq"].includes(section.placement ?? "") && isVisiblePackageSection(section));
  return <div><Eyebrow>A LITTLE PREPARATION GOES A LONG WAY</Eyebrow><h2>Before you go</h2>{details.permitRequired && <div className={styles.permitNotice}><Ticket size={21} /><div><strong>A forest permit is required</strong><p>Permit charges are separate from your trip package.</p></div></div>}
    <div className={styles.disclosures}>{details.transfers && <Disclosure title="Your ride to the hills" hint="Transportation & group allocation" icon={Bus}><TextBlocks text={details.transfers} /></Disclosure>}{extras.map(section => <Disclosure key={section.id} title={section.title} icon={section.placement === "carry" ? Backpack : section.placement === "guidelines" ? ShieldCheck : MapPin}><TextBlocks text={section.body} />{section.items.filter(item => item.visible !== false).map(item => <div key={item.id}><h3>{item.title}</h3><TextBlocks text={item.body} /></div>)}</Disclosure>)}
      {sections.locations.enabled && <Disclosure title="Find your pickup point" hint="View the designated meeting locations" icon={MapPin}>{sections.locations.items.filter(item => item.visible).map(item => <div key={item.id} className={styles.pickup}><strong>{item.name}</strong><p>{item.address}</p><TextBlocks text={item.notes} />{locationMapLink(item) && <a href={locationMapLink(item) ?? undefined} target="_blank" rel="noopener noreferrer">Open pickup map <ArrowUpRight size={15} /></a>}</div>)}</Disclosure>}
      {details.cancellationPolicy && <Disclosure title="Cancellation policy" hint="Read before making your plans" icon={ShieldCheck}><TextBlocks text={details.cancellationPolicy} /></Disclosure>}
    </div>
  </div>;
}
function Reviews() {
  return <div><Eyebrow>FROM PEOPLE WHO’VE BEEN THERE</Eyebrow><h2>A morning well spent</h2><div className={styles.reviewSummary}><strong>{rating.toFixed(1)}<small>/ 5</small></strong><div><span aria-label={`${rating.toFixed(1)} out of five stars`}>{[0, 1, 2, 3, 4].map(n => <Star key={n} size={17} fill="currentColor" />)}</span><p>From {reviews.length} traveller reviews</p></div></div><div className={styles.reviewGrid}>{reviews.map(review => <article key={review.id}><span className={styles.reviewStars}>{Array.from({ length: review.rating }, (_, n) => <Star key={n} size={12} fill="currentColor" />)}</span><p>{review.text.split(/\n\s*\n/)[0]}</p><details className={styles.readMore}><summary>Read their story <ChevronDown size={13} /></summary><TextBlocks text={review.text.split(/\n\s*\n/).slice(1).join("\n\n")} /></details><div className={styles.author}><span>{review.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</span><strong>{review.name}</strong></div></article>)}</div></div>;
}
function TopicPanel({ topic }: { topic: Topic }) {
  if (topic === "itinerary") return <Itinerary />;
  if (topic === "inclusions") return <Coverage />;
  if (topic === "practical") return <PracticalInfo />;
  if (topic === "reviews") return <Reviews />;
  return <Overview />;
}
function TopicTabs({ active, setActive, vertical = false }: { active: Topic; setActive: (topic: Topic) => void; vertical?: boolean }) {
  return <div className={vertical ? styles.chapterNav : styles.tabs} role="tablist" aria-label="Trip information" aria-orientation={vertical ? "vertical" : "horizontal"}>{topics.map(({ id, label, icon: Icon }, index) => <button key={id} id={`tab-${id}`} type="button" role="tab" aria-selected={active === id} aria-controls="trip-topic-panel" tabIndex={active === id ? 0 : -1} onClick={() => setActive(id)} onKeyDown={event => {
    const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 0;
    if (!direction && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? topics.length - 1 : (index + direction + topics.length) % topics.length;
    setActive(topics[next].id);
    document.getElementById(`tab-${topics[next].id}`)?.focus();
  }}>{vertical ? <span>0{index + 1}</span> : <Icon size={16} />}<b>{label}</b>{vertical && <ArrowRight size={15} />}</button>)}</div>;
}

function EssentialPage() {
  return <div className={styles.essentialPage}>
    <Heading />
    <div className={styles.essentialGrid}><div><Photo className={styles.essentialHero} gallery /><Facts /><Overview />
      <div className={styles.disclosures}><Disclosure title="Your overnight itinerary" hint="From Bengaluru to the summit, and back" icon={Sunrise}><Itinerary /></Disclosure><Disclosure title="What’s included" hint="Know exactly what your package covers" icon={Check}><Coverage /></Disclosure><Disclosure title="Before you go" hint="Pickup, packing, permits & policies" icon={Backpack}><PracticalInfo /></Disclosure><Disclosure title="Stories from the trail" hint={`${reviews.length} traveller reviews`} icon={Star}><Reviews /></Disclosure></div>
    </div><div className={styles.stickyBooking}><BookingCard /><p className={styles.sideNote}><ShieldCheck size={16} /> Your trip details, all in one place.</p></div></div>
  </div>;
}
function TabbedPage() {
  const [active, setActive] = useState<Topic>("overview");
  return <div className={styles.tabbedPage}><Heading /><div className={styles.mosaic}><Photo gallery /><Photo second label="Skandagiri, from a different perspective" /></div><Facts />
    <div className={styles.tabbedGrid}><div><TopicTabs active={active} setActive={setActive} /><section id="trip-topic-panel" role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0} className={styles.tabPanel}><TopicPanel key={active} topic={active} /></section></div><div className={styles.stickyBooking}><BookingCard /></div></div>
  </div>;
}
function EditorialPage() {
  const { openBooking } = useBooking();
  return <div className={styles.editorialPage}>
    <div className={styles.editorialHero}><div><Eyebrow>01 NIGHT / A WHOLE NEW PERSPECTIVE</Eyebrow><h1>Skandagiri.<br /><em>Before the<br />world wakes.</em></h1><p>A little adventure. An early start.<br />A morning you’ll carry home.</p><Rating /><a href="#editorial-story" className={styles.exploreLink}>Explore the escape <ArrowDown size={16} /></a></div><Photo gallery label="SKANDAGIRI SUNRISE TREK · KARNATAKA" /></div>
    <Facts />
    <section className={styles.editorialStory} id="editorial-story"><div><Eyebrow>THE ART OF GETTING AWAY</Eyebrow><h2>Trade the city lights<br />for <em>first light.</em></h2></div><div><p>Some of the best escapes start while the city sleeps. A trail through the dark, the quiet of the hills, and that first wash of gold across the sky.</p><p>This is Skandagiri: a night away from your routine, with a new view waiting at the top.</p><details className={styles.readMore}><summary>The story of this hill <ArrowRight size={14} /></summary><TextBlocks text={sections.sections.find(item => item.placement === "overview")?.body || details.summary} /></details></div></section>
    <div className={styles.editorialMoments}><Photo label="01 / THE FIRST LIGHT" /><div><Sunrise size={35} strokeWidth={1} /><span>1,450 m</span><p>A different view<br />of your everyday.</p><small>Above sea level</small></div><Photo second label="02 / THE HILLS, UNHURRIED" /></div>
    <section className={styles.editorialPlan}><div><Eyebrow>YOUR NIGHT & DAY</Eyebrow><h2>A small journey.<br /><em>A lasting feeling.</em></h2></div><div className={styles.miniJourney}>{[{ time: "10:30 PM", title: "Leave the city", body: "Meet your group in Bengaluru.", icon: Bus }, { time: "BEFORE DAWN", title: "Follow the trail", body: "Make your way up with your trek leader.", icon: Mountain }, { time: "SUNRISE", title: "Take it all in", body: "Pause at the summit, then begin your descent.", icon: Sunrise }].map(({ time, title, body, icon: Icon }) => <div key={title}><Icon size={21} /><small>{time}</small><h3>{title}</h3><p>{body}</p></div>)}</div></section>
    <div className={styles.editorialDetails}><Disclosure title="The complete overnight plan" icon={Clock3}><Itinerary /></Disclosure><Disclosure title="Inclusions & exclusions" icon={Check}><Coverage /></Disclosure><Disclosure title="The practical details" icon={Backpack}><PracticalInfo /></Disclosure><Disclosure title="From fellow travellers" icon={Star}><Reviews /></Disclosure></div>
    <div className={styles.editorialClosing}><span>Some mornings are worth the early alarm.</span><button type="button" onClick={openBooking}>Find your morning <ArrowUpRight size={20} /></button></div>
  </div>;
}
function ChapterPage() {
  const [active, setActive] = useState<Topic>("overview");
  const current = topics.findIndex(topic => topic.id === active);
  return <div className={styles.chapterPage}><div className={styles.chapterHero}><Photo /><div><Eyebrow>LEAVE THE EVERYDAY BEHIND</Eyebrow><h1>{trip.title}</h1><div className={styles.meta}><span><MapPin size={15} />Near Bengaluru</span><Rating /></div></div><span className={styles.chapterHeroBadge}><Moon size={16} />1 night / 1 day</span></div>
    <div className={styles.workspace}><aside className={styles.chapterRail}><Eyebrow>YOUR TRIP, IN CHAPTERS</Eyebrow><TopicTabs active={active} setActive={setActive} vertical /><div className={styles.railNote}><Compass size={26} strokeWidth={1.3} /><p>Less scrolling.<br />More discovering.</p></div></aside><div className={styles.chapterContent}><section id="trip-topic-panel" role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0}><span className={styles.chapterNumber}>CHAPTER 0{current + 1} <i>/ 05</i></span>{active === "overview" && <><Facts compact /><Photo className={styles.chapterInset} second /></>}<TopicPanel key={active} topic={active} /></section><div className={styles.chapterFooter}><span>0{current + 1} / 05</span><button type="button" onClick={() => setActive(topics[(current + 1) % topics.length].id)}>{current === topics.length - 1 ? "Back to overview" : `Next: ${topics[current + 1].label}`}<ArrowRight size={16} /></button></div></div><div className={styles.stickyBooking}><BookingCard /></div></div>
  </div>;
}
