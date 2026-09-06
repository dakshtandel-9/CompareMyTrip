import { WEEKEND_TRACKS } from "@/lib/weekendTracks";

/* ------------------------------------------------------------------ */
/* Editable homepage content.                                          */
/*                                                                     */
/* Every section of the homepage is data here, with the shipped copy as */
/* the default, so the /admin CRM can edit all of it. The published     */
/* document lives in Firestore; defaults keep SSR and first load stable */
/* until the real-time Firebase snapshot arrives.                       */
/*                                                                     */
/* Two rules hold across every section below:                          */
/*   · `enabled: false` removes the section from the page entirely.     */
/*   · An empty `actionLabel` or `actionHref` hides that section's      */
/*     "View all →" link rather than rendering a dead one.              */
/* ------------------------------------------------------------------ */

/** The eyebrow → headline → sub-line → optional link every band opens with. */
export type SectionHeaderContent = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
};

/* ---------------------------- Hero -------------------------------- */

/** One block of hero copy. The scroll through the frame sequence is split
    into equal windows, one per block, so they hand over as you scrub. */
export type HeroCopyBlock = {
  id: string;
  /** Rendered as two lines; the second may be blank for a one-line title. */
  titleLine1: string;
  titleLine2: string;
  body: string;
};

/** The social-proof row under the rotating copy. */
export type HeroTrust = {
  enabled: boolean;
  /** Small round thumbnails — public paths or uploaded data URLs. */
  faces: string[];
  /** "Trusted by" · "50K+" · "travellers" */
  prefix: string;
  highlight: string;
  suffix: string;
};

/** The "Top picks for you" shelf under the search panel. */
export type HeroTopPicks = {
  enabled: boolean;
  title: string;
  subtitle: string;
  /** `auto` keeps the rating-weighted shelf that follows the travel-style
      pills; `manual` shows exactly the packages picked in the CRM, in the
      order they were picked. */
  mode: "auto" | "manual";
  packageIds: string[];
  /** How many cards `auto` puts on the shelf. */
  limit: number;
};

export type HeroContent = {
  enabled: boolean;
  copy: HeroCopyBlock[];
  trust: HeroTrust;
  topPicks: HeroTopPicks;
};

/* ------------------------- Travel styles -------------------------- */

export type CategoryCard = {
  id: string;
  label: string;
  tagline: string;
  /** Key into ICON_LIBRARY (src/lib/adminIcons.tsx). */
  icon: string;
  href: string;
  image: string;
  /** Alt text for the photo — described, not decorative. */
  alt: string;
};

export type CategoriesContent = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  cards: CategoryCard[];
};

/* ------------------------ Trending rail --------------------------- */

export type TrendingDestination = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  /** Kept as text so "7,999" formats exactly as typed. */
  price: string;
  packages: number;
  /** Month-on-month rise in searches — the reason it is on this list. */
  rise: number;
  href: string;
};

export type TrendingContent = {
  enabled: boolean;
  header: SectionHeaderContent;
  items: TrendingDestination[];
};

/* --------------------------- Banners ------------------------------ */
/* The photography mastheads: the one on /destinations, and the ones the
   catalogue swaps in for a region, for deals, and for each weekend-trek
   track.

   These are not a homepage section and are not edited with the rest of the
   page copy — they have their own CRM screen at /admin/banners, because
   they belong to several different pages and an editor looking for "the
   banner on the deals page" would never think to look under a homepage
   section.

   A banner's `id` is fixed in code: it names the view the banner belongs
   to, so an editor changes the picture and the words, never where it
   appears. BANNER_SLOTS below is the whole list — add a slot there and it
   shows up in the CRM with its shipped copy already in it. */

export type BannerContent = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
};

export type BannersContent = {
  items: BannerContent[];
};

/** A banner slot: what it is called in the CRM, where it appears, and what
    it says before anyone edits it. `name` and `where` are CRM labels and
    are never stored — they cannot drift from the code. */
export type BannerSlot = {
  id: string;
  name: string;
  where: string;
  banner: BannerContent;
};

export const BANNER_SLOTS: BannerSlot[] = [
  {
    id: "destinations",
    name: "Destinations",
    where: "/destinations",
    banner: {
      id: "destinations",
      eyebrow: "Destinations",
      title: "Every place we cover.",
      description:
        "Pick a destination and we\u2019ll open the catalogue with it already filtered — every package under it, from trusted operators.",
      image: "/images/destinations-header-banner.jpg",
    },
  },
  {
    id: "packages-india",
    name: "India packages",
    where: "/packages?region=india",
    banner: {
      id: "packages-india",
      eyebrow: "Explore India",
      title: "India Holiday Packages",
      description:
        "From Himalayan escapes to Kerala backwaters, compare curated stays and itineraries across India.",
      image: "/destinations/kerala.jpg",
    },
  },
  {
    id: "packages-international",
    name: "International packages",
    where: "/packages?region=international",
    banner: {
      id: "packages-international",
      eyebrow: "Explore the world",
      title: "International Holiday Packages",
      description:
        "Cross borders with confidence. Compare curated international holidays, transparent inclusions, and trusted operators.",
      image: "/categories/international.jpg",
    },
  },
  {
    id: "packages-deals",
    name: "Deals",
    where: "/packages?deals=1",
    banner: {
      id: "packages-deals",
      eyebrow: "Limited-time offers",
      title: "Holiday Deals Worth Packing For",
      description:
        "Hand-picked escapes with meaningful savings — compare the full itinerary before the offer moves on.",
      image: "/images/deals-mountain-backdrop.webp",
    },
  },
  /* One per weekend-trek track, built from the tracks themselves so a new
     track arrives in the CRM with a banner rather than without one. */
  ...WEEKEND_TRACKS.map((track) => ({
    id: `trek-${track.id}`,
    name: track.bannerTitle,
    where: `/packages?category=${track.id}`,
    banner: {
      id: `trek-${track.id}`,
      eyebrow: "Weekend treks",
      title: track.bannerTitle,
      description: track.tagline,
      image: track.bannerImage,
    },
  })),
];

/** The banner for a slot, falling back to what shipped — so a page always
    has a masthead, even against a document written before the slot existed. */
export function bannerFor(banners: BannersContent, id: string): BannerContent {
  return (
    banners.items.find((item) => item.id === id) ??
    BANNER_SLOTS.find((slot) => slot.id === id)?.banner ?? {
      id,
      eyebrow: "",
      title: "",
      description: "",
      image: "",
    }
  );
}

/* --------------------------- Compare ------------------------------ */

/** The comparison tray itself is driven by what the visitor shortlists, so
    only the band's framing is editable. */
export type CompareContent = {
  enabled: boolean;
  header: SectionHeaderContent;
};

/* ---------------------- Featured packages ------------------------- */

export type FeaturedContent = {
  enabled: boolean;
  header: SectionHeaderContent;
  /** Tab labels, each either a region or a package category. */
  tabs: string[];
  maxCards: number;
};

/* ------------------------ Weekend treks --------------------------- */

export type Trek = {
  id: string;
  name: string;
  region: string;
  image: string;
  /** Nights on the trail; 0 is a day trek. */
  nights: number;
  days: number;
  distanceKm: number;
  peakM: number;
  /** 1 Easy · 2 Moderate · 3 Difficult — meter fill and label both. */
  grade: number;
  price: number;
  originalPrice: number;
  note: string;
  href: string;
};

export type WeekendTreksContent = {
  enabled: boolean;
  header: SectionHeaderContent;
  /** Pill on the photo — "Weekend trek". */
  badgeLabel: string;
  ctaLabel: string;
  items: Trek[];
};

/* ------------------------- Train banner --------------------------- */

export type TrainBadge = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type TrainBannerContent = {
  enabled: boolean;
  eyebrow: string;
  /** "Handpicked Packages." / "Unforgettable" (gold) / "Journeys." */
  titleLine1: string;
  titleHighlight: string;
  titleLine2: string;
  description: string;
  badges: TrainBadge[];
};

/* ----------------------- Domestic showcase ------------------------ */

export type DomesticPanel = {
  id: string;
  image: string;
  label: string;
  description: string;
  alt: string;
};

export type DomesticContent = {
  enabled: boolean;
  header: SectionHeaderContent;
  /** Which panel is open before the visitor touches anything. */
  defaultIndex: number;
  items: DomesticPanel[];
};

/* --------------------- International holidays --------------------- */

export const VISA_TYPES = [
  "Visa free",
  "Visa on arrival",
  "e-Visa",
  "Embassy visa",
] as const;

export type VisaType = (typeof VISA_TYPES)[number];

export type CountryCard = {
  id: string;
  country: string;
  region: string;
  hook: string;
  visa: VisaType;
  visaNote: string;
  bestMonths: string;
  flightHours: string;
  price: number;
  currency: string;
  href: string;
};

export type InternationalContent = {
  enabled: boolean;
  header: SectionHeaderContent;
  items: CountryCard[];
  footnote: string;
};

/* ------------------------ Why travel with us ---------------------- */

export type ProofPoint = {
  id: string;
  value: string;
  label: string;
  description: string;
};

export type WhyUsContent = {
  enabled: boolean;
  eyebrow: string;
  /** Second line takes the gold treatment. */
  titleLine1: string;
  titleLine2: string;
  description: string;
  points: ProofPoint[];
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  imageCaption: string;
};

/* --------------------------- Latest deals ------------------------- */

export type DealsPromo = {
  badge: string;
  /** "Up to " · {computed top discount} · " this month's packages" */
  titlePrefix: string;
  titleSuffix: string;
  bodyPrefix: string;
  code: string;
  bodySuffix: string;
  ctaLabel: string;
  ctaHref: string;
  countdownLabel: string;
  countdownNote: string;
};

export type LatestDealsContent = {
  enabled: boolean;
  header: SectionHeaderContent;
  promo: DealsPromo;
  maxCards: number;
};

/* ------------------------ Traveller reviews ----------------------- */

