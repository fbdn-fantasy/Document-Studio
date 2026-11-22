"""Installer verification using only the embedded Python standard library."""
from pathlib import Path
import hashlib,json,sys

def verify(root):
    manifest=json.loads((root/'runtime-manifest.json').read_text('utf-8'))
    if not manifest.get('files'):raise ValueError('Empty runtime manifest')
    for item in manifest['files']:
        target=(root/item['path']).resolve()
        if not target.is_relative_to(root):raise ValueError('Invalid component path')
        if target.stat().st_size!=item['size']:raise ValueError('Incomplete component: '+item['path'])
        digest=hashlib.sha256()
        with target.open('rb') as f:
            while block:=f.read(4*1024*1024):digest.update(block)
        if digest.hexdigest()!=item['sha256']:raise ValueError('Corrupted component: '+item['path'])
    import pypdfium2,docx,lxml.etree,numpy,PIL.Image
    print('Verified offline import components and native parsers.',flush=True)

if __name__=='__main__':
    try:verify(Path(sys.argv[1]).resolve(strict=True))
    except Exception as error:
        print(str(error),file=sys.stderr,flush=True);sys.exit(1)
