"""Convert verified BodyParts3D STLs into indexed, locally loadable mesh packets.
Usage: python packaging/build-atlas-surfaces.py INPUT (directory with sources.json and STL files).
No geometry simplification is applied to the inspection mesh. Overview copies are clustered.
"""
import base64, hashlib, json, struct, sys
from pathlib import Path
import numpy as np

def encoded(a):return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
def unit(v):return v/np.maximum(np.linalg.norm(v,axis=1)[:,None],1.e-20)
def packet(v,f):
    a,b,c=(v[f[:,i]] for i in range(3));fn=unit(np.cross(b-a,c-a));norm=np.zeros(v.shape);lap=np.zeros(v.shape);edge=np.zeros(len(v))
    for i in range(3):
        ix=f[:,i];delta=v[f[:,(i+1)%3]]-v[ix]
        np.add.at(norm,ix,fn);np.add.at(lap,ix,delta);np.add.at(edge,ix,np.linalg.norm(delta,axis=1))
    norm=unit(norm);occl=np.clip(np.einsum('ij,ij->i',norm,lap)/np.maximum(edge,1.e-8),0,.6)
    normal=np.column_stack([np.rint(norm*127),np.rint((1-occl*.62)*127)]).astype('i1')
    lo=v.min(0);hi=v.max(0);q=np.rint(65535*(v-lo)/np.maximum(hi-lo,1.e-9)).astype('<u2')
    return dict(lo=lo.tolist(),hi=hi.tolist(),v=encoded(q),n=encoded(normal),i=encoded(f.astype('<u4' if len(v)>65535 else '<u2')),num=len(v),faces=len(f))
def load_frame(src,k,rec):
    raw=(src/(k+'.stl')).read_bytes()
    assert hashlib.sha1(b'blob '+str(len(raw)).encode()+bytes(1)+raw).hexdigest()==rec['sha'],k
    count=struct.unpack_from('<I',raw,80)[0];assert len(raw)==84+count*50
    tri=np.ndarray((count,9),'<f4',raw,96,(50,4)).reshape(-1,3)
    # Database X goes left, Y posterior, Z superior. The viewer uses left/superior/anterior.
    v,f=np.unique(tri,axis=0,return_inverse=True);v=v[:,[0,2,1]].astype('f8')*[.01,.01,-.01]+[0,-7,-1]
    f=f.reshape(-1,3);obj=packet(v,f)
    if len(f)>1600:
        cell=(v.max(0)-v.min(0)).max()/22
        _,groups=np.unique(np.rint((v-v.min(0))/cell).astype(int),axis=0,return_inverse=True)
        vv=np.zeros((groups.max()+1,3));np.add.at(vv,groups,v);vv/=np.bincount(groups)[:,None]
        ff=groups[f];ff=ff[(ff[:,0]!=ff[:,1])&(ff[:,1]!=ff[:,2])&(ff[:,0]!=ff[:,2])]
        if len(ff)>20:obj['overview']=packet(vv,ff)
    return obj
def build(src):
    dest=Path(__file__).resolve().parents[1]/'assets/anatomy';dest.mkdir(exist_ok=True)
    manifest=json.loads((src/'sources.json').read_text())
    with (dest/'surfaces.js').open('w') as out:
        out.write("'use strict';\nFTEPro.surfaceLibrary={\n")
        for k,rec in manifest['sources'].items():
            m=load_frame(src,k,rec);out.write(json.dumps(k)+':'+json.dumps(m,separators=(',',':'))+',\n')
        out.write('};\nFTEPro.surfaceMapping='+json.dumps(manifest['catalog'],separators=(',',':'))+';\n')
    (dest/'sources.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Compiled',len(manifest['sources']),'surfaces,', (dest/'surfaces.js').stat().st_size,'bytes')
if __name__=='__main__':build(Path(sys.argv[1]))
