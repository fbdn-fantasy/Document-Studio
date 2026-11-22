"""Build-time only: collect upstream license files using verified ZIP records."""
from pathlib import Path
import io,json,re,struct,urllib.request,zipfile,zlib
ROOT=Path(__file__).resolve().parent

def extract_notices(url,prefix):
    req=urllib.request.Request(url,headers={'Range':'bytes=-65536'})
    with urllib.request.urlopen(req,timeout=45) as response:
        tail=response.read()
        cr=response.headers.get('Content-Range','')
    if cr:
        size=int(cr.rsplit('/',1)[1])
        blob=bytearray(size)
        blob[size-len(tail):]=tail
    else:
        blob=tail
    archive=zipfile.ZipFile(io.BytesIO(blob))
    result=[]
    for item in archive.infolist():
        if not re.search(r'license|copying|notice|redist',item.filename,re.I) or item.is_dir():
            continue
        begin=item.header_offset
        req=urllib.request.Request(url,headers={'Range':f'bytes={begin}-{begin+item.compress_size+4096}'})
        with urllib.request.urlopen(req,timeout=45) as response:
            data=response.read()
            partial=response.status==206
        if not partial:
            data=data[begin:]
        assert data[:4]==b'PK\x03\x04'
        fn,extra=struct.unpack_from('<HH',data,26)
        compressed=data[30+fn+extra:30+fn+extra+item.compress_size]
        raw=zlib.decompress(compressed,-15) if item.compress_type==8 else compressed
        assert zlib.crc32(raw)==item.CRC
        name=prefix+'-'+Path(item.filename).name
        (ROOT/'licenses'/name).write_bytes(raw)
        result.append({'file':name,'upstream':url,'member':item.filename})
    return result

if __name__=='__main__':
    result=[]
    for filename,prefix in [('mklml_win_2019.0.5.20190502.zip','Intel-MKLML'),('lapack_win_v3.10.0.20210628.zip','LAPACK')]:
        result+=extract_notices('https://paddlepaddledeps.bj.bcebos.com/'+filename,prefix)
    print(json.dumps(result,indent=2))
    (ROOT/'licenses'/'native-license-sources.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
