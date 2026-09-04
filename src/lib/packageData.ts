export type PackageCategory =
  | "Honeymoon"
  | "Family"
  | "Adventure"
  | "Treks"
  | "Weekend Treks"
  | "Beaches"
  | "Mountains"
  | "Heritage"
  | "Wildlife"
  | "Luxury"
  | "Spiritual";

export type PackageItineraryDay = {
  day: number;
  title: string;
  route: string;
  description: string;
  meals: string;
};

export type PackageStay = {
  name: string;
  nights: number;
  place: string;
  comfort: string;
};

export type PackageDetails = {
  gallery: string[];
  summary: string;
  places: string[];
  highlights: string[];
  itinerary: PackageItineraryDay[];
  stays: PackageStay[];
  inclusions: string[];
  exclusions: string[];
  meals: string;
  transfers: string;
  flights: string;
  cancellationPolicy: string;
};

export type TravelPackage = {
  id: string;
  href?: string;
  title: string;
  location: string;
  /** Headline destination the package is filed under ("Kerala", "Bali").
      Drives the destination filter, so it is the grouped name rather than the
      full stop-by-stop route in `location`. */
  destination: string;
  image: string;
  nights: number;
  days: number;
  pax: string;
  hotelStars: number;
  tags: PackageCategory[];
  region: "India" | "International";
  operator: string;
  rating: number;
  reviews: number;
  discount: number;
  originalPrice: number;
  price: number;
  /** Editorially picked "best deal". Not derived from the discount — a package
      can be keenly priced without being on sale — so it is set per package and
      drives the deals toggle on the catalogue and the badge on the price card. */
  deal?: boolean;
  /** Draft packages stay inside the CRM: they are kept out of the public
      catalogue, out of the sitemap and out of every server-rendered page.
      Documents written before this field existed carry no status and are
      treated as published, so adding it never retires a live package. */
  status?: "draft" | "published";
  details?: PackageDetails;
};

export const PACKAGE_CATEGORIES: PackageCategory[] = [
  "Honeymoon",
  "Family",
  "Adventure",
  "Treks",
  "Weekend Treks",
  "Beaches",
  "Mountains",
  "Heritage",
  "Wildlife",
  "Luxury",
  "Spiritual",
];

