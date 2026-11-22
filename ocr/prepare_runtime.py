"""Apply documented, reproducible packaging changes to a prepared Python tree."""
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parent.parent
runtime=ROOT/'runtime'
common=runtime/'Lib/site-packages/paddle/dataset/common.py'
text=common.read_text(encoding='utf-8')
before="HOME = os.path.expanduser('~')"
after="# Document Studio modification: keep inference-only dataset cache in its temporary workspace.\nHOME = os.environ.get('DOCUMENT_STUDIO_CACHE', tempfile.gettempdir())"
if before in text:common.write_text(text.replace(before,after),encoding='utf-8')
elif after not in text:raise RuntimeError('Unexpected Paddle dataset cache source; inspect before patching')
for filename in ('msvcp140.dll','vcomp140.dll'):
    shutil.copy2(runtime/'Lib/site-packages/sklearn/.libs'/filename,runtime/filename)
print('Patched unused dataset cache location; copied signed app-local Microsoft C++ runtimes')
