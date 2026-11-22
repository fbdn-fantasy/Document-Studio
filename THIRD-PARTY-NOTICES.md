# Third-party notices

## Document Studio 19 document import runtime

The offline import engine adds CPython 3.13.11, PaddlePaddle 3.3.1 CPU, PaddleOCR 3.7.0, PaddleX 3.7.2, pypdfium2 5.15.2 with the supplied PDFium 159.0.8152.0 build, and nine supplied Paddle document models. Their exact versions, SHA-256 model identities, component licenses, and documented runtime modifications are listed in [the OCR architecture guide](ocr/README.md), [model manifest](ocr/model-manifest.json), and [dependency manifest](ocr/dependency-manifest.json). The model cards and their Apache-2.0 declarations accompany the weights.

Full collected notices are in [ocr/licenses](ocr/licenses/), with the original Python-package notices also retained in the bundled runtime. Native-library notices include Intel MKLML/OpenMP, oneDNN, BLAS/LAPACK, GCC runtime libraries, and the signed app-local Microsoft Visual C++ runtime DLLs. The supplied PDFium package and dependency licenses are in [import-engine/pdfium-supplied](import-engine/pdfium-supplied/).

The source ZIP contains corresponding source archives for LGPL native components under [third-party-source](third-party-source/), including GCC 6.2.0 runtime source, GEOS 3.14.1, and crc32c 2.9.post0. Pure Python LGPL component source is included in the runtime tree. Preserve the corresponding source ZIP when redistributing the installer. [Redistribution and library replacement instructions](ocr/licenses/REDISTRIBUTION.md) explain how to rebuild or replace these components and regenerate the corruption-check manifest. Third-party licenses grant their own redistribution, modification and debugging rights. No endorsement by dependency vendors is implied.

The supplied HTML includes its original bundled library notices for docx, Mammoth and JSZip. These remain intact in editor.html.

The desktop host uses Tauri 2 (MIT or Apache-2.0), with WebView2 on Windows and WebKitGTK on Linux. The bundled Node.js helper includes its upstream license file.

Offline spelling uses nspell (MIT), is-buffer (MIT), and dictionary-en (SCOWL/Hunspell notices and component licenses). Their full license files accompany the installed modules in resources/app.asar and are included below in the source notices directory. The US English dictionary is derived from SCOWL; see dictionary-en-license.txt for its complete licensing and provenance.

Build dependencies are declared in package-lock.json and retain their upstream licenses when installed by npm. They are not runtime application dependencies.

## Additional language assets in 1.1.0

Bundled dictionaries: dictionary-en-gb, dictionary-de, dictionary-fr, dictionary-es, dictionary-ru and dictionary-nl. Their original affix files, word lists, package metadata and full licenses are included in `dictionary-sources/` in the source ZIP and in their installed runtime modules. Each dictionary's complete notice governs its data.

Fonts from Fontsource: Noto Sans, Noto Serif, Noto Sans Arabic, Noto Sans Devanagari, Noto Sans Symbols 2, Lora, Fira Code and Caveat. The used font files and their original licenses are in `assets/fonts/<family>/`. They are distributed unchanged. Monochrome drawing code is part of the editor source.

## Pro additions

Locally bundled browser libraries:
- Chart.js 4.4.8 — MIT
- KaTeX 0.16.21 — MIT; bundled KaTeX fonts retain their licenses
- mathjs 14.0.1 — Apache-2.0; bundled dependency notices are retained in the distribution
- qrcode 1.5.4 — MIT
- JsBarcode 3.12.1 — MIT
- html2canvas 1.4.1 — MIT

See `assets/vendor/*LICENSE*` and retained source notices. esbuild and @sparticuz/chromium are build/test dependencies, not runtime services. Document Studio source is distributed under the enclosed Apache License, Version 2.0.

## 2026-11-01 finishing update

New bundled components retain their own licenses, independently of this application's license:

- MathLive 0.111.4, MIT; license in notices/MathLive-LICENSE.txt; bundled math fonts included.
- canvas2svg 1.0.19, MIT; license in notices/canvas2svg-LICENSE. Adaptations for Chart.js are in pro-science.js.
- RDKit.js 2026.9.1, BSD-3-Clause; notices/RDKit-LICENSE.txt. The Emscripten factories are precompiled by packaging/rdkit-csp.cjs so the renderer does not require JavaScript unsafe-eval. Original WebAssembly and binding source are included.
- Citation.js core, CSL, BibTeX and RIS plugins and citeproc-js; see their license files in notices and package-lock.json for exact versions.
- CSL MLA, Chicago author-date and IEEE styles from https://github.com/citation-style-language/styles; retained style XML includes authors, attribution and Creative Commons licensing.
- WordNet 3.0 database from Princeton, distributed through wordnet-db; derived sense/synonym/antonym index retains the license in notices/wordnet-db-LICENSE.
- hyphen engine and bundled language patterns; notices/hyphen-LICENSE and upstream package pattern license statements apply. Patterns are bundled for US/UK English, German, French, Spanish, Dutch and Russian.
- Korean Hunspell dictionary (dictionary-ko 2.0.0, GPL-3.0-or-later); notices/dictionary-ko-license and the source dictionary's embedded notice apply. Full dictionary and affix data are shipped in the runtime dependency.
- hunspell-asm and its underlying Hunspell engine; notices/hunspell-asm-LICENSE and upstream Hunspell license apply.
- Noto Sans JP, KR, SC and TC regular fonts; each assets/fonts/noto-sans-*/LICENSE is retained. Arabic font assets from the previous build are retained.

