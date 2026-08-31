import { makeBlogSection, type BlogPost, type BlogSection } from "@/lib/blogData";

/* ------------------------------------------------------------------ */
/* Ten starter travel guides, written to match the destinations the      */
/* package catalogue already sells. They exist so a brand-new database   */
/* has real content to look at and to give the team a house style to     */
/* edit against — every one is a normal post once seeded, editable and   */
/* deletable in /admin/blog like any other.                              */
/*                                                                       */
/* Photography is the credited Wikimedia Commons set already in          */
/* /public (see the CREDITS files beside each folder). Images an editor  */
/* uploads later go to Cloudflare R2 through the usual uploader; these   */
/* local paths simply avoid inventing R2 objects for seed content.       */
/* ------------------------------------------------------------------ */

type SeedSection = { heading: string; body: string; image?: string; imageAlt?: string; imageCaption?: string };

type SeedPost = Omit<BlogPost, "sections" | "status" | "id"> & { id: string; sections: SeedSection[] };

const section = (index: number, seed: SeedSection): BlogSection => ({
  ...makeBlogSection(),
  id: `section-${index + 1}`,
  heading: seed.heading,
  body: seed.body,
  image: seed.image ?? "",
  imageAlt: seed.imageAlt ?? "",
  imageCaption: seed.imageCaption ?? "",
});

