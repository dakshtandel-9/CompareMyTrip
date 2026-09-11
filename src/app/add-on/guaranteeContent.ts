export const QUOTE_STEPS = [
  { title: "Submit your details", body: "Share your basic personal information so we can create your profile and process your request." },
  { title: "Upload your quote", body: "Provide the competing travel quote you have received. It must cover the same destination and itinerary you want us to compare." },
  { title: "Pay the Token of Interest", body: "Pay a small Token of Interest (TOI) to confirm your commitment. It is non-refundable, except under our price-beat guarantee, and fully adjustable against your final booking." },
  { title: "Receive a better quote", body: "Our team reviews the competitor’s quote and sends you a discounted offer for the exact same package." },
  { title: "Book your package", body: "Happy with the offer? Confirm your package and we will deduct the TOI you have already paid from your final booking amount." },
  { title: "Our guarantee", body: "If we cannot beat the competitor’s quote, we refund your entire TOI and provide 10 times the TOI amount in redeemable rewards for future bookings with us." },
];

export type GuaranteeQuestion = { question: string; answers: string[] };

export const HOTEL_QUESTIONS: GuaranteeQuestion[] = [
  { question: "What if my hotel check-in is delayed?", answers: ["If check-in is delayed by more than two hours beyond the standard time, you will receive compensation of up to ₹2,000."] },
  { question: "What if the hotel has not received my booking confirmation?", answers: ["We double-check and reconfirm hotel reservations. If you are denied check-in because the hotel has not received confirmation, our team will immediately work with the hotel to resolve it. If necessary, we will secure an alternative property nearby."] },
  { question: "What if the hotel dishonors my confirmed booking?", answers: ["Our team will present similar-category options and arrange an alternative property."] },
  { question: "What if I do not like the alternative property?", answers: ["If the alternatives provided under the CompareMyTrip Trust Guarantee are unsuitable, reimbursement is the lowest of the following amounts:", "The new hotel’s booking invoice amount; 150% of the original booking amount; or 100% of the original booking amount plus ₹15,000.", "You must provide the invoice for the new booking paid directly at the property."] },
  { question: "What if the wrong room type is booked?", answers: ["Compensation is the lower of 50% of the booking amount or twice the price difference between the two room types, capped at ₹20,000."] },
  { question: "What if the stay does not match the promised inclusions?", answers: ["We work to ensure you receive all specified inclusions. If there is a discrepancy, we will promptly liaise with the hotel to rectify it."] },
];

export const HOLIDAY_QUESTIONS: GuaranteeQuestion[] = [
  { question: "What if my airport pickup is late?", answers: ["If your airport pickup is delayed by more than 20 minutes, we refund 100% of the transfer amount, up to ₹2,000."] },
  { question: "What if my airport pickup or drop is not provided?", answers: ["We aim to share pickup details before the scheduled time. If the pickup is not provided, please book a cab yourself. We will process reimbursement of up to 150% of the total cab bill."] },
  { question: "What if my private sightseeing pickup is late?", answers: ["For a pickup delay of more than 20 minutes, we refund 100% of the transfer amount, up to ₹2,000."] },
  { question: "What if other passengers delay a shared transfer?", answers: ["Seat-in-coach (SIC) transfers normally have a 30–40 minute buffer. For frequent delays caused by other passengers, we provide a refund of up to ₹500 for delays of more than 30 minutes, and ₹1,000 for delays of more than one hour."] },
  { question: "What if the hotel cannot find my holiday booking?", answers: ["We double-check and reconfirm reservations. Our team will help you get checked in and, subject to availability, upgrade your room by up to 150% of the room cost or ₹15,000, whichever is lower.", "If an upgrade is not feasible, we will arrange an alternative hotel in a similar category."] },
  { question: "What if sightseeing tickets are missing or late?", answers: ["If a ticket is not provided: a refund of 150% of the ticket amount, with additional compensation capped at ₹15,000.", "If a ticket is provided after 45 minutes: a free ticket or full refund of the ticket amount.", "If provided within 5–45 minutes: ₹1,000 or a 50% refund, whichever is lower."] },
  { question: "What if the hotel has health or safety issues, or the room category is wrong?", answers: ["Where possible, we will upgrade the room category by up to 30% of the cost, subject to availability. If a room upgrade is not possible, we will move you to a similar-category hotel.", "If unforeseen circumstances prevent these arrangements, we will offer complimentary sightseeing, an upgraded car type or a free meal, up to 20% of the booking amount."] },
  { question: "What if a confirmed meal is not provided?", answers: ["We will provide meal coupons or try to arrange the next meal at the hotel. The resolution varies by destination."] },
  { question: "What if the car is in poor condition?", answers: ["We will try to replace the vehicle or provide a higher category for the next pickup, drop or day. If unforeseen circumstances prevent a replacement, we will provide one complimentary meal coupon."] },
  { question: "What if the driver misbehaves?", answers: ["We use verified, professional drivers. If a driver misbehaves, we will immediately replace the driver or assign a new one for the rest of your trip."] },
];

export const GUARANTEE_EXCLUSIONS = [
  "Natural or unforeseeable events and peak dates, including Diwali, Christmas, New Year (31 December–1 January), Chinese New Year, and national or festival days at the destination.",
  "Changes made to the itinerary during the trip.",
  "Itinerary changes caused by natural events or government restrictions.",
];
