import type { TravelPackage } from "@/lib/packageData";
import { matchesTraveller, startsInBengaluru } from "@/lib/bengaluruTravel";

export const BENGALURU_COLLECTIONS = [
  { slug: "weekend-trips", title: "Weekend trips from Bengaluru", description: "Make room for a short break. Compare trips with a published Bengaluru starting point, check the departure schedule, and plan your return around work or college.", image: "/weekend-treks/kodachadri.jpg", filter: (pkg: TravelPackage) => pkg.days <= 3,
    tips: [
      { title: "Plan the whole weekend", body: "Check the pickup date as well as the activity date. A Saturday trek may start with a Friday-night bus journey. Confirm the expected return time before planning your next working day." },
      { title: "Choose your pace", body: "Compare trail difficulty, time on the road and accommodation. A short duration does not always mean a relaxed trip; an overnight journey can make a one-day outing tiring." },
      { title: "Budget beyond the headline", body: "Read transport, food, entry-fee and equipment inclusions. Keep a separate allowance for anything listed as self-sponsored or excluded." },
    ] },
  { slug: "one-day-trips", title: "One-day trips from Bengaluru", description: "Explore one-day experiences with Bengaluru departures. Check overnight travel, pickup timings and the return plan before choosing a quick escape.", image: "/weekend-treks/nandi-hills.jpg", filter: (pkg: TravelPackage) => pkg.days === 1,
    tips: [
      { title: "One day can include a night journey", body: "Sunrise trips often begin before midnight. Look at Day 0 and Day 1 together, and check whether the night is spent travelling or in accommodation." },
      { title: "Know your pickup and drop", body: "Choose a published boarding point you can reach at the stated time. Confirm whether the return drop is the same location and arrange your journey home." },
      { title: "Pack for the activity", body: "Use the package carry list. For a pre-dawn trek, check lighting, footwear, drinking water and breakfast arrangements with the coordinator." },
    ] },
  { slug: "treks", title: "Treks from Bengaluru", description: "Compare guided trekking plans with Bengaluru departure details. Find the difficulty, itinerary and transport information that suit your experience.", image: "/weekend-treks/skandagiri.jpg", filter: (pkg: TravelPackage) => pkg.tags.some(tag => tag === "Treks" || tag === "Weekend Treks"),
    tips: [
      { title: "Choose difficulty before price", body: "Ask about distance, elevation gain, terrain and expected walking time. A beginner-friendly description is not a substitute for checking the route against your fitness and experience." },
      { title: "Check permits and conditions", body: "Read the entry-fee and permit inclusions. Ask how weather, trail closures or permit availability could change the itinerary and what cancellation terms apply." },
      { title: "Joining on your own", body: "Check the group size, trip-leader arrangements, room-sharing policy and emergency contact process. Tell the team about any support you need before booking." },
    ] },
  { slug: "couple-getaways", title: "Couple getaways from Bengaluru", description: "Find trips identified for couples, with a published Bengaluru starting point. Compare the pace, stay and travel arrangements for a break together.", image: "/categories/honeymoon.jpg", filter: (pkg: TravelPackage) => matchesTraveller(pkg, "couples"),
    tips: [
      { title: "Choose shared or private travel", body: "A couple-friendly trip may still be a shared group departure. Ask for a private itinerary if you want your own vehicle, flexible stops or a slower schedule." },
      { title: "Confirm room arrangements", body: "Check the room type and whether the price assumes shared or double occupancy. Trek packages can use dormitories or offer no accommodation at all." },
      { title: "Make space for downtime", body: "Compare travel hours and included activities. Ask about optional stops and free time rather than assuming every itinerary can be changed on the day." },
    ] },
  { slug: "family-trips", title: "Family trips from Bengaluru", description: "Explore family-tagged holidays with published Bengaluru departure details. Check child suitability, rooms and travel pace with the team before booking.", image: "/destinations/kerala.jpg", filter: (pkg: TravelPackage) => matchesTraveller(pkg, "families"),
    tips: [
      { title: "Check suitability for every traveller", body: "A Family tag does not establish a minimum age or accessibility guarantee. Share children's ages and any mobility needs so the team can confirm the right plan." },
      { title: "Understand room and meal costs", body: "Ask how child pricing, extra beds and room occupancy affect the total. Check which meals are included and discuss dietary requirements before booking." },
      { title: "Look at the travel day", body: "Compare time on the road, rest stops and departure hours. Ask about a private group option if your family needs more flexibility." },
    ] },
] as const;
export function collectionPackages(packages: TravelPackage[], slug: string) {
  const collection = BENGALURU_COLLECTIONS.find(item => item.slug === slug);
  return collection ? packages.filter(pkg => startsInBengaluru(pkg) && collection.filter(pkg)) : [];
}
