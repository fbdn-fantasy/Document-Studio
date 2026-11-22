"""Build the coccyx, selected organ surfaces and bilateral ossicles.
Usage: python packaging/build-atlas-supplement.py Z-Anatomy.zip SPL-Ear.zip verified-BodyParts3D-STL-directory
Reads only mesh coordinates, polygon loops and object matrices. No embedded Blender scripts run.
"""
from pathlib import Path
import zipfile,struct,re,math,sys,hashlib,json,runpy
import numpy as np
import vtk
from vtk.util.numpy_support import vtk_to_numpy
packet=runpy.run_path(str(Path(__file__).with_name('build-atlas-surfaces.py')))['packet']
out=Path(__file__).resolve().parents[1]/'assets/anatomy';zp,ep,rawdir=map(Path,sys.argv[1:4])
with zipfile.ZipFile(zp) as z:raw=z.read('Z-Anatomy/Startup.blend')
if raw[:12]!=b'BLENDER-v305':raise ValueError('Expected the Z-Anatomy 3.05 Blender file')
blocks={};objects=[];i=12
while i+24<=len(raw):
    code,n,ptr,si,count=struct.unpack_from('<4siQii',raw,i);i+=24
    blocks[ptr]=i
    if code==b'OB\0\0':objects.append(i)
    if code==b'DNA1':dna=memoryview(raw)[i:i+n]
    i+=n
def chunk(i,name):
    assert dna[i:i+4]==name
    return struct.unpack_from('<I',dna,i+4)[0],i+8
def strings(off,num):
    vals=dna[off:].tobytes().split(bytes(1),num)[:num];return [v.decode() for v in vals],off+sum(len(v)+1 for v in vals)
align=lambda x:(x+3)//4*4
n,i=chunk(4,b'NAME');names,i=strings(i,n);n,i=chunk(align(i),b'TYPE');types,i=strings(i,n)
i=align(i);assert dna[i:i+4]==b'TLEN';i+=4;lens=struct.unpack_from('<'+'H'*len(types),dna,i);i+=len(types)*2
n,i=chunk(align(i),b'STRC');fields={};sizes={}
for _ in range(n):
    t,count=struct.unpack_from('<HH',dna,i);i+=4;offset=0;f=fields[types[t]]={};sizes[types[t]]=lens[t]
    for j in range(count):
        ty,ni=struct.unpack_from('<HH',dna,i);i+=4;name=names[ni];f[name]=offset
        offset+=(8 if '*' in name else lens[ty])*math.prod(map(int,re.findall(r'\[(\d+)\]',name)))
def value(off,ty,k,fmt):return struct.unpack_from('<'+fmt,raw,off+fields[ty][k])[0]
def idname(off):i=off+fields['ID']['name[66]'];return raw[i:i+66].split(bytes(1))[0].decode(errors='replace')[2:]
objects={idname(o):o for o in objects}
def blender(name):
    o=objects[name];m=blocks[value(o,'Object','*data','Q')]
    def arr(pointer,ty,count,field,dtype,cols):
        start=blocks[value(m,'Mesh',pointer,'Q')]+fields[ty][field];dt=np.dtype(dtype)
        return np.ndarray((value(m,'Mesh',count,'i'),cols),dtype,raw,start,(sizes[ty],dt.itemsize))
    v=arr('*mvert','MVert','totvert','co[3]','<f4',3).astype('f8')
    poly=arr('*mpoly','MPoly','totpoly','loopstart','<i4',2);loops=arr('*mloop','MLoop','totloop','v','<u4',1)[:,0]
    f=np.array([(loops[start],loops[start+j],loops[start+j+1]) for start,n in poly for j in range(1,n-1)],dtype='u4')
    mat=np.frombuffer(raw,'<f4',16,o+fields['Object']['obmat[4][4]']).reshape(4,4)
    v=v@mat[:3,:3]+mat[3,:3]
    if np.linalg.det(mat[:3,:3])<0:f=f[:,[0,2,1]]
    return v[:,[0,2,1]]*[10,10,-10],f