export type Review = {
  id: string;
  quote: string;
  name: string;
  initials: string;
  /* Optional traveller photo. Empty falls back to the initials disc. */
  avatar: string;
  trip: string;
  travelled: string;
  rating: number;
};

export type ReviewsContent = {
  enabled: boolean;
  header: SectionHeaderContent;
  items: Review[];
};

/* -------------------------- Travel guides ------------------------- */

export type Guide = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  alt: string;
  readMinutes: number;
  href: string;
};

export type GuidesContent = {
  enabled: boolean;
  header: SectionHeaderContent;
  items: Guide[];
};

/* ------------------------------- FAQ ------------------------------ */

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqContent = {
  enabled: boolean;
  header: SectionHeaderContent;
  items: FaqItem[];
  help: {
    icon: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
};

/* --------------------- Trust marks + newsletter ------------------- */

/** The four two-tone marks drawn by hand in TrustAndNewsletter. Anything
    else is looked up in the shared icon library. */
export const TRUST_MARKS = ["price-seal", "headset", "shield-lock", "booking-check"] as const;

export type TrustPoint = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type NewsletterContent = {
  enabled: boolean;
  points: TrustPoint[];
  /** Second line takes the gold treatment. */
  titleLine1: string;
  titleLine2: string;
  description: string;
  placeholder: string;
  ctaLabel: string;
  /** Shown under the field until the visitor submits. */
  note: string;
  successMessage: string;
};

/* ---------------------------- Header ------------------------------ */

/** One entry inside a nav item's dropdown. */
export type NavChildContent = {
  id: string;
  label: string;
  href: string;
};

/** One top-level entry in the site header.

    An item with no children is a plain link and uses `href`. Give it
    children and it becomes a dropdown instead — the header renders the
    label as a button and `href` stops being used, so a parent that is only
    a menu does not need a page of its own to point at. */
export type NavItemContent = {
  id: string;
  label: string;
  href: string;
  children: NavChildContent[];
};

/** The header is the one band that is not part of the homepage scroll, so
    `enabled` here hides the nav links rather than the header itself — the
    logo and the account controls always ship. */
export type HeaderContent = {
  enabled: boolean;
  items: NavItemContent[];
  topBar: HeaderTopBarContent;
};

/** The thin utility strip above the nav: the offer running right now on the
    left, and the two things people look for by reflex on the right — a phone
    number and their own trips.

    Each half hides on its own. An empty `offerText` drops the offer (and its
    code with it), an empty `phoneNumber` drops the call link, and an empty
    `tripsLabel` drops the trips link, so the strip can carry one side, the
    other, or both without leaving a gap where the missing half was.

    `couponCode` is optional next to the offer: an offer that needs no code
    still reads fine on its own. */
export type HeaderTopBarContent = {
  enabled: boolean;
  /** "Flat 12% off every monsoon package" — the offer, in one line. */
  offerText: string;
  /** Shown as a click-to-copy chip. Leave empty for an offer with no code. */
  couponCode: string;
  /** Where the offer text points. Empty leaves it as plain text. */
  offerHref: string;
  /** Printed as typed; the tel: link is built from the digits in it. */
  phoneNumber: string;
  /** The line above/next to the number — "Talk to a travel expert". */
  phoneLabel: string;
  tripsLabel: string;
  tripsHref: string;
};

/* ----------------------------- Auth ------------------------------- */
/* Copy, icons and artwork for the sign-in surfaces — the timed prompt, the
   login page and the signup page.

   Deliberately nothing else. The fields, validation, Firebase calls, error
   messages and the Google button are all code, not content: an editor can
   change what these screens say and show, never what they do. So there is no
   entry here for a field label, a placeholder, a route or a button action. */

/** A small icon + label pair, used for the prompt's reassurance row and the
    login page's trust strip. `icon` is a key into ICON_LIBRARY. */
export type AuthTrustItem = {
  id: string;
  icon: string;
  label: string;
  /** Shown under the label on the login page; the prompt's row ignores it. */
  description: string;
};

/** One of the cards over the signup page's artwork. */
export type AuthFeatureItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

/** The prompt that appears after a visitor has been browsing a while. */
export type AuthPromptContent = {
  enabled: boolean;
  /** Headline, split so the second half keeps the gold treatment. */
  titleLead: string;
  titleHighlight: string;
  /** The sub-line changes with the selected tab. */
  loginSubtitle: string;
  signupSubtitle: string;
  /** The "no thanks" link under the form. */
  dismissLabel: string;
  trust: AuthTrustItem[];
};

/** The side of a full auth page that is not the form. */
export type AuthPageContent = {
  title: string;
  subtitle: string;
  /** Prompt in the top-right, above the form. */
  navPrompt: string;
  navLinkLabel: string;
  /** Artwork column. */
  image: string;
  imageAlt: string;
  headlineLead: string;
  headlineHighlight: string;
  imageSubcopy: string;
};

export type AuthContent = {
  /** Hides the timed prompt. The login and signup pages are routes and always
      reachable, so only the prompt has a switch. */
  enabled: boolean;
  prompt: AuthPromptContent;
  login: AuthPageContent & { trust: AuthTrustItem[] };
  signup: AuthPageContent & {
    features: AuthFeatureItem[];
    /** The row of avatars is on the login page only; signup shows features. */
  };
};

/* ---------------------------- Contact ----------------------------- */
/* Everything the /contact page says, including the business details that
   shipped empty as PENDING — an editor can now fill the email, phone, hours
   and offices in without a deploy, and each block still hides itself when
   left blank.

   The enquiry form is not here: its fields, validation and submission are
   code. Nor are the two destinations (/packages, /faqs) — a link's target is
   wiring, not copy, and only its wording is editable. */

/** One line in the "Reach us directly" list. `kind` decides how the value is
    linked: an email becomes mailto:, a phone tel:, and text is not a link. */
export type ContactChannel = {
  id: string;
  icon: string;
  label: string;
  value: string;
  kind: "email" | "phone" | "text";
};

/** One numbered row of the "What happens next" card. */
export type ContactStep = {
  id: string;
  title: string;
  description: string;
};

export type ContactOffice = {
  id: string;
  city: string;
  /** Small gold line above the address — "Head office". Optional. */
  note: string;
  address: string;
};

export type ContactContent = {
  /** The sidebar card beside the enquiry form. Off, the form runs the full
      width of the page rather than leaving the column empty. */
  enabled: boolean;

  eyebrow: string;
  title: string;
  description: string;

  formTitle: string;
  formDescription: string;

  sidebarTitle: string;
  steps: ContactStep[];

  /** "Reach us directly" — the whole block hides when there is nothing in it. */
  directTitle: string;
  channels: ContactChannel[];
  hours: string;

  browsePrompt: string;
  browseLabel: string;

  offices: {
    /** Marks the sample-office migration so later intentional deletions persist. */
    version: number;
    enabled: boolean;
    title: string;
    items: ContactOffice[];
  };

  /* No FAQ fields here on purpose: the contact page renders the homepage's
     own FAQ section, so it is edited once, in that section, and both places
     follow. */
};

/* ------------------------- The whole page ------------------------- */

export type SiteContent = {
  header: HeaderContent;
  /* Deliberately absent from SECTION_ORDER: banners are edited on their own
     CRM screen, not in the homepage section list. */
  banners: BannersContent;
  auth: AuthContent;
  contact: ContactContent;
  hero: HeroContent;
  categories: CategoriesContent;
  trending: TrendingContent;
  compare: CompareContent;
  featured: FeaturedContent;
  weekendTreks: WeekendTreksContent;
  trainBanner: TrainBannerContent;
  domestic: DomesticContent;
  international: InternationalContent;
  whyUs: WhyUsContent;
  latestDeals: LatestDealsContent;
  reviews: ReviewsContent;
  guides: GuidesContent;
  faq: FaqContent;
  newsletter: NewsletterContent;
};

/** Every editable section, in the order it appears on the page. Drives the
    CRM's section list so a new section shows up there by being added here. */
export const SECTION_ORDER = [
  "header",
  "auth",
  "contact",
  "hero",
  "categories",
  "trending",
  "compare",
  "featured",
  "weekendTreks",
  "trainBanner",
  "domestic",
  "international",
  "whyUs",
  "latestDeals",
  "reviews",
  "guides",
  "faq",
  "newsletter",
] as const satisfies readonly (keyof SiteContent)[];

export type SectionKey = (typeof SECTION_ORDER)[number];

/* --------------------------- Defaults ----------------------------- */
/* What ships. Everything the sections used to hold as hard-coded arrays
   lives here now, so "reset to original" is a real restore rather than a
   guess at what the copy used to say. */

export const DEFAULT_SITE_CONTENT: SiteContent = {
  banners: { items: BANNER_SLOTS.map((slot) => slot.banner) },
  contact: {
    enabled: true,
    eyebrow: "Contact",
    title: "Tell us about the trip.",
    description:
      "Send one enquiry and our travel desk comes back with packages that match your dates, your pace and your budget — no obligation to book.",
    formTitle: "Send an enquiry",
    formDescription: "The more you tell us, the closer the first set of options will be.",
    sidebarTitle: "What happens next",
    steps: [
      {
        id: "contact-step-1",
        title: "Your enquiry reaches the travel desk",
        description: "It lands with the team that handles the destination you asked about.",
      },
      {
        id: "contact-step-2",
        title: "We come back with matching packages",
        description:
          "We shortlist suitable options, with inclusions and final pricing spelled out.",
      },
      {
        id: "contact-step-3",
        title: "You compare, then decide",
        description: "Line the options up side by side and book the one that actually fits.",
      },
    ],
    directTitle: "Reach us directly",
    /* Empty because the registered address, support email and phone are still
       PENDING in requirements/01-Project-Requirements.md. Filling them in in
       the CRM is what makes the block appear — nothing invented ships. */
    channels: [
      { id: "contact-channel-1", icon: "Mail", label: "Email", value: "", kind: "email" },
      { id: "contact-channel-2", icon: "Phone", label: "Phone", value: "", kind: "phone" },
    ],
    hours: "",
    browsePrompt: "Would rather look around first?",
    browseLabel: "Browse packages",
    offices: {
      version: 1,
      enabled: true,
      title: "Where we are",
      items: [
        {
          id: "contact-office-sample",
          city: "Bengaluru",
          note: "Sample address — replace with our office location",
          address: "123 Example Road, Bengaluru, Karnataka 560001, India",
        },
      ],
    },
  },
  auth: {
    enabled: true,
    prompt: {
      enabled: true,
      titleLead: "Travel smarter,",
      titleHighlight: "save more.",
      loginSubtitle:
        "Log in to save packages, compare side by side and pick up where you left off.",
      signupSubtitle: "Create a free account for member-only prices and faster checkout.",
      dismissLabel: "Keep browsing",
      trust: [
        { id: "prompt-trust-1", icon: "ShieldCheck", label: "Secure payments", description: "" },
        { id: "prompt-trust-2", icon: "BadgePercent", label: "Member-only deals", description: "" },
        { id: "prompt-trust-3", icon: "Headset", label: "24/7 support", description: "" },
      ],
    },
    login: {
      title: "Welcome back!",
      subtitle: "Log in to continue comparing and booking the best travel deals.",
      navPrompt: "New here?",
      navLinkLabel: "Sign up",
      image: "/auth/signup.png",
      imageAlt: "Airplane wing above the clouds at sunset",
      headlineLead: "Travel Smarter,",
      headlineHighlight: "Save More.",
      imageSubcopy:
        "Compare flights, hotels and holiday packages from 500+ partners and get the best deals instantly.",
      trust: [
        {
          id: "login-trust-1",
          icon: "ShieldCheck",
          label: "Secure Payments",
          description: "Your data is protected with 256-bit encryption.",
        },
        {
          id: "login-trust-2",
          icon: "BadgeCheck",
          label: "Best Price Guarantee",
          description: "Find the best deals or we make it right.",
        },
        {
          id: "login-trust-3",
          icon: "Headset",
          label: "24/7 Support",
          description: "We're here to help you anytime.",
        },
      ],
    },
    signup: {
      title: "Create your account",
      subtitle: "Sign up and start your smart travel journey today.",
      navPrompt: "Already have an account?",
      navLinkLabel: "Log in",
      image: "/auth/login.png",
      imageAlt: "Overwater bungalows on a tropical lagoon",
      headlineLead: "Your Next Adventure",
      headlineHighlight: "Awaits.",
      imageSubcopy:
        "Create your free account and unlock member-only prices on flights, stays and holiday packages.",
      features: [
        {
          id: "signup-feature-1",
          icon: "BadgePercent",
          title: "Exclusive Deals",
          description: "Access special member only offers.",
        },
        {
          id: "signup-feature-2",
          icon: "Wallet",
          title: "Easy Bookings",
          description: "Book flights, hotels and holidays in minutes.",
        },
        {
          id: "signup-feature-3",
          icon: "UserCheck",
          title: "Personalized Experience",
          description: "Get recommendations tailored just for you.",
        },
      ],
    },
  },
  header: {
    enabled: true,
    topBar: {
      enabled: true,
      offerText: "Flat 12% off on every monsoon package",
      couponCode: "MONSOON12",
      offerHref: "/packages?deals=1",
      phoneNumber: "+91 80 4718 2200",
      phoneLabel: "Talk to a travel expert",
      tripsLabel: "My Trips",
      tripsHref: "/account",
    },
    items: [
      { id: "nav-1", label: "Explore", href: "/destinations", children: [] },
      {
        id: "nav-2",
        label: "Weekend treks",
        href: "/packages?category=weekend-treks",
        children: [
          { id: "nav-2-1", label: "Sunrise Treks", href: "/packages?category=sunrise" },
          { id: "nav-2-2", label: "Monsoon Treks", href: "/packages?category=monsoon" },
          { id: "nav-2-3", label: "Weekend Escape", href: "/packages?category=escapes" },
        ],
      },
      {
        id: "nav-3",
        label: "India",
        href: "/packages?region=india",
        children: [
          { id: "nav-3-1", label: "Kashmir", href: "/packages?region=india&destination=Kashmir" },
          { id: "nav-3-2", label: "Kerala", href: "/packages?region=india&destination=Kerala" },
          { id: "nav-3-3", label: "Rajasthan", href: "/packages?region=india&destination=Rajasthan" },
          { id: "nav-3-4", label: "Goa", href: "/packages?region=india&destination=Goa" },
          { id: "nav-3-5", label: "Andaman", href: "/packages?region=india&destination=Andaman" },
          { id: "nav-3-6", label: "Explore More", href: "/packages?region=india" },
        ],
      },
      {
        id: "nav-4",
        label: "World",
        href: "/packages?region=international",
        children: [
          { id: "nav-4-1", label: "Thailand", href: "/packages?region=international&destination=Thailand" },
          { id: "nav-4-2", label: "Bali", href: "/packages?region=international&destination=Bali" },
          { id: "nav-4-3", label: "Singapore", href: "/packages?region=international&destination=Singapore" },
          { id: "nav-4-4", label: "Vietnam", href: "/packages?region=international&destination=Vietnam" },
          { id: "nav-4-5", label: "Maldives", href: "/packages?region=international&destination=Maldives" },
          { id: "nav-4-6", label: "Explore More", href: "/packages?region=international" },
        ],
      },
      { id: "nav-5", label: "Deals", href: "/packages?deals=1", children: [] },
      { id: "nav-6", label: "Travel Guides", href: "/blog", children: [] },
    ],
  },
  hero: {
    enabled: true,
    copy: [
      {
        id: "hero-1",
        titleLine1: "Smart travel packages.",
        titleLine2: "Better choices.",
        body: "Compare curated travel packages side by side and book the trip that's actually right for you.",
      },
      {
        id: "hero-2",
        titleLine1: "No hidden costs.",
        titleLine2: "No surprises.",
        body: "Full itinerary, inclusions and exclusions — all of it in front of you before you pay, not after.",
      },
      {
        id: "hero-3",
        titleLine1: "Line them up.",
        titleLine2: "Then decide.",
        body: "Put two or three packages next to each other and see exactly what changes between them.",
      },
      {
        id: "hero-4",
        titleLine1: "Book it now.",
        titleLine2: "Pay for it later.",
        body: "Hold your trip with a deposit, pay the balance closer to the date, and keep every booking in one account.",
      },
    ],
    trust: {
      enabled: true,
      faces: [
        "/destinations/goa.jpg",
        "/destinations/kerala.jpg",
        "/destinations/ladakh.jpg",
        "/destinations/rajasthan.jpg",
      ],
      prefix: "Trusted by",
      highlight: "50K+",
      suffix: "travellers",
    },
    topPicks: {
      enabled: true,
      title: "Top picks for you",
      subtitle: "Curated packages you might love",
      mode: "auto",
      packageIds: [],
      limit: 6,
    },
  },

  categories: {
    enabled: true,
    eyebrow: "Browse By Travel Style",
    title: "What kind of trip are you after?",
    description:
      "Pick a style that matches your next getaway and explore curated travel packages.",
    cards: [
      {
        id: "cat-honeymoon",
        label: "Honeymoon",
        tagline: "Romantic escapes",
        icon: "Heart",
        href: "/packages?type=honeymoon",
        image: "/categories/honeymoon.jpg",
        alt: "A balcony with two chairs looking out over a coastal bay at sunset",
      },
      {
        id: "cat-family",
        label: "Family",
        tagline: "Fun for everyone",
        icon: "Users",
        href: "/packages?type=family",
        image: "/package-gallery/periyar-thekkady.jpg",
        alt: "A herd of elephants at the water's edge in Periyar, Thekkady",
      },
      {
        id: "cat-adventure",
        label: "Adventure",
        tagline: "Thrill-filled journeys",
        icon: "Backpack",
        href: "/packages?type=adventure",
        image: "/destinations/spiti.jpg",
        alt: "Pin Valley in Spiti, Himachal Pradesh",
      },
      {
        id: "cat-luxury",
        label: "Luxury",
        tagline: "Travel without compromise",
        icon: "Gem",
        href: "/packages?type=luxury",
        image: "/categories/luxury.jpg",
        alt: "A beachfront resort and its pools seen from the air",
      },
      {
        id: "cat-beach",
        label: "Beach",
        tagline: "Sun, sand & slow days",
        icon: "TreePalm",
        href: "/packages?type=beach",
        image: "/destinations/andaman.jpg",
        alt: "Radhanagar Beach on Havelock Island, Andaman Islands",
      },
      {
        id: "cat-weekend",
        label: "Weekend",
        tagline: "Two days, well spent",
        icon: "CalendarDays",
        href: "/packages?type=weekend",
        image: "/package-gallery/munnar-tea-hills.jpg",
        alt: "Tea plantations covering the hills around Munnar, Kerala",
      },
      {
        id: "cat-cultural",
        label: "Cultural",
        tagline: "Stories, heritage & art",
        icon: "Landmark",
        href: "/packages?type=cultural",
        image: "/destinations/rajasthan.jpg",
        alt: "The east facade of Hawa Mahal in Jaipur, Rajasthan",
      },
      {
        id: "cat-international",
        label: "International",
        tagline: "Passport-stamp trips",
        icon: "Globe",
        href: "/packages?region=international",
        image: "/categories/international.jpg",
        alt: "Villas built into a Mediterranean cliffside above the sea",
      },
      {
        id: "cat-domestic",
        label: "Domestic",
        tagline: "Closer than you think",
        icon: "MapPin",
        href: "/packages?region=india",
        image: "/destinations/meghalaya.jpg",
        alt: "The double-decker living root bridge near Nongriat, Meghalaya",
      },
    ],
  },

  trending: {
    enabled: true,
    header: {
      eyebrow: "Trending This Month",
      title: "Where everyone is going",
      description:
        "Ranked by how much traveller interest each destination has picked up over the last thirty days.",
      actionLabel: "See all destinations",
      actionHref: "/destinations",
    },
    items: [
      {
        id: "trend-goa",
        name: "Goa",
        subtitle: "Beach Getaway",
        image: "/popular-destinations/goa.png",
        price: "7,999",
        packages: 836,
        rise: 38,
        href: "/packages",
      },
      {
        id: "trend-dharamshala",
        name: "Dharamshala",
        subtitle: "Mountain Escape",
        image: "/popular-destinations/dharmashala.png",
        price: "13,999",
        packages: 389,
        rise: 31,
        href: "/packages",
      },
      {
        id: "trend-delhi",
        name: "New Delhi",
        subtitle: "Heritage Capital",
        image: "/popular-destinations/newdelhi.png",
        price: "9,499",
        packages: 968,
        rise: 24,
        href: "/packages",
      },
      {
        id: "trend-kerala",
        name: "Kerala",
        subtitle: "Backwater Country",
        image: "/popular-destinations/kerala.png",
        price: "8,499",
        packages: 621,
        rise: 22,
        href: "/packages",
      },
      {
        id: "trend-mumbai",
        name: "Mumbai",
        subtitle: "City of Dreams",
        image: "/popular-destinations/mumbai.png",
        price: "8,999",
        packages: 754,
        rise: 19,
        href: "/packages",
      },
      {
        id: "trend-kolkata",
        name: "Kolkata",
        subtitle: "Cultural Capital",
        image: "/popular-destinations/kolkota.png",
        price: "7,499",
        packages: 412,
        rise: 16,
        href: "/packages",
      },
    ],
  },

  compare: {
    enabled: true,
    header: {
      eyebrow: "Compare Before You Book",
      title: "Three packages. One honest comparison.",
      description:
        "The whole point of CompareMyTrip: put the shortlist side by side and see exactly what changes between them — before any money moves.",
      actionLabel: "Compare all packages",
      actionHref: "/packages",
    },
  },

  featured: {
    enabled: true,
    header: {
      eyebrow: "Handpicked This Week",
      title: "Featured packages",
      description:
        "Every package here comes from a trusted operator, with the full itinerary, inclusions and exclusions published before you enquire.",
      actionLabel: "Browse all packages",
      actionHref: "/packages",
    },
    tabs: ["India", "International", "Honeymoon", "Family", "Beaches", "Mountains"],
    maxCards: 8,
  },

  weekendTreks: {
    enabled: true,
    header: {
      eyebrow: "Leave Friday, Back Monday",
      title: "Weekend treks",
      description:
        "Short, honest climbs within driving distance of the city — graded on distance and elevation gain, not on marketing copy.",
      actionLabel: "All weekend treks",
      actionHref: "/packages?category=Treks",
    },
    badgeLabel: "Weekend trek",
    ctaLabel: "View trek",
    items: [
      {
        id: "kumara-parvatha-trek",
        name: "Kumara Parvatha",
        region: "Kukke Subramanya, Coorg",
        image: "/weekend-treks/kumara-parvatha.jpg",
        nights: 1,
        days: 2,
        distanceKm: 22,
        peakM: 1712,
        grade: 3,
        price: 3499,
        originalPrice: 4299,
        note: "The long one. Steep from Bhattaru Mane onward.",
        href: "/packages/kumara-parvatha-trek",
      },
      {
        id: "tadiandamol-trek",
        name: "Tadiandamol",
        region: "Kakkabe, Coorg",
        image: "/weekend-treks/tadiandamol.jpg",
        nights: 1,
        days: 2,
        distanceKm: 14,
        peakM: 1748,
        grade: 2,
        price: 2999,
        originalPrice: 3599,
        note: "Karnataka's highest peak, through shola forest.",
        href: "/packages/tadiandamol-trek",
      },
      {
        id: "skandagiri-trek",
        name: "Skandagiri",
        region: "Chikkaballapur",
        image: "/weekend-treks/skandagiri.jpg",
        nights: 0,
        days: 1,
        distanceKm: 8,
        peakM: 1450,
        grade: 1,
        price: 1499,
        originalPrice: 1899,
        note: "Starts at 3am so you top out above the cloud line.",
        href: "/packages/skandagiri-trek",
      },
      {
        id: "kodachadri-trek",
        name: "Kodachadri",
        region: "Shivamogga",
        image: "/weekend-treks/kodachadri.jpg",
        nights: 1,
        days: 2,
        distanceKm: 16,
        peakM: 1343,
        grade: 2,
        price: 3299,
        originalPrice: 3999,
        note: "Rainforest ridge above the Mookambika reserve.",
        href: "/packages/kodachadri-trek",
      },
      {
        id: "savandurga-trek",
        name: "Savandurga",
        region: "Magadi",
        image: "/weekend-treks/savandurga.jpg",
        nights: 0,
        days: 1,
        distanceKm: 5,
        peakM: 1226,
        grade: 2,
        price: 1299,
        originalPrice: 1699,
        note: "One of Asia's largest monoliths — bare rock the whole way.",
        href: "/packages/savandurga-trek",
      },
      {
        id: "nandi-hills-trek",
        name: "Nandi Hills",
        region: "Chikkaballapur",
        image: "/weekend-treks/nandi-hills.jpg",
        nights: 0,
        days: 1,
        distanceKm: 6,
        peakM: 1478,
        grade: 1,
        price: 1199,
        originalPrice: 1499,
        note: "The closest real climb to the city. Good first trek.",
        href: "/packages/nandi-hills-trek",
      },
    ],
  },

  trainBanner: {
    enabled: true,
    eyebrow: "Crafted For Every Explorer",
    titleLine1: "Handpicked Packages.",
    titleHighlight: "Unforgettable",
    titleLine2: "Journeys.",
    description:
      "From scenic escapes to once-in-a-lifetime adventures — we curate journeys you'll cherish forever.",
    badges: [
      {
        id: "train-1",
        icon: "Users",
        title: "Trusted by Thousands",
        description: "Join a growing community of happy travelers.",
      },
      {
        id: "train-2",
        icon: "HeartHandshake",
        title: "500+ Travel Partners",
        description: "Handpicked partners for the best experiences.",
      },
      {
        id: "train-3",
        icon: "ShieldCheck",
        title: "Secure & Easy Booking",
        description: "Book with confidence in just a few clicks.",
      },
      {
        id: "train-4",
        icon: "Tag",
        title: "No Hidden Charges",
        description: "Transparent pricing with no surprises.",
      },
    ],
  },

  domestic: {
    enabled: true,
    header: {
      eyebrow: "Domestic Holidays",
      title: "Seven places worth the trip",
      description:
        "India, without the shortlist fatigue. Open a panel to see what each one is actually like.",
      actionLabel: "All domestic packages",
      actionHref: "/packages?region=india",
    },
    defaultIndex: 3,
    items: [
      {
        id: "dom-ladakh",
        image: "/destinations/ladakh.jpg",
        label: "Ladakh",
        description: "Pangong's blue water at 4,350m, held in by bare Himalayan ridges.",
        alt: "Pangong Tso lake in eastern Ladakh",
      },
      {
        id: "dom-rajasthan",
        image: "/destinations/rajasthan.jpg",
        label: "Rajasthan",
        description: "Pink-city palaces, desert forts and bazaars that never quite go quiet.",
        alt: "The east facade of Hawa Mahal in Jaipur, Rajasthan",
      },
      {
        id: "dom-goa",
        image: "/destinations/goa.jpg",
        label: "Goa",
        description: "Palm-backed sand down south, where the evenings run slow.",
        alt: "Palolem Beach in South Goa",
      },
      {
        id: "dom-meghalaya",
        image: "/destinations/meghalaya.jpg",
        label: "Meghalaya",
        description: "Root bridges the Khasi grow, live, across rain-fed gorges.",
        alt: "The double-decker living root bridge near Nongriat, Meghalaya",
      },
      {
        id: "dom-kerala",
        image: "/destinations/kerala.jpg",
        label: "Kerala",
        description: "Houseboats drifting the backwater channels behind Alappuzha.",
        alt: "A houseboat cruising the Kerala backwaters",
      },
      {
        id: "dom-spiti",
        image: "/destinations/spiti.jpg",
        label: "Spiti Valley",
        description: "A cold desert of whitewashed monasteries and very high passes.",
        alt: "Pin Valley in Spiti, Himachal Pradesh",
      },
      {
        id: "dom-andaman",
        image: "/destinations/andaman.jpg",
        label: "Andaman Islands",
        description: "Radhanagar's shallow turquoise shelf, out on Havelock.",
        alt: "Radhanagar Beach on Havelock Island, Andaman Islands",
      },
    ],
  },

  international: {
    enabled: true,
    header: {
      eyebrow: "International Holidays",
      title: "Passport out, paperwork sorted",
      description:
        "Visa route, best season and flight time up front — the three things that decide an overseas trip, before you get as far as the itinerary.",
      actionLabel: "All international packages",
      actionHref: "/packages?region=international",
    },
    footnote:
      "Visa rules and flight times are indicative for Indian passport holders and change without notice. We confirm the current requirement in writing before any booking.",
    items: [
      {
        id: "intl-thailand",
        country: "Thailand",
        region: "Southeast Asia",
        hook: "Bangkok's street food, then the Andaman islands.",
        visa: "Visa free",
        visaNote: "Up to 60 days for Indian passports",
        bestMonths: "Nov – Mar",
        flightHours: "4h 15m",
        price: 59999,
        currency: "Thai baht (THB)",
        href: "/packages?region=international",
      },
      {
        id: "intl-indonesia",
        country: "Indonesia",
        region: "Southeast Asia",
        hook: "Ubud's rice terraces and the Bukit cliffs.",
        visa: "Visa on arrival",
        visaNote: "30 days, extendable once",
        bestMonths: "Apr – Oct",
        flightHours: "6h 30m",
        price: 62999,
        currency: "Indonesian rupiah (IDR)",
        href: "/packages?region=international",
      },
      {
        id: "intl-vietnam",
        country: "Vietnam",
        region: "Southeast Asia",
        hook: "Hạ Long's limestone bay and Da Nang's coast.",
        visa: "e-Visa",
        visaNote: "Applied online before travel",
        bestMonths: "Feb – Apr",
        flightHours: "5h 20m",
        price: 71999,
        currency: "Vietnamese dong (VND)",
        href: "/packages?region=international",
      },
      {
        id: "intl-srilanka",
        country: "Sri Lanka",
        region: "South Asia",
        hook: "Kandy's hill country by rail, Bentota by sea.",
        visa: "e-Visa",
        visaNote: "Free ETA for Indian passports",
        bestMonths: "Dec – Mar",
        flightHours: "1h 30m",
        price: 57999,
        currency: "Sri Lankan rupee (LKR)",
        href: "/packages?region=international",
      },
      {
        id: "intl-uae",
        country: "United Arab Emirates",
        region: "Middle East",
        hook: "Dubai's skyline and the Liwa desert beyond it.",
        visa: "e-Visa",
        visaNote: "14, 30 or 60-day tourist visa",
        bestMonths: "Nov – Mar",
        flightHours: "3h 30m",
        price: 60999,
        currency: "UAE dirham (AED)",
        href: "/packages?region=international",
      },
      {
        id: "intl-maldives",
        country: "Maldives",
        region: "Indian Ocean",
        hook: "One island, one resort, nothing else to decide.",
        visa: "Visa on arrival",
        visaNote: "30 days, free on landing",
        bestMonths: "Nov – Apr",
        flightHours: "1h 45m",
        price: 92999,
        currency: "US dollar (USD) widely used",
        href: "/packages?region=international",
      },
    ],
  },

  whyUs: {
    enabled: true,
    eyebrow: "Why travel with CompareMyTrip",
    titleLine1: "More confidence in every",
    titleLine2: "trip you choose.",
    description:
      "Strong trips are built on better information, dependable people and support that stays with you after you book.",
    points: [
      {
        id: "why-1",
        value: "500+",
        label: "Curated trips",
        description:
          "Handpicked routes across India and beyond, reviewed for quality and value.",
      },
      {
        id: "why-2",
        value: "24/7",
        label: "Traveller support",
        description: "Real help before departure, during your trip and all the way home.",
      },
      {
        id: "why-3",
        value: "Upfront",
        label: "Transparent pricing",
        description:
          "Clear inclusions, exclusions and final pricing before you make a decision.",
      },
      {
        id: "why-4",
        value: "Verified",
        label: "Local partners",
        description: "Trusted operators with checked credentials and destination expertise.",
      },
    ],
    ctaLabel: "Explore packages",
    ctaHref: "/packages",
    image: "/images/halftone-everest-reveal.webp",
    imageAlt:
      "Mount Everest seen from Kala Patthar, its summit standing above the Khumbu glacier",
    imageCaption: "The right trip should feel exciting before it even begins.",
  },

  latestDeals: {
    enabled: true,
    header: {
      eyebrow: "Latest Deals",
      title: "Live offers, with the clock showing",
      description:
        "Package deals currently running across the catalogue. When the timer ends, so does the price — no rolling countdowns that quietly reset.",
      actionLabel: "All deals",
      actionHref: "/deals",
    },
    promo: {
      badge: "Limited time offer",
      titlePrefix: "Up to",
      titleSuffix: "this month's packages",
      bodyPrefix: "Apply code",
      code: "MONSOON25",
      bodySuffix:
        "at enquiry. Stacks with the operator discount already shown on each package.",
      ctaLabel: "View all offers",
      ctaHref: "/deals",
      countdownLabel: "Offer ends in",
      countdownNote: "Ends at midnight on the last day of the month.",
    },
    maxCards: 4,
  },

  reviews: {
    enabled: true,
    header: {
      eyebrow: "Traveller Reviews",
      title: "What people said afterwards",
      description:
        "Collected after the trip, published as written. We keep the critical ones up — they are the reason the good ones mean anything.",
      /* The rail is the whole section: there is no /reviews page to send
         anyone to, so the header carries the arrows instead of a link. */
      actionLabel: "",
      actionHref: "",
    },
    /* Placeholder faces until real traveller photos are uploaded over them
       in /admin → Homepage → Reviews. Every one of these is replaceable
       from that screen, avatar included. */
    items: [
      {
        id: "rev-1",
        quote:
          "The comparison table did the thing I always end up doing in a spreadsheet. Two packages looked identical until I saw one had airport transfers and the other did not.",
        name: "Ananya R.",
        initials: "AR",
        avatar: "https://i.pravatar.cc/160?img=47",
        trip: "Kerala Backwaters & Hills Escape",
        travelled: "Travelled July 2026",
        rating: 5,
      },
      {
        id: "rev-2",
        quote:
          "Booked Dharamshala for five nights. The itinerary matched what actually happened, which sounds like a low bar until you have had it go the other way.",
        name: "Vikram S.",
        initials: "VS",
        avatar: "https://i.pravatar.cc/160?img=12",
        trip: "Dharamshala Mountain & Monastery Break",
        travelled: "Travelled June 2026",
        rating: 5,
      },
      {
        id: "rev-3",
        quote:
          "One thing I would flag: the Goa resort was further from the main beach than I expected. Support moved us to a closer property the same evening, no argument about it.",
        name: "Meera K.",
        initials: "MK",
        avatar: "https://i.pravatar.cc/160?img=32",
        trip: "Goa Beach Getaway with Island Cruise",
        travelled: "Travelled May 2026",
        rating: 4,
      },
      {
        id: "rev-4",
        quote:
          "Kumara Parvatha is a hard trek and the listing said so before I paid, which I appreciated. The group size was the eleven people they promised, not twenty.",
        name: "Rohit N.",
        initials: "RN",
        avatar: "https://i.pravatar.cc/160?img=59",
        trip: "Kumara Parvatha Weekend Trek",
        travelled: "Travelled April 2026",
        rating: 5,
      },
      {
        id: "rev-5",
        quote:
          "The Volvo left Delhi forty minutes late and nobody told us why. Everything after that was fine — Solang Valley, the hotel, the driver — but the start was scrappy.",
        name: "Sneha P.",
        initials: "SP",
        avatar: "https://i.pravatar.cc/160?img=45",
        trip: "Manali Volvo Tour Package – 4 Nights / 5 Days",
        travelled: "Travelled March 2026",
        rating: 3,
      },
      {
        id: "rev-6",
        quote:
          "Booked Kashmir for my parents, who are in their sixties. I asked about the walking on each day and got a straight answer per day rather than a brochure line.",
        name: "Imran Q.",
        initials: "IQ",
        avatar: "https://i.pravatar.cc/160?img=68",
        trip: "Magnificent Kashmir",
        travelled: "Travelled March 2026",
        rating: 5,
      },
      {
        id: "rev-7",
        quote:
          "Skandagiri at 3am with a group I had never met could have gone badly. The trek lead had done it enough times to keep everyone together, and we made the sunrise.",
        name: "Divya B.",
        initials: "DB",
        avatar: "https://i.pravatar.cc/160?img=26",
        trip: "Skandagiri Sunrise Trek",
        travelled: "Travelled February 2026",
        rating: 5,
      },
      {
        id: "rev-8",
        quote:
          "Jibhi was quieter than the photos suggested, which is a compliment. The Serolsar Lake walk was the day I would go back for. Wifi at the stay is basically decorative.",
        name: "Karan M.",
        initials: "KM",
        avatar: "https://i.pravatar.cc/160?img=14",
        trip: "Jibhi Jalori Pass Tour Package",
        travelled: "Travelled February 2026",
        rating: 4,
      },
      {
        id: "rev-9",
        quote:
          "Priced three operators for the same Kasol dates. This one was not the cheapest, but it was the only one that put the inclusions in writing before payment.",
        name: "Nikita J.",
        initials: "NJ",
        avatar: "https://i.pravatar.cc/160?img=20",
        trip: "Manali Kasol Tour Package from Delhi",
        travelled: "Travelled January 2026",
        rating: 5,
      },
      {
        id: "rev-10",
        quote:
          "A day trek is an easy thing to get wrong by overselling it. Tadiandamol was described accurately, started on time, and I was home by evening as advertised.",
        name: "Arjun V.",
        initials: "AV",
        avatar: "https://i.pravatar.cc/160?img=51",
        trip: "Tadiandamol Weekend Trek",
        travelled: "Travelled January 2026",
        rating: 4,
      },
    ],
  },

  guides: {
    enabled: true,
    header: {
      eyebrow: "Travel Guides",
      title: "Read the place before you book it",
      description:
        "Written by people who went. Practical, specific, and happy to tell you when something is not worth your two days.",
      actionLabel: "All travel guides",
      actionHref: "/blog",
    },
    items: [
      {
        id: "guide-munnar",
        category: "Itinerary",
        title: "Three days in Munnar, and what to skip",
        excerpt:
          "The tea estates, Eravikulam and the drive up from Kochi — plus the two viewpoints that are not worth the detour in monsoon.",
        image: "/package-gallery/munnar-tea-hills.jpg",
        alt: "Tea plantations covering the hills around Munnar, Kerala",
        readMinutes: 7,
        href: "/blog/three-days-in-munnar",
      },
      {
        id: "guide-houseboat",
        category: "How to choose",
        title: "Picking a Kerala houseboat that is actually worth it",
        excerpt:
          "What separates a good Alleppey houseboat from a moored disappointment: cruising hours, the channel it takes, and who cooks.",
        image: "/package-gallery/alleppey-houseboat.jpg",
        alt: "A houseboat moored on the Alleppey backwaters",
        readMinutes: 6,
        href: "/blog/choosing-a-kerala-houseboat",
      },
      {
        id: "guide-spiti",
        category: "Know before you go",
        title: "Spiti by road: what the altitude does to your plans",
        excerpt:
          "Acclimatisation days are not padding. How to sequence Shimla, Kaza and Chandratal so the high passes do not end your trip early.",
        image: "/destinations/spiti.jpg",
        alt: "Pin Valley in Spiti, Himachal Pradesh",
        readMinutes: 9,
        href: "/blog/spiti-by-road-altitude",
      },
    ],
  },

  faq: {
    enabled: true,
    header: {
      eyebrow: "Questions",
      title: "Before you enquire",
      description: "The six things people ask us most often, answered without the hedging.",
      actionLabel: "",
      actionHref: "",
    },
    help: {
      icon: "MessageCircle",
      title: "Still not answered?",
      description:
        "Tell us where you want to go and what you are weighing up. Nothing is charged at the enquiry stage.",
      ctaLabel: "Talk to the team",
      ctaHref: "/contact",
    },
    items: [
      {
        id: "faq-1",
        question: "Do you sell the packages yourself?",
        answer:
          "CompareMyTrip is a comparison platform. Every package is delivered by a tour operator that we check before it is listed. We put the packages side by side, publish the full inclusions and exclusions, and confirm who will be operating your trip once you book.",
      },
      {
        id: "faq-2",
        question: "Is the price on the card the price I pay?",
        answer:
          "The price shown is per person on twin sharing, and it is the price the operator has quoted us. Taxes are included. Anything not covered — flights on domestic packages, visa fees, personal expenses — is listed under exclusions on the package detail page before you enquire, never after.",
      },
      {
        id: "faq-3",
        question: "How do I compare two packages properly?",
        answer:
          "Open any two packages and use Compare. You get one table with duration, price per person, accommodation, meals, transfers, flights, cancellation terms and rating lined up row by row, so the differences are the only thing you have to read.",
      },
      {
        id: "faq-4",
        question: "What happens after I send an enquiry?",
        answer:
          "The enquiry goes to our team and to the operator running that package. You get a written confirmation of the itinerary, the final price and the cancellation terms before any payment is requested. Nothing is charged at the enquiry stage.",
      },
      {
        id: "faq-5",
        question: "Can I change or cancel after booking?",
        answer:
          "That depends on the package, which is why the cancellation policy is printed on every detail page rather than buried in terms. Most packages marked Free cancellation can be cancelled up to 15 days before departure at no cost. Anything with a stricter policy says so on the card itself.",
      },
      {
        id: "faq-6",
        question: "Are the reviews real?",
        answer:
          "They are collected from travellers after they return, and published as written. We do not remove critical reviews — you will find three and four-star reviews on the site, including on packages we recommend.",
      },
    ],
  },

  newsletter: {
    enabled: true,
    points: [
      {
        id: "trust-1",
        icon: "price-seal",
        title: "Best Price Guarantee",
        description: "Find it cheaper elsewhere and we'll match the price.",
      },
      {
        id: "trust-2",
        icon: "headset",
        title: "24/7 Support",
        description: "Real people on hand, whatever the time zone.",
      },
      {
        id: "trust-3",
        icon: "shield-lock",
        title: "Secure Payments",
        description: "Every transaction encrypted end to end.",
      },
      {
        id: "trust-4",
        icon: "booking-check",
        title: "Easy Booking",
        description: "Confirm in a few taps and manage it from one account.",
      },
    ],
    titleLine1: "Your next trip",
    titleLine2: "starts here.",
    description: "Get handpicked destinations and exclusive travel deals.",
    placeholder: "Enter your email address",
    ctaLabel: "Subscribe",
    note: "No spam, just good trips. Unsubscribe anytime.",
    successMessage: "You're on the list. Look out for your first edit soon.",
  },
};

/* --------------------------- Storage ------------------------------ */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const bool = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

/** A whole number held inside a range the UI can actually render. */
const int = (value: unknown, fallback: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(num(value, fallback))));

