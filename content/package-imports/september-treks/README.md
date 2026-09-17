# September trek PDF import

These seven package records were transcribed from the PDFs supplied by the user. `manifest.json` maps each record to its source. The user confirmed importing all seven.

Run `node scripts/import-september-treks.mjs` to validate and preview; use `--write` to create missing records. Existing records are never overwritten. The importer uses the CRM validation rules, checks for duplicate titles, creates records atomically, and verifies every saved payload.

- Cover/gallery photos are existing entries from the site's image library, as requested. They are illustrative library images rather than newly sourced location photography.
- Prices, duration, departure restrictions, pickup times, activities, packing lists, guidelines and policies follow the supplied PDFs. No discount or crossed-out markup was invented.
- Gudibande's PDF contains no cancellation terms. Its cancellation field is empty and the section is hidden until the admin supplies a policy.
- Anthargange contains four authored reviews in the supplied PDF; they are preserved. Other PDFs have no reviews or only editorial placeholders, so their review sections are disabled.
- Anthargange has no explicit difficulty rating, so its badge is hidden. Madhugiri's hard rating and Gudibande's easy rating follow their descriptive text; the other four ratings follow their snapshot fields.
- Netravati retains 3 nights / 2 days, including overnight transport. Its itinerary includes one dormitory overnight stay. The separately charged permit arrangement is ₹510 per person. Day-one lunch at Horanadu is in the itinerary but is not among the included meals.
- Pickup map links use the existing address-based map behavior; no coordinates or meeting-pin URLs were invented.