These third-party licenses continue to govern their respective components. Runtime processing is local; development dependency installation requires an npm connection or populated package cache.

## V5 release language resources

- Jieba 0.42.1: Chinese dictionary `dict.txt.big`, copied as `assets/vendor/cjk/zh-dictionary.txt`; MIT, `notices/jieba-LICENSE`. The app uses its own maximum-probability dictionary segmentation; it does not run Jieba HMM.
- Kuromoji.js 0.1.2 and IPADIC: optional Japanese tokenizer and compressed data. Apache-2.0 and IPADIC notices: `notices/kuromoji-LICENSE`, `notices/kuromoji-IPADIC-NOTICE.md`. The browser loader was adapted to read local gzip files in the Node worker.
- Sudachi core 20261015: unmodified `system_core.dic`, 1,630,049 entries. `notices/Sudachi-dictionary-LEGAL` preserves UniDic/NEologd notices; `notices/Sudachi-LICENSE` is Apache-2.0. `sudachi.cjs` adapts the documented binary structures from Sudachi 0.8.2 to JavaScript, with dictionary-cost segmentation and unknown-character fallback. It does not run the Java normalization/OOV/plugin pipeline and is not output-equivalent to that pipeline.
- Pycorrector 1.1.4: bundled same-pinyin and same-stroke tables, used for Chinese dictionary candidate generation. Apache-2.0, `notices/Pycorrector-LICENSE`. No pretrained model, Python runtime, or remote model service is used.
- Arabic Hunspell data: Mohamed Kebdani, 2006–2008, from LibreOffice/dictionaries `ar/ar.aff` and `ar/ar.dic`. Unmodified source data is included. This distribution elects MPL-1.1 under its GPL/LGPL/MPL tri-license; `notices/Arabic-COPYING.txt`, `notices/Arabic-AUTHORS.txt`, `notices/Arabic-MPL-1.1`. Source: https://github.com/LibreOffice/dictionaries/tree/master/ar . Git blob identities: aff `42285cff6415879518b46bd05ce9d89e4a30d153`, dic `3fc60d11d07d869c979e1b7c22d96453cb13fb67`.

## V6 scientific datasets

- FreeSolv molecular structures: CC BY 4.0; 602 validated distinct structures from the public FreeSolv database and hydra SDF mirror, with nine separately authored idealized teaching models. See `notices/FreeSolv-attribution.txt` and `notices/FreeSolv-CC-BY-4.0.txt`. Source records and excluded-record validation report are included under `assets/vendor/science/source`.
- Periodic Table JSON: CC BY-SA 3.0, derived element names, symbols, shell counts and mass defaults; see `notices/Periodic-Table-data.txt`. These separately licensed data remain under their respective licenses.

## V9 medical reference provenance

The medical meshes/primitives are original procedural illustrations, with no downloaded anatomy assets. Source URLs and bibliographic attribution are in MEDICAL-SOURCES.md. OpenStax and Human Protein Atlas are optional educational references; no textbook illustrations, micrographs or expression datasets are redistributed. The application license is unchanged and does not override any reference publisher's rights.

## V13 document art and page backgrounds

The 54 original PDFs and 50 A4 background JPEGs are supplied by Forbidden Fantasy for this release. The source collection did not include a separate grant for redistributing those assets individually. This software does not assign new rights to the supplied artwork. The additional eight material swatches and their generator are part of this project. Liberation Sans font files and their upstream license are bundled in assets/fonts/supplied.

## V17.1 anatomy

Reference meshes come from BodyParts3D (CC BY-SA 2.1 Japan), Z-Anatomy (CC BY-SA 4.0), the SPL Inner Ear Atlas (3D Slicer license, part B), and two Czeibert et al. CC0 skull volumes. Refer to assets/anatomy/ATTRIBUTION.txt, SPL-LICENSE.txt, Z-Anatomy-LICENSE.txt and UPSTREAM-LICENSE.txt for credits, modifications, specimen IDs and the respective terms. These data retain their own licenses.

## Ko-fi

The cup logo on the support button is provided by Ko-fi. [Ko-fi logo asset](https://storage.ko-fi.com/cdn/cup-border.png)
