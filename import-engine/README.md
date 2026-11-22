# Document Studio offline import

The Electron main process validates selected paths, starts the bundled Python in
isolated mode, controls cancellation and enforces a wall-time limit. `worker.py`
applies a Windows Job object (6 GiB process memory, at most four child processes,
kill on job close), caps CPU threads, rejects network connections and bounds input
bytes, pages, characters and image pixels. PDFium was built without JavaScript or
XFA. The original input files are opened read-only; all generated files belong to
a new temporary output directory.

## Pipeline

* PDFs use PDFium native character Unicode, coordinates, font family, size, weight,
  italic flag and color. Native text is reused whenever available. Rotated page
  coordinates are converted through PDFium's page-to-device mapping.
* The graphics layer is rendered with PDF text objects hidden. Images and vector
  illustrations retain appearance as a page-resolution bitmap. Searchable scans
  reuse their native text and clean the corresponding original ink regions.
* Conservative grid detection combines rendered ruling lines and native text to
  form editable cells; absent internal edges can represent merged cells.
* Pages without usable native text and document images call the supplied Paddle
  models through `ocr/inference.py`. Orientation, layout, text, table and formula
  inference run on CPU. Photo rectification is enabled for image inputs. TIFF
  frames and multiple input files become ordered pages in one document.
* Reconstructed blocks use source coordinates. DOCX contains actual positioned
  text paragraphs, editable tables and merged cells, plus Office Math for supported
  formula syntax. Unsupported equations remain source images. A document image
  with no reliable DPI metadata uses A4's short edge and retains its aspect ratio;
  the conversion report states that assumption.
* DOCX ZIP integrity, XML parsing, document reading, expected page sections,
  extracted text and embedded artwork are checked before the import is committed.
  Geometry checks flag major overlaps and regions outside page boundaries.
* The app compares actual browser-rendered pages against source previews (up to
  ten distributed pages). It reports ink displacement, mean color difference and
  overflowing regions. This is a discrepancy detector, not a guarantee of exact
  Word pagination. The review panel retains source previews and OCR confidence.

`pro-import-layout.js` supplies the existing editor with positioned editable
regions, formula editing, layout controls, DOCX export and source/render checks.
Alt-double-click a region (or use **Imported region layout**) to adjust its position
or size. Double-click a formula to edit it with the existing mathematical editor.
Ordinary images inserted into a document still use the existing insertion path.

## Exact editor reopening

Generated DOCX files include `document-studio/project.json`. A SHA-256 fingerprint
covers every other ZIP part, including text, styles, images, headers and
relationships. Exact editor state is used only when that fingerprint still matches.
External edits invalidate it and use the normal DOCX importer. The fingerprint is
a consistency check, not a trust boundary: native project validation and HTML
sanitization always run, even for matching metadata.

## Rebuild and tests

Provision the pinned Python dependencies and models with the OCR build script,
then run `runtime/python.exe -I import-engine/prepare_pdfium.py`. This installs the
supplied PDFium **159.0.8152.0** into pypdfium2 **5.15.2** and records its actual
version. `pdfium-supplied/` contains the DLL, original build arguments, version and
redistribution licenses. Wrapper bindings and digital conversions were checked
against this DLL; its V8 and XFA features are disabled.

Run `runtime/python.exe -I import-engine/worker.py --health` for parser health.
Run `runtime/python.exe -I import-engine/test_import.py`; the unit tests use the
archived real PDF fixtures and the bundled dependencies. Regenerate PDF fixtures
with a developer Python containing ReportLab using
`import-engine/create_fixtures.py <output-directory>`. The browser integration
test is `node test/document-studio-import.browser.cjs` (Playwright and Chrome).
`DS_IMPORT_FIXTURE` selects a prepared conversion folder under
`test/import-evidence/`. Developer-only ReportLab is unnecessary at runtime.

Worker protocol: `runtime/python.exe -I -u import-engine/worker.py --request FILE`.
The UTF-8 JSON request is `{"inputs":["absolute source path"],"output":"fresh directory"}`.
Stdout contains JSON lines with `type` values `progress`, `result` or `error`.
Results name the generated `docx`, `project` and `report` files. Diagnostic library
output goes to stderr. Process-tree termination cancels safely; incomplete output
is never committed to the current document.

## Conversion limits

Font substitution, missing embedded font metrics, ambiguous table borders, dense
equations, curved/blurred photographs, handwriting, unusual reading order and
overlapping source text can prevent exact reconstruction. OCR text is never
invented to fill gaps. Complex illustrations remain pixels. Digitally extracted
unruled tables may remain positioned text unless a reliable grid is available.
Office Math supports fractions, roots, scripts, fenced expressions and matrices;
other constructs retain the equation image. Page headers and footers retain their
positions but are not inferred as repeating Word fields. Edited regions can grow
past their original geometry; review warnings and adjust their layout. The app's
renderer and Word/LibreOffice can paginate differently.

Inputs are limited to 256 MiB per file, 300 pages per import, 32 megapixels per
decoded image and 300,000 native characters per page. Protected PDFs must first
be saved as an unlocked copy. No password is guessed or protection bypassed.

API references: [pypdfium2](https://pypdfium2.readthedocs.io/en/stable/python_api.html),
[PDFium editing API](https://pdfium.googlesource.com/pdfium/+/main/public/fpdf_edit.h).
