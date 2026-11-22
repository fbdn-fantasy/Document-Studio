# Redistribution and replaceable library notice

Document Studio's original code uses the Apache License, Version 2.0. The third-party components retain their own licenses. This directory includes notices from installed packages. The model cards accompany the weights.

The Python runtime and every model are packaged locally. Original dependency libraries are unmodified except the marked Paddle dataset-cache path adjustment in `paddle/dataset/common.py`. `../prepare_runtime.py` reproduces this adjustment. No model weights or Microsoft/Intel native library bytes have been modified.

Microsoft `msvcp140.dll` and `vcomp140.dll` version 14.51.36247.0 are copied from scikit-learn's redistributable `.libs` directory and remain Microsoft-signed. The embedded Python package supplies `vcruntime140.dll` and `vcruntime140_1.dll` version 14.42.34438.0. The scikit-learn COPYING notice includes the Microsoft redistribution notice. Intel MKLML/OpenMP 2019.0.5 uses the original `Intel-MKLML-license.txt` recovered from Paddle's official dependency archive; oneDNN uses its Apache-2.0 notice. BLAS/LAPACK is 3.10.0 as pinned by Paddle 3.3.1's build recipe.

The following components include LGPL-covered code:

* **GEOS 3.14.1**, dynamically loaded through Shapely. Source is `third-party-source/geos-3.14.1.tar.bz2`, with upstream build instructions in the archive. Shapely's `LICENSE_GEOS` preserves LGPL-2.1. The Python extension and GEOS DLL remain separate files under `runtime/Lib/site-packages`.
* **crc32c 2.9.post0**. Source is `third-party-source/crc32c-2.9.post0.tar.gz`; its build configuration and license notices are included there. This is a transitive SDK dependency and does not send data because conversion network access is disabled.
* **cssutils** and **encutils**. Their complete Python `.py` sources and LGPL notices are in the bundled runtime; no compilation or object files are needed to replace them.
* **GNU runtime libraries** supplied by Paddle's LAPACK dependency. The binaries identify GCC 6.2.0 with MinGW-w64 startup objects. The GCC 6.2.0 source archive contains libquadmath, libgfortran and libgcc, along with GPL/LGPL notices, the GCC Runtime Library Exception and build instructions. Original library files remain dynamically linked. The GCC exception applies where stated by upstream; libquadmath's own license must also be retained.

Source archives and their upstream URLs/hashes are listed in `third-party-source/SOURCE-MANIFEST.json` in the complete source ZIP delivered alongside the installer. Preserve access to that source ZIP when redistributing the installer. Other permissive libraries retain their notices and package source metadata. For the full provenance of PDFium and its libraries, see `import-engine/pdfium-supplied/licenses/`.

You may inspect, modify, rebuild and replace LGPL-covered components, and perform reverse engineering necessary to debug such modifications, as permitted by their licenses. To use a modified library, extract the complete application source ZIP, replace/rebuild the relevant separate Python package or native DLL with a compatible ABI, regenerate the runtime integrity manifest using the supplied packaging script, then build the installer. No signing key or vendor authorization is needed to regenerate that manifest. These third-party rights take precedence over conflicting application-license restrictions for those components.
