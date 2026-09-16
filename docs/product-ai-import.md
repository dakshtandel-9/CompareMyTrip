# Product AI import

Open **Admin → Travel packages → Create package** (or edit a package). Expand **Import a package with AI** above the editable page preview.

1. Copy the AI prompt. A downloadable `.txt` and a selectable prompt are also available.
2. Paste the prompt into ChatGPT with one package PDF or your trip information.
3. The prompt asks ChatGPT to clarify missing or conflicting details before generating JSON. If supported, it also creates a clarification PDF. Complete input goes directly to JSON. Images are added later.
4. Upload the resulting `package-import.json` data file (maximum 1 MB). If ChatGPT cannot create a download, save its complete JSON code block as a `.json` file; a single enclosing Markdown code fence is accepted. Check the preview and select **Apply to this product**.
5. Upload photos and click text in the populated page preview to edit it. Click outside to apply an edit, press Escape to cancel, or use Undo. Review with **View as traveller**, then use the top-bar Draft/Published choice and **Save package**.

Importing fills the local editor. It does not save, publish, call an AI service or write other CMS records. Existing photos, operator, deal flag, product identity and publication choice remain under the editor's control. Product text, prices, itinerary, facts, custom sections, locations and supplied reviews are replaced. A location photo is reused when its type, name and address match; other existing location photos are retained in the optional gallery.

## Format

The envelope is `{ "kind": "comparemytrip.product", "version": 1, "product": { ... } }`.

The complete, versioned schema is exported as `PACKAGE_IMPORT_SCHEMA` in `src/lib/packageAiImport.ts` and embedded directly into the copied prompt in compact JSON. The prompt also includes a complete fictional data example, tested against the importer and editor, and a checklist for constraints such as matching itinerary days. ChatGPT must return populated package data, not the reference schema. Properties listed in `required` must be supplied; empty content uses empty strings, arrays and disabled sections. Unknown fields, bulk imports, image URLs, product IDs and publication flags are rejected. This is different from the internal full-package files under `content/package-imports`, which are used by the reference-package seed script.

Optional booking fields are `trekGrade` (0 hides difficulty, 1 Easy, 2 Moderate, 3 Difficult), `bookingLabel`, `availabilityNote`, and `quoteNote`. A blank booking label uses the hotel tier or Trip package; blank notes hide the corresponding text. Older version-1 files can omit these fields without changing existing values. The package editor saves difficulty on the package itself, overriding the legacy weekend-trek grade.

If an upload fails, the error identifies the invalid field or explains when a schema document or unwrapped product was supplied. Paste the error into the same ChatGPT conversation with the current prompt to request a corrected data file. Surrounding prose, multiple code blocks and malformed JSON are rejected; code fences do not bypass content validation.

Day 0 is explicit and additional to the trip's numbered days. Prices are INR per person. Both prices may be zero only for an intentionally unpriced draft; existing publishing validation still requires a price. Reviews must come from the source.

## Icons

Products use exactly 1,000 supported icon names. The prompt and picker use `src/lib/packageIconNames.json`; rendered icons use `public/package-icons.svg`. The shared picker retains its existing catalogue for other admin screens. To regenerate the product assets after intentionally changing the icon set, run:

```sh
node scripts/generate-package-icons.mjs
```

The generator retains existing travel icons and fills the remaining slots with canonical Lucide icons. Keep the generated names, SVG sprite and license together. Recheck schema compatibility before changing an existing icon name.

## Verification

`tests/package-ai-import.test.mjs` covers both PDF package fixtures, Day 0, invalid files, content and price validation, retained uploads, the fixed icon catalogue, prompt/schema consistency and upload/preview/apply handlers. No live catalogue writes are needed for these tests.

## Editing in the preview

The package editor and public page share the same rendering components. Text, quick facts, itinerary activities, stays, custom sections, FAQs, locations and real reviews can be edited where they appear. Photos have upload, ordering and removal controls. Optional sections can be hidden without deleting their content; hidden content remains available in edit mode. The sidebar's Booking card details section contains difficulty, package badge, availability note and quote note controls. Flight text is editable above it. Categories, destination, permit requirements and departure weekdays live in Catalogue & departure settings.

Changes stay in the editor until Save package is selected. Undo restores the previous edit, including image references; removed uploads are cleaned only after a successful save. The preview disables customer booking actions. Tests in `tests/package-preview-editing.test.mjs` cover inline commit/cancel, Undo, model conversion and saving against a mocked persistence layer.

Transfers, pickup/drop, packing and trail guidelines appear as closed dropdown cards on the website. The editor keeps them open. Practical section text can be pasted into the larger editor or loaded from a `.txt`/`.md` file up to 100 KB. Review the staged text, select **Apply text**, then **Save package**. Files are read locally; uploading a file does not publish it. Use `[Heading]` on a separate line with a blank line above it and `-` bullet points for formatted lists. For PDFs or complete package imports, use the AI import flow above.
