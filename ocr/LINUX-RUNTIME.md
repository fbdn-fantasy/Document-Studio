# Bundled Linux OCR runtime (V20)

The source archive includes the complete relocatable `runtime-linux` CPython
3.12.14 interpreter, standard library, all 101 pinned Python distributions, native
Linux extensions and library dependencies. The application installer stages this
tree as `runtime` inside its installed resources. It does not use Fedora's system
Python or require a virtual environment, pip, source archive, or downloads at run
time. OCR uses the same supplied offline models as Windows.

`requirements-linux-lock.txt` records the complete prepared environment.
`dependency-linux-manifest.json` records interpreter and package metadata.
Python's license is `runtime-linux/lib/python3.12/LICENSE.txt`; distribution notices
remain inside each package's `.dist-info` directory, alongside the existing copied
OCR notices.

To rebuild from a clean source tree with an equivalent relocatable CPython 3.12
standalone installation:

```sh
python3 ocr/prepare_linux_runtime.py --python-source /path/to/python
# Optional offline dependency provisioning:
python3 ocr/prepare_linux_runtime.py --python-source /path/to/python --wheelhouse /path/to/linux-wheels
```

The script refuses to overwrite an existing prepared runtime. To use the supplied
runtime directly, no preparation is needed. Invoke modules with the bundled
interpreter instead of invoking generated pip console scripts by their shebang.

Checks:

```sh
runtime-linux/bin/python3 -I -m pip check
runtime-linux/bin/python3 -I -B import-engine/worker.py --health
runtime-linux/bin/python3 -I -B import-engine/test_import.py
runtime-linux/bin/python3 -I -B ocr/test_linux_inference.py
```

The standard library and model binaries are unchanged. Three inherited absolute
library/pkgconfig symlinks were converted to relative links. As in the Windows
runtime, Paddle's unused training-dataset cache is redirected from the user's home
to the disposable inference workspace. Model downloads are disabled in the
application inference wrapper. OpenCV additionally requires Fedora's libGL.so.1
(`libglvnd-glx`), and the platform GTK/WebKit dependencies provide GLib.

The PDFium Linux wheel supplies native PDFium 159.0.8149.0. The supplied Windows
PDFium DLL is retained only in the Windows runtime; Linux never loads that DLL.