export const DUMMY_PACKAGES: TravelPackage[] = [
  {
    id: "kumara-parvatha-trek",
    title: "Kumara Parvatha Weekend Trek",
    location: "Kukke Subramanya · Coorg",
    destination: "Karnataka",
    image: "/weekend-treks/kumara-parvatha.jpg",
    nights: 1,
    days: 2,
    pax: "6–14 pax",
    hotelStars: 3,
    tags: ["Weekend Treks", "Treks", "Adventure", "Mountains"],
    region: "India",
    operator: "Bengaluru Trail Collective",
    rating: 4.8,
    reviews: 86,
    discount: 19,
    originalPrice: 4299,
    price: 3499,
  },
  {
    id: "tadiandamol-trek",
    title: "Tadiandamol Weekend Trek",
    location: "Kakkabe · Coorg",
    destination: "Karnataka",
    image: "/weekend-treks/tadiandamol.jpg",
    nights: 1,
    days: 2,
    pax: "6–14 pax",
    hotelStars: 3,
    tags: ["Weekend Treks", "Treks", "Adventure", "Mountains"],
    region: "India",
    operator: "Bengaluru Trail Collective",
    rating: 4.7,
    reviews: 73,
    discount: 17,
    originalPrice: 3599,
    price: 2999,
  },
  {
    id: "skandagiri-trek",
    title: "Skandagiri Sunrise Trek",
    location: "Chikkaballapur",
    destination: "Karnataka",
    image: "/weekend-treks/skandagiri.jpg",
    nights: 0,
    days: 1,
    pax: "6–16 pax",
    hotelStars: 3,
    tags: ["Weekend Treks", "Treks", "Adventure", "Mountains"],
    region: "India",
    operator: "Bengaluru Trail Collective",
    rating: 4.6,
    reviews: 118,
    discount: 21,
    originalPrice: 1899,
    price: 1499,
    deal: true,
  },
  {
    id: "kodachadri-trek",
    title: "Kodachadri Weekend Trek",
    location: "Shivamogga",
    destination: "Karnataka",
    image: "/weekend-treks/kodachadri.jpg",
    nights: 1,
    days: 2,
    pax: "6–14 pax",
    hotelStars: 3,
    tags: ["Weekend Treks", "Treks", "Adventure", "Mountains"],
    region: "India",
    operator: "Bengaluru Trail Collective",
    rating: 4.8,
    reviews: 64,
    discount: 18,
    originalPrice: 3999,
    price: 3299,
  },
  {
    id: "savandurga-trek",
    title: "Savandurga Day Trek",
    location: "Magadi",
    destination: "Karnataka",
    image: "/weekend-treks/savandurga.jpg",
    nights: 0,
    days: 1,
    pax: "6–16 pax",
    hotelStars: 3,
    tags: ["Weekend Treks", "Treks", "Adventure", "Mountains"],
    region: "India",
    operator: "Bengaluru Trail Collective",
    rating: 4.6,
    reviews: 92,
    discount: 24,
    originalPrice: 1699,
    price: 1299,
  },
  {
    id: "nandi-hills-trek",
    title: "Nandi Hills Day Trek",
    location: "Chikkaballapur",
    destination: "Karnataka",
    image: "/weekend-treks/nandi-hills.jpg",
    nights: 0,
    days: 1,
    pax: "6–16 pax",
    hotelStars: 3,
    tags: ["Weekend Treks", "Treks", "Adventure", "Mountains"],
    region: "India",
    operator: "Bengaluru Trail Collective",
    rating: 4.5,
    reviews: 105,
    discount: 20,
    originalPrice: 1499,
    price: 1199,
    deal: true,
  },
  {
    id: "dummy-kerala-backwaters",
    href: "/packages/kerala-backwaters-hills-escape",
    title: "Kerala Backwaters & Hills Escape",
    location: "Kochi · Munnar · Thekkady · Alleppey",
    destination: "Kerala",
    image: "/destinations/kerala.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Family", "Mountains"],
    region: "India",
    operator: "The Curated Escapes",
    rating: 4.8,
    reviews: 124,
    discount: 13,
    originalPrice: 14999,
    price: 12999,
    deal: true,
  },
  /* ---------------------------------------------------------------- */
  /* Imported from tourbazaar.in/api/packages — 16 India + 16 overseas.  */
  /* The source publishes no ratings and no pre-discount price, so those */
  /* stay at 0 here and the cards hide the stars and the % off pill      */
  /* rather than invent them. Regenerate with scripts/import-packages.mjs */
  /* ---------------------------------------------------------------- */
  {
    id: "manali-volvo-tour-package-4-nights-5-days-98fb",
    title: "Manali Volvo Tour Package – 4 Nights / 5 Days",
    location: "Manali",
    destination: "Himachal",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/pkg-manali-volvo-tour-package-4-nights-5-days-98fb/img-1786004591508-pv0zfb.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Mountains", "Adventure", "Honeymoon", "Treks"],
    region: "India",
    operator: "Rajan Bookings",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 4499,
    price: 4499,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/pkg-manali-volvo-tour-package-4-nights-5-days-98fb/img-1786004591508-pv0zfb.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/pkg-manali-volvo-tour-package-4-nights-5-days-98fb/img-1786004676994-m5egsk.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/pkg-manali-volvo-tour-package-4-nights-5-days-98fb/img-1786004687087-3ooekr.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/pkg-manali-volvo-tour-package-4-nights-5-days-98fb/img-1786004690005-43xqrj.jpg"
      ],
      summary: "Manali Volvo Tour Package – 4 Nights / 5 Days is a 5-day itinerary through Manali.",
      places: [
        "Manali"
      ],
      highlights: [
        "🚌 Comfortable Volvo Bus Journey from Delhi",
        "🏨 Comfortable Hotel Accommodation",
        "🍽 Daily Breakfast & Dinner",
        "📸 Beautiful Mountain Views & Photo Spots",
        "💁 Dedicated Travel Assistance Throughout Your Trip"
      ],
      itinerary: [
        {
          day: 1,
          title: "📍 Day 1: Delhi / Chandigarh ➝ Manali (Overnight Volvo Journey)",
          route: "Manali",
          description: "🚌 Board your comfortable Volvo bus from RK Ashram / Kashmiri Gate.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "📍 Day 2: Arrival in Manali & Local Sightseeing",
          route: "Manali",
          description: "Arrive in Manali and check in to your hotel. Explore the popular local attractions:",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "📍 Day 3: Solang Valley Excursion",
          route: "Manali",
          description: "🍽️ After Breakfast, proceed to the scenic Solang Valley.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "📍 Day 4: Manali ➝ Kullu ➝ Nagar ➝ Delhi (Overnight Volvo Journey)",
          route: "Manali",
          description: "🍽️ After Breakfast, check out from the hotel and visit:",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Day 5: Arrival in Delhi / Chandigarh",
          route: "Manali",
          description: "🌅 Arrive at Delhi / Chandigarh in the morning with wonderful memories of your Manali trip.",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [
        { name: "Royal Grand", nights: 0, place: "Manali", comfort: "3-star category stay" }
      ],
      inclusions: [
        "🚌 Delhi – Manali – Delhi Luxury AC Volvo Bus Tickets",
        "🏨 2 Nights Comfortable Hotel Stay in Manali",
        "🍽 2 Breakfast & 2 Dinner at the Hotel",
        "🚐 Volvo Bus Stand Pickup & Hotel Transfer",
        "🚗 Local Manali Sightseeing by Private Cab",
        "🏔 Excursion to Solang Valley by Private Cab",
        "💰 All Parking Charges, Toll Taxes & Driver Allowances Included"
      ],
      exclusions: [
        "🚫 Rohtang Pass Permit & Sightseeing (Subject to Government Permission & Weather Conditions)",
        "🎿 Adventure Activities (Skiing, Paragliding, ATV Ride, Snow Scooter, Zipline, Ropeway, etc.)",
        "🎫 Monument Entry Tickets & Camera Charges",
        "🍴 Lunch",
        "🛍 Personal Expenses (Shopping, Laundry, Telephone Calls, Tips, etc.)",
        "➕ Any Service Not Specifically Mentioned in the \"Package Includes\" Section"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "magnificent-kashmir-9ec7",
    title: "Magnificent Kashmir",
    location: "Srinagar · Gulmarg · Pahalgam · Sonamarg",
    destination: "Kashmir",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784130586781-qjg12p.jpg",
    nights: 6,
    days: 7,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Mountains", "Treks", "Adventure"],
    region: "India",
    operator: "ToursHut Holidays",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 16627,
    price: 16627,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784130586781-qjg12p.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784130590878-7hbcbi.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784130593435-lc3vse.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784130598731-vedhec.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784130605710-9hdf04.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784130612203-umtih7.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784130618554-cn12vs.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784130623376-lisc5b.jpg"
      ],
      summary: "Magnificent Kashmir is a 7-day itinerary through Srinagar · Gulmarg · Pahalgam · Sonamarg.",
      places: [
        "Srinagar",
        "Gulmarg",
        "Pahalgam",
        "Sonamarg",
        "Doodhpatri"
      ],
      highlights: [
        "Standard hotel check-in 2:00 PM, check-out 11:00 AM.",
        "All transfers in Non-air-conditioned vehicles.",
        "Driver doubles as guide; conversant in Hindi.",
        "Itinerary may be re-sequenced due to weather, road or flight conditions."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival Srinagar - Local Sightseeing",
          route: "Srinagar",
          description: "Arrival at Srinagar International Airport. 35-minute drive through the heart of New Srinagar city, passing the Abdullah Bridge, which connects the banks of the Jhelum River. One hour Shikara ride on the lake. Rest period. Local sightseeing, including visits to the famous Mughal gardens of Nishat and Shalimar. Overnight stay in a hotel.",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Srinagar - Sonmarg - Daytrip",
          route: "Gulmarg",
          description: "After breakfast depart for full day excursion to the Sonamarg, ”Meadow of Gold” (84 km/03 hrs) on srinagar - leh road, a gushing river is the highlight of this meadow, flowing down from snowy heights into the dense woodlands of firs and silver birches. Glaciers pour down from this stream from the Himalayas on to the many camping sites in Sonamarg. A thick forest cover of sycamore, alpine flowers, silver birch, fir and pine, Sonamarg offers adventure in the form of treks, sledging, angling, alpine skiing and white water rafting. Enjoy pony ride (at your own cost) or leisurely walks around the meadow. Return back to Srinagar. Dinner and overnight in the hotel.",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Srinagar - Gulmarg",
          route: "Pahalgam",
          description: "After breakfast depart for a full day to Gulmarg, Meadow of flowers (56 km/2 hrs) situated at an altitude of 2730 meters, full day at leisure to take the leisurely walks on the lush green meadows of flowers with a backdrop of the snow capped mountains. Enjoy pony ride or gondola ride (rope way) to Khillanmarg at your own cost. Dinner & overnight in the hotel.",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Gulmarg - Pahalgam",
          route: "Sonamarg",
          description: "After breakfast, drive to Pahalgam, visit Betaab Valley and Chandanwari (at your own cost). After sightseeing around the mountain valley for most of the day. Dinner & overnight stay in the hotel.",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Pahalgam - Srinagar",
          route: "Doodhpatri",
          description: "After breakfast leave Pahalgam and drive to Srinagar at lunch time you will reach into the hotel at Srinagar. Dinner and overnight stay in hotel/houseboat.",
          meals: "Breakfast",
        },
        {
          day: 6,
          title: "Srinagar - Doodhpathri - Daytrip",
          route: "Doodhpatri",
          description: "After breakfast, drive to Doodhpathri, valley of Milk, located in Budgam district, lies in bowl shaped valley in Pir Panjal Range. It’s an alpine valley covered with Snowclad Mountain. Not a lot of tourists come to this place, since the road conditions are not favorable. After some quiet and peaceful time at Doodhpathri, be back to Srinagar for overnight stay in the houseboat.",
          meals: "Breakfast",
        },
        {
          day: 7,
          title: "Srinagar Airport Departure",
          route: "Doodhpatri",
          description: "After breakfast, check out from the hotel and we will assist you with transfers to airport with memories of Kashmir.",
          meals: "Breakfast",
        }
      ],
      stays: [],
      inclusions: [
        "Accommodation on a double sharing basis",
        "Hotels as per the plan mentioned for each hotel",
        "Meal plan: breakfast and dinner on MAPAI basis",
        "Welcome drink on arrival (non-alcoholic)",
        "Pickup from Srinagar airport and departure to Srinagar airport",
        "Meet and greet on arrival",
        "All parking, toll taxes, and driver’s allowances included"
      ],
      exclusions: [
        "Houseboat heating charges",
        "Any kind of airfare",
        "Tips, Drinks, Lunch, Laundry, Telephone charges, Horse riding, Guide services",
        "Any optional tour or trip not mentioned in the tour program",
        "Vehicle from Tangmarg to Gulmarg and back",
        "Mineral water: 1 bottle per person every day",
        "Gondola cable car ride to Phase 1 and Phase 2",
        "Entrance to Mughal Gardens, Betaab Valley, and Aru Valley",
        "Sumo for sightseeing in Aru, Chandanwari and Betaab Valley"
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 15% of package cost. 7–14 days before departure: 25% of package cost. Within 7 days of departure: 50% of package cost",
    },
  },
  {
    id: "jibhi-jalori-pass-tour-package-4-nights-5-days-from-delhi-serolsar-lake-trek-tirthan-valley-3917",
    title: "Jibhi Jalori Pass Tour Package · 4 Nights 5 Days from Delhi · Serolsar Lake Trek & Tirthan Valley",
    location: "Jibhi · Jalori Pass · Serolsar Lake · Mini Thailand",
    destination: "Himachal",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783749247078-odz8vv.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Treks", "Mountains", "Adventure"],
    region: "India",
    operator: "The Curated Escapes Travels",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 6999,
    price: 6999,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783749247078-odz8vv.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783749253535-ycong4.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783749258243-9mqaqt.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783749263435-z05j9c.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783749271217-jixv5f.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783749277622-gvxvup.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783749331150-d31ta9.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783749340109-ao01lb.jpg"
      ],
      summary: "Jibhi Jalori Pass Tour Package · 4 Nights 5 Days from Delhi · Serolsar Lake Trek & Tirthan Valley is a 5-day itinerary through Jibhi · Jalori Pass · Serolsar Lake · Mini Thailand.",
      places: [
        "Jibhi",
        "Jalori Pass",
        "Serolsar Lake",
        "Mini Thailand",
        "Tirthan Valley",
        "Choiee Waterfall"
      ],
      highlights: [],
      itinerary: [
        {
          day: 1,
          title: "Delhi to Jibhi | Overnight Scenic Himalayan Road Journey",
          route: "Jibhi",
          description: "Departure from Delhi – Begin Your Himalayan Adventure Your unforgettable Jibhi Jalori Pass Tour Package begins with an overnight road journey from Delhi towards the picturesque village of Jibhi in Himachal Pradesh. Enjoy the changing landscapes as you leave the bustling city behind and travel towards the serene Himalayan valleys.",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Explore Jibhi | Waterfall | Mini Thailand | Riverside Café Hopping",
          route: "Jalori Pass",
          description: "Discover the Hidden Paradise of Jibhi Arrive in the charming Himalayan village of Jibhi, famous for its cedar forests, crystal-clear rivers, traditional wooden homes and peaceful atmosphere. Spend the day exploring its iconic attractions and relaxing amidst nature.",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Jalori Pass Excursion | Serolsar Lake Trek",
          route: "Serolsar Lake",
          description: "Trek Through the Great Himalayan Forests Experience one of the most scenic adventures in Himachal Pradesh as you visit Jalori Pass and trek to the breathtaking Serolsar Lake, surrounded by dense oak and pine forests with panoramic Himalayan views.",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Tirthan Valley | Choiee Waterfall Trek | Departure",
          route: "Mini Thailand",
          description: "Explore Tirthan Valley Before Returning Visit the pristine Tirthan Valley, one of Himachal Pradesh's best-kept secrets. Enjoy an easy trek to the picturesque Choiee Waterfall, explore riverside cafés, and soak in the peaceful beauty before departing for Delhi.",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Arrival in Delhi | Tour Ends with Beautiful Memories",
          route: "Tirthan Valley",
          description: "Reach Delhi with Unforgettable Memories Arrive back in Delhi after an incredible mountain getaway. Carry home unforgettable memories of Jibhi's waterfalls, Jalori Pass, Serolsar Lake, Tirthan Valley, and the breathtaking landscapes of Himachal Pradesh.",
          meals: "Breakfast",
        }
      ],
      stays: [],
      inclusions: [],
      exclusions: [],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "Cancellation terms are confirmed with the operator at the time of booking.",
    },
  },
  {
    id: "manali-kasol-tour-package-from-delhi-4-nights-5-days-fi-b375",
    title: "Manali Kasol Tour Package from Delhi · 4 Nights / 5 Days Fixed Departure · Solang Valley, Sissu & Atal Tunnel",
    location: "Manali · Solang Valley · Atal Tunnel · Sissu",
    destination: "Himachal",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677235013-l1nuh0.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Mountains", "Adventure", "Honeymoon", "Treks"],
    region: "India",
    operator: "The Curated Escapes Travels",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 6499,
    price: 6499,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677235013-l1nuh0.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677239451-8z8hev.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677244206-gzu4pc.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677248462-siwfre.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677258428-9tw5hm.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677259876-qqeq4g.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677270484-3lw6r3.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677283851-gdm19t.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783677298686-npfnf6.jpg"
      ],
      summary: "Manali Kasol Tour Package from Delhi · 4 Nights / 5 Days Fixed Departure · Solang Valley, Sissu & Atal Tunnel is a 5-day itinerary through Manali · Solang Valley · Atal Tunnel · Sissu.",
      places: [
        "Manali",
        "Solang Valley",
        "Atal Tunnel",
        "Sissu",
        "Kullu",
        "Kasol",
        "Manikaran"
      ],
      highlights: [],
      itinerary: [
        {
          day: 1,
          title: "Delhi to Manali | Overnight Journey to the Himalayas",
          route: "Manali",
          description: "Begin your exciting Manali Kasol Fixed Departure Tour from Delhi by reporting at the designated boarding point in the evening. Meet your tour coordinator and board your Deluxe AC Pushback Traveller for a comfortable overnight journey towards the beautiful hill station of Manali. Enjoy scenic highway views as you travel through North India with scheduled comfort stops for refreshments (at your own expense). Relax onboard and get ready to explore the breathtaking landscapes of Himachal Pradesh over the coming days.",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Arrival in Manali | Explore Local Sightseeing & Himalayan Heritage",
          route: "Solang Valley",
          description: "Welcome to the beautiful hill station of Manali, nestled in the heart of the Kullu Valley. After arriving in the morning, check in to your hotel and relax before exploring the town's iconic attractions. Visit ancient temples, peaceful monasteries, lush parks, vibrant local markets, and the charming lanes of Old Manali. This day offers the perfect introduction to the natural beauty, culture, and lifestyle of Himachal Pradesh.",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Solang Valley | Atal Tunnel | Sissu Valley Adventure Excursion",
          route: "Atal Tunnel",
          description: "After breakfast, set out for one of the most scenic drives in Himachal Pradesh. Visit the breathtaking Solang Valley, pass through the world-famous Atal Tunnel, and explore the stunning Sissu Valley in the Lahaul region (subject to government permissions). Adventure enthusiasts can also enjoy thrilling snow and mountain activities while soaking in panoramic Himalayan views.",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Kullu | River Rafting | Kasol | Manikaran | Overnight Journey to Delhi",
          route: "Sissu",
          description: "Today is filled with adventure, spirituality, and scenic beauty as you explore Kullu, the charming village of Kasol, and the sacred town of Manikaran Sahib. Experience thrilling river rafting on the Beas River, stroll through Kasol's vibrant cafés and markets, and visit the famous Gurudwara and natural hot water springs before beginning your overnight journey back to Delhi.",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Arrival in Delhi | Tour Concludes with Wonderful Memories",
          route: "Kullu",
          description: "After an overnight journey through the Himalayas, arrive back in Delhi in the morning with unforgettable memories of your Manali, Solang Valley, Sissu, Kullu, Kasol, and Manikaran adventure. Your Himachal Pradesh fixed departure tour concludes, leaving you with breathtaking photographs, new friendships, and experiences to cherish forever.",
          meals: "Breakfast",
        }
      ],
      stays: [
        { name: "Deluxe Hotel Stay in Manali", nights: 0, place: "Manali · Solang Valley · Atal Tunnel · Sissu", comfort: "3-star category stay" }
      ],
      inclusions: [],
      exclusions: [],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "Cancellation terms are confirmed with the operator at the time of booking.",
    },
  },
  {
    id: "ladakh-land-of-lamas-e6ff",
    title: "Ladakh Land of Lamas",
    location: "Ladakh · Leh · Pangong · Nubra",
    destination: "Ladakh",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/pkg-ladakh-land-of-lamas-e6ff/img-1784107350675-4cx9ya.jpg",
    nights: 6,
    days: 7,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Mountains", "Beaches"],
    region: "India",
    operator: "ToursHut Holidays",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 23463,
    price: 23463,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/pkg-ladakh-land-of-lamas-e6ff/img-1784107350675-4cx9ya.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/pkg-ladakh-land-of-lamas-e6ff/img-1784107360561-1nbov9.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/pkg-ladakh-land-of-lamas-e6ff/img-1784107360175-uciiyp.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/pkg-ladakh-land-of-lamas-e6ff/img-1784107365428-gyf801.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/pkg-ladakh-land-of-lamas-e6ff/img-1784107370953-kbbc2y.jpg"
      ],
      summary: "Ladakh Land of Lamas is a 7-day itinerary through Ladakh · Leh · Pangong · Nubra.",
      places: [
        "Ladakh",
        "Leh",
        "Pangong",
        "Nubra"
      ],
      highlights: [
        "Standard hotel check-in 2:00 PM, check-out 11:00 AM.",
        "All transfers in Non-air-conditioned vehicles (AC may not work in hill regions).",
        "Driver doubles as guide; conversant in Hindi.",
        "Itinerary may be re-sequenced due to weather, road or flight conditions."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in",
          route: "Ladakh",
          description: "Arrival at Leh in the morning and then transfer to the hotel. Take complete rest for the remainder of the day to get acclimatized to the high altitude at Leh (11,500 ft/3500 m). Overnight stay at a hotel.",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Leh City Tour",
          route: "Leh",
          description: "After Breakfast, get up at your leisurely pace since you did an exhausting trip a day prior. We leave for a short city tour by 11:00AM. Visit Leh Palace and Shanti Stupa. Have lunch in the market and shop around. Later in the evening, visit Thiksey Monastery, followed by a Flag Down ceremony at the Hall of Fame. Do not exert your body, rest at the hotel if you feel tired/discomfort at any time during the day. Overnight at Leh.",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Leh - Nubra Valley",
          route: "Pangong",
          description: "After Breakfast, move towards Highest Motorable Road of The World, Khardungla Pass. Have a cup of tea there, get yourself clicked with the Khardungla Signboard by BRO & proceed towards Nubra valley. Enroute River Rafting & visit to Diskit Monastery. Check-in at Hotel/Camp, freshen up & later you can have a Double Hump Bactrian Camel ride. Don't forget to click this unique mammal, found in the cold Desert. It was once used to carry the trade material on silk routes. Overnight at Nubra Valley.",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Nubra - Turtuk - Nubra",
          route: "Nubra",
          description: "After breakfast, move toward Turtuk. It is a small village located in Nubra Valley region of Ladakh, on the banks of Shayok River. It is the northernmost village in India lying very close to the India Pakistan border, in the Baltistan region. Return back to Nubra.",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Nubra - Pangong",
          route: "Nubra",
          description: "Leave early morning after Breakfast, towards Spangmik/Pangong via Shyok (preferred) or warily/Leh (backup route), the most secluded pass of the region. Be prepared for contingency of route change leading to longer hours on road. Later drive Diskit-Khalser-Agham-Warila-Sakthi-zingral-Changla-TangsteLukung to finally reach breathtaking Pangong Lake. Overnight at Camps.",
          meals: "Breakfast",
        },
        {
          day: 6,
          title: "Pangong - Leh",
          route: "Nubra",
          description: "After Breakfast, check out from Camps for the return journey to Leh. Enroute visit Hemis Monastery and 3-Idiots School. Overnight at Leh.",
          meals: "Breakfast",
        },
        {
          day: 7,
          title: "Departure",
          route: "Nubra",
          description: "Departure day. After breakfast transfer to the airport and fly back to your onward journey with memories.",
          meals: "Breakfast",
        }
      ],
      stays: [],
      inclusions: [
        "Hotel/Camp accommodation will be provided",
        "Welcome drink on arrival",
        "Breakfast and Dinner (MAP meal plan), Morning tea",
        "Private taxi (Xylo/Innova for up to 6 passengers and Tempo Traveller for more than 7 passengers) for all sightseeing as per itinerary starting from Leh. You can upgrade to another vehicle. Please note that air conditioning is switched off in the hills.",
        "24-hour guidance",
        "Parking, toll, fuel, and driver allowances",
        "An experienced driver will also serve as a guide (you can hire a dedicated guide as well)",
        "No hidden charges"
      ],
      exclusions: [
        "Inner line permit / Protected Area permi",
        "Lunch, beverages, and meals not included in the meal plan",
        "Flight or rail tickets",
        "Laundry, tips, and shopping expenses",
        "Private guide"
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 15% of package cost. 7–14 days before departure: 25% of package cost. Within 7 days of departure: 50% of package cost",
    },
  },
  {
    id: "majestic-ladakh-tour-with-nubra-and-pangong-5n-6d-cde8",
    title: "Majestic Ladakh Tour with Nubra and Pangong 5N &6D",
    location: "Pangong · Nubra · Leh",
    destination: "Ladakh",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784126869737-8wqsmi.jpg",
    nights: 5,
    days: 6,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Adventure"],
    region: "India",
    operator: "ToursHut Holidays",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 19426,
    price: 19426,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784126869737-8wqsmi.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784126872518-xw8aqd.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784126877764-t7ynhg.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784126882281-j0va8j.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784126885313-imgdze.jpg"
      ],
      summary: "Majestic Ladakh Tour with Nubra and Pangong 5N &6D is a 6-day itinerary through Pangong · Nubra · Leh.",
      places: [
        "Pangong",
        "Nubra",
        "Leh"
      ],
      highlights: [
        "Standard hotel check-in 2:00 PM, check-out 11:00 AM.",
        "All transfers in Non-air-conditioned vehicles (AC may not work in hill regions).",
        "Driver doubles as guide; conversant in Hindi.",
        "Itinerary may be re-sequenced due to weather, road or flight conditions."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in",
          route: "Pangong",
          description: "Arrival at Leh in the morning and then transfer to the hotel. Take complete rest for the remainder of the day to get acclimatized to the high altitude at Leh (11,500 ft/3500 m). Overnight stay at a hotel.",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Leh City Tour",
          route: "Nubra",
          description: "After Breakfast, get up at your leisurely pace since you did an exhausting trip a day prior. We leave for a short city tour by 11:00AM. Visit Leh Palace and Shanti Stupa. Have lunch in the market and shop around. Later in the evening, visit Thiksey Monastery, followed by a Flag Down ceremony at the Hall of Fame. Do not exert your body, rest at the hotel if you feel tired/discomfort at any time during the day. Overnight at Leh.",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Leh - Nubra Valley",
          route: "Leh",
          description: "After Breakfast, move towards Highest Motorable Road of The World, Khardungla Pass. Have a cup of tea there, get yourself clicked with the Khardungla Signboard by BRO & proceed towards Nubra valley. Enroute River Rafting & visit to Diskit Monastery. Check-in at Hotel/Camp, freshen up & later you can have a Double Hump Bactrian Camel ride. Don't forget to click this unique mammal, found in the cold Desert. It was once used to carry the trade material on silk routes. Overnight at Nubra.",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Nubra - Pangong Lake",
          route: "Leh",
          description: "Leave early morning after Breakfast, towards Spangmik/Pangong via Shayok (preferred) or warily/Leh (backup route), the most secluded pass of the region. Be prepared for contingency of route change leading to longer hours on road. Later drive Diskit-Khalser-Agham-Warila-Sakthi-zingral-Changla-TangsteLukung to finally reach breathtaking Pangong Lake. Overnight at Camps.",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Pangong - Leh",
          route: "Leh",
          description: "After Breakfast, check out from Camps for the return journey to Leh. Enroute visit Hemis Monastery and 3-Idiots School. Overnight at Leh.",
          meals: "Breakfast",
        },
        {
          day: 6,
          title: "Departure",
          route: "Leh",
          description: "Departure day. After breakfast Transfer to the airport and fly back to your onward journey with memories.",
          meals: "Breakfast",
        }
      ],
      stays: [],
      inclusions: [
        "Hotel/Camp accommodation will be provided",
        "Welcome drink on arrival",
        "Breakfast and Dinner (MAP), Morning tea",
        "Private taxi (Xylo/Innova for up to 6 passengers and Tempo Traveller for more than 7 passengers) for all sightseeing as per itinerary starting from Leh. You can upgrade to another vehicle. Please note that air conditioning is switched off in the hills.",
        "24-hour guidance",
        "Parking, toll, fuel, and driver allowances",
        "An experienced driver will serve as a guide (You can hire a dedicated guide as well)",
        "No hidden charges"
      ],
      exclusions: [
        "Inner line permit / Protected Area permit",
        "Lunch, beverages, and meals not included in the meal plan",
        "Flight or rail tickets",
        "Laundry, tips, and shopping expenses",
        "Private guide"
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 15% of package cost. 7–14 days before departure: 25% of package cost. Within 7 days of departure: 50% of package cost",
    },
  },
  {
    id: "sikkim-darjeeling-delight-4-nights-5-days-69c9",
    title: "Sikkim & Darjeeling Delight – 4 Nights / 5 Days",
    location: "Gangtok · Darjeeling",
    destination: "Sikkim",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fix-holidays-9c74/new/img-1784176259341-6lfotp.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Honeymoon", "Mountains"],
    region: "India",
    operator: "FIx Holidays",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 18500,
    price: 18500,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fix-holidays-9c74/new/img-1784176259341-6lfotp.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fix-holidays-9c74/new/img-1784176266827-wred43.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fix-holidays-9c74/new/img-1784176271825-ny9ka6.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fix-holidays-9c74/new/img-1784176276582-rlcq49.jpg"
      ],
      summary: "Sikkim & Darjeeling Delight – 4 Nights / 5 Days is a 5-day itinerary through Gangtok · Darjeeling.",
      places: [
        "Gangtok",
        "Darjeeling"
      ],
      highlights: [
        "Standard hotel check-in 2:00 PM, check-out 11:00 AM.",
        "All transfers in air-conditioned vehicles (AC may not work in hill regions).",
        "Driver doubles as guide; conversant in Hindi & English.",
        "Itinerary may be re-sequenced due to weather, road or flight conditions."
      ],
      itinerary: [
        {
          day: 1,
          title: "NJP / Bagdogra – Gangtok (Approx. 125 Kms | 4.5–5 Hrs)",
          route: "Gangtok",
          description: "Arrival at NJP Railway Station / Bagdogra Airport, where you will be greeted by our representative. Transfer to Gangtok (5,500 ft) via a scenic drive along the Teesta River valley. On arrival, check in at your hotel. Evening: Free at leisure to explore MG Marg, Gangtok’s vibrant shopping and café street.",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Gangtok – Tsomgo Lake & Baba Mandir Excursion",
          route: "Darjeeling",
          description: "After breakfast, proceed for a full-day excursion to: • Tsomgo Lake (12,400 ft): A sacred high-altitude glacial lake known for its changing colours • Baba Harbhajan Singh Mandir: A revered shrine dedicated to an Indian Army soldier Return to Gangtok by evening. 🛌 Overnight: Gangtok | 🍽️ Meals: Breakfast",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Gangtok – Darjeeling (Approx. 120 Kms | 5–6 Hrs)",
          route: "Darjeeling",
          description: "After breakfast, check out and drive to Darjeeling (6,700 ft), popularly known as the Queen of the Hills. Enjoy picturesque mountain roads and tea garden views en route. Check in to your hotel on arrival. Evening: Free to stroll along Mall Road or relax at leisure. 🛌 Overnight: Darjeeling | 🍽️ Meals: Breakfast",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Darjeeling Sightseeing – Tiger Hill Sunrise",
          route: "Darjeeling",
          description: "Early morning (around 4:00 AM), proceed to Tiger Hill to witness the breathtaking sunrise over Mt. Kanchenjunga. On the way back, visit: • Ghoom Monastery – One of the oldest monasteries in the region • Batasia Loop – A scenic railway loop with panoramic views Return to hotel for breakfast. Later proceed for half-day sightseeing covering: • Himalayan Mountaineering Institute (Closed on Thursdays) • Padmaja Naidu Zoological Park • Japanese Temple & Peace Pagoda • Tea Garden (Outer View) Evening free for shopping and leisure. 🛌 Overnight: Darjeeling | 🍽️ Meals: Breakfast",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Darjeeling – NJP / Bagdogra Departure (Approx. 70 Kms | 3.5–4 Hrs)",
          route: "Darjeeling",
          description: "After breakfast, check out from the hotel and transfer to NJP Railway Station / Bagdogra Airport for your onward journey. Tour Ends with Sweet Memories.",
          meals: "Breakfast",
        }
      ],
      stays: [],
      inclusions: [
        "•\tAccommodation as per above hotels on Double Occupancy",
        "•\tDaily breakfast at all hotels",
        "•\tAll transfers & sightseeing by WagonR /Sedan vehicles",
        "•\tTsomgo Lake & Baba Mandir excursion",
        "•\tDarjeeling sightseeing including Tiger Hill",
        "•\tDriver allowance, parking, toll & fuel charges",
        "•\tAssistance on arrival & departure",
        "•\tAll applicable hotel & transport taxes (GST included)"
      ],
      exclusions: [
        "•\tAirfare / Train fare",
        "•\tNathula Pass permit (optional, extra cost)",
        "•\tEntry fees to monuments, ropeway, parks, or activities",
        "•\tLunch, dinner, tips, laundry, and personal expenses",
        "•\tTravel insurance",
        "•\tTips, porterage, laundry, phone calls",
        "•\tAnything not mentioned in “Inclusions”"
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "discover-the-best-of-goa-scenic-sightseeing-tour-8366",
    title: "Discover the Best of Goa: Scenic Sightseeing Tour",
    location: "North Goa · South Goa · Dudhsagar Waterfall",
    destination: "Goa",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784127725568-45y7xi.jpg",
    nights: 3,
    days: 4,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Adventure"],
    region: "India",
    operator: "ToursHut Holidays",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 7649,
    price: 7649,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784127725568-45y7xi.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784127731225-ah1069.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784127737040-vz3diz.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784127741102-x9qvu1.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784127745387-pogrnu.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-tourshut-holidays-07ab/new/img-1784127750079-z8agmd.jpg"
      ],
      summary: "Discover the Best of Goa: Scenic Sightseeing Tour is a 4-day itinerary through North Goa · South Goa · Dudhsagar Waterfall.",
      places: [
        "North Goa",
        "South Goa",
        "Dudhsagar Waterfall"
      ],
      highlights: [
        "Standard hotel check-in 2:00 PM, check-out 11:00 AM.",
        "All transfers in air-conditioned vehicles.",
        "Driver doubles as guide; conversant in Hindi.",
        "Itinerary may be re-sequenced due to weather, road or flight conditions."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival at Madgao/Vasco Da Gama/Dabolim and transfer to hotel",
          route: "North Goa",
          description: "Reach at Madgaon/Vasco Da Gama Railway station or Dabolim International Airport and transfer to North Goa Hotel. Take rest and evening free for leisure. Overnight stay at hotel.",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "North Goa Sightseeing",
          route: "South Goa",
          description: "After breakfast start your journey for North Goa Sightseeing; 1) Fort Agauda 2) Sinquerim Beach 3) Candolim Beach 4) Calangute Beach 5) Baga Beach 6) Anjuna Beach 7) Vagator Beach. Evening free for shopping and party. Overnight stay at hotel.",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "South Goa Sightseeing",
          route: "Dudhsagar Waterfall",
          description: "After breakfast start your journey for South Goa Sightseeing; 1) Mangueshi Temple 2) Old Goa Church 3) Miramar Beach 4) Balaji Temple 5) Church Square Panaji 6) St. Augustine Tower. Evening free for shopping and party. Overnight stay at hotel.",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Departure Day",
          route: "Dudhsagar Waterfall",
          description: "After breakfast leave for Madgaon/Vasco Da Gama Railway station/Dabolim Internation Airport with beautiful memories.",
          meals: "Breakfast",
        }
      ],
      stays: [],
      inclusions: [
        "Accommodation",
        "Breakfast and dinner included",
        "Professional driver provided for pick-up and drop-off",
        "North Goa and South Goa Sightseeing on SIC basis"
      ],
      exclusions: [
        "Parking",
        "Entry Fees",
        "Shopping",
        "Tips and Additional Services",
        "Camera"
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 15% of package cost. 7–14 days before departure: 25% of package cost. Within 7 days of departure: 50% of package cost",
    },
  },
  {
    id: "majestic-desert-night-with-cultural-show-06ca",
    title: "Majestic Desert Night with Cultural Show",
    location: "Jaisalmer · Rajasthan",
    destination: "Rajasthan",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-majestic-roams-of-rajasthan-4400/new/img-1786184724516-9b2dj0.jpg",
    nights: 1,
    days: 2,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Adventure"],
    region: "India",
    operator: "Majestic Roams Of Rajasthan",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 5499,
    price: 5499,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-majestic-roams-of-rajasthan-4400/new/img-1786184724516-9b2dj0.jpg"
      ],
      summary: "Majestic Desert Night with Cultural Show is a 2-day itinerary through Jaisalmer · Rajasthan.",
      places: [
        "Jaisalmer",
        "Rajasthan"
      ],
      highlights: [
        "Sunset at sam desert"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in",
          route: "Jaisalmer",
          description: "Check-in at camp (Royal Swiss Tent). Evening camel and jeep safari across the dunes. Sunset views, Hi-Tea snacks, traditional Rajasthani cultural program, local dinner and overnight stay.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Leisurely breakfast at camp followed by checkout.",
          route: "Rajasthan",
          description: "",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "Welcome drink on arrival",
        "Accommodation in Royal Swiss Tent",
        "Meals: 1 Breakfast, 1 Hi-Tea, 1 Dinner",
        "Private cab to Camp / Kuldhara",
        "Jeep & Camel safari",
        "Jeep & Camel safari"
      ],
      exclusions: [
        "Lunch",
        "Airfare or train fare",
        "Adventure activities"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "kerala-monsoon-escape-5-nights-6-days-9416",
    title: "Kerala Monsoon Escape – 5 Nights / 6 Days",
    location: "Kochi · Munnar · Thekkady · Alleppey",
    destination: "Kerala",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fix-holidays-9c74/new/img-1784177220363-up9d13.jpg",
    nights: 5,
    days: 6,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Adventure", "Mountains", "Honeymoon"],
    region: "India",
    operator: "FIx Holidays",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 20800,
    price: 20800,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fix-holidays-9c74/new/img-1784177220363-up9d13.jpg"
      ],
      summary: "Kerala Monsoon Escape – 5 Nights / 6 Days is a 6-day itinerary through Kochi · Munnar · Thekkady · Alleppey.",
      places: [
        "Kochi",
        "Munnar",
        "Thekkady",
        "Alleppey"
      ],
      highlights: [
        "Standard hotel check-in 2:00 PM, check-out 11:00 AM.",
        "All transfers in air-conditioned vehicles (AC may not work in hill regions).",
        "Driver doubles as guide; conversant in Hindi & English.",
        "Itinerary may be re-sequenced due to weather, road or flight conditions."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Kochi",
          route: "Kochi",
          description: "• Arrival at Kochi Airport / Ernakulam Railway Station • Meet & greet with representative • Transfer to hotel & check-in 🌆 Evening free at leisure • Relax after journey • Optional visit to Marine Drive / nearby cafés (subject to arrival timing) 🛌 Overnight: Kochi | 🍽️ Meals: No Meal",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Kochi → Munnar (Approx. 130 Kms | 4–5 Hrs)",
          route: "Munnar",
          description: "After breakfast: Drive towards Munnar, Kerala’s famous hill station known for tea gardens and misty mountains. 🔹 Enroute Sightseeing: • Cheeyappara Waterfalls • Valara Waterfalls • Spice Plantation Visit • Scenic Tea Gardens 🏨 Check-in at hotel upon arrival 🌧️ Evening free to enjoy: • Monsoon valley views • Tea estate walks (weather permitting) • Relaxing hill station atmosphere 🛌 Overnight: Munnar | 🍽️ Meals: Breakfast",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Munnar Local Sightseeing (Monsoon-Friendly Sightseeing)",
          route: "Thekkady",
          description: "After breakfast: Proceed for full-day sightseeing in Munnar. 🔹 Sightseeing Covers: • Mattupetty Dam • Echo Point • Kundala Lake • Tea Museum • Blossom Garden • Photo Point ⚠️ Monsoon Note: • Eravikulam National Park may occasionally remain closed during heavy rain or landslide alerts. • Sightseeing order may change based on weather conditions. 🌧️ June in Munnar brings cool temperatures and lush greenery, making it one of Kerala’s best monsoon destinations. 🛌 Overnight: Munnar | 🍽️ Meals: Breakfast",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Munnar → Thekkady (Approx. 95 Kms | 3–4 Hrs)",
          route: "Alleppey",
          description: "After breakfast: Drive towards Thekkady, famous for spice plantations and wildlife experiences. 🔹 Enroute Experience: • Cardamom & Spice Plantation Views • Scenic Western Ghats Drive 🔹 Optional Activities: • Periyar Lake Boating • Kathakali Show • Kalaripayattu Martial Arts Show • Ayurvedic Massage ⚠️ Boating availability depends on weather conditions during monsoon. 🛌 Overnight: Thekkady | 🍽️ Meals: Breakfast",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Thekkady → Alleppey Houseboat (Approx. 140 Kms | 4–5 Hrs)",
          route: "Alleppey",
          description: "After breakfast: Drive towards Alleppey, known for its peaceful backwaters. 🛶 Check-in to traditional Kerala Houseboat by afternoon. 🔹 Houseboat Experience: • Cruise through scenic backwaters • Coconut lagoons & village life • Traditional Kerala meals onboard • Rainy backwater atmosphere ⚠️ During heavy rain, houseboats may anchor earlier for safety, but the monsoon experience is considered one of Kerala’s most beautiful travel experiences. 🛌 Overnight: Houseboat | 🍽️ Meals Included on: Lunch, Evening Tea & Snacks, Dinner, Breakfast",
          meals: "Breakfast",
        },
        {
          day: 6,
          title: "Alleppey → Kochi Departure (Approx. 85 Kms | 2–2.5 Hrs)",
          route: "Alleppey",
          description: "After breakfast: • Check-out from houseboat Drop at Airport / Railway Station for onward journey. ✈ Tour Ends with Beautiful Memories",
          meals: "Breakfast",
        }
      ],
      stays: [],
      inclusions: [
        "Airport / Railway Station pick-up & drop",
        "1 Night stay in Kochi",
        "2 Nights stay in Munnar",
        "1 Night stay in Thekkady",
        "1 Night stay in Alleppey Houseboat",
        "Daily Breakfast at hotels",
        "All meals in Houseboat",
        "Private vehicle for entire tour",
        "Driver allowance, toll & parking charges"
      ],
      exclusions: [
        "Airfare / Train tickets",
        "Entry tickets to sightseeing places",
        "Boating & activity charges",
        "Personal expenses (tips, shopping, laundry etc.)",
        "Optional activities in Thekkady",
        "Meals not mentioned in inclusions",
        "Anything not specifically mentioned"
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "lakshadweep-ed5b",
    title: "Lakshadweep",
    location: "Lakshadweep",
    destination: "Lakshadweep",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fernandez-holidays-0faf/new/img-1787223598600-axppxl.jpg",
    nights: 3,
    days: 4,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Beaches"],
    region: "India",
    operator: "Fernandez Holidays",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 13500,
    price: 13500,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fernandez-holidays-0faf/new/img-1787223598600-axppxl.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fernandez-holidays-0faf/new/img-1787223604056-querpd.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-fernandez-holidays-0faf/new/img-1787223617790-kyn1rb.jpg"
      ],
      summary: "Lakshadweep is a 4-day itinerary through Lakshadweep.",
      places: [
        "Lakshadweep"
      ],
      highlights: [
        "Enjoy beach and indulge in water activities in Lakshadweep"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in at Agatti Homestay",
          route: "Lakshadweep",
          description: "Agatti sightseeings",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Agatti Water activities",
          route: "Lakshadweep",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Glass bottom boat ride to Kalpetti",
          route: "Lakshadweep",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Departure to Agatti airport",
          route: "Lakshadweep",
          description: "",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "Permit, Activities, Sightseeing, Food, Stay at homestay"
      ],
      exclusions: [
        "Airfare"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "kerala-escape-5-nights-6-days-kochi-munnar-thekkady-alleppey-houseboat-9b49",
    title: "Kerala Escape 5 Nights 6 Days · Kochi, Munnar, Thekkady & Alleppey Houseboat",
    location: "Kerala · Kochi · Munnar · Thekkady",
    destination: "Kerala",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783537068614-w48e6u.jpg",
    nights: 5,
    days: 6,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Mountains", "Adventure", "Honeymoon", "Wildlife"],
    region: "India",
    operator: "The Curated Escapes Travels",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 16999,
    price: 16999,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783537068614-w48e6u.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-curated-escapes-travels-0c06/new/img-1783538061253-gnlcez.jpg"
      ],
      summary: "Kerala Escape 5 Nights 6 Days · Kochi, Munnar, Thekkady & Alleppey Houseboat is a 6-day itinerary through Kerala · Kochi · Munnar · Thekkady.",
      places: [
        "Kerala",
        "Kochi",
        "Munnar",
        "Thekkady",
        "Alleppey"
      ],
      highlights: [],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Kochi | Heritage & Waterfront Experience",
          route: "Kerala",
          description: "Welcome to Kerala! Upon arrival in Kochi, meet our representative and transfer to your hotel. Spend the day exploring the city's rich colonial heritage, historic landmarks, and vibrant waterfront before enjoying a relaxing evening.",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Kochi to Munnar | Scenic Hill Station Journey",
          route: "Kochi",
          description: "Drive through Kerala's picturesque countryside to Munnar, famous for its tea gardens, waterfalls, and mist-covered mountains.",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Munnar Sightseeing | Tea Gardens & Nature",
          route: "Munnar",
          description: "Discover the beauty of Munnar with visits to iconic viewpoints, lakes, dams, and tea plantations.",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Munnar to Thekkady | Wildlife & Spice Plantation",
          route: "Thekkady",
          description: "Travel to Thekkady, home to the famous Periyar Wildlife Sanctuary and Kerala's aromatic spice plantations.",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Thekkady to Alleppey | Houseboat & Backwaters",
          route: "Alleppey",
          description: "Experience Kerala's world-famous backwaters as you journey to Alleppey for a memorable houseboat stay.",
          meals: "Breakfast",
        },
        {
          day: 6,
          title: "Departure from Kochi | Tour Ends",
          route: "Alleppey",
          description: "After breakfast, return to Kochi with unforgettable memories of Kerala's hills, wildlife, and tranquil backwaters.",
          meals: "Breakfast",
        }
      ],
      stays: [],
      inclusions: [],
      exclusions: [],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "Cancellation terms are confirmed with the operator at the time of booking.",
    },
  },
  {
    id: "kerala-delight-tour-with-houseboat-84e3",
    title: "Kerala Delight Tour with Houseboat",
    location: "Munnar · Thekkady · Alleppey",
    destination: "Kerala",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786103077677-bkbh93.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Adventure"],
    region: "India",
    operator: "Rajan Bookings",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 12499,
    price: 12499,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786103077677-bkbh93.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786103081110-73d8qs.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786103084572-xoghzv.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786103087263-1p2cmg.jpg"
      ],
      summary: "Kerala Delight Tour with Houseboat is a 5-day itinerary through Munnar · Thekkady · Alleppey.",
      places: [
        "Munnar",
        "Thekkady",
        "Alleppey"
      ],
      highlights: [
        "🚗 Scenic road journey through Kerala's lush tea plantations, waterfalls & spice gardens",
        "🍃 Explore the breathtaking hill station of Munnar and its famous viewpoints",
        "🐘 Visit Thekkady and enjoy optional Elephant Ride, Kathakali Show & Martial Arts Performance",
        "🛶 Experience a memorable 1 Night Houseboat Stay in Alleppey with Lunch & Dinner",
        "🌿 Discover the famous Periyar Wildlife Sanctuary and enjoy boating on Periyar Lake",
        "📸 Perfect combination of Hills, Wildlife, Backwaters & Nature in one unforgettable trip"
      ],
      itinerary: [
        {
          day: 1,
          title: "Cochin Arrival – Transfer to Munnar",
          route: "Munnar",
          description: "Begin your Kerala adventure with a scenic drive through lush greenery, waterfalls, spice plantations, and winding mountain roads as you head towards the beautiful hill station of Munnar.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Munnar Sightseeing",
          route: "Thekkady",
          description: "Discover the mesmerizing beauty of Munnar as you explore its picturesque lakes, tea gardens, viewpoints, and wildlife sanctuary.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Munnar – Thekkady",
          route: "Alleppey",
          description: "Continue your journey to Thekkady, famous for its wildlife, spice plantations, and exciting cultural experiences.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Thekkady – Alleppey Houseboat",
          route: "Alleppey",
          description: "Experience the magic of Kerala's famous backwaters with a relaxing stay aboard a traditional houseboat.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Alleppey – Cochin Departure",
          route: "Alleppey",
          description: "Bid farewell to God's Own Country with unforgettable memories of hills, wildlife, spice plantations, and tranquil backwaters.",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [
        { name: "Green Cove Munnar", nights: 0, place: "Munnar · Thekkady · Alleppey", comfort: "3-star category stay" },
        { name: "The Patio Thekkady", nights: 0, place: "Munnar · Thekkady · Alleppey", comfort: "3-star category stay" },
        { name: "Houseboat Alleppey", nights: 0, place: "Munnar · Thekkady · Alleppey", comfort: "3-star category stay" }
      ],
      inclusions: [
        "All Transfers & Sightseeing by AC Swift Dzire (AC will not operate in hill areas as per local regulations)",
        "Hotel Accommodation",
        "04 Breakfasts",
        "01 Night Stay in Traditional Alleppey Houseboat",
        "01 Lunch & 01 Dinner during Houseboat Stay",
        "Sightseeing as per the itinerary",
        "Toll Tax, Parking Charges & Driver Allowance",
        "Pick-up & Drop from Cochin"
      ],
      exclusions: [
        "Airfare / Train Fare",
        "GST",
        "Entry Tickets & Guide Charges",
        "Meals not mentioned in the inclusions",
        "Personal Expenses (Laundry, Shopping, Telephone, Tips, Mineral Water, Soft Drinks, etc.)",
        "Adventure Activities & Optional Experiences",
        "Additional Vehicle Usage or Sightseeing not mentioned in the itinerary",
        "Expenses arising due to natural calamities, landslides, roadblocks, strikes, or unforeseen circumstances",
        "Any increase in fuel prices, government taxes, or transportation charges before departure"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "royalty-in-rajasthan-6-nights-7-days-39b8",
    title: "Royalty in Rajasthan – 6 Nights / 7 Days",
    location: "Jaipur · Bikaner · Jaisalmer · Jodhpur",
    destination: "Rajasthan",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786105604373-2bqxg9.jpg",
    nights: 6,
    days: 7,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Heritage", "Honeymoon", "Adventure"],
    region: "India",
    operator: "Rajan Bookings",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 22499,
    price: 22499,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786105604373-2bqxg9.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786105606254-0e74u1.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786105609518-368kbf.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786105611797-ac6sm6.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-rajan-bookings-8658/new/img-1786105614527-ddbgk1.jpg"
      ],
      summary: "Royalty in Rajasthan – 6 Nights / 7 Days is a 7-day itinerary through Jaipur · Bikaner · Jaisalmer · Jodhpur.",
      places: [
        "Jaipur",
        "Bikaner",
        "Jaisalmer",
        "Jodhpur"
      ],
      highlights: [
        "🏯 Explore the royal cities of Jaipur, Bikaner, Jaisalmer & Jodhpur",
        "🐪 Enjoy a thrilling Camel Safari followed by a Cultural Folk Dance & Music Show with Evening Tea & Snacks in the desert camp",
        "🌅 Experience an unforgettable Desert Camp Stay in Jaisalmer",
        "🏰 Visit magnificent forts including Amber Fort, Mehrangarh Fort, Jaisalmer Fort & Junagarh Fort",
        "🛍️ Shop for traditional handicrafts, textiles & souvenirs in Jaipur's vibrant bazaars",
        "📸 Witness the perfect blend of royal heritage, golden deserts, historical monuments & Rajasthani culture"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Jaipur",
          route: "Jaipur",
          description: "Welcome to the Pink City! Begin your Rajasthan journey by exploring Jaipur's magnificent palaces, royal heritage, and architectural wonders.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Jaipur Sightseeing",
          route: "Bikaner",
          description: "Discover Jaipur's royal forts, colorful streets, and timeless charm as you explore some of Rajasthan's most iconic landmarks.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Jaipur – Bikaner",
          route: "Jaisalmer",
          description: "Travel to the desert city of Bikaner, renowned for its grand forts, camel heritage, and unique temples.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Bikaner – Jaisalmer",
          route: "Jodhpur",
          description: "Journey towards the Golden City of Jaisalmer and witness the beauty of Rajasthan's vast desert landscapes.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Jaisalmer Sightseeing & Desert Camp",
          route: "Jodhpur",
          description: "Explore the Golden Fort before experiencing the magical Thar Desert with camel rides, cultural performances, and an unforgettable desert camp stay.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Jaisalmer – Jodhpur",
          route: "Jodhpur",
          description: "Head to the Blue City of Jodhpur and admire its impressive forts, royal architecture, and rich cultural heritage.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 7,
          title: "Jodhpur – Jaipur Departure",
          route: "Jodhpur",
          description: "Conclude your unforgettable Rajasthan journey with wonderful memories of royal palaces, majestic forts, golden deserts, and vibrant culture.",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "All Transfers & Sightseeing by Private Vehicle",
        "06 Breakfasts & 1 Dinner",
        "Hotel and Camp Stay as Per Itinerary",
        "Camel Safari at Sam Sand Dunes",
        "Traditional Welcome and Rajasthani Cultural Program",
        "Evening Tea & Snacks at Desert Camp",
        "Sightseeing as per the itinerary",
        "Pickup & Drop from Jaipur",
        "Toll Tax, Parking Charges & Driver Allowance"
      ],
      exclusions: [
        "Airfare / Train Fare",
        "GST",
        "Monument Entry Tickets & Guide Charges",
        "Meals not mentioned in the inclusions",
        "Personal Expenses (Laundry, Shopping, Telephone, Tips, Mineral Water, Soft Drinks, etc.)",
        "Additional Vehicle Usage or Sightseeing not mentioned in the itinerary",
        "Adventure Activities & Optional Experiences",
        "Expenses arising due to natural calamities, roadblocks, strikes, or unforeseen circumstances",
        "Charges for alternate vehicles due to weather or road restrictions (if applicable)",
        "Travel Insurance",
        "Any service not specifically mentioned under Package Includes"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "magical-kashmir-srinagar-gulmarg-pahalgam-6c9c",
    title: "Magical Kashmir — Srinagar, Gulmarg & Pahalgam",
    location: "Kashmir · Gulmarg · Pahalgam",
    destination: "Kashmir",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-shree-tours-travels-05b2/pkg-magical-kashmir-srinagar-gulmarg-pahalgam-6c9c/img-1783099350134-5ofrhb.jpg",
    nights: 5,
    days: 6,
    pax: "2–10 pax",
    hotelStars: 4,
    tags: ["Adventure"],
    region: "India",
    operator: "Shree Tours & Travels",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 22050,
    price: 22050,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-shree-tours-travels-05b2/pkg-magical-kashmir-srinagar-gulmarg-pahalgam-6c9c/img-1783099350134-5ofrhb.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-shree-tours-travels-05b2/pkg-magical-kashmir-srinagar-gulmarg-pahalgam-6c9c/img-1783099364118-1xg4xr.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-shree-tours-travels-05b2/pkg-magical-kashmir-srinagar-gulmarg-pahalgam-6c9c/img-1783099387263-6qqbzr.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-shree-tours-travels-05b2/pkg-magical-kashmir-srinagar-gulmarg-pahalgam-6c9c/img-1783099395900-dc3vc1.jpg"
      ],
      summary: "Magical Kashmir — Srinagar, Gulmarg & Pahalgam is a 6-day itinerary through Kashmir · Gulmarg · Pahalgam.",
      places: [
        "Kashmir",
        "Gulmarg",
        "Pahalgam"
      ],
      highlights: [
        "Sunset Shikara ride at Dal Lake"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Srinagar & Dal Lake Shikara ride",
          route: "Kashmir",
          description: "Land at Srinagar airport, meet your driver and check in to a houseboat on Dal Lake. Evening Shikara ride past floating gardens and the vegetable market as the sun sets over the Zabarwan hills.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Day trip to Sonamarg",
          route: "Gulmarg",
          description: "Full-day excursion to Sonamarg, the \"Meadow of Gold\". Optional pony ride or 4x4 to Thajiwas Glacier, where snow lingers even in summer.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Srinagar to Pahalgam via saffron fields",
          route: "Pahalgam",
          description: "Drive to Pahalgam along the Lidder river, stopping at Pampore saffron fields and Avantipora ruins. Afternoon at leisure in the pine forests. Details:",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Pahalgam valleys, then Gulmarg",
          route: "Pahalgam",
          description: "Morning visit to Chandanwari or Aru Valley, then drive to Gulmarg through apple orchards. Evening stroll on Asia's highest golf course meadow. Details:",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Gulmarg Gondola & return to Srinagar",
          route: "Pahalgam",
          description: "Ride the Gulmarg Gondola Phase 1 to Kongdoori for panoramic Himalayan views (Phase 2 optional). Return to Srinagar for Mughal Gardens and local shopping.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Departure",
          route: "Pahalgam",
          description: "Breakfast and airport drop with a stop for dry fruits and Kashmiri kahwa shopping if time permits.",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "Daily Breakfast",
        "Daily Lunch"
      ],
      exclusions: [],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "coorg-mysore-explore-5bb5",
    title: "COORG - MYSORE EXPLORE",
    location: "Coorg · Mysore",
    destination: "Coorg",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-skytora-74ad/new/img-1786481447904-ta6o42.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Mountains", "Adventure", "Wildlife", "Heritage", "Honeymoon"],
    region: "India",
    operator: "Skytora",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 14249,
    price: 14249,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-skytora-74ad/new/img-1786481447904-ta6o42.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-skytora-74ad/new/img-1786481520366-hd5vr3.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-skytora-74ad/new/img-1786481620686-b0wq3h.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-skytora-74ad/new/img-1786481655934-xl7hpe.jpg"
      ],
      summary: "COORG - MYSORE  EXPLORE is a 5-day itinerary through Coorg · Mysore.",
      places: [
        "Coorg",
        "Mysore"
      ],
      highlights: [
        "All major sightseeing",
        "All day breakfast included",
        "Private Transfers",
        "24/7 assistance"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in",
          route: "Coorg",
          description: "EVENING SUNSET TOUR",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "FULL DAY COORG TOUR",
          route: "Mysore",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "CHECKOUT AND TRAVEL TO MYSORE",
          route: "Mysore",
          description: "MYSORE FULL DAY TOUR",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "MYSORE HALF DAY TOUR",
          route: "Mysore",
          description: "CHECKOUT AND DROPP OFF TO PICKUP CITY (Bangalore / Mangalore)",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "Breakfast at the hotel",
        "AC Private transfer",
        "3/4 Star hotel",
        "Driver allowance",
        "Fuel",
        "Toll ,taxes and parking charges"
      ],
      exclusions: [
        "Airfare / train tickets",
        "Personal expenses",
        "Anything not mentioned under inclusions"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 30 % of package cost. 15–29 days before departure: 40 % of package cost. 7–14 days before departure: 75 % of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "bali-adventure-516e",
    title: "Bali Adventure",
    location: "Bali",
    destination: "Bali",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-svayatra-30d8/new/img-1784608308614-3y6asy.webp",
    nights: 6,
    days: 7,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Honeymoon", "Treks", "Mountains", "Adventure"],
    region: "International",
    operator: "Svayatra",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 45000,
    price: 45000,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-svayatra-30d8/new/img-1784608308614-3y6asy.webp"
      ],
      summary: "Bali Adventure is a 7-day itinerary through Bali.",
      places: [
        "Bali"
      ],
      highlights: [
        "Full-Day Deluxe Watersports Tour Visit Uluwatu Temple Watch the Famous Kecak Dance Performance Nusa Penida West Island Tour Two-Way Ferry Tickets Included Local Lunch Included Guided Mount Batur Trek (Jeep Tour) Kintamani Volcano Experience White Water Rafting Adventure ATV Tandem Ride Private Transfers & Sightseeing"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Bali",
          route: "Bali",
          description: "Arrival at Bali International Airport. Meet & greet by local representative. Hotel check-in. Free time to relax.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Deluxe Watersports & Uluwatu Temple",
          route: "Bali",
          description: "Enjoy an exciting day featuring: Banana Boat Ride Jet Ski Parasailing Uluwatu Temple Visit Evening Kecak Dance Show",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Nusa Penida West Tour",
          route: "Bali",
          description: "After breakfast, proceed for a full-day island tour. Visit: Kelingking Beach Broken Beach Angel Billabong 3-Point Snorkeling (Sharing Boat) Includes: Local Lunch Two-Way Ferry Tickets",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Leisure Day",
          route: "Bali",
          description: "Enjoy the day at your own pace. You can: Relax at the resort Visit nearby beaches Explore local markets Try Balinese spa treatments",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Mount Batur Jeep Trek",
          route: "Bali",
          description: "Explore the scenic beauty of Kintamani. Highlights: Guided Mount Batur Jeep Trek Stunning volcanic landscapes Beautiful sunrise viewpoints Nature photography",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Rafting & ATV Adventure",
          route: "Bali",
          description: "Adventure-filled day including: White Water Rafting (160 Minutes) ATV Tandem Ride (60 Minutes) Local Lunch Surya Bintang Adventures",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 7,
          title: "Departure",
          route: "Bali",
          description: "Breakfast at hotel. Check-out. Transfer to Bali Airport. Tour ends with wonderful memories.",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "daily breakfast at hotel"
      ],
      exclusions: [],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "sri-lanka-luxury-group-tour-5-0c14",
    title: "Sri Lanka Luxury Classy Fix departure",
    location: "Sri Lanka · Kandy · Nuwara Eliya · Bentota",
    destination: "Sri Lanka",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/new/img-1786368602447-ylsyf1.jpg",
    nights: 6,
    days: 7,
    pax: "2–10 pax",
    hotelStars: 5,
    tags: ["Luxury"],
    region: "International",
    operator: "EXOTIC ALLEY",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 125000,
    price: 125000,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/new/img-1786368602447-ylsyf1.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/new/img-1786368603950-8ndbx1.jpg"
      ],
      summary: "Sri Lanka Luxury Classy Fix departure is a 7-day itinerary through Sri Lanka · Kandy · Nuwara Eliya · Bentota.",
      places: [
        "Sri Lanka",
        "Kandy",
        "Nuwara Eliya",
        "Bentota",
        "Colombo"
      ],
      highlights: [
        "Pinnawala Elephant Orphanage",
        "Temple of the Tooth",
        "Gregory Lake – Nuwara Eliya",
        "Ella Nine Arch Bridge",
        "Madu River Boat Safari",
        "Madu River Boat Safari"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Kandy",
          route: "Sri Lanka",
          description: "Arrive at Colombo International Airport; scenic drive to Kandy; Pinnawala Elephant Orphanage; Spice & Herbal Garden; traditional Sri Lankan cultural show; complimentary Gem Museum visit; hotel check-in.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Kandy → Nuwara Eliya",
          route: "Kandy",
          description: "Visit Temple of the Tooth; brief Kandy City Tour including Kandy Lake; continue to Nuwara Eliya; visit Ramboda Hanuman Temple, Ramboda Waterfall, tea plantation and tea factory en route.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Ella Excursion",
          route: "Nuwara Eliya",
          description: "Head to Ella; visit Ravana Falls and Nine Arch Bridge; return journey via Seetha Agni Pariksha Temple, Hakgala Botanical Garden (Ashok Vatika) and Seetha Amman Temple.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Nuwara Eliya → Bentota",
          route: "Bentota",
          description: "Explore Nuwara Eliya including Gregory Lake, Victoria Park and Gayathri Peedam Temple; drive to coastal Bentota; optional white-water rafting at Kitulgala en route.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Bentota Experience",
          route: "Colombo",
          description: "Madu River boat safari through mangroves; visit Kosgoda Turtle Hatchery; leisure time at Bentota Beach; optional water sports.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Bentota → Colombo",
          route: "Colombo",
          description: "Proceed to Colombo after breakfast; visit Kelaniya Vibhishana Temple and Anjaneyar Temple; evening leisure in Colombo; optional casinos or pubs.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 7,
          title: "Colombo Departure",
          route: "Colombo",
          description: "After breakfast, Colombo City Tour with time for shopping; transfer to Colombo International Airport; depart for home.",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [
        { name: "Grand Kandyan Hotel", nights: 0, place: "Sri Lanka · Kandy · Nuwara Eliya · Bentota", comfort: "5-star category stay" },
        { name: "Araliya Green City", nights: 0, place: "Sri Lanka · Kandy · Nuwara Eliya · Bentota", comfort: "5-star category stay" },
        { name: "Cinnamon Bey Beruwala", nights: 0, place: "Sri Lanka · Kandy · Nuwara Eliya · Bentota", comfort: "5-star category stay" },
        { name: "NH Collection Colombo", nights: 0, place: "Sri Lanka · Kandy · Nuwara Eliya · Bentota", comfort: "5-star category stay" }
      ],
      inclusions: [
        "Flights",
        "Visa",
        "Hotels",
        "Meals",
        "Activities/Sightseeing"
      ],
      exclusions: [
        "GST & TCS, subject to government policy",
        "Optional activities",
        "Personal expenses such as:  Shopping ,  Alcohol ,Mini-bar usage",
        "Any applicable surcharge,  Portages, Travel insurance",
        "Any item other than what is specifically included in the package rates",
        "Any increase in:  Government taxes, Fuel charges, Service tax, Other applicable taxes"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Included",
      cancellationPolicy: "105 Days+: Cancellation charges INR  1,25,000. 75-105 Days: 50% of tour cost. 45-75 Days: 75% of tour cost. Last 45 Days: 100% of tour cost",
    },
  },
  {
    id: "superb-bali-c189",
    title: "Superb Bali",
    location: "Bali",
    destination: "Bali",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783953890899-u7w7sv.jpg",
    nights: 5,
    days: 6,
    pax: "2–10 pax",
    hotelStars: 4,
    tags: ["Beaches", "Mountains", "Adventure", "Honeymoon", "Wildlife", "Heritage"],
    region: "International",
    operator: "The Holiday Time",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 20000,
    price: 20000,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783953890899-u7w7sv.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783953895065-a3hwz8.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783953902891-5rvl05.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783953907696-y0ni18.jpg"
      ],
      summary: "Superb Bali is a 6-day itinerary through Bali.",
      places: [
        "Bali"
      ],
      highlights: [
        "Standard hotel check-in 3:00 PM, check-out 10:00 AM.",
        "All transfers in air-conditioned vehicles (AC may not work in hill regions).",
        "Itinerary may be re-sequenced due to weather, road or flight conditions.",
        "A valid government photo ID is mandatory for all travellers at check-in."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in",
          route: "Bali",
          description: "Arrival & check-in & Relax",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Watersports + Uluwatu",
          route: "Bali",
          description: "Banana Boat, Jet Ski, Parasailing + Uluwatu Temple.",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "South Bali Beach Hopping",
          route: "Bali",
          description: "Nusa Dua Peninsula Island, Pandawa Beach, Nyang Nyang Beach, Sunset at Jimbaran Beach.",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Free Leisure Day",
          route: "Bali",
          description: "Relax",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Inter-hotel + Ubud Tour",
          route: "Bali",
          description: "Coffee Plantation, Tegenungan Falls, Bali Jungle Swing (no lunch), Ubud Art Market.",
          meals: "Breakfast",
        },
        {
          day: 6,
          title: "Departure",
          route: "Bali",
          description: "Flight to Home",
          meals: "Breakfast",
        }
      ],
      stays: [
        { name: "Kuta Central Park Hotel - Superior Room", nights: 0, place: "Bali", comfort: "4-star category stay" },
        { name: "Kori Maharani Villas - One Bedroom Garden Private Pool Villa", nights: 0, place: "Bali", comfort: "4-star category stay" }
      ],
      inclusions: [
        "Arrival Transfer & Departure Transfer",
        "4* Hotel Stay",
        "Breakfast",
        "Watersports + Uluwatu",
        "South Bali Beach Hopping",
        "Inter-hotel + Ubud Tour"
      ],
      exclusions: [
        "Domestic & International Flight Tickets",
        "GST, TCS, & Any Other Applicable Government Taxes",
        "Lunch & Personal Meals (Unless Specifically Mentioned)",
        "Personal Expenses such as Laundry, Telephone Calls, Shopping, mini-bars, Etc",
        "Any Optional Tours, Activities or Services",
        "Any Expenses Arising Due to Flight Delays, Cancellations, Natural Calamities, Force Majeure or Unforeseen Circumstances",
        "Anything Not Specifically Mentioned under \" Package Inclusions\""
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "60+ days before departure: 30% of package cost + Non Refundable Services. 45–29 days before departure: 65% of package cost + Non Refundable Services. 7–28 days before departure: 85% of package cost + Non Refundable Services. Within 7 days of departure: 100% of package cost + Non Refundable Services",
    },
  },
  {
    id: "mesmerising-vietnam-including-phu-quoc-copy-9654",
    title: "SENIOR SPECIAL - Discover Vietnam Tour - Hanoi, Halong, Ninh Binh, Da Nang, Hoi An & Hue",
    location: "Hanoi · Halong Bay · Ninh Binh · Da Nang",
    destination: "Vietnam",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784652309602-wytvc3.jpg",
    nights: 9,
    days: 10,
    pax: "2–10 pax",
    hotelStars: 4,
    tags: ["Beaches", "Mountains", "Heritage", "Family"],
    region: "International",
    operator: "The Thoughtful Travel",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 135000,
    price: 135000,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784652309602-wytvc3.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784652316712-w9ubbn.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784652338483-nmzq6j.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784652352962-uov2p4.jpg"
      ],
      summary: "SENIOR SPECIAL - Discover Vietnam Tour - Hanoi, Halong, Ninh Binh, Da Nang, Hoi An & Hue is a 10-day itinerary through Hanoi · Halong Bay · Ninh Binh · Da Nang.",
      places: [
        "Hanoi",
        "Halong Bay",
        "Ninh Binh",
        "Da Nang",
        "Hoi An",
        "Hue",
        "Vietnam"
      ],
      highlights: [
        "Day Trip to Halong Bay on a Cruise Boat with Buffet Lunch",
        "Ba Na Hills Tour including the Golden Hands Bridge",
        "Hoi An Memories Show – Grand outdoor cultural spectacle in Hoi An",
        "Dragon Bridge & Night Market Walk in Da Nang",
        "Day Trips to the scenic Ninh Binh & Hue Cities",
        "Small Groups of 10-12 PAX Only with Accompanying Tour Manager from start to end of tour."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in | Dinner | Water Puppet Show in Hanoi",
          route: "Hanoi",
          description: "Arrive in Hanoi, check in to your hotel, and unwind with a captivating traditional Vietnamese Water Puppet Show.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Day Trip to Halong Bay including Buffet Lunch on Cruise Boat",
          route: "Halong Bay",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Hanoi City Tour, Train Street, Hoan Kiem Lake",
          route: "Ninh Binh",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Day Trip to Ninh Binh from Hanoi",
          route: "Da Nang",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Arrival into Da Nang, Visit Dragon Bridge & Night Market",
          route: "Hoi An",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Day Trip to Hue City",
          route: "Hue",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 7,
          title: "Relax at the Beach in the morning. Marble Mountain in the afternoon. Arrive & Check into hotel at Hoi An",
          route: "Vietnam",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 8,
          title: "Day Trip to Ba Na Hills & Golden Hands Bridge",
          route: "Vietnam",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 9,
          title: "Explore Hoi An, Coconut Basket Tour & Hoi An Memories Show",
          route: "Vietnam",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 10,
          title: "Transfer to Airport | Depart Phu Quoc and Arrive at Bangalore",
          route: "Vietnam",
          description: "",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "Return Flights from Bangalore",
        "Domestic Flights within Vietnam",
        "Airport Transfers",
        "Hotels with Breakfast",
        "Meals (as per itinerary)",
        "All entrance tickets",
        "Accompanying tour manager from start to finish",
        "Forex Assistance | Visa & Insurance Advisory | Pre Departure Briefing | Post Return Get together"
      ],
      exclusions: [
        "Visa Costs",
        "Travel Insurance",
        "Tips & Personal Expenses",
        "Meals not mentioned in itinerary",
        "Any Increase in the Airfare / Rail / Bus / Cruise Fares",
        "Any Increase in the fuel surcharge or any kind of taxes levied by the respective government or statutory bodies",
        "Any add-on sightseeing/activities along with transfers if done other than mentioned in the tour program",
        "Any upgradation in the room category or air line class.",
        "Medicines or Medical Expenses required if any"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Included",
      cancellationPolicy: "60+ days before departure: 50% of package cost. 30-59  days before departure: 75% of package cost. 0-30  days before departure: 100% of package cost",
    },
  },
  {
    id: "astonishing-sri-lanka-8a8b",
    title: "Astonishing Sri Lanka",
    location: "Kandy · Nuwara Eliya · Bentota · Colombo",
    destination: "Sri Lanka",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784043259809-hw6tyc.jpg",
    nights: 5,
    days: 6,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Beaches", "Mountains", "Adventure", "Honeymoon", "Wildlife", "Heritage"],
    region: "International",
    operator: "The Holiday Time",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 35000,
    price: 35000,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784043259809-hw6tyc.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784043264023-udllwr.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784043267163-np8c7d.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784043271185-uwe85i.jpg"
      ],
      summary: "Astonishing Sri Lanka is a 6-day itinerary through Kandy · Nuwara Eliya · Bentota · Colombo.",
      places: [
        "Kandy",
        "Nuwara Eliya",
        "Bentota",
        "Colombo"
      ],
      highlights: [
        "Standard hotel check-in 3:00 PM, check-out 10:00 AM.",
        "All transfers in air-conditioned vehicles (AC may not work in hill regions).",
        "Itinerary may be re-sequenced due to weather, road or flight conditions.",
        "A valid government photo ID is mandatory for all travellers at check-in."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in & Relax",
          route: "Kandy",
          description: "Arrival & check-in & Relax",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Check Out and Enroute Kandy City Tour and Transfer to Nuwara Eliya",
          route: "Nuwara Eliya",
          description: "Check Out and Enroute Kandy City Tour and Transfer to Nuwara Eliya",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Check Out and Enroute Nuwara Eliya City Tour and Transfer to Bentota",
          route: "Bentota",
          description: "Check Out and Enroute Nuwara Eliya City Tour and Transfer to Bentota",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Bentota City Tour, Whale and Dolphin watching, Galle Dutch Fort & Unawatuna beach",
          route: "Colombo",
          description: "Bentota City Tour, Whale and Dolphin watching, Galle Dutch Fort & Unawatuna beach",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Check Out and Enroute Galle Face Green & Colombo city tour",
          route: "Colombo",
          description: "Check Out and Enroute Galle Face Green & Colombo city tour",
          meals: "Breakfast",
        },
        {
          day: 6,
          title: "Departure",
          route: "Colombo",
          description: "Flight to Home",
          meals: "Breakfast",
        }
      ],
      stays: [],
      inclusions: [
        "3* Hotel Stay",
        "Breakfast",
        "Pinnawala Elephant Orphanage",
        "Kandy Tooth Relic Temple",
        "Kandy Botanical Garden",
        "Kandy Gem Museum",
        "Batik factory",
        "Spice Garden with herbal massage",
        "Cultural show",
        "Ramboda Waterfalls and tea plantations",
        "Hanuman Temple",
        "Gregory Lake & Strawberry farm",
        "Kosgoda turtle hatchery",
        "Madu Ganga River Safari",
        "Whale and Dolphin watching",
        "Galle Dutch Fort",
        "Unawatuna beach",
        "Galle Face Green & Colombo city tour"
      ],
      exclusions: [
        "Domestic & International Flight Tickets",
        "GST, TCS, & Any Other Applicable Government Taxes",
        "Lunch & Personal Meals (Unless Specifically Mentioned)",
        "Personal Expenses such as Laundry, Telephone Calls, Shopping, mini-bars, Etc",
        "Any Optional Tours, Activities or Services",
        "Any Expenses Arising Due to Flight Delays, Cancellations, Natural Calamities, Force Majeure or Unforeseen Circumstances",
        "Anything Not Specifically Mentioned under \" Package Inclusions\""
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "60+ days before departure: 30% of package cost + Non Refundable Services. 45–29 days before departure: 65% of package cost + Non Refundable Services. 7–28 days before departure: 85% of package cost + Non Refundable Services. Within 7 days of departure: 100% of package cost + Non Refundable Services",
    },
  },
  {
    id: "two-capitals-with-northern-lights-fixed-departure-521e",
    title: "Two Capitals with Northern Lights Fixed Departure",
    location: "Moscow · St.Petersburg · Murmansk",
    destination: "Russia",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-our-only-planet-1384/new/img-1787306130392-cjx076.jpg",
    nights: 8,
    days: 9,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Mountains", "Adventure", "Heritage"],
    region: "International",
    operator: "Our Only Planet",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 282700,
    price: 282700,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-our-only-planet-1384/new/img-1787306130392-cjx076.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-our-only-planet-1384/new/img-1787306189160-gjtyvs.jpg"
      ],
      summary: "Two Capitals with Northern Lights Fixed Departure is a 9-day itinerary through Moscow · St.Petersburg · Murmansk.",
      places: [
        "Moscow",
        "St.Petersburg",
        "Murmansk"
      ],
      highlights: [
        "Northern Lights",
        "Moscow Metro Tour",
        "Cathedral of Christ the Saviour excursion",
        "Lenin Icebreaker"
      ],
      itinerary: [
        {
          day: 1,
          title: "Moscow",
          route: "Moscow",
          description: "Flight Delhi - Moscow Arrival in Moscow Transfer to the hotel Check-in at a hotel Welcome lunch from the company",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Moscow",
          route: "St.Petersburg",
          description: "2 Day, Moscow Breakfast at the hotel Panoramic city tour of Moscow with a private English-speaking guide. Discover the vibrant capital of Russia, where imperial grandeur meets modern energy. Stroll through Red Square, explore the Kremlin with a visit to Lenin’s Tomb, admire the colorful domes of Saint Basil’s Cathedral and the majestic Cathedral of Christ the Saviour — the largest Orthodox church in Russia — before experiencing the elegance of the Bolshoi Theatre and the breathtaking beauty of Moscow’s legendary metro stations.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Moscow-St.Petersburg",
          route: "Murmansk",
          description: "Breakfast at the hotel Transfer to the railway station Sapsan train to Saint-Petersburg Arrival in Saint-Petersburg Transfer to the hotel Check-in at a hotel",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "St.Petersburg",
          route: "Murmansk",
          description: "Breakfast at the hotel Panoramic city tour of Saint-Petersburg with a private English-speaking guide Explore the cultural jewel of Saint Petersburg, where imperial elegance meets timeless artistry. Stroll along graceful canals, marvel at the magnificent Winter Palace, and discover the world-renowned Hermitage Museum — one of the largest and most celebrated art museums on Earth — before admiring the breathtaking beauty of the Church of the Savior on Spilled Blood, a masterpiece of Russian architecture and history.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "St.Petersburg-Murmansk",
          route: "Murmansk",
          description: "Breakfast at the hotel Transfer to the airport Flight to Murmansk Arrival in Murmansk Panoramic city tour of Murmansk with an English-speaking guide Walk through the streets of the city and visit its main attractions: the “Alyosha” monument, the Church of the “Savior on the Waters”, the “Mayak” and “Kursk” memorials, and visit the world's first nuclear “Lenin” icebreaker (entrance ticket included). Learn about city's modern education and development, discover interesting facts. Transfer to Aurora Village Check-in at the village The village is located between the capital of the northern lights – Murmansk and the Arctic Ocean. In this place, it is absolutely dark and the light of the city does not interfere at all with a comfortable observation of the natural miracle.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Murmansk",
          route: "Murmansk",
          description: "Breakfast at the hotel Teriberka village excursion with an optional boat trip Discover one of the few places where you can comfortably reach the shore of the Arctic Ocean, visit the famous ship graveyard, take a walk through the Nature Park, where you'll see the Dragon's Eggs beach and the Battery Waterfall, and go in search of marine life. Return to Murmansk Check-in at a hotel",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 7,
          title: "Murmansk",
          route: "Murmansk",
          description: "Breakfast at the hotel Saami village and Husky Park OR Kirovsk, Khibiny Mountains & Snow Village (the location depends on the weather)",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 8,
          title: "Murmansk-Moscow",
          route: "Murmansk",
          description: "Breakfast at the hotel Transfer to the airport Flight to Moscow Flight to Delhi",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "●\tAccommodation in Hotels with breakfast",
        "●\tAll tours and excursions as per the itinerary",
        "●\tAll transfers by bus as per program",
        "●\tSapsan train tickets Moscow – Saint-Petersburg",
        "●\tFlights Saint-Petersburg – Murmansk, Murmansk – Moscow",
        "●\tFlights Delhi – Moscow, Moscow - Delhi",
        "●\tInsurance"
      ],
      exclusions: [
        "●\tLunches, dinners",
        "●\tRussian e-visa fees",
        "●\tAdditional excursion programs",
        "●\tEntrance tickets to museums not mentioned in the itinerary"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "new-zealand-luxury-group-tour-a3b4",
    title: "New Zealand Luxury Group Tour",
    location: "Auckland · Rotorua · Queenstown · Lake Tekapo",
    destination: "New Zealand",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/pkg-new-zealand-luxury-group-tour-a3b4/img-1786355049333-wxcb8t.jpg",
    nights: 11,
    days: 12,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Adventure", "Luxury"],
    region: "International",
    operator: "EXOTIC ALLEY",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 519999,
    price: 519999,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/pkg-new-zealand-luxury-group-tour-a3b4/img-1786355049333-wxcb8t.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/pkg-new-zealand-luxury-group-tour-a3b4/img-1786355056950-t363jy.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/pkg-new-zealand-luxury-group-tour-a3b4/img-1786355067524-tatn98.jpg"
      ],
      summary: "New Zealand Luxury Group Tour is a 12-day itinerary through Auckland · Rotorua · Queenstown · Lake Tekapo.",
      places: [
        "Auckland",
        "Rotorua",
        "Queenstown",
        "Lake Tekapo",
        "Christchurch"
      ],
      highlights: [
        "Milford Sound Cruise",
        "Lavender Fields",
        "Heli Ride",
        "Te Puia",
        "Redwood Night walk",
        "Waitomo Caves"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival in auckland",
          route: "Auckland",
          description: "Upon arrival at Auckland International Airport, meet your tour manager and transfer to your hotel for check-in. Relax after your journey and enjoy the remainder of the day at leisure.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Waitomo Glowworm Caves & Redwoods Nightlights",
          route: "Rotorua",
          description: "After breakfast, proceed towards Rotorua via the world-famous Waitomo Glowworm Caves. Experience the magical underground caverns illuminated by thousands of glowworms. Later in the evening, enjoy the enchanting Redwoods Nightlights walk through beautifully illuminated forest trails",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Te Puia, Maori Experience & Rotorua City Tour",
          route: "Queenstown",
          description: "After breakfast, visit the famous Te Puia Geothermal Valley to witness the spectacular Pohutu Geyser. Experience authentic Maori culture and traditions before enjoying a guided city tour of Rotorua's major attractions.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Leisure day for Adventure activities",
          route: "Lake Tekapo",
          description: "After breakfast, enjoy a full day at leisure to experience Queenstown's exciting optional adventure activities. Choose from thrilling experiences, explore the local markets, or simply relax amidst New Zealand's stunning landscapes.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Sky Tower & Auckland City Tour",
          route: "Christchurch",
          description: "After breakfast, proceed to Auckland and visit the iconic Sky Tower for breathtaking panoramic views of the city. Later, enjoy a guided Auckland City Tour covering the city's major attractions before checking in to your hotel",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Flight to Queenstown, KJet Ride, Gondola , Luge Experience",
          route: "Christchurch",
          description: "After breakfast, board your domestic flight to Queenstown, New Zealand's adventure capital. Upon arrival, experience the thrilling KJet Ride across the crystal-clear waters of the Shotover and Kawarau Rivers. Later, ride the Skyline Gondola to enjoy breathtaking panoramic views of Queenstown before experiencing the exciting Luge Ride, one of the region's most popular attractions.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 7,
          title: "Wanaka Day Tour, Puzzling World & lavender farm",
          route: "Christchurch",
          description: "After breakfast, enjoy a scenic excursion to Wanaka. Visit the famous Puzzling World and explore the beautiful Lavender Farm surrounded by stunning alpine scenery before returning to Queenstown.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 8,
          title: "Leisure for Adventure Activities",
          route: "Christchurch",
          description: "After breakfast, enjoy another free day to experience Queenstown's optional adventure activities. Spend your day exploring the town, shopping, or participating in exciting outdoor experiences",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 9,
          title: "Milford Sound Scenic Excursion",
          route: "Christchurch",
          description: "After breakfast, depart for a full-day scenic coach excursion to Milford Sound through Fiordland National Park. Admire breathtaking waterfalls, towering mountains, and spectacular fjords while enjoying an Indian lunch before returning to Queenstown.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 10,
          title: "Helicopter Ride & Stargazing Experience",
          route: "Christchurch",
          description: "After breakfast, proceed towards Lake Tekapo. Enjoy a spectacular 25-minute helicopter ride over the Southern Alps before experiencing the world-renowned Stargazing with Hot Pool in the International Dark Sky Reserve.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 11,
          title: "International Antarctic Centre & Tram Experience",
          route: "Christchurch",
          description: "After breakfast, travel to Christchurch and visit the International Antarctic Centre to enjoy its interactive exhibits. Later, explore the city aboard the heritage Christchurch Tram before checking in to your hotel.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 12,
          title: "Departure",
          route: "Christchurch",
          description: "After breakfast, check out from the hotel and transfer to Christchurch International Airport for your onward flight back home with unforgettable memories of New Zealand.",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [
        { name: "Holiday Inn Auckland Airport", nights: 0, place: "Auckland · Rotorua · Queenstown · Lake Tekapo", comfort: "3-star category stay" },
        { name: "Novotel Rotorua Lakeside", nights: 0, place: "Auckland · Rotorua · Queenstown · Lake Tekapo", comfort: "3-star category stay" },
        { name: "SkyCity Hotel Auckland", nights: 0, place: "Auckland · Rotorua · Queenstown · Lake Tekapo", comfort: "3-star category stay" },
        { name: "Holiday Inn Express & Suites Queenstown", nights: 0, place: "Auckland · Rotorua · Queenstown · Lake Tekapo", comfort: "3-star category stay" },
        { name: "OakRidge Wanaka", nights: 0, place: "Auckland · Rotorua · Queenstown · Lake Tekapo", comfort: "3-star category stay" },
        { name: "DoubleTree by Hilton Christchurch", nights: 0, place: "Auckland · Rotorua · Queenstown · Lake Tekapo", comfort: "3-star category stay" }
      ],
      inclusions: [
        "Activities :- Arrival at Auckland & Hotel Check-in Waitomo Glowworm Caves, Redwoods Nightlights &  Transfer to Rotorua Te Puia Geothermal Valley, Maori Cultural Experience &  Rotorua City Tour Leisure Day for Optional Adventure Activities Sky Tower Experience & Auckland City Tour Domestic Flight to Queenstown, Skyline Gondola &  Luge Ride Stay Wanaka Day Tour – Puzzling World & Lavender Farm  Experience Leisure Day for Optional Adventure Activities  Insurance Insurance Milford Sound Scenic Coach Excursion with Indian  Lunch Scenic Transfer to Lake Tekapo, 25-Minute Helicopter  Ride & Stargazing with Hot Pool International Antarctic Centre & Christchurch Tram  Experience",
        "Insurance",
        "Meals",
        "Visa",
        "Hotela"
      ],
      exclusions: [
        "GST & TCS Subject to Government Policy",
        "Cost of Any personal Exp. like shopping, alcohol etc",
        "Surcharge if any applicable",
        "Portages",
        "Optional Activities",
        "Usage of Mini bar",
        "Any other item except \"Package rates Includes\"",
        "Any increase in government tax, fuel Charges",
        "Service tax or any other tax"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Included",
      cancellationPolicy: "105 Days+: Cancellation charges INR  1,85,000. 75-105 Days: 50% of tour cost. 45-75 Days: 70% of tour cost. Last 45 Days: 100% of tour cost",
    },
  },
  {
    id: "taipei-taiwan-tour-package-5n-6d-jiufen-shifen-0eb6",
    title: "Taipei Taiwan Tour Package 5N/6D · Jiufen & Shifen",
    location: "Taipei · Jiufen · Shifen · Yehliu",
    destination: "Taiwan",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-trips-and-tents-af37/pkg-taipei-taiwan-tour-package-5n-6d-jiufen-shifen-0eb6/img-1786500127868-qm5gze.jpg",
    nights: 5,
    days: 6,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Adventure", "Heritage"],
    region: "International",
    operator: "Trips And Tents",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 44900,
    price: 44900,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-trips-and-tents-af37/pkg-taipei-taiwan-tour-package-5n-6d-jiufen-shifen-0eb6/img-1786500127868-qm5gze.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-trips-and-tents-af37/pkg-taipei-taiwan-tour-package-5n-6d-jiufen-shifen-0eb6/img-1786500172438-4mv25y.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-trips-and-tents-af37/pkg-taipei-taiwan-tour-package-5n-6d-jiufen-shifen-0eb6/img-1786500230304-ext7xe.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-trips-and-tents-af37/pkg-taipei-taiwan-tour-package-5n-6d-jiufen-shifen-0eb6/img-1786500357501-gl0rqd.jpg"
      ],
      summary: "Taipei Taiwan Tour Package 5N/6D · Jiufen & Shifen is a 6-day itinerary through Taipei · Jiufen · Shifen · Yehliu.",
      places: [
        "Taipei",
        "Jiufen",
        "Shifen",
        "Yehliu"
      ],
      highlights: [
        "Panoramic Taipei 101 experience and Taipei city views",
        "Explore the atmospheric old streets of Jiufen",
        "Visit Shifen and experience its famous railway-town charm",
        "Discover the dramatic rock formations of Yehliu Geopark",
        "Taste authentic Taiwanese flavours at a lively night market",
        "Experience Taipei's temples, culture and modern city life"
      ],
      itinerary: [
        {
          day: 1,
          title: "Taipei City Highlights | Taipei 101 & Traditional Taipei",
          route: "Taipei",
          description: "Discover the contrast between Taipei's futuristic skyline and its centuries-old cultural heritage.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Jiufen & Shifen | Old Streets, Mountains & Railway Towns",
          route: "Jiufen",
          description: "Escape the city for a memorable Northern Taiwan day trip combining mountain scenery, heritage streets and the atmospheric towns of Jiufen and Shifen.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Yehliu Geopark | Nature & Northern Coast",
          route: "Shifen",
          description: "Discover one of Northern Taiwan's most distinctive landscapes before returning to Taipei for an evening of leisure.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Taipei at Leisure | Shopping, Food & Culture",
          route: "Yehliu",
          description: "Enjoy a relaxed final day to experience Taipei according to your interests.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Taipei Departure",
          route: "Yehliu",
          description: "Enjoy breakfast and your final moments in Taipei before your private transfer to the airport.",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [
        { name: "★  Suggested hotel examples: Hotel Puri / City Suites Taipei Nandong / similar 3★ hotel    Comfortable, well-located accommodation ideal for budget-conscious travellers who want to spend more on experiences.", nights: 0, place: "Taipei · Jiufen · Shifen · Yehliu", comfort: "3-star category stay" },
        { name: "Premium — Comfort 4★  Suggested hotel examples: Caesar Park Taipei / Hotel Resonance Taipei / similar 4★ hotel .  Well-appointed 4★ accommodation in convenient Taipei locations, ideal for couples and families seeking greater comfort.", nights: 0, place: "Taipei · Jiufen · Shifen · Yehliu", comfort: "3-star category stay" },
        { name: "Deluxe — Luxury 5★  Suggested hotel examples: Grand Hyatt Taipei / Regent Taipei / Taipei Marriott Hotel / similar 5★ hotel :  Premium 5★ accommodation with elevated service, facilities and a luxury Taipei experience.", nights: 0, place: "Taipei · Jiufen · Shifen · Yehliu", comfort: "3-star category stay" }
      ],
      inclusions: [
        "Daily breakfast at the hotel",
        "5 nights accommodation in selected hotel category",
        "Private airport arrival transfer",
        "Private airport departure transfer",
        "Taipei city sightseeing as per itinerary",
        "Jiufen & Shifen excursion",
        "Yehliu Geopark excursion",
        "Air-conditioned vehicle for included transfers/sightseeing",
        "English-speaking driver/guide or local guide as applicable",
        "All sightseeing mentioned in the itinerary",
        "Travel assistance during the tour"
      ],
      exclusions: [
        "International airfare to/from Taiwan",
        "Taiwan visa/entry-related charges, if applicable",
        "Travel insurance",
        "Lunches and dinners unless specifically mentioned",
        "Taipei 101 observatory ticket, unless included in the selected package",
        "Personal expenses",
        "Shopping and beverages",
        "Tips and gratuities",
        "Any sightseeing or activity not mentioned under inclusions",
        "Early check-in and late check-out",
        "Any increase in taxes, entrance fees or transportation costs imposed after booking"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 7–14 days before departure: 50% of package cost. Within 7 days of departure: 100% of package cost",
    },
  },
  {
    id: "japan-luxury-group-tour-73cb",
    title: "Japan Luxury Group Tour",
    location: "Japan",
    destination: "Japan",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/new/img-1786105067472-tx1gll.jpg",
    nights: 9,
    days: 10,
    pax: "2–10 pax",
    hotelStars: 5,
    tags: ["Adventure", "Luxury"],
    region: "International",
    operator: "EXOTIC ALLEY",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 359999,
    price: 359999,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/new/img-1786105067472-tx1gll.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/pkg-japan-luxury-group-tour-73cb/img-1786110699519-ui8lti.jpg"
      ],
      summary: "Japan Luxury Group Tour is a 10-day itinerary through Japan.",
      places: [
        "Japan"
      ],
      highlights: [
        "Shinkansen Shinkansen Bullet Train Bullet Train,",
        "Universal Universal Studios Japan",
        "Tokyo DisneySea",
        "Mt. Fuji & Hakone Experience",
        "Kyoto Heritage Experience",
        "Tokyo City Highlights"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Tokyo Osaka By Bullet Train",
          route: "Japan",
          description: "Upon arrival at Haneda International Airport, meet your Tour Manager and transfer to the train station to board Japan's famous Shinkansen Bullet Train to Osaka. Upon arrival, check in to your hotel and spend the evening exploring the vibrant Dotonbori district.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Nara Excursion & Osaka City Tour",
          route: "Japan",
          description: "After breakfast, visit the famous Nara Deer Park and the magnificent Todai-ji Temple. Later, return to Osaka to explore the iconic Osaka Castle and enjoy panoramic city views from the Umeda Sky Building.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Hiroshima & Miyajima Experience",
          route: "Japan",
          description: "Board the Shinkansen Bullet Train to Hiroshima. Visit the historic Atomic Bomb Dome and Peace Memorial Park before taking a ferry to the beautiful Miyajima Island to witness the famous floating Torii Gate.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Universal Studios Japan",
          route: "Japan",
          description: "Enjoy a full day at Universal Studios Japan, home to exciting attractions including Super Nintendo World, The Wizarding World of Harry Potter, Minions Park and many thrilling rides and live entertainment experiences.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Kyoto Heritage Tour",
          route: "Japan",
          description: "Proceed to Kyoto and enjoy a scenic ride on the Sagano Romantic Train. Visit the Arashiyama Bamboo Forest, Kinkaku-ji (Golden Pavilion), Kiyomizu-dera Temple and the iconic Fushimi Inari Taisha Shrine.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Mt. Fuji & Hakone Experience",
          route: "Japan",
          description: "Travel by Bullet Train to Odawara and proceed towards the Mt. Fuji region. Visit the famous Mt. Fuji 5th Station (subject to weather conditions), enjoy the Hakone Ropeway and conclude the day with a scenic Lake Ashi Cruise",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 7,
          title: "Tokyo City Highlights",
          route: "Japan",
          description: "Drive to Tokyo and experience the world-famous Shibuya Crossing. Later, explore the futuristic waterfront district of Odaiba while enjoying spectacular views of Tokyo Bay",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 8,
          title: "Tokyo City Tour",
          route: "Japan",
          description: "After breakfast, visit the iconic Tokyo Skytree, explore the historic Asakusa Senso-ji Temple, enjoy a relaxing Sumida River Cruise and immerse yourself in the digital art world of TeamLab Planets Tokyo.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 9,
          title: "Tokyo DisneySea",
          route: "Japan",
          description: "Spend a magical day at Tokyo DisneySea, one of the world's most unique Disney theme parks, featuring thrilling attractions, themed ports, spectacular entertainment and unforgettable experiences.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 10,
          title: "Departure",
          route: "Japan",
          description: "After breakfast, check out from the hotel and transfer to the airport for your onward flight back home, carrying unforgettable memories of your Japan journey",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [
        { name: "Anchored by RIHGA Osaka Namba (Or Similar) , Osaka", nights: 0, place: "Japan", comfort: "5-star category stay" },
        { name: "Hotel Gracery Kyoto Sanjo (Or Similar) , Kyoto", nights: 0, place: "Japan", comfort: "5-star category stay" },
        { name: "Numazu Riverside Hotel (Or Similar) , Numazu", nights: 0, place: "Japan", comfort: "5-star category stay" },
        { name: "Shinjuku Washington Hotel Main (Or Similar)", nights: 0, place: "Japan", comfort: "5-star category stay" }
      ],
      inclusions: [
        "Flights:- 1.  Return International Flight: Ex-Mumbai 2. Domestic Flights as per itinerary",
        "Activities ;- Arrival in Tokyo, Shinkansen Bullet Train to Osaka & Dotonbori Nara Deer Park, Todai-ji Temple, Osaka Castle &  Umeda Sky Building Hiroshima, Peace Memorial Park, Atomic Bomb Dome  & Miyajima Island Full Day at Universal Studios Japan Sagano Romantic Train, Arashiyama Bamboo Forest,  Kinkaku-ji, Kiyomizu-dera & Fushimi Inari Shrine Shinkansen to Odawara, Mt. Fuji 5th Station, Hakone  Ropeway & Lake Ashi Cruise Tokyo Transfer, Shibuya Crossing & Odaiba Full Day at Tokyo DisneySea Tokyo Skytree, Asakusa Senso-ji Temple, Sumida River  Cruise & TeamLab Planets",
        "4 and 5 star Hotels",
        "Meals :- 09 Breakfasts At The Hotel (Western / Japanese Breakfast) 06 Indian Lunches 09 Indian Dinners Packed Meals may be provided for logistical reasons."
      ],
      exclusions: [
        "Disney Premiere access pass not included",
        "Universal Express is not included",
        "GST & TCS Subject to Government Policy",
        "Cost of Any personal Exp. like shopping, alcohol etc",
        "Surcharge if any applicable",
        "Optional Activities",
        "Usage of Mini bar",
        "Any other item except \"Package rates Includes\"",
        "Any increase in government tax, fuel Charges,",
        "Service tax or any other tax",
        "Portages"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Included",
      cancellationPolicy: "105 Days+: Cancellation charges INR  1,15,000. 75-105 Days: 50% of tour cost. 45-75 Days: 75% of tour cost. Last 45 Days: 100% of tour cost",
    },
  },
  {
    id: "scenic-thailand-fc95",
    title: "Scenic Thailand",
    location: "Phuket · Krabi",
    destination: "Thailand",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784213219079-c8m0qe.jpg",
    nights: 5,
    days: 6,
    pax: "2–10 pax",
    hotelStars: 3,
    tags: ["Beaches", "Mountains", "Adventure", "Honeymoon", "Wildlife", "Heritage"],
    region: "International",
    operator: "The Holiday Time",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 19000,
    price: 19000,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784213219079-c8m0qe.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784213225633-vvgzh6.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784213430214-9phqng.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1784213433661-3o6ar2.jpg"
      ],
      summary: "Scenic Thailand is a 6-day itinerary through Phuket · Krabi.",
      places: [
        "Phuket",
        "Krabi"
      ],
      highlights: [
        "Immerse yourself in Thailand’s breathtaking landscapes, from lush jungles to stunning coastlines and serene temples.   Experience authentic Thai culture through vibrant markets, traditional performances, and local culinary delights.   Discover hidden gems and iconic sights, including ancient ruins, vibrant cities, and pristine beaches.   Enjoy personalized guided tours that bring Thailand’s rich history and natural beauty to life.   Capture unforgettable moments with picture-perfect scenery at every turn."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival into Bangkok Airport and Transfer to Pattaya",
          route: "Phuket",
          description: "Arrival into Bangkok Airport and Transfer to Pattaya",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Coral Island by speedboat",
          route: "Krabi",
          description: "Coral Island by speedboat",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Transfer from Pattaya to Bangkok and Relax",
          route: "Krabi",
          description: "Transfer from Pattaya to Bangkok and Relax",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Bangkok City and Temple Tour with Gems Gallery",
          route: "Krabi",
          description: "Bangkok City and Temple Tour with Gems Gallery",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Departure",
          route: "Krabi",
          description: "Flight to Home",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [
        { name: "Golden Beach Pattaya", nights: 0, place: "Phuket · Krabi", comfort: "3-star category stay" },
        { name: "The Ecotel Bangkok Hotel", nights: 0, place: "Phuket · Krabi", comfort: "3-star category stay" }
      ],
      inclusions: [
        "3* Hotel Stay",
        "Breakfast",
        "Transfers from Bangkok Airport (BKK) – Pattaya Hotel – Bangkok Hotel – Bangkok Airport (BKK)",
        "Half Day Coral Island Tour with Lunch on Seat in Coach Basis",
        "Bangkok City & Temple Tour with Visit to Gems Gallery"
      ],
      exclusions: [
        "Domestic & International Flight Tickets",
        "GST, TCS, & Any Other Applicable Government Taxes",
        "Lunch & Personal Meals (Unless Specifically Mentioned)",
        "Personal Expenses such as Laundry, Telephone Calls, Shopping, mini-bars, Etc",
        "Any Optional Tours, Activities or Services",
        "Any Expenses Arising Due to Flight Delays, Cancellations, Natural Calamities, Force Majeure or Unforeseen Circumstances",
        "Anything Not Specifically Mentioned under \" Package Inclusions\""
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "60+ days before departure: 30% of package cost + Non Refundable Services. 45–29 days before departure: 65% of package cost + Non Refundable Services. 7–28 days before departure: 85% of package cost + Non Refundable Services. Within 7 days of departure: 100% of package cost + Non Refundable Services",
    },
  },
  {
    id: "hong-kong-cruise-getaway-dd5e",
    title: "Hong Kong & Cruise Getaway",
    location: "Hong Kong · Cruise",
    destination: "Hong Kong",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783956183818-0xov8d.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 4,
    tags: ["Beaches", "Mountains", "Adventure", "Honeymoon", "Heritage"],
    region: "International",
    operator: "The Holiday Time",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 80000,
    price: 80000,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783956183818-0xov8d.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783956186925-skxksz.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783956190625-hbiiju.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783956209990-b8utzn.jpg"
      ],
      summary: "Hong Kong & Cruise Getaway is a 5-day itinerary through Hong Kong · Cruise.",
      places: [
        "Hong Kong",
        "Cruise"
      ],
      highlights: [
        "Standard hotel check-in 3:00 PM, check-out 10:00 AM.",
        "All transfers in air-conditioned vehicles (AC may not work in hill regions).",
        "Itinerary may be re-sequenced due to weather, road or flight conditions.",
        "A valid government photo ID is mandatory for all travellers at check-in."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in & Relax",
          route: "Hong Kong",
          description: "Arrival & check-in & Relax",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Disneyland tour with ticket & Hong Kong City Tour",
          route: "Cruise",
          description: "Proceed for Disneyland tour with ticket & Hong Kong City Tour",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Transfer to Star Voyager Cruise - Check In & Relax - At Sea",
          route: "Cruise",
          description: "Transfer to Star Voyager Cruise - Check In & Relax - At Sea",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "At Sea Aboard Star Voyager Cruise",
          route: "Cruise",
          description: "Relax at Star Voyager Cruise",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Departure",
          route: "Cruise",
          description: "Flight to Home",
          meals: "Breakfast",
        }
      ],
      stays: [
        { name: "Regal Kowloon Hotel", nights: 0, place: "Hong Kong · Cruise", comfort: "4-star category stay" },
        { name: "Star Voyager Cruise", nights: 0, place: "Hong Kong · Cruise", comfort: "4-star category stay" }
      ],
      inclusions: [
        "2 nights at Regal Kowloon Hotel",
        "2 nights on Star Voyager cruise",
        "Breakfast",
        "All Meals included at Star Voyager Cruise",
        "Disneyland tour with ticket",
        "Hong Kong city tour",
        "Private airport & cruise transfers"
      ],
      exclusions: [
        "Domestic & International Flight Tickets",
        "GST, TCS, & Any Other Applicable Government Taxes",
        "Lunch & Personal Meals (Unless Specifically Mentioned)",
        "Personal Expenses such as Laundry, Telephone Calls, Shopping, mini-bars, Etc",
        "Any Optional Tours, Activities or Services",
        "Any Expenses Arising Due to Flight Delays, Cancellations, Natural Calamities, Force Majeure or Unforeseen Circumstances",
        "Anything Not Specifically Mentioned under \" Package Inclusions\""
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "60+ days before departure: 30% of package cost + Non Refundable Services. 45–29 days before departure: 65% of package cost + Non Refundable Services. 7–28 days before departure: 85% of package cost + Non Refundable Services. Within 7 days of departure: 100% of package cost + Non Refundable Services",
    },
  },
  {
    id: "thailand-getaway-927f",
    title: "Thailand Getaway",
    location: "Thailand",
    destination: "Thailand",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-unbound-holidays-4a26/new/img-1785577327137-v4drxl.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 4,
    tags: ["Honeymoon"],
    region: "International",
    operator: "Unbound Holidays",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 48999,
    price: 48999,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-unbound-holidays-4a26/new/img-1785577327137-v4drxl.jpg"
      ],
      summary: "Thailand Getaway is a 5-day itinerary through Thailand.",
      places: [
        "Thailand"
      ],
      highlights: [
        "Non-stop Direct Akasa Air Flight- Flights also available from PUNE, NASHIK, SURAT, JAIPUR, NAGPUR (Charges differ from city to city)",
        "Free SIM + Free Insurance",
        "4 Star Hotels"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in",
          route: "Thailand",
          description: "Arrive at Phuket Airport and meet our team for a smooth transfer to your hotel. Check in, relax, and soak in the tropical vibes. Overnight stay at Phuket.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Phi Phi Island Adventure",
          route: "Thailand",
          description: "Enjoy breakfast at hotel. Full-day Phi Phi Island tour with lunch (SIC). Return to hotel and overnight stay at Phuket.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Phuket to Krabi – New Views Await",
          route: "Thailand",
          description: "Post breakfast, check out and transfer to Krabi. Enjoy a Phuket City Tour en route. Check in at Krabi hotel and relax. Overnight stay at Krabi.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Krabi 4 Island Hopping",
          route: "Thailand",
          description: "Enjoy breakfast at hotel. Full-day 4 Island tour with lunch (SIC). Return to hotel and overnight stay at Krabi.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Day 5 – Farewell Thailand",
          route: "Thailand",
          description: "Enjoy breakfast at hotel. Check out and transfer to Phuket Airport for your return flight. Depart with wonderful memories!",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [
        { name: "Best Western Patong Beach Hotel, Phuket", nights: 0, place: "Thailand", comfort: "4-star category stay" },
        { name: "Apple A Day, Krabi", nights: 0, place: "Thailand", comfort: "4-star category stay" }
      ],
      inclusions: [
        "Non Stop Direct Akasa Air Flights (Ex- Mumbai) (Roundtrip)",
        "2N Phuket – Hotel Best Western Patong (4 Star)",
        "2N Krabi – Hotel Apple A Day (4 Star)",
        "Phi Phi Island Tour with Lunch (SIC) – NPF excluded",
        "Krabi 4 Island Tour with Lunch (SIC) – NPF excluded",
        "Phuket City Tour (SIC)",
        "Airport & inter-hotel transfers (SIC)",
        "Daily Breakfast",
        "4N Stay",
        "Free SIM + Free Insurance"
      ],
      exclusions: [
        "National Park Fee (NPF) for Phi Phi & Krabi 4 Island tours",
        "Personal expenses (laundry, tips, shopping, minibar, etc.)",
        "Meals not mentioned in inclusions",
        "Any service not explicitly mentioned under inclusions"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Included",
      cancellationPolicy: "More than 25 days before departure: 30% cancellation charges. Within 25 days of departure: Non-Refundable",
    },
  },
  {
    id: "4-nights-maldives-all-meals-best-value-d03d",
    title: "Affordable Maldives Package · Perfect for Couples & Families",
    location: "Maldives",
    destination: "Maldives",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/new/img-1784136615134-nzjprm.jpg",
    nights: 4,
    days: 5,
    pax: "2–10 pax",
    hotelStars: 4,
    tags: ["Beaches", "Adventure", "Honeymoon"],
    region: "International",
    operator: "Live Love Trip Pvt Ltd",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 57000,
    price: 57000,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/new/img-1784136615134-nzjprm.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/new/img-1784136650033-pd1oxg.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/new/img-1784136745017-de0l31.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/new/img-1784136749571-kcurp9.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/new/img-1784136758481-xgjtod.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/new/img-1784136929468-ip7vmo.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/pkg-4-nights-maldives-all-meals-best-value-d03d/img-1784294459512-djfl84.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/pkg-4-nights-maldives-all-meals-best-value-d03d/img-1784294486754-mde956.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/pkg-4-nights-maldives-all-meals-best-value-d03d/img-1784304471238-ra0d4n.png",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-live-love-trip-pvt-ltd-bc05/pkg-4-nights-maldives-all-meals-best-value-d03d/img-1784306787468-okabqo.png"
      ],
      summary: "Affordable Maldives Package · Perfect for Couples & Families is a 5-day itinerary through Maldives.",
      places: [
        "Maldives"
      ],
      highlights: [
        "Full Board Meal Plan (Breakfast, Lunch & Dinner)",
        "Complimentary Sunset Cruise",
        "Complimentary 20-Minute Photoshoot with Printed Photo",
        "Complimentary Sheesha Session",
        "Complimentary Snorkelling Equipment",
        "Private Yoga & Wellness Session"
      ],
      itinerary: [
        {
          day: 1,
          title: "Welcome to the Resort",
          route: "Maldives",
          description: "Welcome to the Maldives! Transfer to your island resort, check in and begin your tropical holiday surrounded by crystal-clear waters and white sandy beaches.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Relax & Explore the Resort",
          route: "Maldives",
          description: "Wake up to beautiful ocean views and spend the day enjoying the resort's facilities or discovering the experiences included with your stay.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Experience the Excursions",
          route: "Maldives",
          description: "Make the most of your Maldives holiday with memorable experiences designed to help you relax, explore and create unforgettable moments.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Enjoy Paradise at Your Own Pace",
          route: "Maldives",
          description: "Spend another beautiful day enjoying the resort, taking in the stunning island surroundings and making the most of your Maldives escape.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Departure to Airport",
          route: "Maldives",
          description: "After breakfast, check out and transfer to the airport with unforgettable memories of your Maldives holiday.",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "Daily Breakfast, Lunch, and Dinner at the Main Restaurant",
        "Soft drinks, juices, water, tea, and coffee during mealtimes",
        "Daily replenishment of 2 x 500ml mineral water bottles in the villa",
        "In-room tea & coffee-making facilities",
        "Combined roundtrip speedboat transfers (MLE - Resort - MLE)",
        "Green Tax included",
        "Complimentary Wi-Fi in villas and public areas",
        "Complimentary use of swimming pool and gym",
        "Complimentary use of snorkelling equipment (subject to availability)",
        "Early check-in and late check-out (subject to availability)",
        "One complimentary sheesha session per stay",
        "One complimentary sunset cruise excursion per stay",
        "20-minute photoshoot at in-house studio including one printed 5-inch photo (Available 09:00 - 16:30, advance reservation required)",
        "Private yoga and wellness session once during the stay.",
        "Flexible check-in/out: Subject to availability.",
        "For Honeymooners: Bottle of Wine, Fruit Platter & Bed Decoration (once per stay)"
      ],
      exclusions: [
        "Airfare from City of Departure to Maldives",
        "Visa Cost (Except for Visa on Arrival)",
        "Tax Collected at Source (TCS) shall apply as per Government of India guidelines.",
        "Anything not mentioned in What's Included --- is Excluded."
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "30+ days before departure: 10% of package cost. 15–29 days before departure: 25% of package cost. 11–14 days before departure: 50% of package cost. Within 10 days of departure: 100% of package cost",
    },
  },
  {
    id: "senior-special-vietnam-cambodia-d362",
    title: "SENIOR SPECIAL - Vietnam & Cambodia Group Tour",
    location: "Vietnam · Cambodia · Hanoi · Halong Bay",
    destination: "Vietnam",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784711658186-4ex9gg.jpg",
    nights: 11,
    days: 12,
    pax: "2–10 pax",
    hotelStars: 4,
    tags: ["Beaches", "Mountains", "Adventure", "Heritage", "Family"],
    region: "International",
    operator: "The Thoughtful Travel",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 169999,
    price: 169999,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784711658186-4ex9gg.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784711666749-nat1ty.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784711689346-6ylg0f.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784711706677-utoci9.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784711723901-cqvxaz.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784711731054-xp5ozs.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784711737713-buaa38.webp",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-thoughtful-travel-470c/new/img-1784711770218-l7olxl.jpg"
      ],
      summary: "SENIOR SPECIAL - Vietnam & Cambodia Group Tour is a 12-day itinerary through Vietnam · Cambodia · Hanoi · Halong Bay.",
      places: [
        "Vietnam",
        "Cambodia",
        "Hanoi",
        "Halong Bay",
        "Ninh Binh",
        "Da Nang",
        "Hoi An"
      ],
      highlights: [
        "Cruise Trip to Halong Bay",
        "Ba Na Hills Tour with Golden Hands Bridge",
        "Hoi An Memories Show",
        "Sunrise Tour to Angkor Wat",
        "Floating Village Day Trip - Siem Reap",
        "Cambodian Apsara Dance Show"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in",
          route: "Vietnam",
          description: "Arrive in Hanoi, check in to your hotel, and unwind with a captivating traditional Vietnamese Water Puppet Show.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Day trip to Halong Bay including Buffet Lunch on a cruise boat",
          route: "Cambodia",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Hanoi City Tour, Train Street, Hoan Kiem Lake",
          route: "Hanoi",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Day trip to Ninh Binh",
          route: "Halong Bay",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Arrival into Da Nang | Dragon Bridge & Night Market Visit",
          route: "Ninh Binh",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Day Trip to Hue City - Former Capital of Vietnam",
          route: "Da Nang",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 7,
          title: "Marble Mountain Tour | Arrival & check in  at  Hoi An | Memories Show at Night",
          route: "Hoi An",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 8,
          title: "Day Trip to Ba Na Hills & Golden Hands Bridge",
          route: "Hoi An",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 9,
          title: "Depart Vietnam | Arrival into Siem Reap, Cambodia | Free Evening",
          route: "Hoi An",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 10,
          title: "Sunrise tour to Angkor Wat | Apsara Dance Show Evening",
          route: "Hoi An",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 11,
          title: "Floating Village Day Trip",
          route: "Hoi An",
          description: "",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 12,
          title: "Depart from Siem Reap | Arrival into Bangalore",
          route: "Hoi An",
          description: "",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [],
      inclusions: [
        "Return Flights from Bangalore",
        "Domestic Flights within Vietnam / Cambodia",
        "Airport Transfers",
        "Hotels with Breakfast",
        "Meals (as per itinerary)",
        "All entrance tickets",
        "Accompanying tour manager from start to finish",
        "Forex Assistance | Visa & Insurance Advisory | Pre Departure Briefing | Post Return Get together"
      ],
      exclusions: [
        "Visa",
        "Travel Insurance",
        "Tips & Personal Expenses",
        "Meals not mentioned in itinerary",
        "Any Increase in the Airfare / Rail / Bus / Cruise Fares",
        "Any Increase in the fuel surcharge or any kind of taxes levied by the respective government or statutory bodies",
        "Any add-on sightseeing/activities along with transfers if done other than mentioned in the tour program",
        "Any upgradation in the room category or air line class.",
        "Medicines or Medical Expenses required if any"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Included",
      cancellationPolicy: "60+ days before departure: 50% of package cost. 30-59  days before departure: 75% of package cost. 0-30  days before departure: 100% of package cost",
    },
  },
  {
    id: "arctic-expedition-luxury-group-tour-3622",
    title: "Arctic Expedition Luxury Group Tour",
    location: "Arctic · Helsinki · Rovaniemi · Kiruna",
    destination: "Arctic",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/new/img-1786367948249-boeys2.jpg",
    nights: 12,
    days: 13,
    pax: "2–10 pax",
    hotelStars: 4,
    tags: ["Adventure", "Luxury"],
    region: "International",
    operator: "EXOTIC ALLEY",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 480000,
    price: 480000,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/new/img-1786367948249-boeys2.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-exotic-alley-ae62/new/img-1786368367551-l7vz01.jpg"
      ],
      summary: "Arctic Expedition Luxury Group Tour is a 13-day itinerary through Arctic · Helsinki · Rovaniemi · Kiruna.",
      places: [
        "Arctic",
        "Helsinki",
        "Rovaniemi",
        "Kiruna",
        "Tromsø",
        "Voss",
        "Oslo",
        "Copenhagen"
      ],
      highlights: [
        "Northern Lights Experience",
        "Santa Claus Village",
        "Husky Safari",
        "icehotel",
        "Flåm Railway",
        "Norwegian  Fjord Cruise"
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Helsinki, Finland",
          route: "Arctic",
          description: "Welcome to the beautiful capital of Finland. Upon arrival, enjoy a guided city tour covering Senate Square, Helsinki Cathedral, Uspenski Cathedral, Sibelius Monument and the famous Rock Church (Temppeliaukio Church). Later, check in to your hotel and relax.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 2,
          title: "Explore Tallinn, Estonia & Overnight Arctic Train",
          route: "Helsinki",
          description: "After breakfast, board a scenic ferry to Tallinn, the charming capital of Estonia. Discover the UNESCO-listed Old Town, Toompea Castle, Alexander Nevsky Cathedral and other medieval landmarks during a guided city tour. Return to Helsinki in the evening and board the overnight train to Rovaniemi.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 3,
          title: "Santa Claus Village & Arctic Circle Experience",
          route: "Rovaniemi",
          description: "Arrive in Rovaniemi, the official hometown of Santa Claus. Visit the magical Santa Claus Village, meet Santa, cross the Arctic Circle and explore Santa's famous Post Office. Enjoy free time to experience the village before checking in to your hotel.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 4,
          title: "Northern Lights Hunting Experience",
          route: "Kiruna",
          description: "Enjoy a relaxed morning in Rovaniemi before collecting your Official Arctic Circle Crossing Certificate. In the evening, embark on your first Northern Lights Hunting Tour in search of the magical Aurora Borealis amidst Finland's breathtaking Arctic wilderness.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 5,
          title: "Kiruna & ICEHOTEL Experience",
          route: "Tromsø",
          description: "Drive through the spectacular Arctic landscapes of Finland and Sweden towards Kiruna. Visit the world-famous ICEHOTEL and admire its remarkable ice architecture and artistic ice suites. Later, continue to Abisko National Park for your second Northern Lights Hunting experience.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 6,
          title: "Tromsø – Gateway to the Arctic",
          route: "Voss",
          description: "After breakfast, continue your scenic journey to Tromsø, one of the world's most renowned Arctic destinations. Pass through dramatic fjords, snow-covered mountains and spectacular Arctic scenery before arriving in this beautiful northern city. Spend the evening at leisure.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 7,
          title: "Tromsø City Tour & Sami Experience",
          route: "Oslo",
          description: "Experience the rich traditions of the indigenous Sami people with a Reindeer Feeding Experience, authentic Sami culture and a warm local lunch. Later, enjoy a guided city tour of Tromsø followed by the Fjellheisen Cable Car for breathtaking panoramic views of the Arctic landscape.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 8,
          title: "Bergen – Gateway to the Fjords",
          route: "Copenhagen",
          description: "Fly to Bergen and explore this charming UNESCO World Heritage city. Visit Bryggen Wharf, the historic Hanseatic Quarter, Fish Market, Bergen Harbour and St. Mary's Church before continuing through Norway's breathtaking fjords and mountain scenery towards Voss.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 9,
          title: "Norway in a Nutshell Experience",
          route: "Copenhagen",
          description: "Experience Norway's world-famous \"Norway in a Nutshell\" journey featuring the spectacular Flåm Railway, one of the world's most scenic train rides. Continue with a breathtaking cruise through the UNESCO-listed Nærøyfjord before travelling onwards to Oslo.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 10,
          title: "Oslo City Tour & Luxury Overnight Cruise",
          route: "Copenhagen",
          description: "Discover the highlights of Norway's capital during a guided city tour covering Karl Johans Gate, Vigeland Sculpture Park, the Royal Palace and Akershus Fortress. In the evening, board a luxury overnight cruise to Copenhagen and enjoy a memorable journey across the sea.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 11,
          title: "Copenhagen City Tour",
          route: "Copenhagen",
          description: "Arrive in Copenhagen and explore Denmark's elegant capital. Visit the Little Mermaid, Amalienborg Palace, Gefion Fountain, City Hall Square and stroll through the colourful Nyhavn waterfront. Enjoy free time to experience the city's charming cafés and canals.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 12,
          title: "Excursion to Malmö, Sweden",
          route: "Copenhagen",
          description: "Drive across the iconic Øresund Bridge into Sweden and explore the beautiful city of Malmö. Visit Turning Torso, admire views of the Øresund Bridge and enjoy a walk through Malmö's charming Old Town before returning to Copenhagen.",
          meals: "Breakfast, lunch and dinner",
        },
        {
          day: 13,
          title: "Departure",
          route: "Copenhagen",
          description: "After breakfast, transfer to Copenhagen Airport for your return journey home. Depart with unforgettable memories of the Arctic landscapes, Scandinavian cities, Northern Lights and extraordinary experiences that made this Diwali journey truly special",
          meals: "Breakfast, lunch and dinner",
        }
      ],
      stays: [
        { name: "holiday inn helsinki city center / Similar", nights: 0, place: "Arctic · Helsinki · Rovaniemi · Kiruna", comfort: "4-star category stay" },
        { name: "scandic rovaniemi city / Similar", nights: 0, place: "Arctic · Helsinki · Rovaniemi · Kiruna", comfort: "4-star category stay" },
        { name: "scandic kiruna / Similar", nights: 0, place: "Arctic · Helsinki · Rovaniemi · Kiruna", comfort: "4-star category stay" },
        { name: "scandic grand Tromsø / Similar", nights: 0, place: "Arctic · Helsinki · Rovaniemi · Kiruna", comfort: "4-star category stay" },
        { name: "scandic neptun / Similar", nights: 0, place: "Arctic · Helsinki · Rovaniemi · Kiruna", comfort: "4-star category stay" },
        { name: "scandic victoria / Similar", nights: 0, place: "Arctic · Helsinki · Rovaniemi · Kiruna", comfort: "4-star category stay" }
      ],
      inclusions: [
        "Activities / Sightseeing :- Guided City Tour, Senate Square, Helsinki Cathedral,  Uspenski Cathedral, Sibelius Monument & Rock Church, Hotel Check-in Ferry to Tallinn, Tallinn Guided City Tour, Old Town, Toompea  Castle, Alexander Nevsky Cathedral, Return to Helsinki &  Overnight Train to Rovaniemi Arrival in Rovaniemi, Santa Claus Village, Meet Santa Claus, Arctic  Circle Crossing, Santa's Post Office Free Time, Northern Lights Hunting Tour & Arctic Circle Crossing  Certificate Scenic Drive to Kiruna, ICEHOTEL Visit, Abisko National Park &  Northern Lights Hunting Tour Scenic Drive to Tromsø via Arctic Landscapes & Fjords, Leisure  Time Tromsø City Tour, Sami Experience, Reindeer Feeding,  Fjellheisen Cable Car Ride Flight to Bergen, Bergen City Tour, Bryggen Wharf, Fish Market,  St. Mary's Church & Drive to Voss Norway in a Nutshell Experience, Flåm Railway, Nærøyfjord  Cruise & Scenic Train to Oslo Oslo City Tour, Karl Johans Gate, Royal Palace, Vigeland Sculpture Park  & Luxury Overnight Cruise to Copenhagen Arrival in Copenhagen, Guided City Tour, Little Mermaid, Amalienborg  Palace, Nyhavn Waterfront & Canal Cruise Excursion to Malmö, Øresund Bridge, Turning Torso & Malmö Old Town",
        "Insurance",
        "Visa",
        "Hotels",
        "Meals:- 2 Continental Breakfasts At The Hotel 12 Indian Dinners Indian Vegetarian & Jain Meals Throughout The Tour Meals As Per The Itinerary (B/D)"
      ],
      exclusions: [
        "GST & TCS Subject to Government Policy",
        "Cost of Any personal Exp. like shopping, alcohol etc",
        "Surcharge if any applicable",
        "Portages",
        "Optional Activities",
        "Usage of Mini bar",
        "Any increase in government tax, fuel Charges,",
        "Service tax or any other tax"
      ],
      meals: "All meals included",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "105 Days+: Cancellation charges INR  1,00,000. 75-105 Days: 50% of tour cost. 45-75 Days: 75% of tour cost. Last 45 Days: 100% of tour cost",
    },
  },
  {
    id: "malaysian-delight-9619",
    title: "Malaysian Delight",
    location: "Kuala Lumpur · Langkawi",
    destination: "Malaysia",
    image: "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783957835005-99bsf1.jpg",
    nights: 5,
    days: 6,
    pax: "2–10 pax",
    hotelStars: 4,
    tags: ["Beaches", "Mountains", "Adventure", "Honeymoon", "Wildlife", "Heritage"],
    region: "International",
    operator: "The Holiday Time",
    rating: 0,
    reviews: 0,
    discount: 0,
    originalPrice: 34000,
    price: 34000,
    deal: true,
    details: {
      gallery: [
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783957835005-99bsf1.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783957858677-ozeyss.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783957864632-0di7j4.jpg",
        "https://xlmpzwkmxtabihhmgzhi.supabase.co/storage/v1/object/public/package-images/op-the-holiday-time-da3b/new/img-1783957867596-61nlo9.jpg"
      ],
      summary: "Malaysian Delight is a 6-day itinerary through Kuala Lumpur · Langkawi.",
      places: [
        "Kuala Lumpur",
        "Langkawi"
      ],
      highlights: [
        "Standard hotel check-in 3:00 PM, check-out 10:00 AM.",
        "All transfers in air-conditioned vehicles (AC may not work in hill regions).",
        "Itinerary may be re-sequenced due to weather, road or flight conditions.",
        "A valid government photo ID is mandatory for all travellers at check-in."
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival & check-in & Relax",
          route: "Kuala Lumpur",
          description: "Arrival & check-in & Relax",
          meals: "Dinner",
        },
        {
          day: 2,
          title: "Evening Half Day Kuala Lumpur City Tour (Without guide) (No Admission) (3 Hours)",
          route: "Langkawi",
          description: "Evening Half Day Kuala Lumpur City Tour (Without guide) (No Admission) (3 Hours)",
          meals: "Breakfast",
        },
        {
          day: 3,
          title: "Full Day Genting Highlands Tour with Photo Stop at Batu Caves with Cable Car Tickets",
          route: "Langkawi",
          description: "Full Day Genting Highlands Tour with Photo Stop at Batu Caves with Cable Car Tickets",
          meals: "Breakfast",
        },
        {
          day: 4,
          title: "Fly to Langkawi & Check In & Relax",
          route: "Langkawi",
          description: "Fly to Langkawi & Check In & Relax",
          meals: "Breakfast",
        },
        {
          day: 5,
          title: "Langkawi Island Hopping Tour & Langkawi Island Experience Tour (4 Hours)",
          route: "Langkawi",
          description: "Proceed for Langkawi Island Hopping Tour & Langkawi Island Experience Tour (4 Hours)",
          meals: "Breakfast",
        },
        {
          day: 6,
          title: "Departure",
          route: "Langkawi",
          description: "Flight to Home",
          meals: "Breakfast",
        }
      ],
      stays: [
        { name: "Furama Bukit Bintang", nights: 0, place: "Kuala Lumpur · Langkawi", comfort: "4-star category stay" },
        { name: "Bella Vista Waterfront Resort", nights: 0, place: "Kuala Lumpur · Langkawi", comfort: "4-star category stay" }
      ],
      inclusions: [
        "4* Hotel Stay",
        "Breakfast",
        "Airport Transfer at Kuala Lumpur & Langkawi",
        "Evening Half Day Kuala Lumpur City Tour (Without guide) (No Admission) (3 Hours)",
        "Full Day Genting Highlands Tour with Photo Stop at Batu Caves with Cable Car Tickets",
        "Langkawi Island Hopping Tour",
        "Langkawi Island Experience Tour (4 Hours)"
      ],
      exclusions: [
        "Domestic & International Flight Tickets",
        "GST, TCS, & Any Other Applicable Government Taxes",
        "Lunch & Personal Meals (Unless Specifically Mentioned)",
        "Personal Expenses such as Laundry, Telephone Calls, Shopping, mini-bars, Etc",
        "Any Optional Tours, Activities or Services",
        "Any Expenses Arising Due to Flight Delays, Cancellations, Natural Calamities, Force Majeure or Unforeseen Circumstances",
        "Anything Not Specifically Mentioned under \" Package Inclusions\""
      ],
      meals: "Daily breakfast",
      transfers: "Transfers included",
      flights: "Not included",
      cancellationPolicy: "60+ days before departure: 30% of package cost + Non Refundable Services. 45–29 days before departure: 65% of package cost + Non Refundable Services. 7–28 days before departure: 85% of package cost + Non Refundable Services. Within 7 days of departure: 100% of package cost + Non Refundable Services",
    },
  },
];

