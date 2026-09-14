import type { FieldOption, Values } from "./services";

export const MAX_TRANSPORT_STOPS = 5;

export const TRANSPORT_TRIP_OPTIONS: FieldOption[] = [
  { value: "oneway", label: "Outstation One-Way" },
  { value: "round", label: "Outstation Round-Trip" },
  { value: "airport", label: "Airport Transfers" },
  { value: "hourly", label: "Hourly Rentals" },
];

export const TRANSPORT_DURATION_OPTIONS: FieldOption[] = [
  { value: "4", label: "4 hours" },
  { value: "8", label: "8 hours" },
  { value: "12", label: "12 hours" },
];

export function isOutstationTrip(values: Values): boolean {
  return values.tripType === "oneway" || values.tripType === "round";
}

/** Date inputs and their minimum use the visitor's calendar date, not UTC. */
export function localDateValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return localDateValue(date) === value;
}

/** Only the active transport mode contributes errors, matching the fields
    that are visible and included in the saved enquiry. */
export function validateTransport(values: Values, now = new Date()): Record<string, string> {
  const errors: Record<string, string> = {};
  const from = values.from?.trim() ?? "";
  const to = values.to?.trim() ?? "";
  const departDate = values.departDate ?? "";
  const pickupTime = values.pickupTime ?? "";

  if (!TRANSPORT_TRIP_OPTIONS.some((option) => option.value === values.tripType)) {
    errors.tripType = "Choose a trip type.";
  }
  if (!from) errors.from = "Add a pickup location.";
  if (values.tripType !== "hourly") {
    if (!to) errors.to = "Add a destination.";
    else if (from.replace(/\s/g, "").toLowerCase() === to.replace(/\s/g, "").toLowerCase()) {
      errors.to = "Choose a destination different from your pickup location.";
    }
  }

  if (!departDate) errors.departDate = "Add a departure date.";
  else if (!validDate(departDate)) errors.departDate = "Enter a valid departure date.";
  else if (departDate < localDateValue(now)) errors.departDate = "Choose today or a future departure date.";

  if (!pickupTime) errors.pickupTime = "Add a pickup time.";
  else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime)) {
    errors.pickupTime = "Enter a valid pickup time.";
  } else if (departDate === localDateValue(now)) {
    const [hours, minutes] = pickupTime.split(":").map(Number);
    const pickup = new Date(now.getTime());
    pickup.setHours(hours, minutes, 0, 0);
    if (pickup.getTime() < now.getTime()) errors.pickupTime = "Choose a pickup time later today.";
  }

  if (values.tripType === "round") {
    const returnDate = values.returnDate ?? "";
    if (!returnDate) errors.returnDate = "Add a return date.";
    else if (!validDate(returnDate)) errors.returnDate = "Enter a valid return date.";
    else if (validDate(departDate) && returnDate < departDate) {
      errors.returnDate = "Choose a return date on or after departure.";
    }
  }

  if (values.tripType === "hourly" && !TRANSPORT_DURATION_OPTIONS.some((option) => option.value === values.duration)) {
    errors.duration = "Choose a rental duration.";
  }

  if (isOutstationTrip(values)) {
    for (let index = 1; index <= MAX_TRANSPORT_STOPS && index <= Number(values.stopCount); index += 1) {
      if (!values[`stop${index}`]?.trim()) errors[`stop${index}`] = `Add stop ${index}.`;
    }
  }

  return errors;
}
