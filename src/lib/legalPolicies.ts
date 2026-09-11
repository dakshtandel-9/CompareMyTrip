// Approve only after filling the business details and reviewing all three policies.
export const LEGAL_POLICIES_APPROVED: boolean = false;
export const BUSINESS_DETAILS = {
  brand: "CompareMyTrip",
  website: "https://comparemytrip.in",
  legalName: "",
  address: "",
  supportEmail: "",
  supportPhone: "+91 95359 76868",
};

export const LEGAL_POLICIES = {
  terms: {
    title: "Terms and Conditions",
    sections: [
      ["Using CompareMyTrip", "These terms cover use of comparemytrip.in to compare travel packages, request quotations and arrange travel. You must be at least 18 to make a booking, provide accurate information and have permission to share details of other travellers. Keep your account credentials private."],
      ["Package information and confirmation", "Check the itinerary, travel dates, accommodation, transport, inclusions, exclusions and cancellation conditions before accepting an offer. Availability and advertised prices may change before confirmation. A comparison, enquiry or payment acknowledgement alone does not confirm availability; retain the written booking confirmation and the conditions supplied with it."],
      ["Prices and payments", "The accepted quotation must identify the total price, taxes, optional extras and payment schedule. Any material change must be explained before you agree to pay. Online payments are processed through PayU. Sandbox transactions are for testing only and do not purchase travel. Do not send card details, passwords or OTPs through enquiry forms."],
      ["Traveller responsibilities", "Check passport, visa, health and entry requirements for your destination and transit points. Supply correct traveller names and carry the required documents. Tell the travel desk about accessibility or other essential requirements before booking; availability must be confirmed with the relevant provider."],
      ["Changes, disruption and support", "Changes and cancellations are governed by the written terms accepted for your booking and our Refund and Cancellation Policy. If a supplier changes or cancels a service, contact the travel desk to discuss available alternatives and any refund entitlement. These terms do not remove rights or remedies available under applicable law. Contact us through the Contact page with your booking reference for assistance."],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      ["Information you provide", "CompareMyTrip receives account and contact details, travel preferences, enquiries, booking information and any quote PDFs you upload. Google sign-in shares the account information needed to authenticate you. Provide only information needed for your request and obtain permission before sharing another traveller’s details."],
      ["How information is used", "We use information to operate your account, respond to requests, arrange and support bookings, maintain transaction records and protect the service from misuse. Newsletter subscriptions are optional. To request removal from the mailing list, contact us through the Contact page."],
      ["Service providers", "The website uses Google Firebase for authentication and data storage, Cloudflare for hosting and media storage, and PayU for payment processing. Relevant booking details may be shared with the travel providers needed to fulfil the arrangement you request. Card and bank authentication details should be entered only on the payment provider’s page."],
      ["Browser storage and security", "Browser storage supports sign-in, saved comparisons and interface preferences. If analytics is configured, it may collect usage and device information. Firebase App Check may use Google reCAPTCHA Enterprise to help detect abuse. Access controls and restricted storage protect records, but no internet service can guarantee absolute security."],
      ["Retention and requests", "Quote PDF access expires after 72 hours. The scheduled cleanup process then removes expired files; separate enquiry and booking records may remain for support, accounting and applicable obligations. Contact us to request access, correction or deletion of your information, or to raise a privacy concern. We may need to verify your identity and explain any records that must be retained. Business contact details and retention schedules must be approved before this draft takes effect."],
    ],
  },
  refund: {
    title: "Refund and Cancellation Policy",
    sections: [
      ["Check the conditions before paying", "Cancellation charges, change fees, non-refundable items and refund eligibility depend on the package and its suppliers. The travel desk must provide the applicable conditions in writing before payment. Ask for clarification if any charge or deadline is missing. This draft does not establish a blanket free-cancellation promise."],
      ["Request a cancellation or change", "Contact CompareMyTrip through the Contact page and provide your booking reference, traveller name and requested change or cancellation. Keep the acknowledgement. A request is not complete until the travel desk confirms how it affects the booking, availability and any amount due."],
      ["Calculating a refund", "An eligible refund is based on the amount paid and the conditions accepted at booking, including disclosed supplier charges and services already used. No-shows and early departures may be subject to those conditions. Request a written breakdown of deductions. If a supplier cancels or cannot provide the agreed service, the travel desk will explain available alternatives and applicable refunds."],
      ["Payment issues and refund processing", "Report duplicate charges or a payment without a booking confirmation with the payment reference; never share an OTP or full card number. Approved refunds should return through the original payment method where supported. The travel desk must confirm the processing timeframe and provide a refund reference; bank posting time can differ. A fixed business refund deadline has not yet been approved."],
      ["Questions and statutory rights", "Use the Contact page for refund status or an unresolved concern and include the booking and payment references. Sandbox payments do not create real bookings or monetary refund obligations. This policy does not limit rights available under applicable law."],
    ],
  },
} as const;