export const PACKAGE_STORAGE_KEY = "comparemytrip-admin-packages";
export const PACKAGE_UPDATE_EVENT = "comparemytrip-packages-updated";

export function readAdminPackages(): TravelPackage[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(PACKAGE_STORAGE_KEY);
    return value ? (JSON.parse(value) as TravelPackage[]) : [];
  } catch {
    return [];
  }
}

export function writeAdminPackages(packages: TravelPackage[]) {
  window.localStorage.setItem(PACKAGE_STORAGE_KEY, JSON.stringify(packages));
  window.dispatchEvent(new Event(PACKAGE_UPDATE_EVENT));
}

const DEFAULT_GALLERY = [
  "/destinations/kerala.jpg",
  "/destinations/goa.jpg",
  "/destinations/rajasthan.jpg",
  "/destinations/ladakh.jpg",
  "/destinations/andaman.jpg",
  "/destinations/meghalaya.jpg",
  "/destinations/spiti.jpg",
  "/popular-destinations/dharmashala.png",
  "/popular-destinations/mumbai.png",
  "/package-gallery/kerala-houseboat.jpg",
];

/* ------------------- Publication and index gating ------------------ */

/** Firestore hands back documents written by older versions of the CRM, so
    the status is read defensively: only an explicit "draft" withholds a
    package. Anything else — a missing field, a legacy document, a typo —
    keeps the package on the website, which is the safe direction to fail. */
