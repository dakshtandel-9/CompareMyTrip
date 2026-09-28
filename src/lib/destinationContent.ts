import { destinationSlug, type DestinationSummary } from "@/lib/destinations";
import { toIndiaState } from "@/lib/indiaStates";

// Editorial introductions use the existing destination banner, without adding
// page sections or implying that every package includes a particular stop.
const INTRODUCTIONS: Record<string, string> = {
  kerala: "Plan a Kerala holiday around the hill stations, backwaters or coast. Compare how each itinerary divides your time between destinations, and check the stays, transfers and meals included in your chosen plan.",
  karnataka: "Explore Karnataka through a weekend escape, a trek or a longer holiday. Compare the route, time on the road and activity level, and check the published starting point before choosing your plan.",
  goa: "Plan your Goa break around beach time, local sights and the pace you prefer. Compare the areas covered by each itinerary, where you will stay and whether airport transfers or sightseeing are included.",
  "himachal-pradesh": "Explore Himachal Pradesh with a plan that suits your time and travel experience. Compare the route, road journeys and overnight stops; for high-altitude itineraries, ask about acclimatisation and seasonal access before booking.",
  rajasthan: "Discover Rajasthan through its historic cities, forts and desert landscapes. Compare the cities included, travel time between stops and sightseeing arrangements to choose the right pace for your holiday.",
  "jammu-kashmir": "Explore Jammu and Kashmir with a clear picture of the route, overnight stays and included sightseeing. Confirm seasonal access, transfers and any optional excursions before choosing your holiday.",
  kashmir: "Compare Kashmir holiday plans by the places covered, accommodation and time available at each stop. Check seasonal access and whether transfers, local sightseeing and optional activities are included.",
  ladakh: "Plan a Ladakh journey with attention to altitude, travel time and overnight stops. Compare the route and acclimatisation time, and confirm current access and permit requirements with the team before booking.",
  meghalaya: "Explore Meghalaya through its hills, waterfalls and living root bridges. Compare travel days and walking requirements, and check which experiences are included in the itinerary you choose.",
  "tamil-nadu": "Explore Tamil Nadu with an itinerary shaped around hill stations, heritage or the coast. Compare the stops, overnight stays and transport arrangements to find a plan that suits your dates and interests.",
  "andaman-nicobar-islands": "Plan an Andaman island holiday around your preferred balance of beaches, sightseeing and time at leisure. Compare island transfers, ferry arrangements, stays and optional activities before choosing a plan.",
  thailand: "Compare Thailand holidays by the cities, islands and experiences included. Check domestic transfers, hotel locations and optional activities, then confirm current entry requirements for your passport and travel dates.",
  vietnam: "Explore Vietnam with a route that fits the time you have, from a focused city break to a journey between regions. Compare internal travel, overnight stays and included experiences before choosing your plan.",
  "sri-lanka": "Plan a Sri Lanka holiday around the coast, cultural sights or hill country. Compare the route and time on the road, and check the transport, stays and activities included in each plan.",
  srilanka: "Plan a Sri Lanka holiday around the coast, cultural sights or hill country. Compare the route and time on the road, and check the transport, stays and activities included in each plan.",
  bali: "Explore Bali with time for the experiences you value most. Compare the areas where you will stay, transfer times and included sightseeing, and check which activities are optional before booking.",
  indonesia: "Explore Indonesia with a plan that makes the island and overnight stops clear. Compare transport between destinations, accommodation and included experiences before choosing your holiday.",
  maldives: "Compare Maldives holidays by island, accommodation, meal plan and airport transfer arrangements. Check whether transfers and activities are included and how room occupancy affects the final quote.",
  dubai: "Plan a Dubai holiday around the sights and experiences that interest you. Compare hotel locations, airport transfers and included excursions, and check admission costs for optional activities.",
  "united-arab-emirates": "Explore the United Arab Emirates with a clear itinerary for each city and overnight stay. Compare transfers, sightseeing and attraction inclusions before choosing your holiday plan.",
  singapore: "Compare Singapore holidays by hotel location, included attractions and time at leisure. Check airport transfers and admission arrangements to understand what your chosen plan covers.",
};

export function destinationIntroduction(name: string): string {
  return INTRODUCTIONS[destinationSlug(name)] ??
    `Explore CompareMyTrip travel plans for ${name}. Compare the route, overnight stays, transport and inclusions, and confirm your preferred dates with our team before booking.`;
}

/** Resolve only hubs that actually exist, including city-to-state guide links. */
export function destinationForPlace(
  destinations: DestinationSummary[],
  place: string,
): DestinationSummary | undefined {
  const exact = destinationSlug(place);
  const guideRegions: Record<string, string> = {
    "spiti-valley": "Himachal Pradesh",
    "new-delhi": "Delhi",
    "andaman-islands": "Andaman & Nicobar Islands",
  };
  const state = destinationSlug(guideRegions[exact] ?? toIndiaState(place));
  return destinations.find((item) => destinationSlug(item.name) === exact) ??
    destinations.find((item) => item.region === "India" && destinationSlug(item.name) === state);
}
