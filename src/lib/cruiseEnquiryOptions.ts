/* The cruise quote form's choices, apart from the Firestore code that files
   the enquiry, so the form can render them without loading Firestore. */

export const BOOKING_TIMELINES = ["immediately", "1_month", "3_months", "later", "unsure"] as const;
export type BookingTimeline = (typeof BOOKING_TIMELINES)[number];

export const BOOKING_TIMELINE_LABELS: Record<BookingTimeline, string> = {
  immediately: "Immediately",
  "1_month": "Within a month",
  "3_months": "In 1–3 months",
  later: "More than 3 months away",
  unsure: "Not sure yet",
};

export const CABIN_TYPES = ["interior", "ocean_view", "balcony", "suite", "any"] as const;
export type CabinType = (typeof CABIN_TYPES)[number];

export const CABIN_TYPE_LABELS: Record<CabinType, string> = {
  interior: "Interior",
  ocean_view: "Ocean view",
  balcony: "Balcony",
  suite: "Suite",
  any: "No preference",
};
