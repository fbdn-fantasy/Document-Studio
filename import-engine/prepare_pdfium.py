"""Apply the supplied, tested PDFium build to the pinned pypdfium2 wrapper."""
import hashlib,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parent.parent
supplied=root/'import-engine'/'pdfium-supplied';target=root/'runtime'/'Lib'/'site-packages'/'pypdfium2_raw'
if not (target/'bindings.py').is_file():raise SystemExit('Install requirements into runtime first.')
shutil.copy2(supplied/'bin'/'pdfium.dll',target/'pdfium.dll')
v=json.loads((target/'version.json').read_text('utf-8-sig'));v.update(major=159,minor=0,build=8152,patch=0,origin='supplied-pdfium-binaries',hash=None)
(target/'version.json').write_text(json.dumps(v,indent=2),'utf-8')
print('PDFium 159.0.8152.0',hashlib.sha256((target/'pdfium.dll').read_bytes()).hexdigest())