export function isPublishedPackage(pkg: Pick<TravelPackage, "status">): boolean {
  return pkg.status !== "draft";
}

export function publishedPackages(packages: TravelPackage[]): TravelPackage[] {
  return packages.filter(isPublishedPackage);
}

/* An address or a link in the title is never marketing copy — it is a record
   somebody typed into the CRM to try the form out. Such a package still
   renders for whoever is looking at it, but it must not reach the sitemap or
   the index, where a stray address would be republished by search engines and
   scraped. Correcting the title in the CRM makes it indexable again. */
const JUNK_TITLE = /[\w.+-]+@[\w-]+\.[\w.]+|https?:\/\/|\bwww\./i;

/** Whether a package may be offered to search engines: published, and free of
    the placeholder text that marks a half-finished record. */
export function isIndexablePackage(pkg: TravelPackage): boolean {
  return isPublishedPackage(pkg) && Boolean(pkg.title?.trim()) && !JUNK_TITLE.test(pkg.title);
}

export function getPackageDetails(pkg: TravelPackage): PackageDetails {
  if (pkg.details) return pkg.details;

  const places = pkg.location.split("·").map((place) => place.trim()).filter(Boolean);
  const gallery = [pkg.image, ...DEFAULT_GALLERY.filter((image) => image !== pkg.image)].slice(0, 10);
  const itinerary: PackageItineraryDay[] = Array.from({ length: pkg.days }, (_, index) => {
    const day = index + 1;
    const place = places[Math.min(index, places.length - 1)] || pkg.location;
    const isFirst = day === 1;
    const isLast = day === pkg.days;
    return {
      day,
      title: isFirst ? `Arrival in ${place}` : isLast ? `Departure from ${place}` : `Explore ${place}`,
      route: index === 0 ? place : `${places[Math.max(0, index - 1)] || place} → ${place}`,
      description: isFirst
        ? "Meet your local representative, transfer to the hotel and settle in at your own pace."
        : isLast
          ? "After breakfast, check out and transfer to the airport or railway station for your onward journey."
          : `Enjoy a thoughtfully paced day around ${place}, with time for signature sights and local experiences.`,
      meals: isFirst ? "Dinner" : "Breakfast",
    };
  });

  return {
    gallery,
    summary: `${pkg.title} is a ${pkg.days}-day journey through ${pkg.location}. It combines comfortable stays, dependable transfers and enough unhurried time to experience each destination.`,
    places,
    highlights: ["Handpicked stays", "Private sightseeing", "Flexible travel plan", "Verified local operator"],
    itinerary,
    stays: [{ name: `${pkg.hotelStars}-star comfort stay`, nights: pkg.nights, place: places[0] || pkg.location, comfort: "Comfort room with daily breakfast" }],
    inclusions: ["Accommodation", "Daily breakfast", "Intercity transfers", "Sightseeing as per itinerary"],
    exclusions: ["Flights or train tickets", "Personal expenses", "Travel insurance", "Anything not listed in inclusions"],
    meals: "Daily breakfast",
    transfers: "Private transfers included",
    flights: "Not included",
    cancellationPolicy: "Free cancellation up to 15 days before departure. Date changes are subject to availability.",
  };
}

/* ------------------------------------------------------------------ */
/* Card commerce helpers, shared by the listing cards, the booking box  */
/* and the admin preview so one package shows one discount everywhere.  */
/* ------------------------------------------------------------------ */

/** The "X% off" pill. Falls back to the gap between the two prices when
    an operator saved a package without naming a percentage. */
export function getDiscountPercent(pkg: Pick<TravelPackage, "discount" | "originalPrice" | "price">): number {
  if (pkg.discount > 0) return Math.round(pkg.discount);
  if (pkg.originalPrice > pkg.price && pkg.originalPrice > 0) {
    return Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100);
  }
  return 0;
}

/** Same maths the admin discount field runs, kept here so the builder and
    the storefront never disagree by a rupee. */
export function discountToPrice(originalPrice: number, discount: number): number {
  if (originalPrice <= 0) return 0;
  const percent = Math.min(Math.max(discount, 0), 90);
  return Math.round(originalPrice * (1 - percent / 100));
}

/** The tier chip — "Premium" and friends — read off the hotel rating. */
export function getPackageTier(hotelStars: number): string {
  if (hotelStars >= 5) return "Luxury";
  if (hotelStars >= 4) return "Premium";
  return "Value";
}
