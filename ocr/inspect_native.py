"""Inspect PE import tables without loading native libraries."""
from pathlib import Path
import struct,json

def dependencies(path):
    data=path.read_bytes()
    if data[:2]!=b'MZ':return []
    pe=struct.unpack_from('<I',data,0x3c)[0]
    sections=struct.unpack_from('<H',data,pe+6)[0]
    optional_size=struct.unpack_from('<H',data,pe+20)[0]
    optional=pe+24
    magic=struct.unpack_from('<H',data,optional)[0]
    directories=optional+(112 if magic==0x20b else 96)
    import_rva=struct.unpack_from('<I',data,directories+8)[0]
    table=optional+optional_size
    regions=[]
    for i in range(sections):
        pos=table+40*i
        virtual_size,rva,size,offset=struct.unpack_from('<IIII',data,pos+8)
        regions.append((rva,max(size,virtual_size),offset))
    def raw(rva):
        for start,size,offset in regions:
            if start<=rva<start+size:return offset+rva-start
        raise ValueError('PE address outside sections')
    if not import_rva:return []
    pos=raw(import_rva)
    names=[]
    while any(data[pos:pos+20]):
        name=raw(struct.unpack_from('<I',data,pos+12)[0])
        names.append(data[name:data.index(0,name)].decode('ascii').lower())
        pos+=20
    return names

if __name__=='__main__':
    root=Path(__file__).resolve().parent.parent/'runtime'
    result={}
    for path in root.rglob('*'):
        if path.suffix.lower() in ('.pyd','.dll','.exe'):
            deps=dependencies(path)
            non_system=[d for d in deps if d.startswith(('msvc','vcruntime','concrt','vcomp'))]
            if non_system:result[str(path.relative_to(root))]=non_system
    print(json.dumps(result,indent=2))
