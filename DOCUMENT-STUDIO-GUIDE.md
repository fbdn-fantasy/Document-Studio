# Working with imported documents

## Import PDFs and document images

Use Open for a PDF, PNG, JPEG, WebP, BMP or TIFF. Use File → Import PDF / images to combine multiple files in the order supplied by the file picker. Multipage PDFs and TIFFs preserve their page order. Ordinary Insert picture continues inserting an image without OCR.

The conversion progress panel remains cancelable while the editor stays available. A converted document opens as a new unsaved DOCX document. The original inputs are never changed. Save chooses an output filename; PDF remains available in Save As. Inputs are bounded by file, page, pixel, memory and time limits; split very large documents into smaller batches.

Digital PDF pages use existing PDFium text, font information and coordinates. Scanned pages and photographs use the bundled Paddle models. Positioned text, editable tables and supported equations are reconstructed; complex artwork is preserved as images. The source page sizes and orientations are retained. Review conversion warnings and uncertain OCR in File → Import review, including source previews. Find in document selects uncertain text for editing. Alt-double-click an imported region to adjust its position and size. Double-click a recognized formula to edit it.

Text regions are positioned to preserve the source layout. They are editable, but substantial rewriting can require resizing or moving a region. OCR may misread text, table boundaries or mathematics. Unsupported or incomplete equations remain visible as images. Editable equation size and spacing can vary between Word-compatible applications; check them against the source preview. Fonts missing from the computer are substituted. PDF vector artwork is rendered at high resolution. Review complex layouts against the original; conversion is not guaranteed to be exact.

Document Studio adds its layout metadata to DOCX files for accurate reopening in this editor. Ordinary DOCX content remains usable by Word-compatible editors. If another editor changes the DOCX, Document Studio falls back to normal DOCX import when its stored layout metadata no longer matches.
