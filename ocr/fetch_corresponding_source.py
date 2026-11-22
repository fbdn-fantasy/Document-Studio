"""Build-time source retrieval for bundled LGPL components, never called by app."""
from pathlib import Path
import concurrent.futures,hashlib,json,urllib.request
ROOT=Path(__file__).resolve().parent
OUT=ROOT.parent/'third-party-source'
SOURCES=[
 ('gcc-6.2.0.tar.bz2','https://ftp.gnu.org/gnu/gcc/gcc-6.2.0/gcc-6.2.0.tar.bz2'),
 ('geos-3.14.1.tar.bz2','https://download.osgeo.org/geos/geos-3.14.1.tar.bz2'),
]

def fetch(item):
    name,url=item
    path=OUT/name
    if not path.exists():
        with urllib.request.urlopen(url,timeout=90) as source,path.open('wb') as target:
            while chunk:=source.read(1024*1024):target.write(chunk)
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    return {'file':name,'url':url,'sha256':digest,'bytes':path.stat().st_size}

if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    with urllib.request.urlopen('https://pypi.org/pypi/crc32c/2.9.post0/json') as stream:meta=json.load(stream)
    source=next(f for f in meta['urls'] if f['packagetype']=='sdist')
    SOURCES.append((source['filename'],source['url']))
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        records=list(pool.map(fetch,SOURCES))
    crc=next(r for r in records if r['file']==source['filename'])
    assert crc['sha256']==source['digests']['sha256']
    (OUT/'SOURCE-MANIFEST.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
    print(json.dumps(records,indent=2))
