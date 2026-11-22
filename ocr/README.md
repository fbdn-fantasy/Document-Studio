# Document Studio 19: offline document recognition

The installer includes a private Windows x64 Python 3.13.11 interpreter, PaddlePaddle 3.3.1 CPU, PaddleOCR 3.7.0, PaddleX 3.7.2, PDFium, the nine supplied model directories, and all Python/native dependencies. No Python installation, GPU, model download, account, or administrator access is required for normal conversion. The original `OCR Models` directory is never consulted by the installed application.

## Components and provenance

| Supplied directory | Exact model |
| --- | --- |
| Doc Layout | PP-DocLayout-M |
| Formulanet plus s | PP-FormulaNet_plus-S |
| LC Net Doc Orientation | PP-LCNet_x1_0_doc_ori |
| Mobile Det | PP-OCRv5_mobile_det |
| Mobile Rec | PP-OCRv5_mobile_rec |
| Slanext wired | SLANeXt_wired |
| Slanext wireless | SLANeXt_wireless |
| Text Line Orientation | PP-LCNet_x1_0_textline_ori |
| UV Doc | UVDoc |

The model identifiers come from the actual `inference.yml` files, rather than folder labels. Each is a Paddle inference JSON graph plus `.pdiparams` weights. The supplied cards declare Apache-2.0. `model-manifest.json` records the size and SHA-256 of every supplied file. No training revision or release number is supplied beyond these model identifiers; the hashes identify the exact weights distributed here.

The supplied `paddlepaddle-3.3.1-cp313-cp313-win_amd64.whl` was installed directly. The 72 Python files in the installed PaddleOCR 3.7.0 package were compared to `PaddleOCR-3.7.0.zip`; all matched after normalizing line endings. PaddleX is an additional required inference dependency, pinned to 3.7.2. This combination was tested using actual CPU predictions. MKLDNN is disabled explicitly, while the native libraries remain bundled because Paddle imports them. Microsoft C++ runtime DLLs are app-local; their original signed bytes and redistribution notices are preserved.

`requirements-lock.txt` pins every installed Python package. `dependency-manifest.json` lists package versions and copied notices. Python's own license is under `licenses/Python-LICENSE.txt`. Original dependency notices remain inside each distribution's `.dist-info` directory as well. PDFium 159.0.8152.0, from the supplied x64 archive, replaces the PDFium 159.0.8149.0 initially shipped with pypdfium2 5.15.2; see `../import-engine/pdfium-supplied/` and `../import-engine/prepare_pdfium.py`.

## Processing

The desktop service starts a separate worker with application-relative paths. The worker parses PDFs through PDFium. Existing digital text and coordinates are used directly; image-only pages invoke `inference.analyze_image`. Multiple input images and TIFF frames become successive pages. The worker reconstructs the analyzed page into DOCX and validates the result; see `../import-engine/` for that implementation.

For scanned or photographed pages, analysis uses document orientation classification, conservative page-outline correction, skew estimation, PP-DocLayout-M, then PP-OCRv5 text detection and recognition with text-line orientation. The pipeline returns all positions in pixels of the corrected page. Photographs with a clear page contour may be perspective-corrected; strongly nonrectangular contours may invoke UVDoc. Full-page scans are not automatically subjected to UVDoc deformation. Corrections are disclosed in conversion warnings.

Table regions invoke the wired or wireless SLANeXt model, selected from detected ruling lines. Its predicted HTML supplies row/column and merge structure. The supplied exports' legacy box outputs proved unreliable, so cell boundaries are recovered from ruling lines and actual recognized text coordinates. The resulting table is editable, but cell assignments must be reviewed. Formula regions invoke PP-FormulaNet-plus-S and supply LaTeX to the DOCX equation converter. Scientific images, charts, seals and complex illustrations are kept as source crops. When structural recognition fails, the region remains a visual crop and the warning identifies the failed operation; no missing scientific content is invented.

The small OCR models stay loaded for the worker's lifetime. Only one large layout/table/formula/unwarping predictor is retained at a time. The worker runs on CPU with four threads, and the parent can terminate it immediately for cancellation. Input/page/pixel limits and the Windows worker resource limits are applied by the import worker. Network connections are denied inside the worker, and model locations are explicit. Model parsing is isolated from the renderer. Dependency integrity is checked against the installation manifest, with an explicit installer repair path on failure. There is no runtime package installation or silent download path.

## Rebuilding

The source ZIP contains the complete prepared `runtime/` and model files, so a normal offline application rebuild does not need to recreate inference dependencies. Use the main build guide and retain these directories when making the installer.

To reapply the two documented runtime preparations to this source tree:

```powershell
powershell -ExecutionPolicy Bypass -File ocr/provision_runtime.ps1
runtime/python.exe import-engine/worker.py --health
runtime/python.exe ocr/test_inference.py
runtime/python.exe ocr/test_models.py
```

To replace the private Python environment from scratch on a build machine, supply an official Python 3.13.11 x64 embeddable ZIP with `-PythonArchive` and an offline wheel repository with `-Wheelhouse`. The optional `-PaddleWheel` argument reinstalls the original supplied wheel. `-DownloadDependencies` is an explicit build-only option that downloads the pinned packages; it is never called by the installed application. The build host needs Python with pip only for recreating this environment. Run `collect_notices.py` after dependency changes, then regenerate the application's runtime manifest before packaging.

`prepare_runtime.py` reproduces one marked upstream source change: Paddle's unused dataset cache is directed to a temporary conversion workspace instead of the user's home directory. It also copies the signed Microsoft runtime libraries supplied with scikit-learn into the interpreter directory. `prepare_pdfium.py` reproduces the supplied PDFium replacement.

## Verification and limits

Real CPU inference acceptance evidence is retained under `../test/ocr-evidence/`. The tests recognize synthetic document text, exact table cell values, a rotated page, an equation, a borderless table structure, and UVDoc output. All nine supplied models execute successfully with offline sockets. These are focused integration checks; they do not establish recognition accuracy for all languages, handwriting, camera conditions, scientific notation, or page designs.

OCR text, table assignment and formula interpretation remain uncertain. Recognition confidence is a model estimate, not a guarantee. Low-confidence text is reported for review; formula recognition can produce plausible but wrong mathematical tokens and should always be checked. Page-edge detection can mistake a rectangular background for the page. Very dense tables, nested structures, overlapping text, unusual fonts, curved/faint photographs, handwriting and complex multicolumn layouts can lose editability or alignment. Original files are never overwritten. Preserve the original for comparison and review the converted document before use.

## Redistribution

The application license does not replace third-party licenses. `licenses/` contains the collected notices, including the original Intel MKLML April 2018 license and Microsoft runtime redistribution notice. No endorsement by those vendors is implied.

Some indirect packages and native libraries use LGPL terms. Corresponding source for crc32c, GEOS and GCC runtime libraries is included under `../third-party-source/`; pure Python LGPL modules are present as their original `.py` source in the runtime. See `licenses/REDISTRIBUTION.md` for source locations and replacement instructions. Third-party rights, including modification and debugging rights under applicable LGPL terms, remain available. Rebuilding with modified libraries and regenerating the integrity manifest is supported; the integrity manifest is a corruption check, not a restriction on those rights.