def bpcenter(k):
    b=(rawdir/(k+'.stl')).read_bytes();v=np.ndarray(((len(b)-84)//50,9),'<f4',b,96,(50,4)).reshape(-1,3);c=(v.min(0)+v.max(0))/2
    return c[[0,2,1]]*[.01,.01,-.01]+[0,-7,-1]
def resource(v,f):
    m=packet(v,f)
    if len(f)>2400:
        step=(v.max(0)-v.min(0)).max()/23
        _,g=np.unique(np.rint((v-v.min(0))/step).astype(int),axis=0,return_inverse=True);q=np.zeros((g.max()+1,3));np.add.at(q,g,v);q/=np.bincount(g)[:,None]
        ff=g[f];ff=ff[(ff[:,0]!=ff[:,1])&(ff[:,1]!=ff[:,2])&(ff[:,0]!=ff[:,2])]
        if len(ff)>20:m['overview']=packet(q,ff)
    return m
surfaces={};bones={};organs={};provenance={}
sac,_=blender('Sacrum');shift=bpcenter('FMA16202')-(sac.min(0)+sac.max(0))/2
# Only skeletal/trunk structures covered by the open Z-Anatomy attribution.
# Ear components and kidney assets from that distribution are not used.
names={'pineal gland':['Pineal gland'],'thymus':['Left lobe of thymus','Right lobe of thymus'],'left atrium':['Left atrium'],'right atrium':['Right atrium'],'left ventricle':['Left ventricle'],'right ventricle':['Right ventricle'],
       'colon':['Ascending colon','Transverse colon','Descending colon','Sigmoid colon'],'jejunum':['Jejunum'],'aorta':['Ascending aorta','Aortic arch','Thoracic aorta','Abdominal aorta'],'urethra':['Urethra'],'pancreatic duct':['Pancreatic duct'],'left main bronchus':['Left main bronchus'],'right main bronchus':['Right main bronchus']}
for group,source_names in {'coccyx':['Coccyx'],**names}.items():
    keys=[]
    for name in source_names:
        if name not in objects:continue
        m=blocks[value(objects[name],'Object','*data','Q')];tag=m+fields['ID']['name[66]']
        if raw[tag:tag+2]!=b'ME':print('Retained procedural path:',name);continue
        v,f=blender(name);key='ZA/'+name;keys.append(key);surfaces[key]=resource(v+shift,f)
        provenance[key]={'source':'Z-Anatomy 2023-05-02','object':name,'license':'CC BY-SA 4.0','triangles':len(f)}
    if group=='coccyx':bones['bone-055']=keys
    elif keys:organs[group]=keys
def ear_mesh(z,name):
    file=next(k for k in z.namelist() if k.endswith('.vtk') and name+'_Bone' in k);b=z.read(file)
    rd=vtk.vtkPolyDataReader();rd.ReadFromInputStringOn();rd.SetInputString(b);rd.Update();m=rd.GetOutput()
    v=vtk_to_numpy(m.GetPoints().GetData()).astype('f8');f=vtk_to_numpy(m.GetPolys().GetConnectivityArray()).reshape(-1,3)
    return v,f,file
with zipfile.ZipFile(ep) as z:ears=[ear_mesh(z,n) for n in ('Malleus','Incus','Stapes')]
# Register the intact chain as one rigid model. Align its size to a representative
# 7.8 mm malleus; the opposite side is a reflected instance of the same specimen.
from scipy.spatial import ConvexHull,distance
mv=ears[0][0];length=distance.pdist(mv[ConvexHull(mv).vertices]).max();factor=.078/length
union=np.concatenate([p[0] for p in ears]);origin=(union.min(0)+union.max(0))/2
for side,first,temporal in [('Right',26,'FMA52739'),('Left',23,'FMA52740')]:
    # Use the anatomical temporal-bone centers for registration, not a second ear specimen.
    idx='bone-014' if side=='Right' else 'bone-006'
    mp=json.loads((out/'sources.json').read_text())['catalog']['bones']
    center=bpcenter(mp[idx][0])+np.array([-.055 if side=='Right' else .055,.11,.08])
    for j,(v,f,file) in enumerate(ears):
        # Source RAS, viewer anatomical left / superior / anterior.
        rel=(v-origin)[:,[0,2,1]]*([-1,1,1] if side=='Right' else [1,1,1])
        if side=='Left':f=f[:,[0,2,1]]
        key='SPL/'+side+str(j);surfaces[key]=resource(rel*factor+center,f)
        bones['bone-%03d'%(first+j)]=[key];provenance[key]={'source':'SPL Inner Ear Atlas, February 2018','file':file,'mirrored':side=='Left','triangles':len(f),'license':'3D Slicer License section B'}
(out/'supplement.js').write_text("'use strict';\nObject.assign(FTEPro.surfaceLibrary,"+json.dumps(surfaces,separators=(',',':'))+");\nObject.assign(FTEPro.surfaceMapping.bones,"+json.dumps(bones)+");Object.assign(FTEPro.surfaceMapping.organs,"+json.dumps(organs)+");\n")
(out/'supplement-sources.json').write_text(json.dumps({'zZipSha256':hashlib.sha256(zp.read_bytes()).hexdigest(),'splZipSha256':hashlib.sha256(ep.read_bytes()).hexdigest(),'surfaces':provenance},indent=2))
print('Supplement',len(bones),'bones,',len(organs),'organ entries,',len(surfaces),'meshes')
