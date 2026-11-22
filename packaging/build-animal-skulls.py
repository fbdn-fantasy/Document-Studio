"""Educational surfaces extracted from the CC0 Czeibert et al. skull volumes.
Usage: python packaging/build-animal-skulls.py path/to/verified/NIfTI/files
Uses NumPy, VTK and SciPy on the build machine only. The viewer works offline.
"""
from pathlib import Path
import json,sys,hashlib,runpy
import numpy as np
from scipy import ndimage
import vtk
from vtk.util.numpy_support import vtk_to_numpy,numpy_to_vtk
packet=runpy.run_path(str(Path(__file__).with_name('build-atlas-surfaces.py')))['packet']
src=Path(sys.argv[1]);out=Path(__file__).resolve().parents[1]/'assets/anatomy'
animals={'cat/skull':('162_C_EUSH','European shorthair cat'),'dog/skull':('015_C_BEAG','Beagle')}
def surface(path):
    reader=vtk.vtkNIFTIImageReader();reader.SetFileName(str(path));reader.Update();im=reader.GetOutput()
    dims=im.GetDimensions();a=vtk_to_numpy(im.GetPointData().GetScalars()).reshape(dims[::-1]).astype('f4')
    # Retain bone and teeth, eliminating small isolated specks from the scanner background.
    a=ndimage.gaussian_filter(a,.58);lab,n=ndimage.label(a>375)
    sizes=np.bincount(lab.ravel());keep=sizes>=48;keep[0]=False
    near=ndimage.binary_dilation(keep[lab],iterations=2);a[~near]=-1024.
    im.GetPointData().SetScalars(numpy_to_vtk(a.ravel(),deep=True))
    iso=vtk.vtkFlyingEdges3D();iso.SetInputData(im);iso.SetValue(0,375);iso.ComputeNormalsOff();iso.Update()
    smooth=vtk.vtkWindowedSincPolyDataFilter();smooth.SetInputConnection(iso.GetOutputPort());smooth.SetNumberOfIterations(12);smooth.SetPassBand(.13);smooth.BoundarySmoothingOff();smooth.NormalizeCoordinatesOn();smooth.Update()
    def mesh(faces):
        reduce=vtk.vtkQuadricDecimation();reduce.SetInputConnection(smooth.GetOutputPort())
        reduce.SetTargetReduction(max(0,1-faces/max(1,smooth.GetOutput().GetNumberOfPolys())));reduce.Update();m=reduce.GetOutput()
        xyz=vtk_to_numpy(m.GetPoints().GetData()).astype('f8')
        # Verified from sagittal and dorsal projections. Rostrum points toward -X.
        v=-xyz[:,[2,1,0]];v-=.5*(v.min(0)+v.max(0));f=vtk_to_numpy(m.GetPolys().GetConnectivityArray()).reshape(-1,3)
        return packet(v,f)
    m=mesh(165000);m['overview']=mesh(8500);return m
objects={};meta={}
for id,(spec,breed) in animals.items():
    path=src/(spec+'.nii.gz')
    if not path.exists():continue
    key='CT'+spec;objects[key]=surface(path)
    meta[id]={'mesh':key,'specimen':spec,'breed':breed,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'faces':objects[key]['faces']}
(out/'animal-skulls.js').write_text("'use strict';\nObject.assign(FTEPro.surfaceLibrary,"+json.dumps(objects,separators=(',',':'))+");\nFTEPro.specimenSkulls="+json.dumps(meta,separators=(',',':'))+";\n")
print(json.dumps(meta))