const strings = (value: unknown, fallback: string[]) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : fallback;

/* A list falls back whole rather than per-item: a section with zero cards is
   a broken layout, not an editorial choice — that is what `enabled` is for. */
function list<T>(
  raw: unknown,
  fallback: T[],
  map: (item: Record<string, unknown>, index: number) => T,
): T[] {
  if (!Array.isArray(raw)) return fallback;
  const items = raw.filter(isRecord).map(map);
  return items.length > 0 ? items : fallback;
}

/* Weekend-trek menu links used to carry the same thing twice —
   ?category=Weekend%20Treks&trek=monsoon — and the catalogue now reads the
   track straight off ?category=monsoon. A menu published against the old
   shape is rewritten as it loads, so the links shorten themselves and the
   CRM shows the form that gets produced today. Old links still work in the
   address bar either way (see trackFromParams); this is about not carrying
   the long one around forever. */
function simplifyTrekHref(href: string): string {
  const query = /^\/packages\?(.+)$/.exec(href.trim())?.[1];
  if (!query) return href;

  const params = new URLSearchParams(query);
  if (params.get("category")?.trim().toLowerCase() !== "weekend treks") return href;

  const trek = params.get("trek")?.trim().toLowerCase();
  params.delete("trek");
  params.set("category", trek || "weekend-treks");
  return `/packages?${params.toString()}`;
}

