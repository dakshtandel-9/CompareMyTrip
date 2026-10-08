/* Customer-facing legal documents, copied word for word from the approved
   Word files in docs/terms/ (see "source" on each). Each block is a heading,
   paragraph, list or table in the order it appears in the document; **text**
   marks words that are bold in the original. Change the Word file first, then
   re-import, so the site and the signed-off document never drift apart. */

export type LegalBlock =
  | { t: "h"; level: 2 | 3 | 4; text: string }
  | { t: "p"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "table"; rows: string[][] };

export type LegalDocument = {
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  source: string;
  blocks: LegalBlock[];
};

export const LEGAL_DOCUMENTS = {
  "terms": {
    "eyebrow": "COMPAREMYTRIP",
    "title": "TERMS & CONDITIONS",
    "subtitle": null,
    "source": "docs/terms/COMPAREMYTRIP Terms and Conditions.docx",
    "blocks": [
      {
        "t": "p",
        "text": "**Effective Date:** [31/03/2026]\n**Last Updated:** [31/03/2026]"
      },
      {
        "t": "p",
        "text": "These Terms & Conditions (\"Terms\", \"Terms and Conditions\") govern your access to and use of the CompareMyTrip website, mobile application, booking platforms, communication channels and travel-related services."
      },
      {
        "t": "p",
        "text": "The website and services are operated by:"
      },
      {
        "t": "p",
        "text": "**Legal Entity Name:** COMPAREMYTRIP\n**Brand Name:** CompareMyTrip\n**Registered Office:** CompareMyTrip, WorkFlo, Ranka Junction, #224, 3rd Floor, Old Madras Road, K R Puram, Bengaluru, KAR 560016 (Near TIN Factory Metro Station)"
      },
      {
        "t": "p",
        "text": "**CIN/LLP/Proprietorship Details:** Mr. LINGARAJU GOWDA"
      },
      {
        "t": "p",
        "text": "**GSTIN:** 29ACWPL4818K1ZR\n**Customer Support:** 080 6927 7012\n**Email:** support@comparemytrip.in"
      },
      {
        "t": "p",
        "text": "**Website:** www.comparemytrip.in"
      },
      {
        "t": "p",
        "text": "By accessing our website, submitting an enquiry, making a booking, making payment, or using any service provided by CompareMyTrip, you acknowledge that you have read, understood and agreed to these Terms."
      },
      {
        "t": "p",
        "text": "If you do not agree with these Terms, please do not use the website or purchase our services."
      },
      {
        "t": "h",
        "level": 2,
        "text": "1. ABOUT COMPAREMYTRIP"
      },
      {
        "t": "p",
        "text": "CompareMyTrip is a travel services platform offering and/or arranging travel-related products and services including:"
      },
      {
        "t": "ul",
        "items": [
          "Sunrise treks",
          "Weekend treks",
          "Monsoon and forest treks",
          "Adventure activities",
          "Domestic holiday packages",
          "International holiday packages",
          "Flights",
          "Hotels and accommodation",
          "Transportation",
          "Visa assistance",
          "Customized travel packages",
          "Other travel-related services"
        ]
      },
      {
        "t": "p",
        "text": "Depending on the product, CompareMyTrip may act as a travel organiser, travel agent, booking facilitator, intermediary, reseller or coordinator between the customer and one or more third-party travel service providers."
      },
      {
        "t": "p",
        "text": "The precise role of CompareMyTrip may differ depending on the service booked."
      },
      {
        "t": "h",
        "level": 2,
        "text": "2. DEFINITIONS"
      },
      {
        "t": "p",
        "text": "For these Terms:"
      },
      {
        "t": "p",
        "text": "**\"Company\", \"CompareMyTrip\", \"we\", \"us\" or \"our\"** means the legal entity operating CompareMyTrip."
      },
      {
        "t": "p",
        "text": "**\"Customer\", \"you\" or \"your\"** means the person accessing our platform or purchasing/enquiring about our services."
      },
      {
        "t": "p",
        "text": "**\"Supplier\"** means an airline, hotel, resort, homestay, transport operator, trek operator, activity provider, DMC, visa service provider, insurance provider or other third-party service provider."
      },
      {
        "t": "p",
        "text": "**\"Booking\"** means a confirmed reservation for a travel service."
      },
      {
        "t": "p",
        "text": "**\"Enquiry\"** means a request for information, quotation or availability that has not yet been confirmed as a booking."
      },
      {
        "t": "p",
        "text": "**\"Travel Service\"** means any travel product or service offered, arranged or facilitated by CompareMyTrip."
      },
      {
        "t": "h",
        "level": 2,
        "text": "3. ELIGIBILITY"
      },
      {
        "t": "p",
        "text": "You must provide accurate information while using our website and booking services."
      },
      {
        "t": "p",
        "text": "Where required by law or by the relevant supplier, customers must meet applicable age, identification, fitness, passport, visa or other eligibility requirements."
      },
      {
        "t": "p",
        "text": "Where a booking is made on behalf of other travellers, the person making the booking confirms that they have authority to provide their information and accept these Terms on their behalf."
      },
      {
        "t": "h",
        "level": 2,
        "text": "4. WEBSITE INFORMATION"
      },
      {
        "t": "p",
        "text": "We make reasonable efforts to ensure that information displayed on our website is accurate and current."
      },
      {
        "t": "p",
        "text": "However, travel information can change due to:"
      },
      {
        "t": "ul",
        "items": [
          "Airline changes",
          "Hotel availability",
          "Government regulations",
          "Forest or wildlife restrictions",
          "Weather conditions",
          "Road conditions",
          "Visa regulations",
          "Supplier policies",
          "Operational circumstances",
          "Force majeure events"
        ]
      },
      {
        "t": "p",
        "text": "Accordingly, information shown online may be subject to change before or after booking."
      },
      {
        "t": "p",
        "text": "A quotation, itinerary, photograph, description or displayed price does not constitute a guarantee of availability unless expressly confirmed by CompareMyTrip."
      },
      {
        "t": "h",
        "level": 2,
        "text": "5. ENQUIRIES ARE NOT AUTOMATIC BOOKINGS"
      },
      {
        "t": "p",
        "text": "Submitting an enquiry, WhatsApp message, form, call request or quotation request does not automatically create a confirmed booking."
      },
      {
        "t": "p",
        "text": "A booking shall be considered confirmed only when:"
      },
      {
        "t": "ol",
        "items": [
          "CompareMyTrip confirms the booking; and",
          "The applicable payment has been successfully received; and",
          "A booking confirmation, voucher, ticket or other confirmation document is issued, where applicable."
        ]
      },
      {
        "t": "p",
        "text": "Until confirmation is issued, availability and pricing may change."
      },
      {
        "t": "h",
        "level": 2,
        "text": "6. PRICES"
      },
      {
        "t": "p",
        "text": "Prices displayed on our website may include or exclude taxes, permits, service fees, convenience fees, supplier charges or other applicable charges depending on the product."
      },
      {
        "t": "p",
        "text": "The final payable amount will be communicated before confirmation wherever applicable."
      },
      {
        "t": "p",
        "text": "Prices may change because of:"
      },
      {
        "t": "ul",
        "items": [
          "Supplier price changes",
          "Airline fare changes",
          "Foreign exchange fluctuations",
          "Government taxes",
          "Permit fees",
          "Fuel surcharges",
          "Seasonal pricing",
          "Availability",
          "Changes in itinerary"
        ]
      },
      {
        "t": "p",
        "text": "Unless expressly stated otherwise, quotations are subject to availability and validity specified in the quotation."
      },
      {
        "t": "h",
        "level": 2,
        "text": "7. PAYMENTS"
      },
      {
        "t": "p",
        "text": "Customers may be offered payment through available payment methods including:"
      },
      {
        "t": "ul",
        "items": [
          "UPI",
          "Credit cards",
          "Debit cards",
          "Net banking",
          "Payment gateways",
          "Bank transfer",
          "Other methods made available by CompareMyTrip"
        ]
      },
      {
        "t": "p",
        "text": "A payment is considered successful only when confirmation is received through the applicable payment system and/or CompareMyTrip."
      },
      {
        "t": "p",
        "text": "A payment being debited from a customer's bank account does not automatically mean that a booking has been confirmed."
      },
      {
        "t": "p",
        "text": "In the event of a failed, duplicate or incorrectly processed transaction, the customer should contact CompareMyTrip promptly."
      },
      {
        "t": "h",
        "level": 2,
        "text": "8. BOOKING CONFIRMATION"
      },
      {
        "t": "p",
        "text": "After successful confirmation, CompareMyTrip may issue:"
      },
      {
        "t": "ul",
        "items": [
          "Booking confirmation",
          "Invoice",
          "Travel voucher",
          "Hotel voucher",
          "Flight ticket",
          "Itinerary",
          "Activity voucher",
          "Other relevant documents"
        ]
      },
      {
        "t": "p",
        "text": "Customers are responsible for checking all details immediately after receiving confirmation."
      },
      {
        "t": "p",
        "text": "Any error relating to passenger names, dates, passport information, destinations or other material details must be reported promptly."
      },
      {
        "t": "p",
        "text": "Charges imposed by suppliers for corrections may be payable by the customer."
      },
      {
        "t": "h",
        "level": 2,
        "text": "9. TRAVELLER INFORMATION"
      },
      {
        "t": "p",
        "text": "Customers must provide accurate information."
      },
      {
        "t": "p",
        "text": "This may include:"
      },
      {
        "t": "ul",
        "items": [
          "Full name",
          "Date of birth",
          "Gender where required",
          "Contact information",
          "Passport information",
          "Visa information",
          "Emergency contact",
          "Passenger information",
          "Accommodation details",
          "Other information necessary to fulfil the booking"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall not be responsible for losses arising from incorrect or incomplete information supplied by the customer, subject to applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "10. FLIGHT BOOKINGS"
      },
      {
        "t": "p",
        "text": "Flight bookings are subject to the fare rules, conditions of carriage and policies of the relevant airline."
      },
      {
        "t": "p",
        "text": "Airlines may impose charges for:"
      },
      {
        "t": "ul",
        "items": [
          "Cancellation",
          "Rebooking",
          "Name correction",
          "Date change",
          "No-show",
          "Baggage",
          "Seat selection",
          "Meals",
          "Other ancillary services"
        ]
      },
      {
        "t": "p",
        "text": "Flight schedules are controlled by airlines and may change without notice."
      },
      {
        "t": "p",
        "text": "CompareMyTrip will assist customers with applicable airline-related requests to the extent reasonably possible."
      },
      {
        "t": "p",
        "text": "Where an airline cancels or changes a flight, the applicable airline rules and fare conditions will apply in addition to these Terms."
      },
      {
        "t": "h",
        "level": 2,
        "text": "11. HOTEL BOOKINGS"
      },
      {
        "t": "p",
        "text": "Hotel bookings are subject to the hotel's own terms and conditions."
      },
      {
        "t": "p",
        "text": "Room availability, room category, check-in/check-out times, deposits, taxes, meal plans, cancellation conditions and additional charges may vary."
      },
      {
        "t": "p",
        "text": "Hotels may require:"
      },
      {
        "t": "ul",
        "items": [
          "Government-issued identification",
          "Passport",
          "Security deposit",
          "Credit-card guarantee",
          "Local taxes",
          "Additional charges"
        ]
      },
      {
        "t": "p",
        "text": "Customers must comply with hotel rules."
      },
      {
        "t": "h",
        "level": 2,
        "text": "12. HOLIDAY PACKAGES"
      },
      {
        "t": "p",
        "text": "Holiday packages may contain a combination of:"
      },
      {
        "t": "ul",
        "items": [
          "Flights",
          "Hotels",
          "Transfers",
          "Sightseeing",
          "Activities",
          "Meals",
          "Guides",
          "Permits",
          "Other travel services"
        ]
      },
      {
        "t": "p",
        "text": "Inclusions and exclusions shall be specified in the quotation, itinerary or booking confirmation."
      },
      {
        "t": "p",
        "text": "Unless expressly stated, services not mentioned as included shall be treated as excluded."
      },
      {
        "t": "p",
        "text": "Itinerary sequencing may change due to operational requirements while maintaining substantially similar travel objectives where reasonably possible."
      },
      {
        "t": "h",
        "level": 2,
        "text": "13. TREKS AND ADVENTURE ACTIVITIES"
      },
      {
        "t": "p",
        "text": "Treks and adventure activities involve inherent risks."
      },
      {
        "t": "p",
        "text": "Customers must:"
      },
      {
        "t": "ul",
        "items": [
          "Follow instructions of trek leaders and operators.",
          "Follow applicable safety rules.",
          "Disclose relevant information required for safe participation.",
          "Follow age and fitness requirements.",
          "Carry required equipment and identification.",
          "Comply with forest, wildlife and government regulations."
        ]
      },
      {
        "t": "p",
        "text": "Treks may involve:"
      },
      {
        "t": "ul",
        "items": [
          "Uneven terrain",
          "Steep climbs",
          "Slippery surfaces",
          "Weather changes",
          "Remote locations",
          "Limited medical facilities",
          "Wildlife",
          "Road/transport risks",
          "Physical exertion"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip may modify, postpone, reroute or cancel an activity where reasonably necessary for safety, government restrictions, weather, permits, operational reasons or force majeure."
      },
      {
        "t": "h",
        "level": 2,
        "text": "14. FOREST AND GOVERNMENT PERMITS"
      },
      {
        "t": "p",
        "text": "Certain destinations require advance permits."
      },
      {
        "t": "p",
        "text": "Examples may include forest, wildlife or protected-area destinations."
      },
      {
        "t": "p",
        "text": "Permit availability is controlled by the relevant authority and cannot always be guaranteed."
      },
      {
        "t": "p",
        "text": "Where a permit is required, the customer may be required to provide accurate identification details within the required timeframe."
      },
      {
        "t": "p",
        "text": "Permit fees may be non-refundable where the relevant authority does not provide a refund."
      },
      {
        "t": "h",
        "level": 2,
        "text": "15. VISA ASSISTANCE"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may provide visa assistance, documentation guidance or application coordination."
      },
      {
        "t": "p",
        "text": "However, visa approval is solely determined by the relevant embassy, consulate, immigration authority or government agency."
      },
      {
        "t": "p",
        "text": "CompareMyTrip does not guarantee:"
      },
      {
        "t": "ul",
        "items": [
          "Visa approval",
          "Visa processing time",
          "Appointment availability",
          "Immigration clearance",
          "Entry into a country",
          "Duration of stay granted",
          "Any particular visa outcome"
        ]
      },
      {
        "t": "p",
        "text": "Government/embassy fees may be non-refundable."
      },
      {
        "t": "p",
        "text": "Customers remain responsible for providing genuine, complete and accurate documents and information."
      },
      {
        "t": "h",
        "level": 2,
        "text": "16. PASSPORT AND TRAVEL DOCUMENTS"
      },
      {
        "t": "p",
        "text": "Customers are solely responsible for ensuring that they possess valid:"
      },
      {
        "t": "ul",
        "items": [
          "Passport",
          "Visa",
          "Identity documents",
          "Permits",
          "Travel insurance",
          "Vaccination certificates where required",
          "Other legally required travel documents"
        ]
      },
      {
        "t": "p",
        "text": "Passport validity and visa requirements may differ by destination."
      },
      {
        "t": "p",
        "text": "Customers should verify applicable requirements before travel."
      },
      {
        "t": "h",
        "level": 2,
        "text": "17. CANCELLATION AND REFUNDS"
      },
      {
        "t": "p",
        "text": "Cancellation and refund requests are governed by the CompareMyTrip Cancellation & Refund Policy applicable to the relevant booking."
      },
      {
        "t": "p",
        "text": "Supplier-specific cancellation rules may also apply."
      },
      {
        "t": "p",
        "text": "Refunds may be subject to:"
      },
      {
        "t": "ul",
        "items": [
          "Airline charges",
          "Hotel cancellation charges",
          "Trek operator charges",
          "Permit charges",
          "Visa/government fees",
          "Payment gateway charges where applicable",
          "Service/convenience fees",
          "Administrative charges",
          "Non-refundable supplier components"
        ]
      },
      {
        "t": "p",
        "text": "The exact refund amount will depend on the booking and applicable supplier terms."
      },
      {
        "t": "h",
        "level": 2,
        "text": "18. CUSTOMER-REQUESTED CHANGES"
      },
      {
        "t": "p",
        "text": "Changes to:"
      },
      {
        "t": "ul",
        "items": [
          "Travel dates",
          "Passenger names",
          "Hotels",
          "Flights",
          "Destinations",
          "Activities",
          "Room categories",
          "Transfers"
        ]
      },
      {
        "t": "p",
        "text": "may result in additional charges."
      },
      {
        "t": "p",
        "text": "Changes are subject to availability and supplier approval."
      },
      {
        "t": "h",
        "level": 2,
        "text": "19. NO-SHOW"
      },
      {
        "t": "p",
        "text": "If a customer does not report for a confirmed service at the specified time or location, the booking may be treated as a no-show."
      },
      {
        "t": "p",
        "text": "No-show charges shall be determined by the applicable supplier and booking conditions."
      },
      {
        "t": "h",
        "level": 2,
        "text": "20. FORCE MAJEURE"
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall not be responsible for failure or delay caused by circumstances beyond reasonable control, including:"
      },
      {
        "t": "ul",
        "items": [
          "Natural disasters",
          "Severe weather",
          "Floods",
          "Landslides",
          "Earthquakes",
          "Epidemics/pandemics",
          "Government restrictions",
          "Political disturbances",
          "War",
          "Terrorism",
          "Strikes",
          "Civil unrest",
          "Airport closures",
          "Road closures",
          "Forest closures",
          "Supplier failures",
          "Airline disruptions",
          "Technical failures",
          "Other extraordinary circumstances"
        ]
      },
      {
        "t": "p",
        "text": "Where reasonably possible, CompareMyTrip will assist customers in identifying alternative arrangements."
      },
      {
        "t": "p",
        "text": "Additional costs may apply."
      },
      {
        "t": "h",
        "level": 2,
        "text": "21. THIRD-PARTY SERVICE PROVIDERS"
      },
      {
        "t": "p",
        "text": "Travel services may be provided by independent suppliers."
      },
      {
        "t": "p",
        "text": "Their terms may apply in addition to these Terms."
      },
      {
        "t": "p",
        "text": "CompareMyTrip may facilitate communication between the customer and supplier but cannot alter supplier policies unless expressly authorised to do so."
      },
      {
        "t": "h",
        "level": 2,
        "text": "22. TRAVEL INSURANCE"
      },
      {
        "t": "p",
        "text": "Customers are strongly encouraged to obtain appropriate travel insurance."
      },
      {
        "t": "p",
        "text": "Unless expressly included in the booking, travel insurance is not included."
      },
      {
        "t": "p",
        "text": "Customers are responsible for reviewing policy exclusions, coverage limits and claim procedures."
      },
      {
        "t": "h",
        "level": 2,
        "text": "23. CUSTOMER CONDUCT"
      },
      {
        "t": "p",
        "text": "Customers shall not:"
      },
      {
        "t": "ul",
        "items": [
          "Provide false information",
          "Misuse the website",
          "Attempt fraudulent bookings",
          "Use stolen payment methods",
          "Harass employees or suppliers",
          "Damage property",
          "Violate local laws",
          "Violate trek/activity safety rules",
          "Use prohibited substances during activities",
          "Attempt unauthorised access to our systems"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip may take appropriate action in cases of suspected fraud, abuse or unlawful activity, subject to applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "24. INTELLECTUAL PROPERTY"
      },
      {
        "t": "p",
        "text": "The CompareMyTrip name, logo, website content, graphics, text, photographs, designs, trademarks and other materials are protected by applicable intellectual-property laws."
      },
      {
        "t": "p",
        "text": "Users may not reproduce, copy, modify, distribute or commercially exploit our materials without prior written permission, except where permitted by law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "25. USER-GENERATED CONTENT"
      },
      {
        "t": "p",
        "text": "Where customers voluntarily submit photographs, reviews, testimonials or other content, CompareMyTrip may use such content for legitimate business and promotional purposes subject to applicable law and any permissions required."
      },
      {
        "t": "p",
        "text": "Customers must not submit content that infringes third-party rights or contains unlawful material."
      },
      {
        "t": "h",
        "level": 2,
        "text": "26. REVIEWS AND FEEDBACK"
      },
      {
        "t": "p",
        "text": "Customers are encouraged to provide genuine feedback."
      },
      {
        "t": "p",
        "text": "Reviews must not contain:"
      },
      {
        "t": "ul",
        "items": [
          "False allegations",
          "Threats",
          "Hate speech",
          "Personal information of others",
          "Illegal content",
          "Misleading claims"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip may moderate content in accordance with applicable law and platform rules."
      },
      {
        "t": "h",
        "level": 2,
        "text": "27. WEBSITE AVAILABILITY"
      },
      {
        "t": "p",
        "text": "We aim to maintain reliable website availability but do not guarantee uninterrupted access."
      },
      {
        "t": "p",
        "text": "The website may occasionally be unavailable due to:"
      },
      {
        "t": "ul",
        "items": [
          "Maintenance",
          "Updates",
          "Technical failures",
          "Security incidents",
          "Hosting issues",
          "Third-party service failures",
          "Other circumstances beyond reasonable control"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "28. LIMITATION OF LIABILITY"
      },
      {
        "t": "p",
        "text": "To the extent permitted by applicable law, CompareMyTrip shall not be responsible for losses arising solely from circumstances outside its reasonable control or from the independent acts or omissions of third-party suppliers."
      },
      {
        "t": "p",
        "text": "Nothing in these Terms shall exclude or restrict liability that cannot lawfully be excluded or restricted."
      },
      {
        "t": "p",
        "text": "Nothing in these Terms is intended to deprive consumers of rights available under applicable consumer-protection law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "29. INDEMNITY"
      },
      {
        "t": "p",
        "text": "To the extent permitted by law, the customer agrees to indemnify CompareMyTrip against losses, claims or expenses arising from:"
      },
      {
        "t": "ul",
        "items": [
          "False information supplied by the customer",
          "Fraudulent activity",
          "Violation of applicable law",
          "Violation of these Terms",
          "Misuse of the platform",
          "Unauthorised use of another person's payment method",
          "Infringement of third-party rights"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "30. PRIVACY AND PERSONAL DATA"
      },
      {
        "t": "p",
        "text": "Personal data shall be handled in accordance with the CompareMyTrip Privacy Policy and applicable data-protection law."
      },
      {
        "t": "p",
        "text": "By using our services, customers acknowledge that certain information may need to be processed and shared with relevant travel suppliers to fulfil bookings."
      },
      {
        "t": "p",
        "text": "Where consent is required, appropriate consent mechanisms shall be provided."
      },
      {
        "t": "h",
        "level": 2,
        "text": "31. ELECTRONIC COMMUNICATIONS"
      },
      {
        "t": "p",
        "text": "By using CompareMyTrip's services, customers may receive service-related communications through:"
      },
      {
        "t": "ul",
        "items": [
          "Email",
          "SMS",
          "WhatsApp",
          "Telephone",
          "Website notifications",
          "Other communication channels"
        ]
      },
      {
        "t": "p",
        "text": "Transactional communications may continue where necessary to provide a requested service."
      },
      {
        "t": "p",
        "text": "Promotional communications shall be handled in accordance with applicable requirements and customer preferences."
      },
      {
        "t": "h",
        "level": 2,
        "text": "32. AI AND AUTOMATED CUSTOMER SUPPORT"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may use automated systems, including AI-assisted chat or WhatsApp customer-support systems, to:"
      },
      {
        "t": "ul",
        "items": [
          "Answer frequently asked questions",
          "Collect enquiry information",
          "Provide general travel information",
          "Assist with lead qualification",
          "Facilitate customer support"
        ]
      },
      {
        "t": "p",
        "text": "Automated responses do not constitute a final booking confirmation unless expressly confirmed by CompareMyTrip."
      },
      {
        "t": "p",
        "text": "Customers should verify important booking, payment, visa and refund information through official confirmation channels."
      },
      {
        "t": "h",
        "level": 2,
        "text": "33. COMPLAINTS AND GRIEVANCE REDRESSAL"
      },
      {
        "t": "p",
        "text": "Customers may submit complaints through:"
      },
      {
        "t": "p",
        "text": "**Grievance Officer:** Mr. Lingaraju Gowda\n**Email:** raju.gowda@comparemytrip.in\n**Phone:** +91 95359 76868\n**Postal Address:** [CompareMyTrip, Ranka Junction, #224, 3rd Floor, Old Madras Road, K R Puram, Bengaluru, KAR 560016 (Near TIN Factory Metro Station)"
      },
      {
        "t": "p",
        "text": "A complaint reference/ticket may be provided where applicable."
      },
      {
        "t": "p",
        "text": "CompareMyTrip will process complaints in accordance with applicable law and its internal grievance procedure."
      },
      {
        "t": "h",
        "level": 2,
        "text": "34. GOVERNING LAW"
      },
      {
        "t": "p",
        "text": "These Terms shall be governed by the laws of India."
      },
      {
        "t": "p",
        "text": "Subject to applicable consumer-protection laws and jurisdictional rules, disputes may be subject to the courts/competent authorities having jurisdiction over [BENGALURU, KARNATAKA]."
      },
      {
        "t": "p",
        "text": "Nothing in this clause is intended to restrict any mandatory jurisdiction or statutory remedy available to a consumer under applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "35. CHANGES TO THESE TERMS"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may update these Terms from time to time."
      },
      {
        "t": "p",
        "text": "The updated version will be published on the website with the applicable effective date."
      },
      {
        "t": "p",
        "text": "Material changes may be communicated through appropriate channels where required."
      },
      {
        "t": "h",
        "level": 2,
        "text": "36. SEVERABILITY"
      },
      {
        "t": "p",
        "text": "If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue to apply to the extent permitted by law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "37. CONTACT"
      },
      {
        "t": "p",
        "text": "**CompareMyTrip**\nLegal Entity: COMPAREMYTRIP"
      },
      {
        "t": "p",
        "text": "Registered Address: CompareMyTrip, Ranka Junction, #224, 3rd Floor, Old Madras Road, K R Puram, Bengaluru, KAR 560016 (Near TIN Factory Metro Station)Email: [INSERT]\nPhone: 080 6927 7012"
      },
      {
        "t": "p",
        "text": "Website: www.comparemytrip.in"
      },
      {
        "t": "p",
        "text": "**End of Terms & Conditions**"
      }
    ]
  },
  "privacy": {
    "eyebrow": "COMPAREMYTRIP",
    "title": "PRIVACY POLICY & PERSONAL DATA PROTECTION NOTICE",
    "subtitle": null,
    "source": "docs/terms/COMPAREMYTRIP Privacy Policy.docx",
    "blocks": [
      {
        "t": "p",
        "text": "**Effective Date:** [31/03/2026]\n**Last Updated:** [31/03/2026]"
      },
      {
        "t": "p",
        "text": "CompareMyTrip (\"CompareMyTrip\", \"we\", \"us\", \"our\") respects your privacy and is committed to protecting personal data processed through our website, mobile application, booking systems and customer communication channels."
      },
      {
        "t": "p",
        "text": "This Privacy Policy explains what information we collect, why we collect it, how we use it, when we share it and the choices available to you."
      },
      {
        "t": "h",
        "level": 2,
        "text": "1. WHO WE ARE"
      },
      {
        "t": "p",
        "text": "**Legal Entity:** COMPAREMYTRIP"
      },
      {
        "t": "p",
        "text": "**Brand:** CompareMyTrip\n**Registered Address:** CompareMyTrip, WorkFlo, Ranka Junction, #224, 3rd Floor, Old Madras Road, K R Puram, Bengaluru, KAR 560016 (Near TIN Factory Metro Station)"
      },
      {
        "t": "p",
        "text": "**Email:** support@comparemytrip.in\n**Phone:** 080 6927 7012"
      },
      {
        "t": "p",
        "text": "For applicable processing activities, CompareMyTrip may act as the entity responsible for determining the purposes and means of processing personal data."
      },
      {
        "t": "h",
        "level": 2,
        "text": "2. INFORMATION WE COLLECT"
      },
      {
        "t": "p",
        "text": "Depending on the service you request, we may collect:"
      },
      {
        "t": "h",
        "level": 3,
        "text": "A. Identity Information"
      },
      {
        "t": "ul",
        "items": [
          "Full name",
          "Date of birth",
          "Age",
          "Gender where required",
          "Nationality where required",
          "Government identification information"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "B. Contact Information"
      },
      {
        "t": "ul",
        "items": [
          "Mobile number",
          "Email address",
          "Residential/correspondence address",
          "Emergency contact information"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "C. Travel Information"
      },
      {
        "t": "ul",
        "items": [
          "Travel dates",
          "Destination",
          "Passenger details",
          "Passport information",
          "Visa information",
          "Accommodation preferences",
          "Travel preferences",
          "Booking history"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "D. Payment Information"
      },
      {
        "t": "p",
        "text": "Payments may be processed through third-party payment service providers."
      },
      {
        "t": "p",
        "text": "CompareMyTrip may receive transaction-related information such as:"
      },
      {
        "t": "ul",
        "items": [
          "Payment status",
          "Transaction reference",
          "Payment method",
          "Amount",
          "Refund status"
        ]
      },
      {
        "t": "p",
        "text": "We do not ordinarily require customers to provide their complete card PIN, CVV or banking password to CompareMyTrip."
      },
      {
        "t": "p",
        "text": "Customers should never share banking passwords, OTPs or PINs with CompareMyTrip employees or chat agents."
      },
      {
        "t": "h",
        "level": 3,
        "text": "E. Communication Information"
      },
      {
        "t": "p",
        "text": "We may process information provided through:"
      },
      {
        "t": "ul",
        "items": [
          "Website forms",
          "Email",
          "WhatsApp",
          "Telephone calls",
          "Chat",
          "Customer-support conversations",
          "Reviews and feedback"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "F. Technical Information"
      },
      {
        "t": "p",
        "text": "Where applicable, we may collect:"
      },
      {
        "t": "ul",
        "items": [
          "IP address",
          "Browser type",
          "Device information",
          "Operating system",
          "Website activity",
          "Cookies",
          "Approximate location information",
          "Referral information",
          "Analytics information"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "3. WHY WE USE PERSONAL DATA"
      },
      {
        "t": "p",
        "text": "We may process personal data to:"
      },
      {
        "t": "ol",
        "items": [
          "Respond to enquiries.",
          "Create quotations.",
          "Process bookings.",
          "Issue tickets and vouchers.",
          "Arrange accommodation.",
          "Arrange transportation.",
          "Process visa assistance requests.",
          "Arrange trek permits where applicable.",
          "Process payments.",
          "Process refunds.",
          "Communicate booking updates.",
          "Provide customer support.",
          "Verify customer information.",
          "Prevent fraud and misuse.",
          "Maintain business and accounting records.",
          "Meet legal or regulatory requirements.",
          "Improve our website and services.",
          "Send promotional communications where permitted.",
          "Manage reviews and feedback.",
          "Operate AI-assisted customer-support systems."
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "4. TRAVEL SUPPLIER SHARING"
      },
      {
        "t": "p",
        "text": "Certain personal data must be shared with relevant service providers to fulfil a booking."
      },
      {
        "t": "p",
        "text": "Depending on the booking, recipients may include:"
      },
      {
        "t": "ul",
        "items": [
          "Airlines",
          "Hotels",
          "Resorts",
          "Homestays",
          "Transport providers",
          "Trek operators",
          "Activity providers",
          "Destination management companies",
          "Visa processing partners",
          "Government/immigration authorities",
          "Forest authorities",
          "Insurance providers",
          "Payment processors",
          "Technology/service providers"
        ]
      },
      {
        "t": "p",
        "text": "We seek to share information relevant to the service being provided."
      },
      {
        "t": "h",
        "level": 2,
        "text": "5. INTERNATIONAL DATA TRANSFERS"
      },
      {
        "t": "p",
        "text": "International travel bookings may require personal information to be transferred to service providers or authorities located outside India."
      },
      {
        "t": "p",
        "text": "Such processing may be necessary to fulfil the requested travel service and shall be handled in accordance with applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "6. MARKETING COMMUNICATION"
      },
      {
        "t": "p",
        "text": "Where applicable, CompareMyTrip may send promotional communications relating to:"
      },
      {
        "t": "ul",
        "items": [
          "Treks",
          "Holiday packages",
          "Travel offers",
          "Discounts",
          "New destinations",
          "Travel information"
        ]
      },
      {
        "t": "p",
        "text": "Promotional communication preferences may be managed through available unsubscribe or opt-out mechanisms."
      },
      {
        "t": "p",
        "text": "Transactional communications required to complete or support a booking may continue even if promotional communications are declined."
      },
      {
        "t": "h",
        "level": 2,
        "text": "7. COOKIES"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may use cookies and similar technologies for:"
      },
      {
        "t": "ul",
        "items": [
          "Website functionality",
          "Security",
          "Analytics",
          "Performance",
          "Personalisation",
          "Advertising and campaign measurement"
        ]
      },
      {
        "t": "p",
        "text": "Where applicable, users may manage cookie preferences through browser or website controls."
      },
      {
        "t": "h",
        "level": 2,
        "text": "8. AI AND AUTOMATED SYSTEMS"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may use AI-assisted systems for customer communication and lead qualification."
      },
      {
        "t": "p",
        "text": "Such systems may process information provided during customer conversations for purposes including:"
      },
      {
        "t": "ul",
        "items": [
          "Responding to enquiries",
          "Understanding travel requirements",
          "Providing general information",
          "Routing enquiries",
          "Supporting customer service"
        ]
      },
      {
        "t": "p",
        "text": "AI-generated information should not be treated as a final booking confirmation, visa approval, refund commitment or other legally binding confirmation unless issued by an authorised CompareMyTrip representative."
      },
      {
        "t": "h",
        "level": 2,
        "text": "9. DATA RETENTION"
      },
      {
        "t": "p",
        "text": "We retain personal data only for as long as reasonably necessary for the purposes for which it was collected, including:"
      },
      {
        "t": "ul",
        "items": [
          "Providing services",
          "Maintaining booking records",
          "Accounting",
          "Tax compliance",
          "Legal compliance",
          "Dispute resolution",
          "Fraud prevention",
          "Legitimate business purposes"
        ]
      },
      {
        "t": "p",
        "text": "Different categories of information may have different retention periods."
      },
      {
        "t": "p",
        "text": "Where personal data is no longer required and there is no legal requirement to retain it, appropriate deletion or anonymisation measures may be taken."
      },
      {
        "t": "h",
        "level": 2,
        "text": "10. DATA SECURITY"
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall implement reasonable technical and organisational safeguards appropriate to the personal data processed."
      },
      {
        "t": "p",
        "text": "Customers should also protect their accounts, devices and communication channels."
      },
      {
        "t": "p",
        "text": "CompareMyTrip will not request:"
      },
      {
        "t": "ul",
        "items": [
          "OTPs",
          "ATM PINs",
          "Banking passwords",
          "Card PINs"
        ]
      },
      {
        "t": "p",
        "text": "through ordinary customer-support communications."
      },
      {
        "t": "h",
        "level": 2,
        "text": "11. DATA BREACHES"
      },
      {
        "t": "p",
        "text": "Where a personal-data breach occurs, CompareMyTrip will take appropriate steps in accordance with applicable legal requirements, including assessment, containment, investigation and notification where required."
      },
      {
        "t": "h",
        "level": 2,
        "text": "12. YOUR RIGHTS"
      },
      {
        "t": "p",
        "text": "Subject to applicable law and the relevant implementation timeline, individuals may have rights relating to their personal data, including rights concerning:"
      },
      {
        "t": "ul",
        "items": [
          "Access to information",
          "Correction",
          "Updating",
          "Withdrawal of consent where processing is based on consent",
          "Deletion/erasure where applicable",
          "Grievance redressal",
          "Nomination of another individual where applicable under law"
        ]
      },
      {
        "t": "p",
        "text": "Requests may be submitted to:"
      },
      {
        "t": "p",
        "text": "**Privacy Contact:** Mr. Lingaraju Gowda\n**Email:** raju.gowda@comparemytrip.in\n**Phone:**  080 6927 7012"
      },
      {
        "t": "p",
        "text": "We may require reasonable verification before processing a request."
      },
      {
        "t": "h",
        "level": 2,
        "text": "13. WITHDRAWAL OF CONSENT"
      },
      {
        "t": "p",
        "text": "Where processing is based on consent, you may withdraw consent through the mechanism made available by CompareMyTrip."
      },
      {
        "t": "p",
        "text": "Withdrawal of consent shall not affect processing that is otherwise permitted or required by law."
      },
      {
        "t": "p",
        "text": "Withdrawal may affect our ability to provide certain services where the relevant information is necessary to fulfil the service."
      },
      {
        "t": "h",
        "level": 2,
        "text": "14. CHILDREN"
      },
      {
        "t": "p",
        "text": "CompareMyTrip does not knowingly seek unnecessary personal information from children."
      },
      {
        "t": "p",
        "text": "Where a booking involves a child, information necessary for the travel service may be collected from an authorised parent, guardian or person legally entitled to provide it."
      },
      {
        "t": "p",
        "text": "Additional requirements may apply depending on the nature of the service and applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "15. THIRD-PARTY WEBSITES"
      },
      {
        "t": "p",
        "text": "Our website may contain links to third-party websites, booking platforms, payment providers or supplier websites."
      },
      {
        "t": "p",
        "text": "We are not responsible for the privacy practices of independent third parties."
      },
      {
        "t": "p",
        "text": "Customers should review the relevant third party's privacy policy before submitting information."
      },
      {
        "t": "h",
        "level": 2,
        "text": "16. PAYMENT SERVICE PROVIDERS"
      },
      {
        "t": "p",
        "text": "Payments may be processed by independent payment providers."
      },
      {
        "t": "p",
        "text": "Payment providers may process information under their own privacy and security policies."
      },
      {
        "t": "p",
        "text": "CompareMyTrip does not ask customers to share payment passwords, OTPs or PINs with us."
      },
      {
        "t": "h",
        "level": 2,
        "text": "17. GRIEVANCE REDRESSAL"
      },
      {
        "t": "p",
        "text": "Privacy complaints may be submitted to:"
      },
      {
        "t": "p",
        "text": "**Grievance Officer:** Mr. Lingaraju Gowda\n**Email:** raju.gowda@comparemytrip.in\n**Phone:** +91 95359 76868\n**Postal Address:** CompareMyTrip, Ranka Junction, #224, 3rd Floor, Old Madras Road, K R Puram, Bengaluru, KAR 560016 (Near TIN Factory Metro Station)"
      },
      {
        "t": "p",
        "text": "We will review and respond to privacy-related complaints in accordance with applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "18. POLICY CHANGES"
      },
      {
        "t": "p",
        "text": "We may update this Privacy Policy from time to time."
      },
      {
        "t": "p",
        "text": "The latest version will be published on our website with the applicable effective date."
      },
      {
        "t": "h",
        "level": 2,
        "text": "19. CONTACT US"
      },
      {
        "t": "p",
        "text": "**CompareMyTrip**\nLegal Entity: COMPAREMYTRIP\nAddress: CompareMyTrip, Ranka Junction, #224, 3rd Floor, Old Madras Road, K R Puram, Bengaluru, KAR 560016 (Near TIN Factory Metro Station)\nPrivacy Email: support@comparemytrip.in"
      },
      {
        "t": "p",
        "text": "Customer Support: 080 6927 7012\nWebsite: www.comparemytrip.in"
      },
      {
        "t": "p",
        "text": "**End of Privacy Policy**"
      }
    ]
  },
  "refund": {
    "eyebrow": "COMPAREMYTRIP",
    "title": "CANCELLATION & REFUND POLICY",
    "subtitle": null,
    "source": "docs/terms/COMPAREMYTRIP Cancellation and Refund policy.docx",
    "blocks": [
      {
        "t": "p",
        "text": "**Effective Date:** [31/03/2026]\n**Last Updated:** [31/03/2026]"
      },
      {
        "t": "p",
        "text": "This Cancellation & Refund Policy applies to bookings made through CompareMyTrip, subject to the specific cancellation terms communicated for the relevant travel product."
      },
      {
        "t": "p",
        "text": "Because different travel services are supplied by different providers, cancellation charges may vary significantly."
      },
      {
        "t": "h",
        "level": 2,
        "text": "1. GENERAL PRINCIPLES"
      },
      {
        "t": "p",
        "text": "Every booking is subject to the cancellation terms applicable to that particular service."
      },
      {
        "t": "p",
        "text": "Before completing payment, customers should review:"
      },
      {
        "t": "ul",
        "items": [
          "Cancellation deadline",
          "Refund eligibility",
          "Supplier cancellation charges",
          "Non-refundable components",
          "Payment/service charges",
          "Amendment charges",
          "No-show conditions"
        ]
      },
      {
        "t": "p",
        "text": "Where a specific booking condition differs from this general policy, the booking-specific condition shall apply to the extent permitted by applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "2. CUSTOMER CANCELLATION REQUEST"
      },
      {
        "t": "p",
        "text": "Cancellation requests should be submitted through official CompareMyTrip channels."
      },
      {
        "t": "p",
        "text": "A cancellation is not considered effective merely because the customer:"
      },
      {
        "t": "ul",
        "items": [
          "Stops responding",
          "Does not attend",
          "Sends a message to an unofficial number",
          "Does not make the balance payment"
        ]
      },
      {
        "t": "p",
        "text": "The cancellation date shall ordinarily be determined from the date CompareMyTrip receives the cancellation request through an authorised channel."
      },
      {
        "t": "h",
        "level": 2,
        "text": "3. SUNRISE TREKS"
      },
      {
        "t": "p",
        "text": "Cancellation charges shall depend on:"
      },
      {
        "t": "ul",
        "items": [
          "Trek date",
          "Operator policy",
          "Transportation arrangements",
          "Permit arrangements",
          "Advance supplier payments"
        ]
      },
      {
        "t": "p",
        "text": "Where a booking-specific cancellation schedule is provided at the time of booking, that schedule will apply."
      },
      {
        "t": "p",
        "text": "For permit-based treks, permit fees already paid to government/forest authorities may be non-refundable where the authority does not provide a refund."
      },
      {
        "t": "h",
        "level": 2,
        "text": "4. MONSOON / FOREST TREKS"
      },
      {
        "t": "p",
        "text": "Monsoon and forest treks may involve:"
      },
      {
        "t": "ul",
        "items": [
          "Forest permits",
          "Restricted entry",
          "Transportation",
          "Homestays",
          "Jeep arrangements",
          "Trek operators"
        ]
      },
      {
        "t": "p",
        "text": "Cancellation charges may therefore include non-refundable supplier and permit components."
      },
      {
        "t": "p",
        "text": "Where weather or government restrictions require CompareMyTrip or the operator to cancel/postpone a trek, customers will be informed of the available alternatives or refund treatment applicable to the booking."
      },
      {
        "t": "h",
        "level": 2,
        "text": "5. WEEKEND & DOMESTIC HOLIDAY PACKAGES"
      },
      {
        "t": "p",
        "text": "Refunds depend on the individual components of the package."
      },
      {
        "t": "p",
        "text": "Potentially non-refundable components may include:"
      },
      {
        "t": "ul",
        "items": [
          "Hotel deposits",
          "Airline fares",
          "Transport",
          "Activity bookings",
          "Entrance tickets",
          "Permits",
          "Supplier advances",
          "DMC charges"
        ]
      },
      {
        "t": "p",
        "text": "The applicable cancellation schedule will be provided in the quotation or booking confirmation."
      },
      {
        "t": "h",
        "level": 2,
        "text": "6. INTERNATIONAL HOLIDAY PACKAGES"
      },
      {
        "t": "p",
        "text": "International packages may contain multiple suppliers and advance commitments."
      },
      {
        "t": "p",
        "text": "Cancellation charges may include:"
      },
      {
        "t": "ul",
        "items": [
          "Airline cancellation charges",
          "Hotel cancellation charges",
          "DMC charges",
          "Visa fees",
          "Embassy/government fees",
          "Activity charges",
          "Transportation",
          "Supplier deposits",
          "Foreign-exchange differences where applicable",
          "CompareMyTrip service charges where disclosed"
        ]
      },
      {
        "t": "p",
        "text": "The exact refund shall be calculated based on the booking components and applicable supplier rules."
      },
      {
        "t": "h",
        "level": 2,
        "text": "7. FLIGHT BOOKINGS"
      },
      {
        "t": "p",
        "text": "Flight cancellations and changes are subject to the airline's applicable fare rules."
      },
      {
        "t": "p",
        "text": "Depending on the fare, refund may be:"
      },
      {
        "t": "ul",
        "items": [
          "Fully refundable",
          "Partially refundable",
          "Refundable after deduction of applicable charges",
          "Non-refundable, subject to applicable law and airline rules"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip may also charge a disclosed service/convenience fee where applicable."
      },
      {
        "t": "p",
        "text": "Airline cancellation rules shall be communicated to the customer wherever reasonably available before booking."
      },
      {
        "t": "h",
        "level": 2,
        "text": "8. HOTEL BOOKINGS"
      },
      {
        "t": "p",
        "text": "Hotel cancellation rules depend on the selected rate and property."
      },
      {
        "t": "p",
        "text": "Rates may be:"
      },
      {
        "t": "ul",
        "items": [
          "Free cancellation",
          "Partially refundable",
          "Non-refundable",
          "Refundable until a specified deadline"
        ]
      },
      {
        "t": "p",
        "text": "After the applicable deadline, supplier charges may apply."
      },
      {
        "t": "h",
        "level": 2,
        "text": "9. VISA SERVICES"
      },
      {
        "t": "p",
        "text": "Visa fees charged by governments, embassies, consulates or visa centres may be non-refundable."
      },
      {
        "t": "p",
        "text": "CompareMyTrip's service fees may also be subject to the service terms disclosed at the time of engagement."
      },
      {
        "t": "p",
        "text": "Visa refusal, delay or non-issuance does not automatically create an entitlement to refund of government fees or third-party charges."
      },
      {
        "t": "h",
        "level": 2,
        "text": "10. CUSTOMER-REQUESTED CHANGES"
      },
      {
        "t": "p",
        "text": "A date change, name correction, itinerary change or other amendment may be treated as a cancellation and rebooking where required by the supplier."
      },
      {
        "t": "p",
        "text": "Additional charges may apply."
      },
      {
        "t": "h",
        "level": 2,
        "text": "11. NO-SHOW"
      },
      {
        "t": "p",
        "text": "Failure to attend a booked service may result in loss of the booking and applicable supplier charges."
      },
      {
        "t": "p",
        "text": "A no-show is not automatically eligible for a refund."
      },
      {
        "t": "h",
        "level": 2,
        "text": "12. BALANCE PAYMENT DEFAULT"
      },
      {
        "t": "p",
        "text": "Where a customer fails to pay the balance by the agreed deadline, CompareMyTrip may cancel the booking subject to the booking terms."
      },
      {
        "t": "p",
        "text": "Any refund, if applicable, shall be calculated after applicable supplier and contractual deductions."
      },
      {
        "t": "h",
        "level": 2,
        "text": "13. CANCELLATION BY COMPAREMYTRIP"
      },
      {
        "t": "p",
        "text": "If CompareMyTrip cancels a confirmed service for reasons within its control, the customer will be informed of the applicable refund, alternative arrangement or other remedy, subject to the nature of the booking and applicable law."
      },
      {
        "t": "p",
        "text": "Where cancellation results from circumstances outside CompareMyTrip's reasonable control, the refund shall depend on amounts recoverable from suppliers and the applicable booking terms, without limiting mandatory consumer rights."
      },
      {
        "t": "h",
        "level": 2,
        "text": "14. AIRLINE / HOTEL / SUPPLIER CANCELLATION"
      },
      {
        "t": "p",
        "text": "If a third-party supplier cancels a service, CompareMyTrip will assist the customer in accordance with the supplier's applicable policy."
      },
      {
        "t": "p",
        "text": "Where a supplier provides a refund, CompareMyTrip will process the corresponding customer refund after receiving or reconciling the relevant amount, subject to applicable deductions that were disclosed and legally permissible."
      },
      {
        "t": "h",
        "level": 2,
        "text": "15. FORCE MAJEURE"
      },
      {
        "t": "p",
        "text": "Where cancellation occurs because of:"
      },
      {
        "t": "ul",
        "items": [
          "Natural disaster",
          "Flood",
          "Landslide",
          "Severe weather",
          "Government restriction",
          "Forest closure",
          "War",
          "Civil unrest",
          "Pandemic/epidemic",
          "Airport closure",
          "Road closure",
          "Other extraordinary circumstances"
        ]
      },
      {
        "t": "p",
        "text": "the available refund or alternative arrangement will depend on supplier recoveries, booking conditions and applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "16. REFUND PROCESSING"
      },
      {
        "t": "p",
        "text": "Approved refunds will normally be processed to the original payment method unless another method is legally or operationally appropriate."
      },
      {
        "t": "p",
        "text": "Processing time may depend on:"
      },
      {
        "t": "ul",
        "items": [
          "Bank",
          "Card issuer",
          "Payment gateway",
          "Supplier",
          "International payment network",
          "Reconciliation process"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip will communicate the refund status where reasonably possible."
      },
      {
        "t": "h",
        "level": 2,
        "text": "17. DUPLICATE PAYMENTS"
      },
      {
        "t": "p",
        "text": "If a customer has made a genuine duplicate payment for the same booking, CompareMyTrip will investigate the transaction."
      },
      {
        "t": "p",
        "text": "Once verified, the excess amount may be refunded after reconciliation."
      },
      {
        "t": "h",
        "level": 2,
        "text": "18. REFUND CALCULATION"
      },
      {
        "t": "p",
        "text": "Where applicable:"
      },
      {
        "t": "p",
        "text": "**Customer Refund = Amount Received – Applicable Supplier Charges – Applicable Non-Refundable Components – Lawfully Applicable Charges**"
      },
      {
        "t": "p",
        "text": "The calculation will be communicated to the customer where required."
      },
      {
        "t": "h",
        "level": 2,
        "text": "19. NON-REFUNDABLE COMPONENTS"
      },
      {
        "t": "p",
        "text": "A booking may contain components that are expressly non-refundable."
      },
      {
        "t": "p",
        "text": "Examples include:"
      },
      {
        "t": "ul",
        "items": [
          "Certain airline fares",
          "Visa/embassy fees",
          "Government permit fees",
          "Certain hotel rates",
          "Supplier deposits",
          "Special event tickets",
          "Certain activity bookings"
        ]
      },
      {
        "t": "p",
        "text": "Non-refundable conditions must not be used to exclude rights that cannot legally be excluded."
      },
      {
        "t": "h",
        "level": 2,
        "text": "20. REFUND DISPUTES"
      },
      {
        "t": "p",
        "text": "If a customer disagrees with a refund calculation, they may contact the CompareMyTrip grievance team with:"
      },
      {
        "t": "ul",
        "items": [
          "Booking reference",
          "Customer name",
          "Payment reference",
          "Cancellation request",
          "Relevant correspondence"
        ]
      },
      {
        "t": "p",
        "text": "The matter will be reviewed based on the booking terms and applicable supplier conditions."
      },
      {
        "t": "h",
        "level": 2,
        "text": "21. IMPORTANT CUSTOMER NOTICE"
      },
      {
        "t": "p",
        "text": "Customers should not assume that:"
      },
      {
        "t": "ul",
        "items": [
          "Every booking is refundable.",
          "A visa fee is refundable.",
          "An airline fare is refundable.",
          "A hotel reservation is refundable.",
          "A permit fee is refundable.",
          "A supplier cancellation automatically results in an immediate refund."
        ]
      },
      {
        "t": "p",
        "text": "The exact conditions applicable to each booking will be communicated as part of the booking process."
      },
      {
        "t": "h",
        "level": 2,
        "text": "22. CONTACT FOR CANCELLATION"
      },
      {
        "t": "h",
        "level": 3,
        "text": "CompareMyTrip Customer Support"
      },
      {
        "t": "p",
        "text": "Email: support@comparemytrip.in\nPhone/WhatsApp: 080 6927 7012\nBusiness Hours: 09:00 – 19:00 IST"
      },
      {
        "t": "p",
        "text": "Customers should quote their booking reference when requesting cancellation."
      },
      {
        "t": "p",
        "text": "**End of Cancellation & Refund Policy**"
      }
    ]
  },
  "trustGuarantee": {
    "eyebrow": null,
    "title": "COMPAREMYTRIP TRUST GUARANTEE",
    "subtitle": "Hotel & Holiday Protection",
    "source": "docs/terms/COMPAREMYTRIP TRUST GUARANTEE.docx",
    "blocks": [
      {
        "t": "p",
        "text": "Effective Date: [31/03/2026]\nLast Updated: [31/03/2026]"
      },
      {
        "t": "p",
        "text": "The CompareMyTrip Trust Guarantee is an additional customer-assurance programme available on selected travel packages and bookings approved by CompareMyTrip."
      },
      {
        "t": "p",
        "text": "It is designed to provide customers with additional assistance and specified remedies when certain eligible service issues occur during a covered booking."
      },
      {
        "t": "h",
        "level": 4,
        "text": "IMPORTANT"
      },
      {
        "t": "p",
        "text": "The CompareMyTrip Trust Guarantee does NOT automatically apply to all packages, hotels, flights, treks, visa services or other products and services listed on CompareMyTrip."
      },
      {
        "t": "p",
        "text": "Trust Guarantee benefits apply only to bookings that are specifically identified by CompareMyTrip as Trust Guarantee Eligible / Trust Guaranteed in the applicable package, quotation, booking page, booking confirmation or other official booking communication."
      },
      {
        "t": "p",
        "text": "Customers should check their booking confirmation to determine whether their booking is covered and which benefits apply."
      },
      {
        "t": "h",
        "level": 2,
        "text": "PART A — HOTEL TRUST GUARANTEE"
      },
      {
        "t": "h",
        "level": 3,
        "text": "1. What if my hotel check-in is delayed?"
      },
      {
        "t": "p",
        "text": "If the customer's check-in is delayed by more than two hours beyond the hotel's standard check-in time, CompareMyTrip may provide compensation of up to ₹2,000, subject to the eligibility and claim conditions of this Trust Guarantee."
      },
      {
        "t": "p",
        "text": "The delay must be attributable to an issue covered by the Trust Guarantee and must be reasonably verifiable."
      },
      {
        "t": "p",
        "text": "The benefit does not apply where the delay results from circumstances outside the control of CompareMyTrip or the hotel, including government restrictions, natural events or customer-related circumstances."
      },
      {
        "t": "h",
        "level": 3,
        "text": "2. What if the hotel has not received my booking confirmation?"
      },
      {
        "t": "p",
        "text": "CompareMyTrip makes reasonable efforts to verify and reconfirm hotel reservations before the customer's arrival."
      },
      {
        "t": "p",
        "text": "If the customer is denied check-in because the hotel has not received or cannot locate the confirmed reservation, the customer should immediately contact the CompareMyTrip support team using the official contact details provided with the booking."
      },
      {
        "t": "p",
        "text": "Our team will work with the hotel to resolve the issue."
      },
      {
        "t": "p",
        "text": "Where necessary and subject to availability, CompareMyTrip may arrange an alternative property in the same or a reasonably comparable category."
      },
      {
        "t": "h",
        "level": 3,
        "text": "3. What if the hotel dishonours my confirmed booking?"
      },
      {
        "t": "p",
        "text": "If a hotel refuses to honour an eligible confirmed booking for reasons attributable to the hotel, CompareMyTrip will work with the customer and hotel to identify a suitable alternative."
      },
      {
        "t": "p",
        "text": "Where reasonably possible, we will provide alternative accommodation of a similar category."
      },
      {
        "t": "p",
        "text": "The alternative arrangement remains subject to availability and local operating conditions."
      },
      {
        "t": "h",
        "level": 3,
        "text": "4. What if I do not accept the alternative property?"
      },
      {
        "t": "p",
        "text": "Where an eligible Trust Guarantee booking is dishonoured by the hotel and the customer reasonably declines the alternative properties offered under the Trust Guarantee, CompareMyTrip may reimburse the customer's eligible replacement hotel expense."
      },
      {
        "t": "p",
        "text": "The maximum reimbursement shall be the lowest of:"
      },
      {
        "t": "ol",
        "items": [
          "The invoice amount of the replacement hotel booking;",
          "150% of the original hotel booking amount; or",
          "100% of the original hotel booking amount plus ₹15,000."
        ]
      },
      {
        "t": "h",
        "level": 4,
        "text": "Claim requirement"
      },
      {
        "t": "p",
        "text": "The customer must provide a valid invoice or payment receipt for the replacement accommodation booked and paid for directly by the customer at the property."
      },
      {
        "t": "p",
        "text": "Reimbursement is subject to verification and the applicable Trust Guarantee conditions."
      },
      {
        "t": "p",
        "text": "Only reasonable and directly related replacement accommodation expenses may be considered."
      },
      {
        "t": "h",
        "level": 3,
        "text": "5. What if the wrong room type is provided?"
      },
      {
        "t": "p",
        "text": "Where the room category or room type provided is materially different from the room type confirmed in an eligible booking, CompareMyTrip will first attempt to resolve the matter with the hotel."
      },
      {
        "t": "p",
        "text": "Where the issue cannot reasonably be rectified, compensation may be provided."
      },
      {
        "t": "p",
        "text": "The compensation shall be the lower of:"
      },
      {
        "t": "ul",
        "items": [
          "50% of the applicable booking amount; or",
          "Two times the applicable price difference between the confirmed room type and the room type actually provided,"
        ]
      },
      {
        "t": "p",
        "text": "subject to a maximum compensation of ₹20,000."
      },
      {
        "t": "p",
        "text": "The customer may be required to provide booking documents, photographs, hotel correspondence or other reasonable evidence to substantiate the claim."
      },
      {
        "t": "h",
        "level": 3,
        "text": "6. What if the stay does not match the promised inclusions?"
      },
      {
        "t": "p",
        "text": "CompareMyTrip works with its hotel partners to ensure that the inclusions specified in the confirmed booking are provided."
      },
      {
        "t": "p",
        "text": "If an included service, facility or benefit is missing or materially different from what was confirmed, the customer should contact CompareMyTrip as soon as reasonably possible during the stay."
      },
      {
        "t": "p",
        "text": "Our team will liaise with the hotel to rectify the discrepancy wherever possible."
      },
      {
        "t": "p",
        "text": "Where the issue cannot be reasonably rectified, the applicable remedy will depend on the nature and value of the missing inclusion and the specific Trust Guarantee coverage."
      },
      {
        "t": "h",
        "level": 2,
        "text": "PART B — HOLIDAY PACKAGE TRUST GUARANTEE"
      },
      {
        "t": "h",
        "level": 3,
        "text": "7. What if my airport pickup is late?"
      },
      {
        "t": "p",
        "text": "For an eligible private airport transfer, if the confirmed airport pickup is delayed by more than 20 minutes beyond the scheduled pickup time, CompareMyTrip will provide a refund of 100% of the applicable transfer amount, subject to a maximum of ₹2,000."
      },
      {
        "t": "p",
        "text": "The benefit is subject to verification of the scheduled pickup time and actual delay."
      },
      {
        "t": "p",
        "text": "The benefit does not apply where the delay results from circumstances outside the reasonable control of the service provider or CompareMyTrip."
      },
      {
        "t": "h",
        "level": 3,
        "text": "8. What if my airport pickup or drop is not provided?"
      },
      {
        "t": "p",
        "text": "CompareMyTrip aims to provide pickup and transfer details before the scheduled service time."
      },
      {
        "t": "p",
        "text": "If an eligible confirmed airport pickup or drop is not provided, the customer should immediately contact CompareMyTrip."
      },
      {
        "t": "p",
        "text": "Where the customer is required to arrange an alternative cab independently in order to avoid disruption to the trip, the customer should obtain a valid invoice/receipt."
      },
      {
        "t": "p",
        "text": "Subject to verification, CompareMyTrip may reimburse up to 150% of the total eligible replacement cab bill."
      },
      {
        "t": "p",
        "text": "The reimbursement remains subject to the applicable Trust Guarantee limits and reasonable replacement-cost assessment."
      },
      {
        "t": "p",
        "text": "Customers should contact CompareMyTrip as soon as reasonably possible before arranging an alternative service, where circumstances permit."
      },
      {
        "t": "h",
        "level": 3,
        "text": "9. What if my private sightseeing pickup is late?"
      },
      {
        "t": "p",
        "text": "For an eligible private sightseeing transfer, if the pickup is delayed by more than 20 minutes beyond the confirmed pickup time, CompareMyTrip will provide a refund of 100% of the applicable transfer amount, subject to a maximum of ₹2,000."
      },
      {
        "t": "p",
        "text": "The delay must be reasonably verifiable."
      },
      {
        "t": "h",
        "level": 3,
        "text": "10. What if other passengers delay my shared transfer?"
      },
      {
        "t": "p",
        "text": "Shared Seat-in-Coach (SIC) transfers operate differently from private transfers and may include a normal operational waiting period."
      },
      {
        "t": "p",
        "text": "A waiting buffer of approximately 30–40 minutes may apply depending on the destination, route and operational conditions."
      },
      {
        "t": "p",
        "text": "Where a delay is caused by other passengers and exceeds the applicable waiting period:"
      },
      {
        "t": "h",
        "level": 4,
        "text": "Delay exceeding 30 minutes"
      },
      {
        "t": "p",
        "text": "A compensation of up to ₹500 may apply."
      },
      {
        "t": "h",
        "level": 4,
        "text": "Delay exceeding one hour"
      },
      {
        "t": "p",
        "text": "A compensation of up to ₹1,000 may apply."
      },
      {
        "t": "p",
        "text": "The applicable amount will depend on the verified duration and circumstances of the delay."
      },
      {
        "t": "p",
        "text": "This benefit does not apply to delays caused by traffic, weather, road closures, government restrictions, operational disruptions or other circumstances outside the reasonable control of the transfer provider."
      },
      {
        "t": "h",
        "level": 2,
        "text": "11. What if the hotel cannot find my holiday booking?"
      },
      {
        "t": "p",
        "text": "CompareMyTrip makes reasonable efforts to reconfirm hotel reservations before arrival."
      },
      {
        "t": "p",
        "text": "If an eligible confirmed holiday booking cannot be located by the hotel, our team will immediately work with the property to resolve the issue."
      },
      {
        "t": "p",
        "text": "Where appropriate and subject to availability, CompareMyTrip may arrange an upgrade of up to 150% of the original room cost or ₹15,000, whichever is lower."
      },
      {
        "t": "p",
        "text": "If an appropriate upgrade is not feasible, CompareMyTrip will work to arrange an alternative hotel of a similar category."
      },
      {
        "t": "p",
        "text": "The applicable remedy will depend on availability and the circumstances of the incident."
      },
      {
        "t": "h",
        "level": 2,
        "text": "12. What if my sightseeing tickets are missing or delayed?"
      },
      {
        "t": "p",
        "text": "For an eligible sightseeing activity:"
      },
      {
        "t": "h",
        "level": 4,
        "text": "Ticket not provided"
      },
      {
        "t": "p",
        "text": "Where a confirmed sightseeing ticket is not provided and the customer is consequently unable to use the included attraction/service, CompareMyTrip may provide:"
      },
      {
        "t": "ul",
        "items": [
          "A refund of 150% of the applicable ticket amount, subject to;",
          "Additional compensation being capped at ₹15,000."
        ]
      },
      {
        "t": "p",
        "text": "The total applicable compensation shall be determined based on the actual circumstances and the Trust Guarantee limits."
      },
      {
        "t": "h",
        "level": 4,
        "text": "Ticket provided after 45 minutes"
      },
      {
        "t": "p",
        "text": "If a confirmed ticket is provided after a delay exceeding 45 minutes, CompareMyTrip may provide either:"
      },
      {
        "t": "ul",
        "items": [
          "A replacement/free ticket where reasonably possible; or",
          "A full refund of the applicable ticket amount."
        ]
      },
      {
        "t": "h",
        "level": 4,
        "text": "Ticket provided within 5–45 minutes"
      },
      {
        "t": "p",
        "text": "Where the ticket is provided between 5 and 45 minutes after the applicable scheduled time, the customer may receive:"
      },
      {
        "t": "ul",
        "items": [
          "₹1,000, or",
          "50% of the applicable ticket amount,"
        ]
      },
      {
        "t": "p",
        "text": "whichever is lower."
      },
      {
        "t": "p",
        "text": "The delay must be reasonably verifiable."
      },
      {
        "t": "h",
        "level": 2,
        "text": "13. What if the hotel has health, safety or room-category issues?"
      },
      {
        "t": "p",
        "text": "Where an eligible booking involves a material hotel health/safety concern or an incorrect room category, CompareMyTrip will first attempt to resolve the issue with the hotel."
      },
      {
        "t": "p",
        "text": "Where appropriate and subject to availability, we may arrange a room upgrade of up to 30% of the original room cost."
      },
      {
        "t": "p",
        "text": "If an appropriate room upgrade is not available, CompareMyTrip may arrange a similar-category alternative hotel."
      },
      {
        "t": "p",
        "text": "Where unforeseen circumstances prevent either remedy, CompareMyTrip may, depending on the circumstances, provide one of the following:"
      },
      {
        "t": "ul",
        "items": [
          "Complimentary sightseeing;",
          "An upgraded vehicle category; or",
          "A complimentary meal."
        ]
      },
      {
        "t": "p",
        "text": "The value of such alternative assistance may be up to 20% of the applicable booking amount."
      },
      {
        "t": "p",
        "text": "The remedy will be selected based on availability, destination and the nature of the issue."
      },
      {
        "t": "h",
        "level": 2,
        "text": "14. What if a confirmed meal is not provided?"
      },
      {
        "t": "p",
        "text": "Where a meal is expressly included and confirmed as part of an eligible booking, CompareMyTrip will work with the hotel or service provider to resolve the issue."
      },
      {
        "t": "p",
        "text": "Where possible, we may provide:"
      },
      {
        "t": "ul",
        "items": [
          "Meal coupons; or",
          "Assistance in arranging the next available meal at the hotel."
        ]
      },
      {
        "t": "p",
        "text": "The precise remedy may vary depending on the destination, meal plan, timing and availability."
      },
      {
        "t": "h",
        "level": 2,
        "text": "15. What if the car is in poor condition?"
      },
      {
        "t": "p",
        "text": "CompareMyTrip works with transportation partners to provide vehicles appropriate for the confirmed service."
      },
      {
        "t": "p",
        "text": "If a vehicle provided under an eligible booking is materially below the agreed or represented standard, our team will attempt to arrange:"
      },
      {
        "t": "ul",
        "items": [
          "A replacement vehicle; or",
          "A higher-category vehicle for the next applicable pickup, drop or travel day."
        ]
      },
      {
        "t": "p",
        "text": "If unforeseen circumstances prevent a vehicle replacement or upgrade, CompareMyTrip may provide one complimentary meal coupon as an alternative goodwill remedy."
      },
      {
        "t": "p",
        "text": "The availability of the remedy may depend on the destination and operational circumstances."
      },
      {
        "t": "h",
        "level": 2,
        "text": "16. What if the driver misbehaves?"
      },
      {
        "t": "p",
        "text": "CompareMyTrip expects its transportation partners and drivers to maintain professional conduct."
      },
      {
        "t": "p",
        "text": "If a driver engages in inappropriate, abusive, threatening or materially unprofessional behaviour, the customer should immediately report the incident to CompareMyTrip."
      },
      {
        "t": "p",
        "text": "Where reasonably possible, CompareMyTrip will work with the transportation provider to:"
      },
      {
        "t": "ul",
        "items": [
          "Replace the driver; or",
          "Assign another driver for the remaining applicable portion of the trip."
        ]
      },
      {
        "t": "p",
        "text": "Where the incident involves an immediate safety concern, customers should first move to a safe location and contact the relevant local emergency authorities where appropriate."
      },
      {
        "t": "p",
        "text": "The Trust Guarantee does not prevent customers from exercising any other legal rights or remedies available under applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "PART C — TRUST GUARANTEE CONDITIONS"
      },
      {
        "t": "h",
        "level": 3,
        "text": "17. Eligible Bookings Only"
      },
      {
        "t": "p",
        "text": "The Trust Guarantee applies only to specifically approved bookings."
      },
      {
        "t": "p",
        "text": "A product may be displayed on the CompareMyTrip website without being covered by the Trust Guarantee."
      },
      {
        "t": "p",
        "text": "Unless the booking confirmation or applicable package page expressly states that the booking is Trust Guarantee Eligible, these benefits should not be assumed to apply."
      },
      {
        "t": "h",
        "level": 3,
        "text": "18. Booking-Specific Terms"
      },
      {
        "t": "p",
        "text": "Different destinations, packages, suppliers and services may have different Trust Guarantee benefits."
      },
      {
        "t": "p",
        "text": "The benefits applicable to the customer's booking are those displayed or communicated at the time of booking."
      },
      {
        "t": "p",
        "text": "CompareMyTrip reserves the right to provide different benefit limits for different products, provided the applicable terms are communicated appropriately."
      },
      {
        "t": "h",
        "level": 2,
        "text": "19. Customer Responsibility"
      },
      {
        "t": "p",
        "text": "To claim a Trust Guarantee benefit, the customer must:"
      },
      {
        "t": "ul",
        "items": [
          "Contact CompareMyTrip as soon as reasonably possible after identifying the issue;",
          "Provide the booking reference;",
          "Provide relevant invoices/receipts where required;",
          "Provide photographs, videos or other evidence where reasonably required;",
          "Provide details of the incident;",
          "Cooperate with reasonable verification;",
          "Take reasonable steps to minimise avoidable losses."
        ]
      },
      {
        "t": "p",
        "text": "Where an alternative arrangement can reasonably resolve the issue, customers should give CompareMyTrip a reasonable opportunity to assist before independently purchasing an alternative service, except where immediate action is reasonably necessary for safety or to prevent significant disruption."
      },
      {
        "t": "h",
        "level": 2,
        "text": "20. Claims and Evidence"
      },
      {
        "t": "p",
        "text": "Trust Guarantee claims may be subject to verification."
      },
      {
        "t": "p",
        "text": "Depending on the claim, CompareMyTrip may request:"
      },
      {
        "t": "ul",
        "items": [
          "Hotel invoice;",
          "Replacement booking invoice;",
          "Cab invoice;",
          "Ticket;",
          "Booking voucher;",
          "Photographs;",
          "Videos;",
          "Messages from the supplier;",
          "Pickup timestamps;",
          "Payment proof;",
          "Other reasonable supporting evidence."
        ]
      },
      {
        "t": "p",
        "text": "Submitting false, altered or misleading documents may result in rejection of the claim and may lead to further action where appropriate."
      },
      {
        "t": "h",
        "level": 2,
        "text": "21. No Double Recovery"
      },
      {
        "t": "p",
        "text": "A customer shall not receive duplicate compensation for the same incident under multiple Trust Guarantee benefits."
      },
      {
        "t": "p",
        "text": "Where the customer has already received compensation, refund, reimbursement, credit or other monetary remedy from the relevant supplier for the same incident, the amount payable under the Trust Guarantee may be adjusted to prevent double recovery."
      },
      {
        "t": "p",
        "text": "This does not affect any mandatory legal rights available to the customer."
      },
      {
        "t": "h",
        "level": 2,
        "text": "22. Trust Guarantee Is Not Travel Insurance"
      },
      {
        "t": "p",
        "text": "The CompareMyTrip Trust Guarantee is a customer-service and contractual benefit programme."
      },
      {
        "t": "p",
        "text": "It is not travel insurance, personal accident insurance, medical insurance or an insurance product."
      },
      {
        "t": "p",
        "text": "Customers are encouraged to obtain appropriate travel insurance for their journey."
      },
      {
        "t": "h",
        "level": 2,
        "text": "23. Circumstances Where the Trust Guarantee Does Not Apply"
      },
      {
        "t": "p",
        "text": "Unless expressly stated otherwise in the applicable booking terms, Trust Guarantee benefits do not apply to issues arising primarily from:"
      },
      {
        "t": "ul",
        "items": [
          "Natural events;",
          "Severe or unforeseeable weather;",
          "Natural disasters;",
          "Floods;",
          "Landslides;",
          "Earthquakes;",
          "Government restrictions;",
          "Government orders;",
          "Border restrictions;",
          "Airport closures;",
          "Road closures;",
          "Forest or wildlife restrictions;",
          "Civil unrest;",
          "War;",
          "Strikes outside CompareMyTrip's reasonable control;",
          "Other force majeure events;",
          "Peak dates or destination-specific exceptional periods;",
          "Changes requested by the customer;",
          "Changes made by the customer during the trip;",
          "Itinerary changes requested by the customer;",
          "Itinerary changes required by natural events;",
          "Itinerary changes required by government authorities;",
          "Customer no-show;",
          "Customer arriving at the wrong location;",
          "Customer providing incorrect booking information;",
          "Failure to comply with supplier requirements;",
          "Personal preferences or dissatisfaction where the contracted service has been delivered as confirmed;",
          "Services not included in the customer's confirmed booking."
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "24. Peak Dates and Exceptional Periods"
      },
      {
        "t": "p",
        "text": "Trust Guarantee benefits may be restricted or unavailable during exceptionally high-demand periods and destination-specific peak dates, including, where applicable:"
      },
      {
        "t": "ul",
        "items": [
          "Diwali;",
          "Christmas;",
          "New Year;",
          "31 December–1 January;",
          "Chinese New Year;",
          "National holidays;",
          "Major destination festivals;",
          "Other officially notified or operationally exceptional periods."
        ]
      },
      {
        "t": "p",
        "text": "The applicable booking page or booking confirmation will indicate where such restrictions apply."
      },
      {
        "t": "h",
        "level": 2,
        "text": "25. Changes During the Trip"
      },
      {
        "t": "p",
        "text": "Trust Guarantee benefits do not ordinarily apply to changes voluntarily requested by the customer after the trip has commenced."
      },
      {
        "t": "p",
        "text": "Examples include:"
      },
      {
        "t": "ul",
        "items": [
          "Changing hotels;",
          "Changing sightseeing;",
          "Changing transportation;",
          "Changing travel dates;",
          "Removing services;",
          "Adding or removing destinations;",
          "Requesting a different itinerary."
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "26. Natural Events and Government Restrictions"
      },
      {
        "t": "p",
        "text": "Where an itinerary is changed because of:"
      },
      {
        "t": "ul",
        "items": [
          "Weather;",
          "Natural disasters;",
          "Government restrictions;",
          "Road closures;",
          "Airport restrictions;",
          "Forest restrictions;",
          "Safety orders; or",
          "Other circumstances beyond reasonable control,"
        ]
      },
      {
        "t": "p",
        "text": "the Trust Guarantee does not automatically create a right to compensation."
      },
      {
        "t": "p",
        "text": "CompareMyTrip will, where reasonably possible, assist customers with alternative arrangements or available supplier remedies."
      },
      {
        "t": "h",
        "level": 2,
        "text": "27. Limitation of Trust Guarantee Benefits"
      },
      {
        "t": "p",
        "text": "Unless a particular benefit expressly provides otherwise, Trust Guarantee benefits are limited to the monetary amounts and remedies stated in this policy."
      },
      {
        "t": "p",
        "text": "The Trust Guarantee does not create an unlimited obligation to reimburse all losses, consequential expenses, lost profits, missed connections or other indirect losses."
      },
      {
        "t": "p",
        "text": "Nothing in this policy excludes or restricts any liability or consumer right that cannot lawfully be excluded or restricted."
      },
      {
        "t": "h",
        "level": 2,
        "text": "28. Relationship With Cancellation & Refund Policy"
      },
      {
        "t": "p",
        "text": "Trust Guarantee benefits are separate from ordinary cancellation and refund rights."
      },
      {
        "t": "p",
        "text": "A Trust Guarantee benefit does not automatically make a booking refundable."
      },
      {
        "t": "p",
        "text": "The customer's cancellation/refund entitlement continues to be determined by the applicable:"
      },
      {
        "t": "ul",
        "items": [
          "Booking terms;",
          "Cancellation & Refund Policy;",
          "Supplier terms;",
          "Airline fare rules;",
          "Hotel rules;",
          "Visa terms;",
          "Permit rules; and",
          "Applicable law."
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "29. Amendments to the Trust Guarantee"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may modify or discontinue the Trust Guarantee programme for future bookings."
      },
      {
        "t": "p",
        "text": "Where Trust Guarantee coverage has already been expressly confirmed for an existing booking, the applicable confirmed terms shall continue to govern that booking, subject to applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "30. Customer Acknowledgement"
      },
      {
        "t": "p",
        "text": "By making a booking identified as Trust Guarantee Eligible, the customer acknowledges that:"
      },
      {
        "t": "ol",
        "items": [
          "The Trust Guarantee is available only for selected approved bookings.",
          "It does not automatically apply to every CompareMyTrip product or service.",
          "The benefits are subject to the applicable conditions, limits and exclusions.",
          "Certain claims require supporting documents.",
          "Alternative arrangements are subject to availability.",
          "The Trust Guarantee is not travel insurance.",
          "The Trust Guarantee does not guarantee that every travel disruption will result in monetary compensation."
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip Trust Guarantee is designed to provide additional assurance—not to replace the customer's statutory rights, supplier obligations or travel insurance coverage."
      },
      {
        "t": "p",
        "text": "End of CompareMyTrip Trust Guarantee"
      }
    ]
  },
  "dataProtection": {
    "eyebrow": "COMPAREMYTRIP",
    "title": "DATA PROTECTION & PERSONAL DATA GOVERNANCE FRAMEWORK",
    "subtitle": null,
    "source": "docs/terms/COMPAREMYTRIP DPDP Act Policy.docx",
    "blocks": [
      {
        "t": "p",
        "text": "**Document Type:** Internal Data Protection Framework\n**Organisation:** CompareMyTrip\n**Legal Entity:** [INSERT LEGAL ENTITY NAME]\n**Effective Date:** [DD/MM/YYYY]\n**Version:** 1.0\n**Document Owner:** [NAME / DESIGNATION]\n**Approved By:** [DIRECTOR / AUTHORISED PERSON]\n**Review Frequency:** At least annually and whenever applicable law, technology, products, suppliers or data-processing activities materially change."
      },
      {
        "t": "h",
        "level": 2,
        "text": "1. PURPOSE"
      },
      {
        "t": "p",
        "text": "This Data Protection & Personal Data Governance Framework (\"Framework\") establishes the principles, policies, procedures, responsibilities and controls that CompareMyTrip follows when collecting, processing, storing, sharing, protecting and deleting personal data."
      },
      {
        "t": "p",
        "text": "The Framework is designed to help CompareMyTrip:"
      },
      {
        "t": "ul",
        "items": [
          "Process personal data lawfully and transparently.",
          "Collect only personal data reasonably necessary for identified purposes.",
          "Provide appropriate privacy notices.",
          "Obtain and manage consent where consent is the applicable basis for processing.",
          "Enable applicable rights of individuals.",
          "Protect personal data against unauthorised access, loss, misuse, alteration or disclosure.",
          "Manage third-party data processors and suppliers appropriately.",
          "Respond to personal-data breaches.",
          "Establish appropriate data-retention and deletion practices.",
          "Maintain appropriate records and accountability.",
          "Protect customer, traveller, employee and business information."
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "2. SCOPE"
      },
      {
        "t": "p",
        "text": "This Framework applies to personal data processed by CompareMyTrip through all applicable business channels, systems and services, including:"
      },
      {
        "t": "h",
        "level": 3,
        "text": "2.1 Website"
      },
      {
        "t": "ul",
        "items": [
          "www.comparemytrip.in",
          "Booking pages",
          "Enquiry forms",
          "Contact forms",
          "Account and login systems",
          "Cookies",
          "Analytics and tracking technologies"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "2.2 Mobile Applications"
      },
      {
        "t": "ul",
        "items": [
          "Android application",
          "Future CompareMyTrip mobile applications"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "2.3 Customer Communication Channels"
      },
      {
        "t": "ul",
        "items": [
          "WhatsApp",
          "Meta Business tools",
          "AI-assisted customer-support systems",
          "Email",
          "SMS",
          "Telephone",
          "Website chat",
          "Social-media messaging"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "2.4 Travel Services"
      },
      {
        "t": "ul",
        "items": [
          "Flight bookings",
          "Hotel bookings",
          "Holiday packages",
          "Sunrise treks",
          "Weekend treks",
          "Monsoon and forest treks",
          "Transportation",
          "Visa assistance",
          "Travel insurance where applicable",
          "Activities and sightseeing",
          "Supplier coordination"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "2.5 Internal Systems"
      },
      {
        "t": "ul",
        "items": [
          "CRM systems",
          "Booking systems",
          "Accounting systems",
          "Customer-support systems",
          "Marketing platforms",
          "Cloud storage",
          "Email systems",
          "Employee systems",
          "Payment systems",
          "Other technology platforms used for business operations"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "3. DATA PROTECTION PRINCIPLE"
      },
      {
        "t": "p",
        "text": "CompareMyTrip follows the following core principle:"
      },
      {
        "t": "p",
        "text": "**Collect what we need, use it for a clear purpose, protect it appropriately, retain it only for as long as necessary, and delete it when it is no longer required.**"
      },
      {
        "t": "p",
        "text": "Personal data shall not be collected, accessed, used or shared unnecessarily."
      },
      {
        "t": "h",
        "level": 2,
        "text": "4. DATA CATEGORIES"
      },
      {
        "t": "p",
        "text": "Depending on the service requested, CompareMyTrip may process the following categories of personal data."
      },
      {
        "t": "h",
        "level": 3,
        "text": "4.1 Identity Information"
      },
      {
        "t": "ul",
        "items": [
          "Full name",
          "Date of birth",
          "Age",
          "Gender where required",
          "Nationality where required",
          "Government identification information where required"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "4.2 Contact Information"
      },
      {
        "t": "ul",
        "items": [
          "Mobile number",
          "Email address",
          "Residential or correspondence address",
          "Emergency contact information",
          "WhatsApp number"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "4.3 Travel Information"
      },
      {
        "t": "ul",
        "items": [
          "Destination",
          "Travel dates",
          "Passenger information",
          "Traveller preferences",
          "Hotel preferences",
          "Room preferences",
          "Flight preferences",
          "Activity preferences",
          "Trek information",
          "Transportation requirements",
          "Booking history"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "4.4 Passport and Immigration Information"
      },
      {
        "t": "p",
        "text": "Where required for a travel or visa service:"
      },
      {
        "t": "ul",
        "items": [
          "Passport number",
          "Passport expiry date",
          "Passport issue information",
          "Date of birth",
          "Nationality",
          "Passport copy",
          "Visa information",
          "Visa application information",
          "Immigration documentation"
        ]
      },
      {
        "t": "p",
        "text": "Passport and immigration information shall be collected only where reasonably necessary for the relevant service or legal requirement."
      },
      {
        "t": "h",
        "level": 2,
        "text": "5. PAYMENT INFORMATION"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may process transaction-related information such as:"
      },
      {
        "t": "ul",
        "items": [
          "Transaction ID",
          "Payment status",
          "Payment amount",
          "Payment method",
          "Payment gateway reference",
          "Refund status"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall not request or intentionally store unnecessary authentication credentials such as:"
      },
      {
        "t": "ul",
        "items": [
          "ATM PIN",
          "UPI PIN",
          "Banking password",
          "Card PIN",
          "OTP"
        ]
      },
      {
        "t": "p",
        "text": "Customers must never be asked to disclose such information through WhatsApp, email, telephone, website chat or AI-assisted customer support."
      },
      {
        "t": "h",
        "level": 2,
        "text": "6. CUSTOMER COMMUNICATION DATA"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may process information provided through:"
      },
      {
        "t": "ul",
        "items": [
          "Website forms",
          "Email",
          "WhatsApp",
          "Telephone calls",
          "Customer-support conversations",
          "Website chat",
          "Social-media communication",
          "AI-assisted chat",
          "Reviews and feedback"
        ]
      },
      {
        "t": "p",
        "text": "Such communications may contain information relating to travel requirements, bookings, preferences and customer support."
      },
      {
        "t": "h",
        "level": 2,
        "text": "7. TECHNICAL INFORMATION"
      },
      {
        "t": "p",
        "text": "Where applicable, CompareMyTrip may collect or receive:"
      },
      {
        "t": "ul",
        "items": [
          "IP address",
          "Browser type",
          "Device information",
          "Operating system",
          "Website activity",
          "Cookies",
          "Session information",
          "Approximate location information",
          "Referral information",
          "Analytics information",
          "Security and diagnostic information"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "8. PURPOSE LIMITATION"
      },
      {
        "t": "p",
        "text": "Personal data shall be processed only for identified and legitimate purposes."
      },
      {
        "t": "p",
        "text": "Examples include:"
      },
      {
        "t": "table",
        "rows": [
          [
            "Personal Data",
            "Purpose"
          ],
          [
            "Name",
            "Customer identification and booking"
          ],
          [
            "Mobile number",
            "Booking and service communication"
          ],
          [
            "Email address",
            "Booking confirmation, invoices and communication"
          ],
          [
            "Passport information",
            "International travel, airline or visa requirements"
          ],
          [
            "Date of birth",
            "Airline, visa, hotel or travel requirements"
          ],
          [
            "Emergency contact",
            "Trek and travel operational purposes"
          ],
          [
            "Payment reference",
            "Payment reconciliation"
          ],
          [
            "Booking history",
            "Customer support and booking management"
          ],
          [
            "WhatsApp conversations",
            "Enquiry and customer support"
          ],
          [
            "Website activity",
            "Security, analytics and website improvement"
          ],
          [
            "Marketing preference",
            "Promotional communication"
          ]
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall avoid collecting information merely because the technology permits collection."
      },
      {
        "t": "h",
        "level": 2,
        "text": "9. DATA MINIMISATION"
      },
      {
        "t": "p",
        "text": "Before collecting personal information, CompareMyTrip shall consider:"
      },
      {
        "t": "p",
        "text": "**Is this information actually necessary to provide the requested service or fulfil a legitimate or legal requirement?**"
      },
      {
        "t": "p",
        "text": "Where the information is not reasonably necessary, it should ordinarily not be collected."
      },
      {
        "t": "h",
        "level": 2,
        "text": "10. PRIVACY NOTICE"
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall provide an appropriate privacy notice when personal data is collected."
      },
      {
        "t": "p",
        "text": "The privacy notice should clearly explain:"
      },
      {
        "t": "ul",
        "items": [
          "What personal data is collected.",
          "Why the data is collected.",
          "How the data is used.",
          "Who the data may be shared with.",
          "How applicable consent may be withdrawn.",
          "How applicable data rights may be exercised.",
          "How privacy complaints may be submitted.",
          "How personal data is protected and retained."
        ]
      },
      {
        "t": "p",
        "text": "The notice should be presented in a clear and understandable manner."
      },
      {
        "t": "h",
        "level": 2,
        "text": "11. CONSENT MANAGEMENT"
      },
      {
        "t": "p",
        "text": "Where consent is the applicable basis for processing, CompareMyTrip shall use an affirmative consent mechanism."
      },
      {
        "t": "p",
        "text": "Consent shall not ordinarily be collected through pre-selected or pre-ticked marketing checkboxes."
      },
      {
        "t": "p",
        "text": "**Example:**"
      },
      {
        "t": "p",
        "text": "☐ I would like to receive travel offers, promotions and updates from CompareMyTrip."
      },
      {
        "t": "p",
        "text": "Marketing consent should be distinguishable from information or acknowledgement necessary to provide a requested travel service."
      },
      {
        "t": "h",
        "level": 2,
        "text": "12. BOOKING CHECKOUT CONSENT"
      },
      {
        "t": "p",
        "text": "Where applicable, the CompareMyTrip checkout process should separately identify:"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Terms & Conditions"
      },
      {
        "t": "p",
        "text": "☐ I have read and agree to the CompareMyTrip Terms & Conditions and Cancellation & Refund Policy."
      },
      {
        "t": "h",
        "level": 3,
        "text": "Privacy Notice"
      },
      {
        "t": "p",
        "text": "☐ I acknowledge the CompareMyTrip Privacy Notice and understand how my personal data will be processed to provide the requested services."
      },
      {
        "t": "h",
        "level": 3,
        "text": "Marketing"
      },
      {
        "t": "p",
        "text": "☐ I would like to receive promotional travel offers and updates from CompareMyTrip."
      },
      {
        "t": "p",
        "text": "Marketing consent should not be bundled into mandatory booking acceptance."
      },
      {
        "t": "h",
        "level": 2,
        "text": "13. CONSENT RECORDS"
      },
      {
        "t": "p",
        "text": "Where consent is relied upon, CompareMyTrip should maintain an appropriate record containing, where applicable:"
      },
      {
        "t": "ul",
        "items": [
          "Customer identifier",
          "Date and time",
          "Consent wording",
          "Consent version",
          "Purpose",
          "Communication channel",
          "Consent status",
          "Withdrawal date",
          "Relevant transaction or booking reference"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "14. WITHDRAWAL OF CONSENT"
      },
      {
        "t": "p",
        "text": "Where processing is based on consent, CompareMyTrip shall provide an accessible mechanism for withdrawal of consent."
      },
      {
        "t": "p",
        "text": "Withdrawal of consent should be reasonably straightforward and should not be unnecessarily more difficult than giving consent."
      },
      {
        "t": "p",
        "text": "Withdrawal shall not affect processing that is otherwise permitted or required by applicable law."
      },
      {
        "t": "p",
        "text": "Where withdrawal prevents CompareMyTrip from providing a service that requires the relevant data, the customer may be informed of the resulting limitation."
      },
      {
        "t": "h",
        "level": 2,
        "text": "15. DATA PRINCIPAL REQUESTS"
      },
      {
        "t": "p",
        "text": "Subject to applicable law, individuals may submit requests concerning their personal data."
      },
      {
        "t": "p",
        "text": "Such requests may include:"
      },
      {
        "t": "ul",
        "items": [
          "Access-related requests",
          "Correction or updating",
          "Erasure or deletion where applicable",
          "Withdrawal of consent",
          "Grievance",
          "Other rights available under applicable law"
        ]
      },
      {
        "t": "p",
        "text": "Requests shall be submitted to:"
      },
      {
        "t": "p",
        "text": "**Privacy Contact:** [NAME / DESIGNATION]\n**Email:** [PRIVACY EMAIL]\n**Phone:** [PHONE NUMBER]"
      },
      {
        "t": "h",
        "level": 2,
        "text": "16. IDENTITY VERIFICATION"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may conduct reasonable identity verification before processing requests involving disclosure, modification or deletion of personal information."
      },
      {
        "t": "p",
        "text": "Verification shall be designed to prevent:"
      },
      {
        "t": "ul",
        "items": [
          "Identity theft",
          "Unauthorised disclosure",
          "Fraudulent deletion",
          "Account takeover"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall avoid collecting unnecessary information solely for verification."
      },
      {
        "t": "h",
        "level": 2,
        "text": "17. DATA SHARING"
      },
      {
        "t": "p",
        "text": "Personal data may be shared with relevant third parties where reasonably necessary to provide the requested service or comply with applicable requirements."
      },
      {
        "t": "p",
        "text": "Recipients may include:"
      },
      {
        "t": "ul",
        "items": [
          "Airlines",
          "Hotels",
          "Resorts",
          "Homestays",
          "Destination Management Companies",
          "Trek operators",
          "Transportation providers",
          "Activity providers",
          "Visa service providers",
          "Government authorities",
          "Immigration authorities",
          "Forest authorities",
          "Payment providers",
          "Insurance providers",
          "Technology providers",
          "Cloud service providers",
          "Other authorised service providers"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall seek to limit information shared to what is reasonably necessary for the relevant purpose."
      },
      {
        "t": "h",
        "level": 2,
        "text": "18. DATA PROCESSOR AND SUPPLIER MANAGEMENT"
      },
      {
        "t": "p",
        "text": "Before engaging significant technology providers or data processors, CompareMyTrip should assess:"
      },
      {
        "t": "ul",
        "items": [
          "What data the provider receives.",
          "Why the provider receives the data.",
          "Where the data is processed.",
          "Security safeguards.",
          "Sub-processors.",
          "Data retention.",
          "Data deletion.",
          "Data breach notification.",
          "Access controls.",
          "Contractual obligations."
        ]
      },
      {
        "t": "p",
        "text": "Relevant supplier and processor arrangements should contain appropriate data-protection obligations."
      },
      {
        "t": "h",
        "level": 2,
        "text": "19. DATA PROCESSOR CONTRACT REQUIREMENTS"
      },
      {
        "t": "p",
        "text": "Where appropriate, agreements with data processors should address:"
      },
      {
        "t": "ol",
        "items": [
          "Purpose limitation.",
          "Confidentiality.",
          "Security safeguards.",
          "Access restrictions.",
          "Sub-processors.",
          "Data-breach notification.",
          "Data retention.",
          "Data deletion or return.",
          "Assistance with applicable data requests.",
          "Compliance cooperation.",
          "Security incident management.",
          "Applicable legal requirements."
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "20. INTERNATIONAL DATA PROCESSING"
      },
      {
        "t": "p",
        "text": "International travel bookings may require personal information to be provided to service providers or authorities located outside India."
      },
      {
        "t": "p",
        "text": "Examples include:"
      },
      {
        "t": "ul",
        "items": [
          "Foreign airlines",
          "Foreign hotels",
          "Destination management companies",
          "Foreign transport providers",
          "Visa authorities",
          "Immigration authorities",
          "International technology providers"
        ]
      },
      {
        "t": "p",
        "text": "Such processing shall be managed in accordance with applicable law and CompareMyTrip's privacy commitments."
      },
      {
        "t": "h",
        "level": 2,
        "text": "21. DATA RETENTION"
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall retain personal data only for as long as reasonably necessary for:"
      },
      {
        "t": "ul",
        "items": [
          "Providing the requested service",
          "Maintaining booking records",
          "Accounting",
          "Tax compliance",
          "Legal compliance",
          "Contractual requirements",
          "Dispute resolution",
          "Fraud prevention",
          "Security",
          "Legitimate operational requirements"
        ]
      },
      {
        "t": "p",
        "text": "Different categories of information may have different retention periods."
      },
      {
        "t": "h",
        "level": 2,
        "text": "22. SUGGESTED RETENTION FRAMEWORK"
      },
      {
        "t": "table",
        "rows": [
          [
            "Data Category",
            "Retention Approach"
          ],
          [
            "Enquiry data",
            "Until enquiry closure plus approved business retention period"
          ],
          [
            "Booking records",
            "Applicable legal, contractual and business retention period"
          ],
          [
            "Accounting records",
            "Applicable tax/accounting retention requirement"
          ],
          [
            "Passport copies",
            "Delete when no longer operationally or legally required"
          ],
          [
            "Visa documents",
            "Delete when no longer required"
          ],
          [
            "Marketing consent records",
            "Retain as necessary to demonstrate consent and manage preferences"
          ],
          [
            "Marketing opt-out records",
            "Retain necessary suppression information"
          ],
          [
            "Customer-support conversations",
            "Approved customer-service retention period"
          ],
          [
            "Payment references",
            "Applicable accounting/payment retention period"
          ],
          [
            "Security logs",
            "Approved security/legal retention period"
          ]
        ]
      },
      {
        "t": "p",
        "text": "Retention periods should be reviewed with appropriate legal, accounting and tax advisers before final implementation."
      },
      {
        "t": "h",
        "level": 2,
        "text": "23. SECURITY FRAMEWORK"
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall maintain reasonable technical and organisational safeguards appropriate to the nature, volume and risk of personal data processed."
      },
      {
        "t": "p",
        "text": "Security controls should include, as appropriate:"
      },
      {
        "t": "ul",
        "items": [
          "Encryption",
          "Masking",
          "Obfuscation",
          "Tokenisation",
          "Access controls",
          "Authentication",
          "Logging",
          "Monitoring",
          "Backups",
          "Security testing",
          "Vendor security controls"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "24. ACCESS CONTROL"
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall apply appropriate access controls including:"
      },
      {
        "t": "ul",
        "items": [
          "Unique user accounts",
          "Role-based access",
          "Least-privilege access",
          "Restricted administrator access",
          "Periodic access reviews",
          "Immediate access removal when an employee or contractor leaves",
          "Restricted access to passport and visa documents"
        ]
      },
      {
        "t": "p",
        "text": "Employees should only access personal data necessary for their role."
      },
      {
        "t": "h",
        "level": 2,
        "text": "25. AUTHENTICATION"
      },
      {
        "t": "p",
        "text": "Where technically available, CompareMyTrip should use:"
      },
      {
        "t": "ul",
        "items": [
          "Strong passwords",
          "Multi-factor authentication",
          "Secure administrator accounts",
          "Restricted privileged access",
          "Password-management controls"
        ]
      },
      {
        "t": "p",
        "text": "Shared administrator credentials should be avoided."
      },
      {
        "t": "h",
        "level": 2,
        "text": "26. PASSPORT AND TRAVEL DOCUMENT SECURITY"
      },
      {
        "t": "p",
        "text": "Passport and visa documents must be handled with enhanced care."
      },
      {
        "t": "p",
        "text": "Employees should:"
      },
      {
        "t": "ul",
        "items": [
          "Access documents only when necessary.",
          "Avoid unnecessary downloading.",
          "Avoid storing documents on personal devices.",
          "Avoid forwarding documents to personal email accounts.",
          "Use approved business systems for storage.",
          "Share documents only with authorised suppliers.",
          "Delete documents when the approved retention period expires."
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "27. WHATSAPP DATA PROTECTION"
      },
      {
        "t": "p",
        "text": "CompareMyTrip's WhatsApp operations shall follow appropriate privacy and security controls."
      },
      {
        "t": "p",
        "text": "Employees must never request:"
      },
      {
        "t": "ul",
        "items": [
          "OTPs",
          "UPI PINs",
          "ATM PINs",
          "Card PINs",
          "Banking passwords"
        ]
      },
      {
        "t": "p",
        "text": "Employees should avoid requesting unnecessary identity documents."
      },
      {
        "t": "p",
        "text": "Passport, visa and other sensitive documents should be exchanged only through approved business channels and stored in approved systems."
      },
      {
        "t": "h",
        "level": 2,
        "text": "28. AI CUSTOMER-SUPPORT DATA"
      },
      {
        "t": "p",
        "text": "CompareMyTrip may use AI-assisted systems for:"
      },
      {
        "t": "ul",
        "items": [
          "Frequently asked questions",
          "Travel enquiries",
          "Lead qualification",
          "Customer support",
          "Travel information",
          "Enquiry routing",
          "Booking assistance"
        ]
      },
      {
        "t": "p",
        "text": "AI systems shall operate only within approved access and data-processing boundaries."
      },
      {
        "t": "h",
        "level": 2,
        "text": "29. AI SYSTEM RESTRICTIONS"
      },
      {
        "t": "p",
        "text": "The CompareMyTrip AI system should not independently:"
      },
      {
        "t": "ul",
        "items": [
          "Guarantee a booking.",
          "Guarantee availability.",
          "Approve refunds.",
          "Promise compensation outside approved policies.",
          "Guarantee visa approval.",
          "Guarantee immigration clearance.",
          "Alter contractual terms.",
          "Request OTPs, PINs or passwords.",
          "Make representations outside approved business information."
        ]
      },
      {
        "t": "p",
        "text": "Material contractual decisions should be handled or confirmed by authorised CompareMyTrip personnel."
      },
      {
        "t": "h",
        "level": 2,
        "text": "30. AI CUSTOMER DISCLOSURE"
      },
      {
        "t": "p",
        "text": "Where appropriate, customers should be informed that they may interact with an AI-assisted customer-support system."
      },
      {
        "t": "p",
        "text": "Recommended wording:"
      },
      {
        "t": "p",
        "text": "**AI-Assisted Support Notice:** CompareMyTrip may use AI-assisted systems to respond to travel enquiries and provide general information. AI-generated responses are not final booking, refund, visa or contractual confirmations unless expressly confirmed by an authorised CompareMyTrip representative."
      },
      {
        "t": "h",
        "level": 2,
        "text": "31. MARKETING DATA"
      },
      {
        "t": "p",
        "text": "Marketing information should be managed separately from operational booking information."
      },
      {
        "t": "p",
        "text": "CompareMyTrip should maintain, where applicable:"
      },
      {
        "t": "ul",
        "items": [
          "Marketing consent",
          "Communication channel",
          "Consent date/time",
          "Consent status",
          "Withdrawal date",
          "Opt-out status",
          "Suppression status"
        ]
      },
      {
        "t": "p",
        "text": "A customer providing information for a booking should not automatically be treated as having consented to promotional marketing where consent is required."
      },
      {
        "t": "h",
        "level": 2,
        "text": "32. COOKIE AND TRACKING GOVERNANCE"
      },
      {
        "t": "p",
        "text": "CompareMyTrip should maintain an inventory of technologies used on its website and applications, including:"
      },
      {
        "t": "ul",
        "items": [
          "Cookies",
          "Analytics tools",
          "Advertising pixels",
          "Remarketing technologies",
          "Tag-management systems",
          "Third-party scripts"
        ]
      },
      {
        "t": "p",
        "text": "For each technology, the company should document:"
      },
      {
        "t": "p",
        "text": "**Technology → Purpose → Data Collected → Provider → Retention → Consent Requirement → Website/Application Location**"
      },
      {
        "t": "h",
        "level": 2,
        "text": "33. EMPLOYEE ACCESS"
      },
      {
        "t": "p",
        "text": "Employee access shall be based on job requirements."
      },
      {
        "t": "p",
        "text": "**Sales employees may require:**"
      },
      {
        "t": "ul",
        "items": [
          "Name",
          "Mobile number",
          "Email",
          "Destination",
          "Travel dates",
          "Budget",
          "Enquiry information"
        ]
      },
      {
        "t": "p",
        "text": "**Visa employees may require:**"
      },
      {
        "t": "ul",
        "items": [
          "Passport information",
          "Visa documents",
          "Travel information",
          "Supporting documentation"
        ]
      },
      {
        "t": "p",
        "text": "**Accounts employees may require:**"
      },
      {
        "t": "ul",
        "items": [
          "Invoice",
          "Payment reference",
          "Refund information",
          "Customer billing details"
        ]
      },
      {
        "t": "p",
        "text": "Employees should not have unrestricted access to all customer information."
      },
      {
        "t": "h",
        "level": 2,
        "text": "34. EMPLOYEE CONFIDENTIALITY"
      },
      {
        "t": "p",
        "text": "Employees, contractors and relevant business partners who handle personal data should be subject to appropriate confidentiality obligations."
      },
      {
        "t": "h",
        "level": 2,
        "text": "35. PROHIBITED EMPLOYEE PRACTICES"
      },
      {
        "t": "p",
        "text": "Employees must not:"
      },
      {
        "t": "ul",
        "items": [
          "Store customer passport copies unnecessarily on personal devices.",
          "Send customer documents to personal email accounts.",
          "Share customer information with unauthorised persons.",
          "Upload customer documents to unapproved AI tools.",
          "Request OTPs, PINs or passwords.",
          "Download customer databases unnecessarily.",
          "Use customer data for personal purposes.",
          "Sell or disclose customer information.",
          "Export customer lists without authorisation.",
          "Use customer data outside approved business purposes."
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "36. PERSONAL DATA BREACH"
      },
      {
        "t": "p",
        "text": "A personal-data breach may include unauthorised:"
      },
      {
        "t": "ul",
        "items": [
          "Access",
          "Disclosure",
          "Alteration",
          "Loss",
          "Destruction",
          "Availability compromise",
          "Other compromise of personal data"
        ]
      },
      {
        "t": "p",
        "text": "Any suspected breach must be reported immediately through the internal escalation process."
      },
      {
        "t": "h",
        "level": 2,
        "text": "37. DATA BREACH RESPONSE PROCEDURE"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Step 1 — Detect"
      },
      {
        "t": "p",
        "text": "Identify the suspected incident."
      },
      {
        "t": "h",
        "level": 3,
        "text": "Step 2 — Report"
      },
      {
        "t": "p",
        "text": "Immediately report the incident to:"
      },
      {
        "t": "p",
        "text": "**Data Protection Contact:** [NAME]\n**Email:** [EMAIL]\n**Phone:** [PHONE]"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Step 3 — Contain"
      },
      {
        "t": "p",
        "text": "Where appropriate:"
      },
      {
        "t": "ul",
        "items": [
          "Disable compromised credentials.",
          "Isolate affected systems.",
          "Stop unauthorised access.",
          "Preserve relevant evidence."
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "Step 4 — Assess"
      },
      {
        "t": "p",
        "text": "Determine:"
      },
      {
        "t": "ul",
        "items": [
          "What data was affected?",
          "How many individuals may be affected?",
          "How did the incident occur?",
          "Who may have accessed the information?",
          "What is the potential impact?"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "Step 5 — Notify"
      },
      {
        "t": "p",
        "text": "Where required by applicable law, CompareMyTrip shall make appropriate notifications to affected individuals and relevant authorities within the applicable statutory timelines and through prescribed mechanisms."
      },
      {
        "t": "h",
        "level": 3,
        "text": "Step 6 — Remediate"
      },
      {
        "t": "ul",
        "items": [
          "Correct the vulnerability.",
          "Reset credentials.",
          "Improve security controls.",
          "Address affected systems.",
          "Document corrective actions."
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "Step 7 — Review"
      },
      {
        "t": "p",
        "text": "Conduct a post-incident review and implement appropriate preventive measures."
      },
      {
        "t": "h",
        "level": 2,
        "text": "38. DATA BREACH REGISTER"
      },
      {
        "t": "p",
        "text": "CompareMyTrip should maintain an internal breach register containing:"
      },
      {
        "t": "ul",
        "items": [
          "Incident ID",
          "Date and time detected",
          "Date and time of incident, where known",
          "Systems affected",
          "Data categories affected",
          "Individuals affected",
          "Cause",
          "Containment measures",
          "Notifications",
          "Remediation",
          "Closure date",
          "Lessons learned"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "39. DATA DELETION"
      },
      {
        "t": "p",
        "text": "When personal data is no longer required:"
      },
      {
        "t": "ol",
        "items": [
          "Identify the relevant data.",
          "Confirm that no legal, contractual or regulatory retention requirement applies.",
          "Confirm that no legal hold or dispute requires preservation.",
          "Delete or anonymise the data.",
          "Delete relevant copies where reasonably practicable.",
          "Record completion where appropriate."
        ]
      },
      {
        "t": "p",
        "text": "Deletion procedures should address applicable:"
      },
      {
        "t": "ul",
        "items": [
          "Databases",
          "CRM",
          "Cloud storage",
          "Shared drives",
          "Documents",
          "Temporary files",
          "Backups according to the applicable backup lifecycle"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "40. LEGAL HOLD"
      },
      {
        "t": "p",
        "text": "Personal data must not be deleted where preservation is reasonably required for:"
      },
      {
        "t": "ul",
        "items": [
          "Litigation",
          "Consumer complaints",
          "Fraud investigation",
          "Regulatory investigation",
          "Legal notices",
          "Tax or accounting requirements",
          "Contractual disputes",
          "Other applicable legal obligations"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "41. CHILDREN'S DATA"
      },
      {
        "t": "p",
        "text": "Where a booking involves a child or minor, CompareMyTrip shall collect only information reasonably necessary for the requested travel service."
      },
      {
        "t": "p",
        "text": "Where applicable under law, appropriate parent or lawful guardian mechanisms shall be followed."
      },
      {
        "t": "p",
        "text": "Marketing, profiling and behavioural-monitoring practices involving children shall be handled with particular caution and in accordance with applicable law."
      },
      {
        "t": "h",
        "level": 2,
        "text": "42. CUSTOMER PRIVACY REQUEST WORKFLOW"
      },
      {
        "t": "p",
        "text": "The standard process shall be:"
      },
      {
        "t": "p",
        "text": "**Customer Request → Identity Verification → Request Logging → Data Identification → Legal/Retention Assessment → Action → Documentation → Response**"
      },
      {
        "t": "p",
        "text": "Customer-support employees should not independently delete, modify or disclose personal data outside the approved process."
      },
      {
        "t": "h",
        "level": 2,
        "text": "43. PRIVACY INCIDENT ESCALATION"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Level 1 — Low Risk"
      },
      {
        "t": "p",
        "text": "Examples:"
      },
      {
        "t": "ul",
        "items": [
          "General privacy question",
          "Routine preference update"
        ]
      },
      {
        "t": "p",
        "text": "Handled by customer support or privacy contact."
      },
      {
        "t": "h",
        "level": 3,
        "text": "Level 2 — Medium Risk"
      },
      {
        "t": "p",
        "text": "Examples:"
      },
      {
        "t": "ul",
        "items": [
          "Possible unauthorised disclosure",
          "Suspicious access",
          "Lost customer document"
        ]
      },
      {
        "t": "p",
        "text": "Escalate to management and the data-protection responsible person."
      },
      {
        "t": "h",
        "level": 3,
        "text": "Level 3 — High Risk"
      },
      {
        "t": "p",
        "text": "Examples:"
      },
      {
        "t": "ul",
        "items": [
          "Confirmed significant personal-data breach",
          "Large-scale unauthorised disclosure",
          "Compromised customer database",
          "Major system intrusion"
        ]
      },
      {
        "t": "p",
        "text": "Immediate management, technical and legal escalation is required."
      },
      {
        "t": "h",
        "level": 2,
        "text": "44. THIRD-PARTY REVIEW"
      },
      {
        "t": "p",
        "text": "CompareMyTrip should periodically review major data processors and suppliers according to risk."
      },
      {
        "t": "p",
        "text": "High-priority providers may include:"
      },
      {
        "t": "ul",
        "items": [
          "Booking technology providers",
          "Payment gateways",
          "CRM providers",
          "WhatsApp/Meta services",
          "Cloud providers",
          "Email providers",
          "Analytics providers",
          "Flight APIs",
          "Hotel APIs",
          "Visa processing providers",
          "Suppliers receiving passport or traveller information"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "45. DATA PROCESSOR REGISTER"
      },
      {
        "t": "p",
        "text": "CompareMyTrip should maintain a register containing:"
      },
      {
        "t": "table",
        "rows": [
          [
            "Provider",
            "Data Processed",
            "Purpose",
            "Location",
            "Contract",
            "Retention",
            "Risk"
          ],
          [
            "Payment Gateway",
            "Transaction data",
            "Payment processing",
            "[ ]",
            "[ ]",
            "[ ]",
            "Medium"
          ],
          [
            "WhatsApp/Meta",
            "Customer communications",
            "Customer support",
            "[ ]",
            "[ ]",
            "[ ]",
            "High"
          ],
          [
            "CRM",
            "Customer data",
            "Sales/service",
            "[ ]",
            "[ ]",
            "[ ]",
            "High"
          ],
          [
            "Hotel API",
            "Traveller information",
            "Hotel booking",
            "[ ]",
            "[ ]",
            "[ ]",
            "High"
          ],
          [
            "Flight API",
            "Passenger information",
            "Flight booking",
            "[ ]",
            "[ ]",
            "[ ]",
            "High"
          ],
          [
            "Visa Partner",
            "Passport/visa documents",
            "Visa processing",
            "[ ]",
            "[ ]",
            "[ ]",
            "High"
          ],
          [
            "Analytics Provider",
            "Technical data",
            "Analytics",
            "[ ]",
            "[ ]",
            "[ ]",
            "Medium"
          ]
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "46. DATA INVENTORY"
      },
      {
        "t": "p",
        "text": "CompareMyTrip should maintain a master data inventory covering:"
      },
      {
        "t": "p",
        "text": "**Collection Point → Data Collected → Purpose → Applicable Processing Basis → System → Supplier → Retention → Deletion Process**"
      },
      {
        "t": "p",
        "text": "The inventory should be reviewed whenever a new feature, product, supplier or technology is introduced."
      },
      {
        "t": "h",
        "level": 2,
        "text": "47. NEW PRODUCT AND TECHNOLOGY REVIEW"
      },
      {
        "t": "p",
        "text": "Before introducing:"
      },
      {
        "t": "ul",
        "items": [
          "A new booking API",
          "WhatsApp integration",
          "AI agent",
          "CRM",
          "Payment provider",
          "Analytics platform",
          "Visa provider",
          "Customer form",
          "Marketing platform",
          "New mobile application"
        ]
      },
      {
        "t": "p",
        "text": "CompareMyTrip should conduct a privacy review."
      },
      {
        "t": "p",
        "text": "The review should determine:"
      },
      {
        "t": "ol",
        "items": [
          "What personal data will be collected?",
          "Why is it required?",
          "Is the collection necessary?",
          "Who will receive the data?",
          "Where will the data be processed?",
          "How long will it be retained?",
          "How will it be protected?",
          "Is consent required?",
          "Does the Privacy Policy require updating?",
          "Does the supplier agreement require updating?"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "48. CUSTOMER-FACING PRIVACY DOCUMENTS"
      },
      {
        "t": "p",
        "text": "CompareMyTrip should maintain the following customer-facing documents as applicable:"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Core Documents"
      },
      {
        "t": "ul",
        "items": [
          "Privacy Policy",
          "Data Protection Notice",
          "Terms & Conditions",
          "Cancellation & Refund Policy",
          "Cookie Policy",
          "Grievance Redressal Policy"
        ]
      },
      {
        "t": "h",
        "level": 3,
        "text": "Recommended Additional Notices"
      },
      {
        "t": "ul",
        "items": [
          "WhatsApp & AI Customer Communication Notice",
          "Visa Data Processing Notice",
          "Trek & Adventure Data/Safety Notice",
          "Marketing Communication Notice"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "49. WEBSITE IMPLEMENTATION"
      },
      {
        "t": "p",
        "text": "The CompareMyTrip website should provide accessible links to:"
      },
      {
        "t": "p",
        "text": "**Terms & Conditions\nPrivacy Policy\nCancellation & Refund Policy\nCookie Policy\nGrievance Redressal**"
      },
      {
        "t": "p",
        "text": "Where applicable, checkout should provide:"
      },
      {
        "t": "p",
        "text": "☐ I acknowledge the CompareMyTrip Privacy Notice."
      },
      {
        "t": "p",
        "text": "Marketing should use a separate optional mechanism:"
      },
      {
        "t": "p",
        "text": "☐ I would like to receive travel offers and promotional communications from CompareMyTrip."
      },
      {
        "t": "p",
        "text": "Trust Guarantee bookings should separately state:"
      },
      {
        "t": "p",
        "text": "☐ I understand that the CompareMyTrip Trust Guarantee applies only to eligible bookings specifically identified as covered."
      },
      {
        "t": "h",
        "level": 2,
        "text": "50. DATA PROTECTION RESPONSIBILITY"
      },
      {
        "t": "p",
        "text": "CompareMyTrip shall designate an internal person responsible for coordinating privacy and data-protection matters."
      },
      {
        "t": "p",
        "text": "**Responsible Person:** [NAME]\n**Designation:** [DESIGNATION]\n**Email:** [EMAIL]\n**Phone:** [PHONE]"
      },
      {
        "t": "p",
        "text": "The responsible person may coordinate:"
      },
      {
        "t": "ul",
        "items": [
          "Privacy requests",
          "Data incidents",
          "Supplier compliance",
          "Policy updates",
          "Employee training",
          "Data inventory",
          "Retention",
          "Security escalation",
          "Privacy audits"
        ]
      },
      {
        "t": "p",
        "text": "The internal title used by CompareMyTrip shall not be represented as a statutory Data Protection Officer unless the applicable law requires or permits such designation."
      },
      {
        "t": "h",
        "level": 2,
        "text": "51. EMPLOYEE TRAINING"
      },
      {
        "t": "p",
        "text": "Employees who handle personal data should receive periodic training covering:"
      },
      {
        "t": "ul",
        "items": [
          "Data-protection principles",
          "Customer privacy",
          "Password security",
          "Phishing",
          "WhatsApp security",
          "Passport-document handling",
          "Customer verification",
          "Data sharing",
          "AI usage",
          "Breach reporting",
          "Data retention",
          "Data deletion"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "52. DATA PROTECTION AND MARKETING"
      },
      {
        "t": "p",
        "text": "Information collected for fulfilling a customer's booking should not automatically be treated as marketing consent where separate consent is required."
      },
      {
        "t": "p",
        "text": "Operational communication and promotional communication should be appropriately distinguished."
      },
      {
        "t": "h",
        "level": 2,
        "text": "53. DATA PROTECTION AND SUPPLIERS"
      },
      {
        "t": "p",
        "text": "Before sharing traveller information with a supplier, employees should consider:"
      },
      {
        "t": "p",
        "text": "**Is this information necessary to fulfil this booking or service?**"
      },
      {
        "t": "p",
        "text": "If yes, it may be shared through an approved business channel."
      },
      {
        "t": "p",
        "text": "If no, it should not be shared."
      },
      {
        "t": "h",
        "level": 2,
        "text": "54. RECORD KEEPING"
      },
      {
        "t": "p",
        "text": "CompareMyTrip should maintain appropriate records relating to:"
      },
      {
        "t": "ul",
        "items": [
          "Privacy notices",
          "Consent records",
          "Consent withdrawals",
          "Data-principal requests",
          "Privacy complaints",
          "Data breaches",
          "Processor contracts",
          "Data inventories",
          "Retention schedules",
          "Security reviews",
          "Employee training",
          "Privacy assessments",
          "Supplier reviews"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "55. ANNUAL REVIEW"
      },
      {
        "t": "p",
        "text": "At least annually, CompareMyTrip should review:"
      },
      {
        "t": "ul",
        "items": [
          "Privacy Policy",
          "Data inventory",
          "Processor register",
          "Retention schedule",
          "Security controls",
          "Consent mechanisms",
          "Cookie technologies",
          "AI systems",
          "WhatsApp workflows",
          "Supplier data-sharing arrangements",
          "Breach history",
          "Applicable laws and regulations"
        ]
      },
      {
        "t": "p",
        "text": "A review should also be conducted whenever there is a significant:"
      },
      {
        "t": "ul",
        "items": [
          "Technology change",
          "Product change",
          "Supplier change",
          "Data-processing change",
          "Legal or regulatory change",
          "Security incident"
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "56. COMPLIANCE DASHBOARD"
      },
      {
        "t": "p",
        "text": "Management should periodically review the following:"
      },
      {
        "t": "table",
        "rows": [
          [
            "Compliance Area",
            "Target"
          ],
          [
            "Privacy complaints",
            "100% logged and tracked"
          ],
          [
            "Data requests",
            "100% logged and processed"
          ],
          [
            "Data breaches",
            "100% logged and escalated"
          ],
          [
            "Employee privacy training",
            "100% relevant employees"
          ],
          [
            "Processor agreements",
            "100% high-risk processors"
          ],
          [
            "Data retention reviews",
            "Completed periodically"
          ],
          [
            "Consent records",
            "Available where required"
          ],
          [
            "Access reviews",
            "Completed periodically"
          ],
          [
            "Passport-data exposure",
            "Minimise"
          ],
          [
            "Unauthorised access",
            "Zero tolerance"
          ],
          [
            "Privacy policy review",
            "At least annually"
          ],
          [
            "Supplier privacy review",
            "Risk-based"
          ]
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "57. DOCUMENT HIERARCHY"
      },
      {
        "t": "p",
        "text": "The CompareMyTrip privacy programme shall operate through the following hierarchy:"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Level 1 — Applicable Law and Regulations"
      },
      {
        "t": "p",
        "text": "↓"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Level 2 — CompareMyTrip Data Protection & Personal Data Governance Framework"
      },
      {
        "t": "p",
        "text": "↓"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Level 3 — Privacy Policy and Customer Privacy Notice"
      },
      {
        "t": "p",
        "text": "↓"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Level 4 — Internal Data Protection SOPs"
      },
      {
        "t": "p",
        "text": "↓"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Level 5 — Employee Procedures and Training"
      },
      {
        "t": "p",
        "text": "↓"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Level 6 — Technical and Organisational Controls"
      },
      {
        "t": "h",
        "level": 2,
        "text": "58. LEGAL COMPLIANCE PRINCIPLE"
      },
      {
        "t": "p",
        "text": "Nothing in this Framework, Privacy Policy, Terms & Conditions or any other CompareMyTrip document shall be interpreted as:"
      },
      {
        "t": "ul",
        "items": [
          "Waiving a statutory right;",
          "Avoiding a mandatory legal obligation;",
          "Preventing an individual from exercising a lawful remedy;",
          "Removing any obligation imposed on CompareMyTrip by applicable law."
        ]
      },
      {
        "t": "p",
        "text": "Where applicable law provides a higher level of protection, the applicable law shall prevail."
      },
      {
        "t": "h",
        "level": 2,
        "text": "59. MANAGEMENT APPROVAL"
      },
      {
        "t": "p",
        "text": "This Framework shall be approved by an authorised representative of CompareMyTrip."
      },
      {
        "t": "p",
        "text": "**Approved By:** __________________________________"
      },
      {
        "t": "p",
        "text": "**Designation:** __________________________________"
      },
      {
        "t": "p",
        "text": "**Date:** __________________________________"
      },
      {
        "t": "p",
        "text": "**Signature:** __________________________________"
      },
      {
        "t": "h",
        "level": 2,
        "text": "60. VERSION CONTROL"
      },
      {
        "t": "table",
        "rows": [
          [
            "Version",
            "Date",
            "Change",
            "Approved By"
          ],
          [
            "1.0",
            "[DD/MM/YYYY]",
            "Initial Data Protection Framework",
            "[NAME]"
          ]
        ]
      },
      {
        "t": "h",
        "level": 2,
        "text": "COMPAREMYTRIP DATA PROTECTION IMPLEMENTATION CHECKLIST"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Legal and Governance"
      },
      {
        "t": "p",
        "text": "Exact legal entity name inserted"
      },
      {
        "t": "p",
        "text": "Registered office inserted"
      },
      {
        "t": "p",
        "text": "Privacy contact appointed"
      },
      {
        "t": "p",
        "text": "Official privacy email created"
      },
      {
        "t": "p",
        "text": "Grievance Officer identified"
      },
      {
        "t": "p",
        "text": "Management approval obtained"
      },
      {
        "t": "p",
        "text": "Framework version recorded"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Data Management"
      },
      {
        "t": "p",
        "text": "Master data inventory created"
      },
      {
        "t": "p",
        "text": "Personal-data collection points identified"
      },
      {
        "t": "p",
        "text": "Data-processing purposes documented"
      },
      {
        "t": "p",
        "text": "Data-sharing register created"
      },
      {
        "t": "p",
        "text": "Processor register created"
      },
      {
        "t": "p",
        "text": "International data flows identified"
      },
      {
        "t": "p",
        "text": "Retention schedule approved"
      },
      {
        "t": "p",
        "text": "Deletion process implemented"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Website"
      },
      {
        "t": "p",
        "text": "Privacy Policy published"
      },
      {
        "t": "p",
        "text": "Privacy Notice implemented"
      },
      {
        "t": "p",
        "text": "Terms & Conditions published"
      },
      {
        "t": "p",
        "text": "Cancellation & Refund Policy published"
      },
      {
        "t": "p",
        "text": "Cookie Policy published"
      },
      {
        "t": "p",
        "text": "Grievance Redressal published"
      },
      {
        "t": "p",
        "text": "Consent mechanisms reviewed"
      },
      {
        "t": "p",
        "text": "Marketing opt-in separated"
      },
      {
        "t": "p",
        "text": "Trust Guarantee disclosure implemented"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Booking Systems"
      },
      {
        "t": "p",
        "text": "Flight data flow reviewed"
      },
      {
        "t": "p",
        "text": "Hotel data flow reviewed"
      },
      {
        "t": "p",
        "text": "Visa data flow reviewed"
      },
      {
        "t": "p",
        "text": "Trek data flow reviewed"
      },
      {
        "t": "p",
        "text": "Payment data flow reviewed"
      },
      {
        "t": "p",
        "text": "Supplier access reviewed"
      },
      {
        "t": "h",
        "level": 3,
        "text": "WhatsApp and AI"
      },
      {
        "t": "p",
        "text": "WhatsApp data flow documented"
      },
      {
        "t": "p",
        "text": "Meta/AI data processing reviewed"
      },
      {
        "t": "p",
        "text": "AI disclosure implemented"
      },
      {
        "t": "p",
        "text": "AI access restrictions implemented"
      },
      {
        "t": "p",
        "text": "Staff prohibited-data instructions issued"
      },
      {
        "t": "p",
        "text": "Customer document handling procedure implemented"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Security"
      },
      {
        "t": "p",
        "text": "Role-based access implemented"
      },
      {
        "t": "p",
        "text": "Administrator access restricted"
      },
      {
        "t": "p",
        "text": "MFA enabled where available"
      },
      {
        "t": "p",
        "text": "Security logs enabled where appropriate"
      },
      {
        "t": "p",
        "text": "Backup process implemented"
      },
      {
        "t": "p",
        "text": "Passport document access restricted"
      },
      {
        "t": "p",
        "text": "Employee access review implemented"
      },
      {
        "t": "p",
        "text": "Breach-response procedure established"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Employee Compliance"
      },
      {
        "t": "p",
        "text": "Employee privacy training completed"
      },
      {
        "t": "p",
        "text": "Confidentiality obligations documented"
      },
      {
        "t": "p",
        "text": "Personal-device restrictions communicated"
      },
      {
        "t": "p",
        "text": "Personal-email restrictions communicated"
      },
      {
        "t": "p",
        "text": "AI-tool usage policy communicated"
      },
      {
        "t": "p",
        "text": "Breach reporting procedure communicated"
      },
      {
        "t": "h",
        "level": 3,
        "text": "Ongoing Compliance"
      },
      {
        "t": "p",
        "text": "Annual privacy review scheduled"
      },
      {
        "t": "p",
        "text": "Processor review scheduled"
      },
      {
        "t": "p",
        "text": "Access review scheduled"
      },
      {
        "t": "p",
        "text": "Retention review scheduled"
      },
      {
        "t": "p",
        "text": "Security review scheduled"
      },
      {
        "t": "p",
        "text": "Legal/regulatory review scheduled"
      },
      {
        "t": "p",
        "text": "**END OF COMPAREMYTRIP DATA PROTECTION & PERSONAL DATA GOVERNANCE FRAMEWORK**"
      }
    ]
  }
} satisfies Record<string, LegalDocument>;
