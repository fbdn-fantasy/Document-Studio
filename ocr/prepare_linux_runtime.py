"""Rebuild the bundled Linux Python environment.

Supply a relocatable CPython 3.12 standalone installation with --python-source.
This copies the interpreter/standard library, never the source's site-packages,
and installs precisely the Linux lock into the private runtime. Build-time network
access is needed unless a --wheelhouse is supplied. Installed apps are offline.
"""
from pathlib import Path
import argparse, os, shutil, subprocess
root=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('--python-source',required=True);p.add_argument('--wheelhouse');args=p.parse_args()
src=Path(args.python_source).resolve();target=root/'runtime-linux'
if target.exists():raise SystemExit('runtime-linux already exists; move it aside before rebuilding.')
def ignore(_path,names):return [n for n in names if n in ('site-packages','__pycache__','include','share') or n.endswith('.pyc')]
shutil.copytree(src,target,symlinks=True,ignore=ignore)
for item in target.rglob('*'):
 if item.is_symlink() and item.readlink().is_absolute():
  to=Path(item.readlink().name);item.unlink();item.symlink_to(to)
python=target/'bin/python3'
subprocess.run([str(python),'-I','-m','ensurepip'],check=True)
cmd=[str(python),'-I','-m','pip','install','--disable-pip-version-check','-r',str(root/'ocr/requirements-linux-lock.txt')]
if args.wheelhouse:cmd.extend(['--no-index','--find-links',str(Path(args.wheelhouse).resolve())])
subprocess.run(cmd,check=True)
# Preserve the cache policy used by the Windows runtime.
common=target/'lib/python3.12/site-packages/paddle/dataset/common.py'
text=common.read_text();before="HOME = os.path.expanduser('~')";after="HOME = os.environ.get('DOCUMENT_STUDIO_CACHE', tempfile.gettempdir())"
if before in text:common.write_text(text.replace(before,after))
subprocess.run([str(python),'-I','-B',str(root/'import-engine/worker.py'),'--health'],check=True)
