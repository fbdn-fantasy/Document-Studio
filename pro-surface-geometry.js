// Indexed, smooth surface geometry. Small parts are sampled in their own local
// bounding boxes, so a carpal bone or cell process survives a whole-model view.
'use strict';
(()=>{
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const unit=a=>{const len=Math.hypot(...a)||1;return a.map(v=>v/len);};
 const sub=(a,b)=>a.map((v,i)=>v-b[i]);
 function finish(pos,indices,normals){
   if(!normals){normals=new Float32Array(pos.length);
     for(let k=0;k<indices.length;k+=3){const ia=indices[k]*3,ib=indices[k+1]*3,ic=indices[k+2]*3;
       const ab=[0,1,2].map(i=>pos[ib+i]-pos[ia+i]),ac=[0,1,2].map(i=>pos[ic+i]-pos[ia+i]),n=cross(ab,ac);
       for(const j of [ia,ib,ic])for(let i=0;i<3;i++)normals[j+i]+=n[i];
     }
   }
   const n=new Int8Array(pos.length/3*4);
   for(let i=0,j=0;i<pos.length;i+=3,j+=4){const a=unit([normals[i],normals[i+1],normals[i+2]]);for(let k=0;k<3;k++)n[j+k]=Math.round(a[k]*127);n[j+3]=127;}
   return {pos:Float32Array.from(pos),idx:pos.length/3>65535?Uint32Array.from(indices):Uint16Array.from(indices),normal:n};
 }
 function egg(p,steps){
   const pos=[],idx=[],normals=[],lat=steps/2;
   for(let j=0;j<=lat;j++){const phi=Math.PI*j/lat;for(let i=0;i<=steps;i++){
     const theta=i*2*Math.PI/steps,u=[Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)];
     const q=u.map((v,k)=>p.p[k]+v*p.r[k]);pos.push(...q);normals.push(...u.map((v,k)=>v/Math.max(p.r[k],1e-5)));
     if(i<steps&&j<lat){const a=j*(steps+1)+i,b=a+steps+1;idx.push(a,a+1,b,a+1,b+1,b);}
   }}return finish(pos,idx,normals);
 }
 function smoothLine(v){
   if(v.length<3)return v;
   const pts=[];for(let i=0;i<v.length-1;i++){const a=v[Math.max(0,i-1)],b=v[i],c=v[i+1],d=v[Math.min(v.length-1,i+2)];
     for(const t of [0,.25,.5,.75])pts.push(b.map((x,k)=>.5*((2*x)+(-a[k]+c[k])*t+(2*a[k]-5*x+4*c[k]-d[k])*t*t+(-a[k]+3*x-3*c[k]+d[k])*t*t*t)));
   }pts.push(v.at(-1));return pts;
 }
 function tube(p,n){
   const pts=p.pts.length<70?smoothLine(p.pts):p.pts,verts=[],normals=[],idx=[],radius=p.r||.03;
   let previous;
   for(let j=0;j<pts.length;j++){
     const dir=unit(sub(pts[Math.min(j+1,pts.length-1)],pts[Math.max(0,j-1)]));
     let axis=previous?sub(previous,dir.map(x=>x*previous.reduce((s,v,i)=>s+v*dir[i],0))):cross(dir,Math.abs(dir[1])<.85?[0,1,0]:[1,0,0]);
     axis=unit(axis);previous=axis;const side=cross(dir,axis);
     for(let i=0;i<n;i++){const angle=2*Math.PI*i/n,norm=axis.map((v,k)=>v*Math.cos(angle)+side[k]*Math.sin(angle));verts.push(...pts[j].map((v,k)=>v+radius*norm[k]));normals.push(...norm);
       if(j>0){const a=(j-1)*n+i,b=(j-1)*n+(i+1)%n;idx.push(a,b,a+n,b,b+n,a+n);}
     }
   }
   for(const j of [0,pts.length-1]){const k=verts.length/3;verts.push(...pts[j]);normals.push(...unit(sub(pts[j],pts[j===0?1:j-1])));for(let i=0;i<n;i++)idx.push(k,j*n+i,j*n+(i+1)%n);}
   return finish(verts,idx,normals);
 }
 function plate(p){
   const pos=[],idx=[],n=p.pts.length,normal=unit(cross(sub(p.pts[1],p.pts[0]),sub(p.pts[2],p.pts[0])));
   for(const sign of [-1,1])for(const q of p.pts)pos.push(...q.map((v,i)=>v+normal[i]*sign*(p.depth||.04)/2));
   for(let j=1;j<n-1;j++)idx.push(0,j+1,j,n,n+j,n+j+1);for(let j=0;j<n;j++){const k=(j+1)%n;idx.push(j,k,n+j,k,n+k,n+j);}return finish(pos,idx);
 }
 function implicit(p,res){
   const bb=FTEPro.atlasVolume.bounds(p),extent=bb[1].map((v,i)=>Math.max(v-bb[0][i],.001)),max=Math.max(...extent);
   const dims=extent.map(e=>Math.max(14,Math.ceil(res*e/max))+3),[nx,ny,nz]=dims;
   const step=extent.map((e,i)=>e/(dims[i]-3)),origin=bb[0].map((x,i)=>x-step[i]);
   const values=new Float32Array(nx*ny*nz);for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)values[(z*ny+y)*nx+x]=p.sample(origin[0]+x*step[0],origin[1]+y*step[1],origin[2]+z*step[2]);
   const stride=nx*ny,offset=[0,1,nx+1,nx,stride,stride+1,stride+nx+1,stride+nx];
   const tetra=[[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6],[0,5,1,6]],cache=new Map(),v=[],normal=[],idx=[];
   const point=i=>[i%nx,Math.floor(i/nx)%ny,Math.floor(i/stride)].map((n,k)=>origin[k]+n*step[k]);
   function edge(a,b){
     const key=Math.min(a,b)*values.length+Math.max(a,b);if(cache.has(key))return cache.get(key);
     const t=values[a]/(values[a]-values[b]),pa=point(a),pb=point(b),q=pa.map((n,k)=>n+(pb[k]-n)*t),j=v.length/3;
     v.push(...q);for(let k=0;k<3;k++){const off=step[k]*.33,l=q.slice(),h=q.slice();l[k]-=off;h[k]+=off;normal.push((p.sample(...l)-p.sample(...h))/(2*off));}
     cache.set(key,j);return j;
   }
   for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
     const o=x+nx*y+stride*z,sign=values[o]>0;if(!offset.some(i=>(values[o+i]>0)!==sign))continue;
     for(const face of tetra){const inside=[],outside=[];for(const n of face){const i=o+offset[n];(values[i]>0?inside:outside).push(i);}
       if(!inside.length||!outside.length)continue;
       if(inside.length===2){const [a,b]=inside,[c,d]=outside,A=edge(a,c),B=edge(a,d),C=edge(b,c),D=edge(b,d);idx.push(A,B,C,B,D,C);}
       else{const one=inside.length===1?inside[0]:outside[0],many=inside.length===1?outside:inside;idx.push(...many.map(i=>edge(one,i)));}
     }
   }
   return finish(v,idx,normal);
 }
 const rawCache=new WeakMap(),localCache=new WeakMap();
 function decode(p){
   let cached=rawCache.get(p);if(cached)return cached;
   const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
   const q=new Uint16Array(bytes(p.v)),pos=new Float32Array(q.length);
   for(let i=0;i<q.length;i++){const k=i%3;pos[i]=p.lo[k]+(p.hi[k]-p.lo[k])*q[i]/65535;}
   cached={pos,idx:p.num>65535?new Uint32Array(bytes(p.i)):new Uint16Array(bytes(p.i)),normal:new Int8Array(bytes(p.n))};rawCache.set(p,cached);return cached;
 }
 function get(part,screenSize){
   if(part.mesh){const m=FTEPro.surfaceLibrary[part.mesh];return decode(screenSize<140&&m.overview?m.overview:m);}
   const key=screenSize>95?'fine':'coarse',all=localCache.get(part)||{};
   if(!all[key]){const fine=key==='fine';all[key]=part.sample?implicit(part,fine?62:30):part.p?egg(part,fine?80:28):part.kind==='plate'?plate(part):tube(part,fine?28:12);localCache.set(part,all);}
   return all[key];
 }
 FTEPro.surfaceGeometry={get};
})();