function header(raw: unknown, fallback: SectionHeaderContent): SectionHeaderContent {
  const value = isRecord(raw) ? raw : {};
  return {
    eyebrow: str(value.eyebrow, fallback.eyebrow),
    title: str(value.title, fallback.title),
    description: str(value.description, fallback.description),
    actionLabel: str(value.actionLabel, fallback.actionLabel),
    actionHref: str(value.actionHref, fallback.actionHref),
  };
}

/** One section's stored blob, or an empty one so every field below falls
    through to its default. */
const section = (raw: unknown): Record<string, unknown> => (isRecord(raw) ? raw : {});

/* Stored content is only ever as new as the last time this browser saved it,
   so every field is read defensively against the current defaults. A partial
   or stale blob loses nothing but the fields it never had. */
export function normalizeSiteContent(raw: unknown): SiteContent {
  const base = DEFAULT_SITE_CONTENT;
  const root = isRecord(raw) ? raw : {};

  /* --- banners --- */
  const bannersRaw = (() => {
    const raw = section(root.banners).items;
    return Array.isArray(raw) ? raw.filter(isRecord) : [];
  })();

  /* --- header --- */
  const headerRaw = section(root.header);
  const topBarRaw = section(headerRaw.topBar);

  /* --- contact --- */
  const contactRaw = section(root.contact);
  const officesRaw = section(contactRaw.offices);

  /* --- auth --- */
  const authRaw = section(root.auth);
  const promptRaw = section(authRaw.prompt);
  const loginRaw = section(authRaw.login);
  const signupRaw = section(authRaw.signup);

  /* --- hero --- */
  const heroRaw = section(root.hero);
  const trustRaw = isRecord(heroRaw.trust) ? heroRaw.trust : {};
  const picksRaw = isRecord(heroRaw.topPicks) ? heroRaw.topPicks : {};

  /* --- categories --- */
  const categoriesRaw = section(root.categories);

  /* --- the rest --- */
  const trendingRaw = section(root.trending);
  const compareRaw = section(root.compare);
  const featuredRaw = section(root.featured);
  const treksRaw = section(root.weekendTreks);
  const trainRaw = section(root.trainBanner);
  const domesticRaw = section(root.domestic);
  const intlRaw = section(root.international);
  const whyRaw = section(root.whyUs);
  const dealsRaw = section(root.latestDeals);
  const promoRaw = isRecord(dealsRaw.promo) ? dealsRaw.promo : {};
  const reviewsRaw = section(root.reviews);
  const guidesRaw = section(root.guides);
  const faqRaw = section(root.faq);
  const faqHelpRaw = isRecord(faqRaw.help) ? faqRaw.help : {};
  const newsRaw = section(root.newsletter);

  const domesticItems = list(domesticRaw.items, base.domestic.items, (item, index) => ({
    id: str(item.id, `dom-${index + 1}`),
    image: str(item.image, ""),
    label: str(item.label, "Untitled"),
    description: str(item.description, ""),
    alt: str(item.alt, ""),
  }));

  const normalizedHeaderItems = list(headerRaw.items, base.header.items, (item, index) => ({
    id: str(item.id, `nav-${index + 1}`),
    label: str(item.label, "Untitled"),
    href: simplifyTrekHref(str(item.href, "")),
    /* Not `list()`: an empty children array is the meaningful, common
       case — a plain link — and must not fall back to the default
       item's dropdown. */
    children: Array.isArray(item.children)
      ? item.children.filter(isRecord).map((child, childIndex) => ({
          id: str(child.id, `nav-${index + 1}-${childIndex + 1}`),
          label: str(child.label, "Untitled"),
          href: simplifyTrekHref(str(child.href, "")),
        }))
      : [],
  }));

  /* Upgrade only the three original shipped nav entries. This lets an older
     Firestore homepage document pick up the new menus without overwriting
     genuinely custom links created in the admin editor. */
  const legacyHeaderLabels: Record<string, string> = {
    "nav-2": "Weekend Treks",
    "nav-3": "Domestic Tours",
    "nav-4": "International Holidays",
  };
  const headerItems = normalizedHeaderItems.map((item) => {
    if (legacyHeaderLabels[item.id] !== item.label) return item;
    return base.header.items.find((defaultItem) => defaultItem.id === item.id) ?? item;
  });

  /* Trust rows and feature cards are shaped alike enough to share a reader,
     but not so alike that they share a type — description is meaningful on
     the login strip and unused by the prompt's one-line row. */
  const trustList = (raw: unknown, fallback: AuthTrustItem[], prefix: string) =>
    list(raw, fallback, (item, index) => ({
      id: str(item.id, `${prefix}-${index + 1}`),
      icon: str(item.icon, "ShieldCheck"),
      label: str(item.label, ""),
      description: str(item.description, ""),
    }));

  const authPage = <Extra,>(raw: Record<string, unknown>, base: AuthPageContent & Extra) => ({
    title: str(raw.title, base.title),
    subtitle: str(raw.subtitle, base.subtitle),
    navPrompt: str(raw.navPrompt, base.navPrompt),
    navLinkLabel: str(raw.navLinkLabel, base.navLinkLabel),
    image: str(raw.image, base.image),
    imageAlt: str(raw.imageAlt, base.imageAlt),
    headlineLead: str(raw.headlineLead, base.headlineLead),
    headlineHighlight: str(raw.headlineHighlight, base.headlineHighlight),
    imageSubcopy: str(raw.imageSubcopy, base.imageSubcopy),
  });

  const contactSteps = list(contactRaw.steps, base.contact.steps, (item, index) => ({
    id: str(item.id, `contact-step-${index + 1}`),
    title: str(item.title, ""),
    description: str(item.description, ""),
  })).map((step) => {
    const isOriginalOperatorCopy =
      step.id === "contact-step-2" &&
      step.description ===
        "Options from GST-verified operators, with inclusions and final pricing spelled out.";

    return isOriginalOperatorCopy
      ? (base.contact.steps.find((defaultStep) => defaultStep.id === step.id) ?? step)
      : step;
  });

  return {
    contact: {
      enabled: bool(contactRaw.enabled, base.contact.enabled),
      eyebrow: str(contactRaw.eyebrow, base.contact.eyebrow),
      title: str(contactRaw.title, base.contact.title),
      description: str(contactRaw.description, base.contact.description),
      formTitle: str(contactRaw.formTitle, base.contact.formTitle),
      formDescription: str(contactRaw.formDescription, base.contact.formDescription),
      sidebarTitle: str(contactRaw.sidebarTitle, base.contact.sidebarTitle),
      steps: contactSteps,
      directTitle: str(contactRaw.directTitle, base.contact.directTitle),
      /* Not `list()`: an editor who clears every channel means it, and must
         not be handed the defaults back. Same for offices below. */
      channels: Array.isArray(contactRaw.channels)
        ? contactRaw.channels.filter(isRecord).map((item, index) => ({
            id: str(item.id, `contact-channel-${index + 1}`),
            icon: str(item.icon, "Mail"),
            label: str(item.label, ""),
            value: str(item.value, ""),
            kind:
              item.kind === "phone" ? "phone" : item.kind === "text" ? "text" : "email",
          }))
        : base.contact.channels,
      hours: str(contactRaw.hours, base.contact.hours),
      browsePrompt: str(contactRaw.browsePrompt, base.contact.browsePrompt),
      browseLabel: str(contactRaw.browseLabel, base.contact.browseLabel),
      offices: {
        version: 1,
        enabled: bool(officesRaw.enabled, base.contact.offices.enabled),
        title: str(officesRaw.title, base.contact.offices.title),
        // Seed previously empty office sections once; an editor can then
        // change or remove the sample without it being restored on save.
        items: Array.isArray(officesRaw.items) &&
          (officesRaw.items.length > 0 || officesRaw.version === 1)
          ? officesRaw.items.filter(isRecord).map((item, index) => ({
              id: str(item.id, `contact-office-${index + 1}`),
              city: str(item.city, ""),
              note: str(item.note, ""),
              address: str(item.address, ""),
            }))
          : base.contact.offices.items,
      },
    },
    auth: {
      enabled: bool(authRaw.enabled, base.auth.enabled),
      prompt: {
        enabled: bool(promptRaw.enabled, base.auth.prompt.enabled),
        titleLead: str(promptRaw.titleLead, base.auth.prompt.titleLead),
        titleHighlight: str(promptRaw.titleHighlight, base.auth.prompt.titleHighlight),
        loginSubtitle: str(promptRaw.loginSubtitle, base.auth.prompt.loginSubtitle),
        signupSubtitle: str(promptRaw.signupSubtitle, base.auth.prompt.signupSubtitle),
        dismissLabel: str(promptRaw.dismissLabel, base.auth.prompt.dismissLabel),
        trust: trustList(promptRaw.trust, base.auth.prompt.trust, "prompt-trust"),
      },
      login: {
        ...authPage(loginRaw, base.auth.login),
        trust: trustList(loginRaw.trust, base.auth.login.trust, "login-trust"),
      },
      signup: {
        ...authPage(signupRaw, base.auth.signup),
        features: list(signupRaw.features, base.auth.signup.features, (item, index) => ({
          id: str(item.id, `signup-feature-${index + 1}`),
          icon: str(item.icon, "Sparkles"),
          title: str(item.title, ""),
          description: str(item.description, ""),
        })),
      },
    },
    /* Stored banners are merged onto the code's slot list rather than read
       as a list of their own: a slot added in code appears with its shipped
       copy, and a stored banner for a slot that no longer exists drops out,
       so the CRM can never show a banner that renders nowhere. */
    banners: {
      items: BANNER_SLOTS.map((slot) => {
        const stored = bannersRaw.find(
          (item) => str(item.id, "") === slot.id,
        );
        return {
          id: slot.id,
          eyebrow: str(stored?.eyebrow, slot.banner.eyebrow),
          title: str(stored?.title, slot.banner.title),
          description: str(stored?.description, slot.banner.description),
          image: str(stored?.image, slot.banner.image),
        };
      }),
    },
    header: {
      enabled: bool(headerRaw.enabled, base.header.enabled),
      items: headerItems,
      topBar: {
        enabled: bool(topBarRaw.enabled, base.header.topBar.enabled),
        offerText: str(topBarRaw.offerText, base.header.topBar.offerText),
        couponCode: str(topBarRaw.couponCode, base.header.topBar.couponCode),
        offerHref: str(topBarRaw.offerHref, base.header.topBar.offerHref),
        phoneNumber: str(topBarRaw.phoneNumber, base.header.topBar.phoneNumber),
        phoneLabel: str(topBarRaw.phoneLabel, base.header.topBar.phoneLabel),
        tripsLabel: str(topBarRaw.tripsLabel, base.header.topBar.tripsLabel),
        tripsHref: str(topBarRaw.tripsHref, base.header.topBar.tripsHref),
      },
    },
    hero: {
      enabled: bool(heroRaw.enabled, base.hero.enabled),
      copy: list(heroRaw.copy, base.hero.copy, (block, index) => ({
        id: str(block.id, `hero-${index + 1}`),
        titleLine1: str(block.titleLine1, ""),
        titleLine2: str(block.titleLine2, ""),
        body: str(block.body, ""),
      })),
      trust: {
        enabled: bool(trustRaw.enabled, base.hero.trust.enabled),
        faces: strings(trustRaw.faces, base.hero.trust.faces),
        prefix: str(trustRaw.prefix, base.hero.trust.prefix),
        highlight: str(trustRaw.highlight, base.hero.trust.highlight),
        suffix: str(trustRaw.suffix, base.hero.trust.suffix),
      },
      topPicks: {
        enabled: bool(picksRaw.enabled, base.hero.topPicks.enabled),
        title: str(picksRaw.title, base.hero.topPicks.title),
        subtitle: str(picksRaw.subtitle, base.hero.topPicks.subtitle),
        mode: picksRaw.mode === "manual" ? "manual" : "auto",
        packageIds: strings(picksRaw.packageIds, base.hero.topPicks.packageIds),
        limit: int(picksRaw.limit, base.hero.topPicks.limit, 1, 12),
      },
    },

    categories: {
      enabled: bool(categoriesRaw.enabled, base.categories.enabled),
      eyebrow: str(categoriesRaw.eyebrow, base.categories.eyebrow),
      title: str(categoriesRaw.title, base.categories.title),
      description: str(categoriesRaw.description, base.categories.description),
      cards: list(categoriesRaw.cards, base.categories.cards, (card, index) => ({
        id: str(card.id, `cat-${index + 1}`),
        label: str(card.label, "Untitled"),
        tagline: str(card.tagline, ""),
        icon: str(card.icon, "MapPin"),
        href: str(card.href, "/packages"),
        image: str(card.image, ""),
        alt: str(card.alt, ""),
      })),
    },

    trending: {
      enabled: bool(trendingRaw.enabled, base.trending.enabled),
      header: header(trendingRaw.header, base.trending.header),
      items: list(trendingRaw.items, base.trending.items, (item, index) => ({
        id: str(item.id, `trend-${index + 1}`),
        name: str(item.name, "Untitled"),
        subtitle: str(item.subtitle, ""),
        image: str(item.image, ""),
        price: str(item.price, "0"),
        packages: int(item.packages, 0, 0, 999999),
        rise: int(item.rise, 0, 0, 999),
        href: str(item.href, "/packages"),
      })),
    },

    compare: {
      enabled: bool(compareRaw.enabled, base.compare.enabled),
      header: header(compareRaw.header, base.compare.header),
    },

    featured: {
      enabled: bool(featuredRaw.enabled, base.featured.enabled),
      header: header(featuredRaw.header, base.featured.header),
      tabs: (() => {
        const tabs = strings(featuredRaw.tabs, base.featured.tabs);
        return tabs.length > 0 ? tabs : base.featured.tabs;
      })(),
      maxCards: int(featuredRaw.maxCards, base.featured.maxCards, 1, 24),
    },

    weekendTreks: {
      enabled: bool(treksRaw.enabled, base.weekendTreks.enabled),
      header: header(treksRaw.header, base.weekendTreks.header),
      badgeLabel: str(treksRaw.badgeLabel, base.weekendTreks.badgeLabel),
      ctaLabel: str(treksRaw.ctaLabel, base.weekendTreks.ctaLabel),
      items: list(treksRaw.items, base.weekendTreks.items, (item, index) => ({
        id: str(item.id, `trek-${index + 1}`),
        name: str(item.name, "Untitled"),
        region: str(item.region, ""),
        image: str(item.image, ""),
        nights: int(item.nights, 0, 0, 30),
        days: int(item.days, 1, 1, 30),
        distanceKm: int(item.distanceKm, 0, 0, 999),
        peakM: int(item.peakM, 0, 0, 9000),
        grade: int(item.grade, 1, 1, 3),
        price: int(item.price, 0, 0, 10_000_000),
        originalPrice: int(item.originalPrice, 0, 0, 10_000_000),
        note: str(item.note, ""),
        href: str(item.href, "/packages"),
      })),
    },

    trainBanner: {
      enabled: bool(trainRaw.enabled, base.trainBanner.enabled),
      eyebrow: str(trainRaw.eyebrow, base.trainBanner.eyebrow),
      titleLine1: str(trainRaw.titleLine1, base.trainBanner.titleLine1),
      titleHighlight: str(trainRaw.titleHighlight, base.trainBanner.titleHighlight),
      titleLine2: str(trainRaw.titleLine2, base.trainBanner.titleLine2),
      description: str(trainRaw.description, base.trainBanner.description),
      badges: list(trainRaw.badges, base.trainBanner.badges, (badge, index) => ({
        id: str(badge.id, `train-${index + 1}`),
        icon: str(badge.icon, "Sparkles"),
        title: str(badge.title, "Untitled"),
        description: str(badge.description, ""),
      })),
    },

    domestic: {
      enabled: bool(domesticRaw.enabled, base.domestic.enabled),
      header: header(domesticRaw.header, base.domestic.header),
      /* Clamped against the list it points into, so deleting panels can never
         leave the gallery opening on a panel that is no longer there. */
      defaultIndex: int(domesticRaw.defaultIndex, 0, 0, domesticItems.length - 1),
      items: domesticItems,
    },

    international: {
      enabled: bool(intlRaw.enabled, base.international.enabled),
      header: header(intlRaw.header, base.international.header),
      footnote: str(intlRaw.footnote, base.international.footnote),
      items: list(intlRaw.items, base.international.items, (item, index) => ({
        id: str(item.id, `intl-${index + 1}`),
        country: str(item.country, "Untitled"),
        region: str(item.region, ""),
        hook: str(item.hook, ""),
        visa: (VISA_TYPES as readonly string[]).includes(str(item.visa, ""))
          ? (item.visa as VisaType)
          : "e-Visa",
        visaNote: str(item.visaNote, ""),
        bestMonths: str(item.bestMonths, ""),
        flightHours: str(item.flightHours, ""),
        price: int(item.price, 0, 0, 10_000_000),
        currency: str(item.currency, ""),
        href: str(item.href, "/packages?region=international"),
      })),
    },

    whyUs: {
      enabled: bool(whyRaw.enabled, base.whyUs.enabled),
      eyebrow: str(whyRaw.eyebrow, base.whyUs.eyebrow),
      titleLine1: str(whyRaw.titleLine1, base.whyUs.titleLine1),
      titleLine2: str(whyRaw.titleLine2, base.whyUs.titleLine2),
      description: str(whyRaw.description, base.whyUs.description),
      points: list(whyRaw.points, base.whyUs.points, (point, index) => ({
        id: str(point.id, `why-${index + 1}`),
        value: str(point.value, ""),
        label: str(point.label, "Untitled"),
        description: str(point.description, ""),
      })),
      ctaLabel: str(whyRaw.ctaLabel, base.whyUs.ctaLabel),
      ctaHref: str(whyRaw.ctaHref, base.whyUs.ctaHref),
      image: str(whyRaw.image, base.whyUs.image),
      imageAlt: str(whyRaw.imageAlt, base.whyUs.imageAlt),
      imageCaption: str(whyRaw.imageCaption, base.whyUs.imageCaption),
    },

    latestDeals: {
      enabled: bool(dealsRaw.enabled, base.latestDeals.enabled),
      header: header(dealsRaw.header, base.latestDeals.header),
      maxCards: int(dealsRaw.maxCards, base.latestDeals.maxCards, 1, 12),
      promo: {
        badge: str(promoRaw.badge, base.latestDeals.promo.badge),
        titlePrefix: str(promoRaw.titlePrefix, base.latestDeals.promo.titlePrefix),
        titleSuffix: str(promoRaw.titleSuffix, base.latestDeals.promo.titleSuffix),
        bodyPrefix: str(promoRaw.bodyPrefix, base.latestDeals.promo.bodyPrefix),
        code: str(promoRaw.code, base.latestDeals.promo.code),
        bodySuffix: str(promoRaw.bodySuffix, base.latestDeals.promo.bodySuffix),
        ctaLabel: str(promoRaw.ctaLabel, base.latestDeals.promo.ctaLabel),
        ctaHref: str(promoRaw.ctaHref, base.latestDeals.promo.ctaHref),
        countdownLabel: str(promoRaw.countdownLabel, base.latestDeals.promo.countdownLabel),
        countdownNote: str(promoRaw.countdownNote, base.latestDeals.promo.countdownNote),
      },
    },

    reviews: {
      enabled: bool(reviewsRaw.enabled, base.reviews.enabled),
      header: header(reviewsRaw.header, base.reviews.header),
      items: list(reviewsRaw.items, base.reviews.items, (item, index) => ({
        id: str(item.id, `rev-${index + 1}`),
        quote: str(item.quote, ""),
        name: str(item.name, "Anonymous"),
        initials: str(item.initials, "").slice(0, 3),
        avatar: str(item.avatar, ""),
        trip: str(item.trip, ""),
        travelled: str(item.travelled, ""),
        rating: int(item.rating, 5, 1, 5),
      })),
    },

    guides: {
      enabled: bool(guidesRaw.enabled, base.guides.enabled),
      header: header(guidesRaw.header, base.guides.header),
      items: list(guidesRaw.items, base.guides.items, (item, index) => ({
        id: str(item.id, `guide-${index + 1}`),
        category: str(item.category, ""),
        title: str(item.title, "Untitled"),
        excerpt: str(item.excerpt, ""),
        image: str(item.image, ""),
        alt: str(item.alt, ""),
        readMinutes: int(item.readMinutes, 5, 1, 120),
        href: str(item.href, "/blog"),
      })),
    },

    faq: {
      enabled: bool(faqRaw.enabled, base.faq.enabled),
      header: header(faqRaw.header, base.faq.header),
      items: list(faqRaw.items, base.faq.items, (item, index) => ({
        id: str(item.id, `faq-${index + 1}`),
        question: str(item.question, "Untitled"),
        answer: str(item.answer, ""),
      })),
      help: {
        icon: str(faqHelpRaw.icon, base.faq.help.icon),
        title: str(faqHelpRaw.title, base.faq.help.title),
        description: str(faqHelpRaw.description, base.faq.help.description),
        ctaLabel: str(faqHelpRaw.ctaLabel, base.faq.help.ctaLabel),
        ctaHref: str(faqHelpRaw.ctaHref, base.faq.help.ctaHref),
      },
    },

    newsletter: {
      enabled: bool(newsRaw.enabled, base.newsletter.enabled),
      points: list(newsRaw.points, base.newsletter.points, (point, index) => ({
        id: str(point.id, `trust-${index + 1}`),
        icon: str(point.icon, "ShieldCheck"),
        title: str(point.title, "Untitled"),
        description: str(point.description, ""),
      })),
      titleLine1: str(newsRaw.titleLine1, base.newsletter.titleLine1),
      titleLine2: str(newsRaw.titleLine2, base.newsletter.titleLine2),
      description: str(newsRaw.description, base.newsletter.description),
      placeholder: str(newsRaw.placeholder, base.newsletter.placeholder),
      ctaLabel: str(newsRaw.ctaLabel, base.newsletter.ctaLabel),
      note: str(newsRaw.note, base.newsletter.note),
      successMessage: str(newsRaw.successMessage, base.newsletter.successMessage),
    },
  };
}

