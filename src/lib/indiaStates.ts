/* ------------------------------------------------------------------ */
/* India destinations are states, not places.                           */
/*                                                                      */
/* A package's `destination` is the one name the catalogue files it     */
/* under. For India that name has to be a state: operators write the    */
/* town ("Munnar"), a district ("Coorg") or a shorthand ("Himachal"),   */
/* which split one state across three filter rows and made Coorg look   */
/* like somewhere other than Karnataka.                                 */
/*                                                                      */
/* This does NOT restrict what can be sold. The filter list is still    */
/* built from the live catalogue — a state appears exactly while a      */
/* package is filed under it, and a name nobody mapped here falls       */
/* through unchanged rather than vanishing.                             */
/* ------------------------------------------------------------------ */

/** Every state and union territory, offered in the CRM's "Filed under"
    field so a new package lands on a state without anyone typing one. */
export const INDIA_STATES = [
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

/* Lower-cased place, district and shorthand names that resolve to a state.
   Keep this to names that sit unambiguously inside one state — a name that
   spans several ("North East") is better left alone than guessed at. */
const STATE_ALIASES: Record<string, string> = {
  // Karnataka
  coorg: "Karnataka",
  kodagu: "Karnataka",
  madikeri: "Karnataka",
  mysore: "Karnataka",
  mysuru: "Karnataka",
  bangalore: "Karnataka",
  bengaluru: "Karnataka",
  chikmagalur: "Karnataka",
  sakleshpur: "Karnataka",
  gokarna: "Karnataka",
  hampi: "Karnataka",
  udupi: "Karnataka",
  mangalore: "Karnataka",
  "nandi hills": "Karnataka",
  skandagiri: "Karnataka",
  savandurga: "Karnataka",
  kodachadri: "Karnataka",
  tadiandamol: "Karnataka",
  "kumara parvatha": "Karnataka",

  // Kerala
  kochi: "Kerala",
  cochin: "Kerala",
  munnar: "Kerala",
  thekkady: "Kerala",
  alleppey: "Kerala",
  alappuzha: "Kerala",
  kumarakom: "Kerala",
  wayanad: "Kerala",
  kovalam: "Kerala",
  varkala: "Kerala",
  trivandrum: "Kerala",
  thiruvananthapuram: "Kerala",

  // Tamil Nadu
  ooty: "Tamil Nadu",
  udhagamandalam: "Tamil Nadu",
  kodaikanal: "Tamil Nadu",
  coonoor: "Tamil Nadu",
  chennai: "Tamil Nadu",
  madurai: "Tamil Nadu",
  coimbatore: "Tamil Nadu",
  rameswaram: "Tamil Nadu",
  kanyakumari: "Tamil Nadu",
  yercaud: "Tamil Nadu",
  yelagiri: "Tamil Nadu",

  // Andhra Pradesh
  tirupati: "Andhra Pradesh",
  visakhapatnam: "Andhra Pradesh",
  vizag: "Andhra Pradesh",
  araku: "Andhra Pradesh",
  "araku valley": "Andhra Pradesh",
  vijayawada: "Andhra Pradesh",

  // Shorthands and towns elsewhere in the catalogue
  himachal: "Himachal Pradesh",
  manali: "Himachal Pradesh",
  shimla: "Himachal Pradesh",
  kasol: "Himachal Pradesh",
  jibhi: "Himachal Pradesh",
  dharamshala: "Himachal Pradesh",
  dalhousie: "Himachal Pradesh",
  spiti: "Himachal Pradesh",
  kashmir: "Jammu & Kashmir",
  "j&k": "Jammu & Kashmir",
  srinagar: "Jammu & Kashmir",
  gulmarg: "Jammu & Kashmir",
  pahalgam: "Jammu & Kashmir",
  sonamarg: "Jammu & Kashmir",
  leh: "Ladakh",
  pangong: "Ladakh",
  nubra: "Ladakh",
  "north goa": "Goa",
  "south goa": "Goa",
  panaji: "Goa",
  jaipur: "Rajasthan",
  jaisalmer: "Rajasthan",
  jodhpur: "Rajasthan",
  udaipur: "Rajasthan",
  bikaner: "Rajasthan",
  pushkar: "Rajasthan",
  "mount abu": "Rajasthan",
  gangtok: "Sikkim",
  pelling: "Sikkim",
  lachung: "Sikkim",
  darjeeling: "West Bengal",
  kalimpong: "West Bengal",
  nainital: "Uttarakhand",
  mukteswar: "Uttarakhand",
  mussoorie: "Uttarakhand",
  rishikesh: "Uttarakhand",
  haridwar: "Uttarakhand",
  auli: "Uttarakhand",
  guwahati: "Assam",
  kaziranga: "Assam",
  shillong: "Meghalaya",
  cherrapunji: "Meghalaya",
  pondicherry: "Puducherry",
  goa: "Goa",
};

/** The state a package filed under `name` belongs to. Unknown names come
    back as they went in, so nothing is ever filtered out of existence. */
export function toIndiaState(name: string): string {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return "";
  return STATE_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}
