# Medical references and provenance

Reviewed for this release on 2026-11-02. Every catalog record carries a source URL; MEDICAL-CATALOG.md and MEDICAL-CATALOG.json enumerate the exact inventory and model labels.

## Anatomy and histology references

OpenStax, Rice University, J. Gordon Betts and colleagues, *Anatomy and Physiology 2e* (2022), chapters 3–8, 12, 14, 17–18, 20–23, 25, 27–28. The first-edition reproductive-system pages are used where the corresponding 2e URL was unavailable. Specific section links are bundled per entry. These are reference links, not bundled textbook content.

- https://openstax.org/books/anatomy-and-physiology-2e/pages/7-1-divisions-of-the-skeletal-system
- https://openstax.org/books/anatomy-and-physiology-2e/pages/3-2-the-cytoplasm-and-cellular-organelles
- https://openstax.org/books/anatomy-and-physiology-2e/pages/25-4-microscopic-anatomy-of-the-kidney

OpenStax currently displays CC BY-NC-SA licensing on its live textbook pages. V9 does **not** distribute OpenStax illustrations, mesh assets, screenshots, textbook passages or downloadable datasets. Models and concise descriptions are newly authored procedural illustrations and factual explanations. A link to a reference does not relicense that reference under the application's license. Do not import textbook artwork without independently checking its applicable license.

## Cell classification reference

Human Protein Atlas, Single Cell Type resource and methods:

- https://www.proteinatlas.org/humanproteome/single+cell/single+cell+type
- https://www.proteinatlas.org/humanproteome/single+cell/single+cell+type/method
- https://www.proteinatlas.org/about/licence

HPA uses a transcriptomic cell classification; V9 uses an explicitly curated organ-system teaching catalog. HPA’s copyrightable database content is CC BY 4.0, with possible third-party exceptions. No HPA micrographs, expression tables, downloaded datasets or tissue images are bundled here. It is cited for classification context and optional further reading. No clinical endorsement is implied.

## Assets and offline operation

All medical geometry is generated locally by pro-medical-models.js. The catalog and rendering code are bundled. No remote mesh, font, script, API, image, atlas download or network request is required. All medical illustration assets are original procedural geometry. The existing application LICENSE and LICENSE.odt are preserved byte-for-byte. Existing bundled third-party resources retain their original notices.

External links open only after a user click. The desktop bridge accepts HTTPS references from openstax.org/books/ and www.proteinatlas.org/humanproteome/ only, and opens them in the system browser. Embedded application networking remains blocked.