const SEED_POSTS: SeedPost[] = [
  {
    id: "three-days-in-munnar",
    title: "Three days in Munnar, and what to skip",
    excerpt:
      "The tea estates, Eravikulam and the drive up from Kochi — plus the two viewpoints that are not worth the detour in monsoon.",
    category: "Itinerary",
    coverImage: "/package-gallery/munnar-tea-hills.jpg",
    coverAlt: "Tea plantations covering the hills around Munnar, Kerala",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "Kerala",
    tags: ["munnar", "kerala", "tea estates", "monsoon"],
    publishedAt: "2026-08-18",
    featured: true,
    seoTitle: "Three days in Munnar: a realistic itinerary",
    seoDescription:
      "A three-day Munnar plan that accounts for the drive from Kochi, Eravikulam permits and monsoon visibility — including the stops worth skipping.",
    sections: [
      {
        heading: "The drive up is half the day",
        body: "Munnar is about 130 km from Kochi and almost every itinerary underestimates it. The last 40 km are hairpins, and in monsoon you will be behind a lorry for a good part of them. Four to five hours is realistic; five and a half if you stop at Cheeyappara or Valara falls, which are worth twenty minutes each and no more.\n\nLeave Kochi by eight and you are checked in and walking through an estate by mid-afternoon. Leave at eleven and you have spent day one in a car.",
        image: "/package-gallery/munnar-tea-plantation.jpg",
        imageAlt: "Tea bushes in neat rows on a hillside near Munnar",
        imageCaption: "The estates start well before the town itself — the first good stop is usually 20 km short of Munnar.",
      },
      {
        heading: "Eravikulam needs a booking, not a plan",
        body: "Eravikulam National Park is the one fixed point in a Munnar trip. Entry is by timed slot, the shuttle from the gate is compulsory, and the park closes entirely for roughly two months in calving season, usually February into March. Check before you build a day around it.\n\nGo in the first slot. By eleven the crowd on the short walking stretch is dense enough that spotting a Nilgiri tahr becomes an exercise in patience rather than luck.",
      },
      {
        heading: "What is genuinely worth the detour",
        body: "Top Station, on the Kerala–Tamil Nadu border, is the one long detour that earns itself — about 32 km each way, and on a clear morning the view down into the Theni valley is the best in the district. On a clouded-over afternoon it is a car park in fog.\n\nThe tea museum is fine but brief. An estate walk arranged through your stay is better, cheaper and tells you more about how the leaf is actually graded.",
      },
      {
        heading: "The two stops to skip in monsoon",
        body: "Echo Point and Kundala Lake both sell boat rides, and in June to September both are usually a queue in drizzle for fifteen minutes on grey water. In clear weather they are pleasant enough. In monsoon, swap them for a long slow morning in the estates, which look their best precisely when the weather is worst.",
      },
    ],
  },
  {
    id: "choosing-a-kerala-houseboat",
    title: "Picking a Kerala houseboat that is actually worth it",
    excerpt:
      "What separates a good Alleppey houseboat from a moored disappointment: cruising hours, the channel it takes, and who cooks.",
    category: "Travel Tips",
    coverImage: "/package-gallery/alleppey-houseboat.jpg",
    coverAlt: "A houseboat moored on the Alleppey backwaters",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "Kerala",
    tags: ["alleppey", "kerala", "houseboat", "backwaters"],
    publishedAt: "2026-08-14",
    featured: false,
    seoTitle: "How to choose a Kerala houseboat",
    seoDescription:
      "Cruising hours, canal width and the on-board cook matter more than the star rating. How to book an Alleppey houseboat that is worth the money.",
    sections: [
      {
        heading: "Cruising hours are the whole product",
        body: "Almost every houseboat listing quotes noon check-in and nine-thirty check-out, and almost none of them says how much of that is spent moving. The legal cruising window on most of the backwaters ends at sundown, so a boat that boards at noon and moors at five-thirty has given you five and a half hours of actual cruising out of a twenty-two hour booking.\n\nAsk the operator one question before you pay: what time do we moor, and where. A boat that moors at six near Kainakary is a different holiday from one that moors at four-thirty beside the main Alleppey jetty.",
      },
      {
        heading: "The narrow channels are the point",
        body: "Big boats — the three and four bedroom ones — are restricted to the wider channels because they simply cannot turn anywhere else. That means Vembanad Lake, which is beautiful, open and slightly monotonous after the first hour.\n\nA one or two bedroom boat can take the narrow canals through Kainakary and Chennamkary, where the backwaters do the thing you came for: paddy fields below water level, toddy tappers, kids rowing to school. If there are two of you, the smaller boat is the better boat.",
        image: "/package-gallery/kerala-houseboat.jpg",
        imageAlt: "A houseboat moving through a narrow palm-lined backwater channel",
        imageCaption: "Smaller boats reach the channels the large ones cannot enter.",
      },
      {
        heading: "The cook matters more than the star rating",
        body: "Food is included on essentially every houseboat and prepared on board, usually by a crew of three doubling as captain, cook and deckhand. This is where the price difference actually shows. A good boat serves karimeen fried to order and lunch that arrives while you are still moving; a cheap one reheats and moors early to make it easier.\n\nIf you eat fish, say so at booking — the karimeen is bought that morning, not stocked.",
      },
      {
        heading: "One night is usually right",
        body: "Two nights on a houseboat sounds better than it is. The second day repeats the first, at the same speed, in the same eight square kilometres. Most travellers get more out of one night afloat plus a night in Alleppey or Kumarakom than two nights on the water.",
      },
    ],
  },
  {
    id: "spiti-by-road-altitude",
    title: "Spiti by road: what the altitude does to your plans",
    excerpt:
      "Acclimatisation days are not padding. How to sequence Shimla, Kaza and Chandratal so the high passes do not end your trip early.",
    category: "Travel Tips",
    coverImage: "/destinations/spiti.jpg",
    coverAlt: "Pin Valley in Spiti, Himachal Pradesh",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "Spiti",
    tags: ["spiti", "himachal", "altitude", "road trip"],
    publishedAt: "2026-08-10",
    featured: false,
    seoTitle: "Spiti road trip: altitude, routes and timing",
    seoDescription:
      "Why the Shimla approach to Spiti beats the Manali one, how many acclimatisation days you actually need, and when Kunzum La is open.",
    sections: [
      {
        heading: "Go in via Shimla, come out via Manali",
        body: "Both roads reach Kaza. They are not equivalent. The Shimla side climbs gradually over three days — Narkanda, Sangla, Kalpa, Nako — and by the time you reach Kaza at roughly 3,800 m your body has had time to catch up. The Manali side crosses Kunzum La at 4,590 m within a single day of leaving 2,000 m.\n\nDriving in the easy direction is the single biggest thing you can do to avoid spending your trip with a headache in a guesthouse.",
      },
      {
        heading: "Two nights below 3,500 m before you sleep high",
        body: "Altitude sickness is not about fitness and it does not care how many treks you have done. The rule that works is simple: gain height during the day, sleep low, and give yourself two nights somewhere around 2,700 to 3,200 m before your first night above 3,500 m. Kalpa and Nako are both well placed for exactly this.\n\nIf you get a headache that paracetamol does not touch, or you cannot sleep and cannot catch your breath lying down, the answer is to descend. It is a three-hour drive down, not an evacuation, and everyone at your guesthouse has seen it before.",
        image: "/destinations/ladakh.jpg",
        imageAlt: "High-altitude lake surrounded by bare mountains",
        imageCaption: "Above 4,000 m, plans should have a descent option built into them.",
      },
      {
        heading: "Kunzum La and Chandratal open late",
        body: "Chandratal is reached over Kunzum La, and the pass is typically closed by snow until sometime in late May or June, then closes again around October. The exact dates move every year and are decided by the BRO, not by a calendar.\n\nIf Chandratal is the reason for your trip, go between mid-June and late September and build a spare day in. The camps beside the lake are seasonal, unheated and a genuinely cold night at 4,250 m.",
      },
      {
        heading: "Fuel, cash and phone signal",
        body: "The petrol pump at Kaza is the only reliable one between Reckong Peo and Manali — roughly 200 km of mountain road on either side. Fill up whether or not you think you need to.\n\nATMs in Kaza exist and regularly do not work. Bring more cash than feels sensible. Only BSNL and Jio hold signal with any consistency, and in Pin Valley almost nothing does.",
      },
    ],
  },
  {
    id: "goa-beyond-the-beach-shacks",
    title: "Goa in the shoulder season, beyond the beach shacks",
    excerpt:
      "November and February are the same price and a different holiday. Where to stay in the south, and what actually opens when.",
    category: "Destination Guide",
    coverImage: "/destinations/goa.jpg",
    coverAlt: "Palolem Beach in South Goa at low tide",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "Goa",
    tags: ["goa", "beaches", "shoulder season", "palolem"],
    publishedAt: "2026-08-06",
    featured: false,
    seoTitle: "Goa shoulder season guide",
    seoDescription:
      "When Goa's shacks open, why South Goa suits a quiet trip better than the north, and what a shoulder-season week actually costs.",
    sections: [
      {
        heading: "The season has hard edges",
        body: "Beach shacks in Goa are temporary structures, put up and taken down each year under a state licence. In practice most of the coast comes alive in the first half of November and is dismantled again through May. Book a beach holiday in late September and you will find a beautiful, empty, entirely closed shoreline.\n\nMid-November to mid-December, and again through February, gives you the full season at noticeably less than the Christmas-to-New-Year peak, when rates on the same room can triple.",
      },
      {
        heading: "North and south are two different trips",
        body: "North Goa — Baga, Calangute, Anjuna — is dense, loud and where the nightlife is. It is genuinely fun and genuinely crowded, and in season the road between Baga and Candolim can take forty minutes to drive two kilometres.\n\nSouth Goa — Palolem, Agonda, Patnem — is quieter, greener and mostly low-rise. Agonda in particular has stayed low-key. If you are picturing long empty sand and reading a book, you want the south, and you want to know that a taxi between the two ends of the state is well over an hour.",
        image: "/destinations/andaman.jpg",
        imageAlt: "Quiet tropical beach with clear shallow water",
        imageCaption: "The southern beaches keep their space even in season.",
      },
      {
        heading: "Rent a scooter, not a car",
        body: "Goa's distances are short and its lanes are narrow. A scooter costs a few hundred rupees a day and turns the interior — Chandor's old Portuguese houses, the Saturday night market, a spice farm inland — into an easy morning rather than a negotiation with a taxi driver.\n\nCarry your licence, wear the helmet, and do not ride at night on the coastal road after the bars close.",
      },
      {
        heading: "Inland Goa is the underrated half",
        body: "Almost every itinerary treats the beaches as the destination and the interior as a day trip. Reverse it for a day. Divar and Chorão islands are ten minutes on a free ferry and a century away, the Latin Quarter in Panjim is genuinely lovely early in the morning, and Dudhsagar in the weeks after monsoon is at full volume.",
      },
    ],
  },
  {
    id: "weekend-treks-from-bengaluru",
    title: "Six weekend treks from Bengaluru, ranked by effort",
    excerpt:
      "From a pre-dawn walk up Nandi Hills to the long haul up Kumara Parvatha — what each one asks of you, and when to go.",
    category: "Trekking",
    coverImage: "/weekend-treks/kumara-parvatha.jpg",
    coverAlt: "The ridge line of Kumara Parvatha in Karnataka",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "Karnataka",
    tags: ["bengaluru", "trekking", "karnataka", "weekend"],
    publishedAt: "2026-08-02",
    featured: false,
    seoTitle: "Weekend treks from Bengaluru, ranked",
    seoDescription:
      "Nandi Hills, Skandagiri, Savandurga, Kodachadri, Tadiandamol and Kumara Parvatha — difficulty, timing and what each trek actually involves.",
    sections: [
      {
        heading: "Start here: Nandi Hills and Skandagiri",
        body: "Nandi Hills is barely a trek — there is a road to the top — but the stepped path from the base is a pleasant ninety minutes and it is an hour from the city. Go on a weekday if you can; weekend mornings at the summit are a car park.\n\nSkandagiri is the better beginner's night trek: about four hours return, done in the dark to reach the top before sunrise, with a genuine cloud inversion below you in the cooler months. It needs a permit and an authorised guide, which is worth arranging in advance rather than at the gate.",
        image: "/weekend-treks/skandagiri.jpg",
        imageAlt: "Sunrise from the top of Skandagiri with clouds below the summit",
        imageCaption: "Skandagiri's inversion is best between October and February.",
      },
      {
        heading: "Step up: Savandurga and Kodachadri",
        body: "Savandurga is one of the largest monolith hills in Asia and the climb is exactly what that sounds like: exposed rock, painted arrows, no shade. Two to three hours up. Do not attempt it after rain and do not start it at eleven in the morning.\n\nKodachadri is a different proposition — Western Ghats forest, shola grassland, roughly 12 km of walking and best done as an overnight. Post-monsoon, from October, it is as green as Karnataka gets.",
      },
      {
        heading: "The long ones: Tadiandamol and Kumara Parvatha",
        body: "Tadiandamol is Coorg's highest peak at 1,748 m, about 7 km each way through coffee estate and shola forest. Comfortably a long day if you start early.\n\nKumara Parvatha is the one that earns its reputation. Around 22 km return from Kukke Subramanya, a punishing continuous climb, and most people do it as a two-day with a night at Bhattara Mane. Carry three litres of water per person; there is nothing reliable on the ridge.",
        image: "/weekend-treks/tadiandamol.jpg",
        imageAlt: "Grassland slopes and forest on the way up Tadiandamol",
        imageCaption: "Tadiandamol's upper slopes open out into shola grassland.",
      },
      {
        heading: "When to go, and when not to",
        body: "October to February is the window. The post-monsoon months give you green hills and clear air; by March the exposed rock climbs are unpleasant by nine in the morning and by April they are genuinely unsafe.\n\nIn June to September the Ghats treks — Kodachadri, Kumara Parvatha — are leech country and the rock ones are slick. Several are officially closed in peak monsoon. Check before you drive four hours.",
      },
    ],
  },
  {
    id: "rajasthan-first-trip-route",
    title: "A first trip to Rajasthan: the route that actually works",
    excerpt:
      "Jaipur, Jodhpur, Udaipur and Jaisalmer in ten days — which legs to fly, which to drive, and where the extra night belongs.",
    category: "Itinerary",
    coverImage: "/destinations/rajasthan.jpg",
    coverAlt: "The east facade of Hawa Mahal in Jaipur",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "Rajasthan",
    tags: ["rajasthan", "jaipur", "udaipur", "jaisalmer"],
    publishedAt: "2026-07-28",
    featured: false,
    seoTitle: "Rajasthan in ten days: a first-timer's route",
    seoDescription:
      "How to sequence Jaipur, Jodhpur, Jaisalmer and Udaipur without spending the trip in a car, and the right number of nights for each.",
    sections: [
      {
        heading: "Four cities is the limit for ten days",
        body: "The classic loop is Jaipur, Jodhpur, Jaisalmer, Udaipur. It is a good loop and it is longer than it looks on a map: Jodhpur to Jaisalmer alone is around 285 km and a solid five hours, and Jaisalmer to Udaipur is closer to nine.\n\nWith ten days, four cities works if you accept two long driving days. With seven, cut Jaisalmer — it is the furthest and the most expensive leg in time. Three cities properly seen beats four seen through a windscreen.",
      },
      {
        heading: "Where the extra nights belong",
        body: "Two nights in Jaipur is enough for Amber, the city palace and Hawa Mahal without rushing. Two in Jodhpur, because Mehrangarh deserves most of a day and the old city below it deserves the rest.\n\nUdaipur is where people wish they had stayed longer. Give it three. It is the one city on the loop that rewards doing nothing in particular — a morning on the lake, an afternoon in the bazaar behind Jagdish Temple.",
        image: "/popular-destinations/newdelhi.png",
        imageAlt: "Mughal-era architecture in northern India",
        imageCaption: "Most Rajasthan trips arrive through Delhi — it is worth a night either side.",
      },
      {
        heading: "Drive the short legs, fly or train the long one",
        body: "Jaipur to Jodhpur and Jodhpur to Jaisalmer are fine drives with things to stop for — Ranakpur's marble temple sits neatly on the Jodhpur to Udaipur road and is worth the hour.\n\nJaisalmer to Udaipur is the leg to avoid in a car. Take the overnight train, or fly via Jaipur or Delhi. Nine hours on that road is a day of the trip gone for nothing.",
      },
      {
        heading: "Go between November and February",
        body: "Rajasthan in May routinely passes 45°C and sightseeing becomes something you do for two hours at either end of the day. November to February is cool, clear and busy; late February and early March is the sweet spot, with warm days, thin crowds and rates below peak.\n\nBook the desert camps at Jaisalmer ahead in December and January. The good ones — the ones actually out at Sam or Khuri rather than parked on the edge of town — fill up.",
      },
    ],
  },
  {
    id: "andaman-islands-how-many-days",
    title: "How many days do the Andamans actually need?",
    excerpt:
      "Ferries, not flights, set the pace. A realistic breakdown of Havelock, Neil and Port Blair — and why five nights is the floor.",
    category: "Beaches",
    coverImage: "/destinations/andaman.jpg",
    coverAlt: "Radhanagar Beach on Havelock Island in the Andamans",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "Andaman",
    tags: ["andaman", "havelock", "beaches", "diving"],
    publishedAt: "2026-07-22",
    featured: false,
    seoTitle: "Andaman Islands: how many days to plan",
    seoDescription:
      "Ferry timings, island-hopping order and the minimum realistic trip length for Havelock, Neil and Port Blair.",
    sections: [
      {
        heading: "The ferry timetable is your itinerary",
        body: "There are a handful of private fast ferries a day between Port Blair, Havelock and Neil, and they mostly run in the morning. That single fact shapes everything: an island change costs you a half-day, whether or not the crossing itself is only ninety minutes.\n\nBook ferries before you fly. In season the morning sailings sell out days ahead, and the alternative is a slow government ferry on a schedule that does not care about your flight home.",
      },
      {
        heading: "Five nights is the practical minimum",
        body: "A workable shape is one night Port Blair on arrival, three on Havelock, one on Neil, then back. That gives you two full days on Havelock — enough for Radhanagar, and either a dive or the Elephant Beach snorkel trip — and one slow day on Neil.\n\nAnything under five nights and you are spending a third of the trip on boats. Seven nights is where it stops feeling rushed.",
        image: "/destinations/goa.jpg",
        imageAlt: "Shallow turquoise water on a quiet tropical beach",
        imageCaption: "Radhanagar is the famous one; Havelock's east-coast beaches are quieter at sunrise.",
      },
      {
        heading: "Diving is the reason to go",
        body: "The Andamans have some of the best accessible diving in India, and Havelock is where it is centred. A PADI open water course takes three to four days, which is worth building the trip around rather than squeezing in.\n\nIf you are not certified, a discover-scuba dive gets you in the water the same morning. Visibility is generally best from December through March.",
      },
      {
        heading: "Season, permits and cash",
        body: "The islands are open year-round but the sea between May and September is rough enough that ferries get cancelled and dive sites close. December to March is the reliable window; October and November are quieter and mostly fine.\n\nIndian nationals need no permit for the main islands. Foreign nationals are issued one on arrival. Card acceptance on Havelock and Neil has improved but is still patchy — carry cash from Port Blair.",
      },
    ],
  },
  {
    id: "meghalaya-living-root-bridges",
    title: "Meghalaya's root bridges: the trek nobody warns you about",
    excerpt:
      "The double-decker bridge at Nongriat is 3,000 steps down and 3,000 back up. What to know before you commit to the day.",
    category: "Destination Guide",
    coverImage: "/destinations/meghalaya.jpg",
    coverAlt: "The double-decker living root bridge at Nongriat, Meghalaya",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "Meghalaya",
    tags: ["meghalaya", "nongriat", "cherrapunji", "trekking"],
    publishedAt: "2026-07-16",
    featured: false,
    seoTitle: "Nongriat living root bridge trek guide",
    seoDescription:
      "What the double-decker root bridge trek at Nongriat involves, whether to stay overnight, and when Meghalaya's waterfalls are at their best.",
    sections: [
      {
        heading: "It is a staircase, not a walk",
        body: "The double-decker root bridge sits in Nongriat, below Tyrna village near Cherrapunji, and the only way in is on foot down a concrete staircase of roughly 3,000 steps. Going down takes most people about ninety minutes. Coming back up takes two hours or more and is genuinely hard on the knees and lungs.\n\nThis is not a scenic stroll to a viewpoint. Treat it as a day's trek: proper shoes, two litres of water, and an early start so you are not climbing out in the afternoon heat.",
      },
      {
        heading: "Stay the night at the bottom",
        body: "The single best decision on this trip is to sleep in Nongriat rather than turning straight around. There are simple guesthouses in the village, and staying means you see the bridge in the early morning without the day-trippers, and you can walk on to the Rainbow Falls — another hour each way and quieter than the bridge itself.\n\nIt also splits the climb across two days, which your legs will notice.",
        image: "/destinations/meghalaya.jpg",
        imageAlt: "Living root bridge formed from the roots of a rubber fig tree",
        imageCaption: "The bridges are grown, not built — the roots are trained across the stream over decades.",
      },
      {
        heading: "The single-decker option",
        body: "If 6,000 steps is not the holiday you had in mind, the root bridge at Mawlynnong is a short flat walk from the village and gives you the idea without the descent. Riwai, nearby, is similar.\n\nThey are smaller and busier, and they are not the same experience — but they are a genuine alternative rather than a consolation prize.",
      },
      {
        heading: "Go just after the rain",
        body: "Cherrapunji and Mawsynram are among the wettest places on earth and the monsoon here runs June to September in earnest. Trekking then is miserable and the steps are treacherous.\n\nOctober and November are the window: the waterfalls are still at full volume from the monsoon, the leeches have gone, and the air is clear enough to actually see across the valleys into Bangladesh.",
      },
    ],
  },
  {
    id: "kochi-two-days",
    title: "Two days in Kochi that are not just a stopover",
    excerpt:
      "Most itineraries treat Fort Kochi as an airport with a beach. It is worth a proper 48 hours — here is how to spend them.",
    category: "Food & Culture",
    coverImage: "/package-gallery/fort-kochi-fishing-nets.jpg",
    coverAlt: "Chinese fishing nets on the waterfront at Fort Kochi",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "Kerala",
    tags: ["kochi", "kerala", "food", "history"],
    publishedAt: "2026-07-10",
    featured: false,
    seoTitle: "Two days in Fort Kochi",
    seoDescription:
      "A 48-hour Fort Kochi plan: the Jewish quarter, a Kathakali performance done properly, and where to eat between them.",
    sections: [
      {
        heading: "Stay in Fort Kochi, not Ernakulam",
        body: "Kochi is really two places. Ernakulam is the mainland business city where the trains and most hotels are. Fort Kochi is the old peninsula across the water, and it is the one you came for — Portuguese, Dutch and British layers stacked on a few walkable square kilometres.\n\nThe ferry between them takes ten minutes and costs almost nothing. Stay on the Fort Kochi side and you can walk everywhere; stay in Ernakulam and you will spend the trip crossing back.",
      },
      {
        heading: "Day one: the peninsula on foot",
        body: "Start early at the Chinese fishing nets, which are best before the crowd and before the light goes flat. St Francis Church, where Vasco da Gama was originally buried, is a five-minute walk. Then Mattancherry: the Dutch Palace with its Ramayana murals, and Paradesi Synagogue in the Jewish quarter, both closed on different days, so check before you go.\n\nJew Town's spice warehouses still smell of cardamom and pepper, and the antique shops between them are a pleasant hour whether or not you buy anything.",
        image: "/package-gallery/fort-kochi-fishing-nets.jpg",
        imageAlt: "Cantilevered Chinese fishing nets silhouetted at the water's edge",
        imageCaption: "The nets are worked at dawn and dusk — midday is the least interesting time to see them.",
      },
      {
        heading: "Kathakali, done properly",
        body: "Several venues in Fort Kochi run daily performances. Go to one that starts an hour early with the make-up and the explanation of the mudras, because the form is close to unreadable without it — the entire vocabulary is in the eyes and hands.\n\nAn hour of context turns the performance from a photo opportunity into something you actually follow.",
      },
      {
        heading: "Day two: eat, and take the backwater ferry",
        body: "Breakfast is puttu and kadala, or appam and stew. Lunch is a sadya on a banana leaf if you can find one being served. Dinner is at the seafood places near the nets, where you pick the fish and pay by weight — agree the price before it is cooked.\n\nWith the afternoon, take the public ferry to Vypin or Vallarpadam. It is a working commuter boat, it costs a few rupees, and it is the cheapest backwater trip in Kerala.",
      },
    ],
  },
  {
    id: "monsoon-travel-in-india",
    title: "Where monsoon actually improves the trip",
    excerpt:
      "June to September is the cheapest travel window in India, and for a handful of destinations it is also the best one.",
    category: "Budget Travel",
    coverImage: "/package-gallery/periyar-thekkady.jpg",
    coverAlt: "Mist over the forested hills at Periyar, Thekkady",
    author: "CompareMyTrip",
    authorRole: "Travel desk",
    destination: "",
    tags: ["monsoon", "budget", "kerala", "ladakh"],
    publishedAt: "2026-07-04",
    featured: false,
    seoTitle: "Monsoon travel in India: where it works",
    seoDescription:
      "The destinations that are better in the rains, the ones to avoid entirely, and how much you save travelling in the off season.",
    sections: [
      {
        heading: "The saving is real",
        body: "Off-season rates in India are not a small discount. A Kerala resort that charges peak rates in December will often be at half that in July, and the same is true of Goa, Coorg and most hill stations. Flights follow the same curve.\n\nThe trade is weather risk, and it is worth taking in some places and not in others.",
      },
      {
        heading: "Kerala in the rains is the best version of Kerala",
        body: "The Western Ghats are built for this. Munnar and Wayanad are greener than they ever are in season, the waterfalls are running, and the crowds are gone. Ayurvedic treatment centres consider monsoon the correct season for a course, and price accordingly.\n\nThe caveat is that houseboat cruising can be curtailed on rough days and some trekking routes close. Build a spare day in and you will be fine.",
        image: "/package-gallery/periyar-thekkady.jpg",
        imageAlt: "Low cloud sitting over dense green forest at Periyar",
        imageCaption: "The Ghats are at their best in exactly the months most itineraries avoid.",
      },
      {
        heading: "Ladakh and Spiti sit above the rain",
        body: "The high trans-Himalaya is in rain shadow — the monsoon largely does not reach it. June to September is not the off season there, it is the only season, because that is when the passes are open.\n\nSo while the rest of the country is wet, Leh, Nubra and Spiti are dry, clear and at their most accessible. The approach roads through Himachal can still be cut by landslides, which is an argument for flying into Leh rather than driving up.",
      },
      {
        heading: "Where not to go",
        body: "Coastal Maharashtra and coastal Karnataka get genuinely heavy rain and the sea is closed to swimming. The Andamans have ferry cancellations from May through September. Uttarakhand's hill roads are landslide-prone in July and August and the Char Dham routes are periodically shut.\n\nRajasthan is a mixed case: the rain is light, it cools things from unbearable to merely hot, and Udaipur's lakes are full. That one is worth the gamble.",
      },
    ],
  },
];

/** Ten ready-to-edit posts, published and dated so the index has an order. */
export const BLOG_SEED_POSTS: BlogPost[] = SEED_POSTS.map((post) => ({
  ...post,
  status: "published" as const,
  sections: post.sections.map((seed, index) => section(index, seed)),
}));