/** Ids only need to be unique inside their own list, so one is derived from
    the list itself — keeping "add an item" a pure function of what is already
    there rather than a reading of the clock. */
export function nextId(prefix: string, existing: { id: string }[]): string {
  const taken = new Set(existing.map((item) => item.id));
  let counter = existing.length + 1;
  while (taken.has(`${prefix}-${counter}`)) counter += 1;
  return `${prefix}-${counter}`;
}

/** Stock photography already in /public, offered as one-click choices in the
    CRM's image fields alongside upload and paste-a-URL. */
export const STOCK_IMAGES: string[] = [
  "/destinations/andaman.jpg",
  "/destinations/goa.jpg",
  "/destinations/kerala.jpg",
  "/destinations/ladakh.jpg",
  "/destinations/meghalaya.jpg",
  "/destinations/rajasthan.jpg",
  "/destinations/spiti.jpg",
  "/categories/honeymoon.jpg",
  "/categories/international.jpg",
  "/categories/luxury.jpg",
  "/package-gallery/alleppey-houseboat.jpg",
  "/package-gallery/fort-kochi-fishing-nets.jpg",
  "/package-gallery/kerala-houseboat.jpg",
  "/package-gallery/munnar-tea-hills.jpg",
  "/package-gallery/munnar-tea-plantation.jpg",
  "/package-gallery/periyar-thekkady.jpg",
  "/popular-destinations/goa.png",
  "/popular-destinations/dharmashala.png",
  "/popular-destinations/kerala.png",
  "/popular-destinations/kolkota.png",
  "/popular-destinations/mumbai.png",
  "/popular-destinations/newdelhi.png",
  "/weekend-treks/kodachadri.jpg",
  "/weekend-treks/kumara-parvatha.jpg",
  "/weekend-treks/nandi-hills.jpg",
  "/weekend-treks/savandurga.jpg",
  "/weekend-treks/skandagiri.jpg",
  "/weekend-treks/tadiandamol.jpg",
  "/images/deals-mountain-backdrop.webp",
  "/images/halftone-everest-reveal.webp",
];
