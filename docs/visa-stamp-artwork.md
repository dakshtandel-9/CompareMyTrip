# Original destination stamp scans

The visa destination panel uses transparent ink impressions adapted from ten scans sourced from Wikimedia Commons. Source scans are retained in `public/visaLogo/original/`; the displayed cutouts are in `public/visaLogo/transparent/`. Original monochrome and AI-colored souvenir illustrations are retained but are no longer used by the panel.

The scans include historical entry/exit marks; they are decorative examples, not a guide to current immigration requirements. Bali uses a Ngurah Rai Airport stamp. Antarctica uses a Port Lockroy souvenir stamp, not an immigration stamp.

The built-in imagegen tool removed passport paper, security patterns and neighboring stamps, isolating the ink on a transparent background. These are AI-edited decorative derivatives of the scans, not pixel-identical archival reproductions. The page removes the surrounding cards and panel background so the ink appears directly on the page.

For delivery, the cutouts are proportionally resized to fit within 640 × 640 pixels and encoded as WebP at quality 90 with alpha quality 100. Transparency is preserved throughout. These derivatives retain the source licenses listed below. The final prompts and edit notes are recorded in `docs/visa-stamp-cutout-prompts.json`.

Source credits and license links are also available in the panel's expandable image credits. The component metadata is in `src/app/add-on/visaStamps.json`.

| Destination | Source | Author | License |
| --- | --- | --- | --- |
| New Zealand | [Passport stamp entry permit, Auckland, New Zealand, 1992](https://commons.wikimedia.org/wiki/File:Newzealand_entry_permit.JPG) | Slleong | Public domain |
| Maldives | [Maldives entry passport stamp](https://commons.wikimedia.org/wiki/File:Maldives_entry_stamp.jpg) | Blagomeni | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Malaysia | [Malaysia Entry Stamp](https://commons.wikimedia.org/wiki/File:Malaysia_Entry_Stamp.jpg) | ButcherC | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Japan | [Japan exit stamp](https://commons.wikimedia.org/wiki/File:Japan_exit_stamp.JPG) | Abasaa | Public domain |
| Hong Kong | [Hong Kong entry passport stamp at the airport](https://commons.wikimedia.org/wiki/File:Hong_Kong_Entry_Stamp.jpg) | Fligtar | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Antarctica | [British Antarctic Territory Passport Stamp](https://commons.wikimedia.org/wiki/File:British_Antarctic_Territory_Passport_Stamp.jpg) | Daxelk | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Bali, Indonesia | [Passport stamp Ngurah Rai Airport, Bali](https://commons.wikimedia.org/wiki/File:Indonesia_bali3.JPG) | Slleong | Public domain |
| Sri Lanka | [Sri Lankan entry stamp at Bandaranaike International Airport](https://commons.wikimedia.org/wiki/File:Sri_Lankan_entry_stamp.jpg) | Jpchamathdj | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| Thailand | [Thailand entry stamp for 24 Jan 2022 at Suvarnabhumi Airport, on a Turkish passport](https://commons.wikimedia.org/wiki/File:Thailand_Entry_Stamp_(2022).jpg) | Ave Ozkal | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| Vietnam | [Passport stamp from Noi Bai Airport, Hanoi, Vietnam](https://commons.wikimedia.org/wiki/File:Vietnam_entry_stamp.png) | Slleong; derivative by Monocletophat123 | Public domain |
