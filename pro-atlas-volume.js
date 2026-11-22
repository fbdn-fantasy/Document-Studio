// An orthographic ray caster over a labelled, locally generated density field.
// The same material numbers drive colors, picking, clipping and the printed view.
'use strict';
(()=>{
const P=FTEPro,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), axes=['Sagittal','Axial','Coronal'];
const palette={base:'#d6bca1',membrane:'#a4ccce',nucleus:'#9e80b0',mito:'#bf7852',accent:'#548a86',lipid:'#ddbf74',hole:'#f4f0e9'};
let catalogNames;
function materials(parts){
 if(!catalogNames){const d=P.medicalData;catalogNames=new Map(['bones','cells','animals','systems'].flatMap(k=>(d[k]||[]).map(e=>[e.id,e.name])));}
 const table=new Map();
 for(const p of parts){const key=p.detail||p.id;if(!table.has(key))table.set(key,{key,id:p.id,name:p.detailName||catalogNames.get(p.id)||String(p.id).split('/').pop(),color:p.color,p:p.anchor||p.p||p.pts[Math.floor(p.pts.length/2)]});}
 return [...table.values()];
}
function bounds(p){
 if(p.bounds)return p.bounds;
 if(p.p)return [-1,1].map(sign=>p.p.map((v,i)=>v+sign*p.r[i]));
 return [Math.min,Math.max].map((op,k)=>[0,1,2].map(i=>op(...p.pts.map(q=>q[i]))+(k?1:-1)*(p.r||p.depth||.03)));
}
function scene(parts,s,camera){
 const all=parts.map(bounds),lo=[0,1,2].map(i=>Math.min(...all.map(b=>b[0][i]))),hi=[0,1,2].map(i=>Math.max(...all.map(b=>b[1][i])));
 if(s.cutaway&&s.id==='Cardiovascular/Heart and great vessels'&&s.sectionFocus!==false){lo.splice(0,3,-1.21,3.70,-.51);hi.splice(0,3,1.12,5.84,1.04);}
 const axis=Math.max(0,axes.indexOf(s.sectionAxis||'Coronal')),sectionWorld=lo[axis]+(s.sectionDepth??.5)*(hi[axis]-lo[axis]);
 if(camera&&s.view.zoom>1.6){
   // Intersect the original specimen box with a conservative world-space bound
   // of the visible camera prism. Section depth remains in specimen coordinates.
   const {center,right,up,front,scale}=camera;
   const corners=Array.from({length:8},(_,n)=>lo.map((x,i)=>((n>>i)&1)?hi[i]:x));
   const depths=corners.map(p=>p.reduce((a,x,i)=>a+(x-center[i])*front[i],0));
   const prism=[];for(const x of [-540,540])for(const y of [-355,355])for(const z of [Math.min(...depths),Math.max(...depths)])prism.push(center.map((v,i)=>v+x*right[i]/scale+y*up[i]/scale+z*front[i]));
   for(let i=0;i<3;i++){const a=Math.max(lo[i],Math.min(...prism.map(p=>p[i]))),b=Math.min(hi[i],Math.max(...prism.map(p=>p[i])));if(b>a){lo[i]=a;hi[i]=b;}}
 }
 const extent=Math.max(...hi.map((v,i)=>v-lo[i]),.01);
 const fine=Math.min(340,Math.max(208,Math.round(192+Math.log2(Math.max(1,s.view.zoom))*30)));
 const step=Math.max(extent/fine,Math.cbrt(Math.max(.000001,(hi[0]-lo[0])*(hi[1]-lo[1])*(hi[2]-lo[2]))/5100000));
 const origin=lo.map(v=>v-step*3),dims=hi.map((v,i)=>Math.ceil((v-origin[i])/step)+4),[nx,ny,nz]=dims;
 const size=nx*ny*nz,bytes=new Uint8Array(size*4),mat=materials(parts),indices=new Map(mat.map((v,i)=>[v.key,i+1]));
 const hidden=new Set([...(s.hidden||[]),...(s.removed||[]),...(s.detailHidden||[])]);
 function paint(b,fn,id,subtract=false){
  const start=b[0].map((v,i)=>clamp(Math.floor((v-origin[i])/step)-1,0,dims[i]-1)),end=b[1].map((v,i)=>clamp(Math.ceil((v-origin[i])/step)+1,0,dims[i]-1));
  for(let k=start[2];k<=end[2];k++){const z=origin[2]+k*step;for(let j=start[1];j<=end[1];j++){const y=origin[1]+j*step;let off=((k*ny+j)*nx+start[0])*4;for(let i=start[0];i<=end[0];i++,off+=4){const dist=fn(origin[0]+i*step,y,z),a=clamp(128+dist/step*104,0,255);
  if(subtract){bytes[off+3]=Math.min(bytes[off+3],255-a);continue;}
  if(a>=128||a>bytes[off+3]){bytes[off]=id&255;bytes[off+1]=id>>8;bytes[off+3]=Math.max(a,bytes[off+3]);}
  }}}
 }
 for(const p of parts){
  const key=p.detail||p.id,id=indices.get(key);if(hidden.has(key)||hidden.has(p.id)||hidden.has(p.requires)||s.isolatedDetail&&key!==s.isolatedDetail)continue;
  if(p.sample){paint(bounds(p),p.sample,id,p.carve);continue;}
  if(p.p){const [a,b,c]=p.p,[rx,ry,rz]=p.r.map(v=>Math.max(v,step*.72)),r=Math.min(rx,ry,rz);paint(bounds(p),(x,y,z)=>r*(1-Math.sqrt(((x-a)/rx)**2+((y-b)/ry)**2+((z-c)/rz)**2)),id);continue;}
  if(p.kind==='plate'){
   const v=p.pts,u=v[0],ab=v[1].map((x,i)=>x-u[i]),ac=v[2].map((x,i)=>x-u[i]),n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];const len=Math.hypot(...n)||1;n.forEach((x,i)=>n[i]=x/len);const drop=n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs))),a=(drop+1)%3,b=(drop+2)%3;
   paint(bounds(p),(x,y,z)=>{const t=[x,y,z];let inside=false;for(let i=0,j=v.length-1;i<v.length;j=i++){if((v[i][b]>t[b])!==(v[j][b]>t[b])&&t[a]<(v[j][a]-v[i][a])*(t[b]-v[i][b])/(v[j][b]-v[i][b])+v[i][a])inside=!inside;}return inside?Math.max(step*.7,p.depth/2)-Math.abs((x-u[0])*n[0]+(y-u[1])*n[1]+(z-u[2])*n[2]):-step*2;},id);continue;
  }
  for(let j=1;j<p.pts.length;j++){const a=p.pts[j-1],b=p.pts[j],v=b.map((x,i)=>x-a[i]),l=v.reduce((t,x)=>t+x*x,0)||1,r=Math.max(step*.74,p.r||.03);
   paint([a.map((x,i)=>Math.min(x,b[i])-r),a.map((x,i)=>Math.max(x,b[i])+r)],(x,y,z)=>{x-=a[0];y-=a[1];z-=a[2];const t=clamp((x*v[0]+y*v[1]+z*v[2])/l,0,1);return r-Math.sqrt((x-t*v[0])**2+(y-t*v[1])**2+(z-t*v[2])**2);},id);}
 }
 return {bytes,dims,origin,step,extent,sectionWorld,mat,center:hi.map((v,i)=>(v+lo[i])/2)};
}
let device,failed;
function gpu(){
 if(device||failed)return device;
 const surface=document.createElement('canvas'),gl=surface.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});
 if(!gl){failed=true;return null;}
 const program=gl.createProgram();
 function shader(type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(program,sh);gl.deleteShader(sh);}
 shader(gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}');
 shader(gl.FRAGMENT_SHADER,`#version 300 es
 precision highp float;precision highp sampler3D;
 uniform sampler3D vol;uniform sampler2D lut;
 uniform vec3 dims,center,right,up,front;uniform vec2 res;uniform float scale,extent,cut,axis,pick,planar;out vec4 pixel;
 float rho(vec3 uv){return texture(vol,uv).a;}
 void main(){vec3 o=center+(gl_FragCoord.x-res.x*.5)/scale*right+(gl_FragCoord.y-res.y*.515)/scale*up+front*extent*1.12;
 vec3 dir=-front,inv=1./(dir+vec3(1e-9)),a=(-o)*inv,b=(dims-o)*inv,vmin=min(a,b),vmax=max(a,b);
 float t=max(0.,max(max(vmin.x,vmin.y),vmin.z)),stop=min(min(vmax.x,vmax.y),vmax.z);
 vec3 acc=vec3(0.);float trans=1.,previous=-1.; vec3 bg=vec3(1.);
 for(int i=0;i<1024;i++,t+=.62){if(t>stop||trans<.01)break;vec3 pos=o+t*dir,uv=(pos+.5)/dims;
 float depth=axis==0.?pos.x:axis==1.?pos.y:pos.z;if(depth>cut){previous=-1.;continue;}
 float den=rho(uv);if(den<.47){previous=-1.;continue;}
 vec2 ids=floor(texelFetch(vol,clamp(ivec3(pos+.5),ivec3(0),ivec3(dims)-1),0).rg*255.+.5);float id=ids.x+256.*ids.y;if(id<.5||id==previous)continue;previous=id;
 vec4 material=texelFetch(lut,ivec2(int(ids.x),int(ids.y)),0);if(material.a<.01)continue;
 if(pick>.5){pixel=vec4(ids/255.,0.,1.);return;}
 vec3 h=1./dims;vec3 n=vec3(rho(uv-vec3(h.x,0,0))-rho(uv+vec3(h.x,0,0)),rho(uv-vec3(0,h.y,0))-rho(uv+vec3(0,h.y,0)),rho(uv-vec3(0,0,h.z))-rho(uv+vec3(0,0,h.z)));
 if(cut-depth<1.0)n=axis==0.?vec3(1,0,0):axis==1.?vec3(0,1,0):vec3(0,0,1);
 n=length(n)>.001?normalize(n):front;float light=max(dot(n,normalize(front*.85+up*.65-right*.55)),0.);
 float shade=mix(.60+.40*light,.83+.17*light,planar);shade*=.82+.18*smoothstep(.0,.34,abs(dot(n,front)));
 float sheen=pow(max(dot(n,normalize(front*1.70+up*.65-right*.55)),0.),20.)*.035*(1.-planar);acc+=trans*material.a*(material.rgb*shade+vec3(sheen));trans*=1.-material.a;}
 pixel=pick>.5?vec4(0,0,0,1):vec4(acc+trans*bg,1.);}`);
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const u={};for(const name of 'vol lut dims center right up front res scale extent cut axis pick planar'.split(' '))u[name]=gl.getUniformLocation(program,name);
 gl.useProgram(program);gl.uniform1i(u.vol,0);gl.uniform1i(u.lut,1);
 function texture(unit,target,filter){gl.activeTexture(gl.TEXTURE0+unit);const t=gl.createTexture();gl.bindTexture(target,t);for(const f of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(target,f,filter);for(const f of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T,...(unit===0?[gl.TEXTURE_WRAP_R]:[])])gl.texParameteri(target,f,gl.CLAMP_TO_EDGE);return t;}
 const volume=texture(0,gl.TEXTURE_3D,gl.LINEAR),colors=texture(1,gl.TEXTURE_2D,gl.NEAREST);
 device={gl,u,surface,volume,colors};return device;
}
function render(canvas,s,g,project,rx,ry,scale,center){
 const d=gpu();
 const right=[Math.cos(ry),0,Math.sin(ry)],up=[Math.sin(rx)*Math.sin(ry),Math.cos(rx),-Math.sin(rx)*Math.cos(ry)],front=[-Math.cos(rx)*Math.sin(ry),Math.sin(rx),Math.cos(rx)*Math.cos(ry)];
 const signature=JSON.stringify([s.view.zoom>1.6?[s.view.zoom,s.view.focus,rx,ry]:0,s.sectionAxis,s.sectionDepth,s.hidden,s.removed,s.detailHidden,s.isolatedDetail,s.id==='Cardiovascular/Heart and great vessels'&&!!s.cutaway&&s.sectionFocus!==false]);
 if(g.volumeKey!==signature){g.volume=scene(g.parts,s,{right,up,front,scale,center});g.volumeKey=signature;}
 const v=g.volume;if(!d)return software(canvas,s,v,project,scale);
 const {gl,u,surface}=d;if(d.current!==v){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_3D,d.volume);gl.texImage3D(gl.TEXTURE_3D,0,gl.RGBA8,...v.dims,0,gl.RGBA,gl.UNSIGNED_BYTE,v.bytes);d.current=v;}
 const rgb=new Uint8Array(256*Math.max(1,Math.ceil((v.mat.length+1)/256))*4);
 for(const [i,m] of v.mat.entries()){let col=s.detailColors?.[m.key]||s.partColors?.[m.id]||(m.color==='base'?s.color:m.color==='membrane'?s.cellColor:palette[m.color])||m.color||s.color;if(!/^#[0-9a-f]{6}$/i.test(col))col='#c6b5ac';
 let c=[1,3,5].map(j=>parseInt(col.slice(j,j+2),16));if(s.monochrome)c=Array(3).fill(Math.round(c[0]*.299+c[1]*.587+c[2]*.114));rgb.set([...c,s.transparent?.includes(m.id)||s.detailTransparent?.includes(m.key)?Math.round(255*(s.layerOpacity??.22)):255],(i+1)*4);}
 gl.activeTexture(gl.TEXTURE1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,256,rgb.length/1024,0,gl.RGBA,gl.UNSIGNED_BYTE,rgb);
 if(surface.width!==canvas.width||surface.height!==canvas.height){surface.width=canvas.width;surface.height=canvas.height;}
 gl.viewport(0,0,surface.width,surface.height);

 for(const [key,val] of Object.entries({right,up,front,dims:v.dims,center:center.map((x,i)=>(x-v.origin[i])/v.step)}))gl.uniform3fv(u[key],val);
 const axis=Math.max(0,axes.indexOf(s.sectionAxis||'Coronal'));gl.uniform1f(u.axis,axis);gl.uniform1f(u.cut,s.cutaway?(v.sectionWorld-v.origin[axis])/v.step:10000);
 gl.uniform1f(u.pick,0);gl.uniform1f(u.planar,s.dimension==='2D'?1:0);gl.uniform2f(u.res,surface.width,surface.height);gl.uniform1f(u.scale,scale*v.step*canvas.width/1000);gl.uniform1f(u.extent,Math.max(...v.dims));gl.drawArrays(gl.TRIANGLES,0,3);
 canvas.getContext('2d').drawImage(surface,0,0,1000,650);
 canvas.atlasPick=(x,y)=>{if(d.current!==v)return;const a=new Uint8Array(4);gl.enable(gl.SCISSOR_TEST);const px=clamp(Math.floor(x*surface.width/1000),0,surface.width-1),py=clamp(surface.height-1-Math.floor(y*surface.height/650),0,surface.height-1);gl.scissor(px,py,1,1);gl.uniform1f(u.pick,1);gl.drawArrays(gl.TRIANGLES,0,3);gl.readPixels(px,py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,a);gl.disable(gl.SCISSOR_TEST);return v.mat[a[0]+256*a[1]-1];};
 return true;
}
// Project the exposed surfaces of the same labeled volume on systems without WebGL2.
function software(canvas,s,v,project,scale){
 const W=Math.min(1800,canvas.width),H=Math.round(W*.65),k=W/1000, layer=document.createElement('canvas');layer.width=W;layer.height=H;
 const ctx=layer.getContext('2d'),im=ctx.createImageData(W,H),depth=new Float32Array(W*H).fill(-Infinity),ids=new Uint16Array(W*H);
 const [nx,ny,nz]=v.dims,axis=axes.indexOf(s.sectionAxis||'Coronal'),cut=s.cutaway?Math.floor((v.sectionWorld-v.origin[axis])/v.step):Infinity;
 const colors=v.mat.map(m=>{let c=s.detailColors?.[m.key]||s.partColors?.[m.id]||(m.color==='base'?s.color:m.color==='membrane'?s.cellColor:palette[m.color])||m.color||s.color;
 if(!/^#[0-9a-f]{6}$/i.test(c))c='#ccae99';let rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
 if(s.monochrome)rgb=Array(3).fill(Math.round(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114));
 if(s.transparent?.includes(m.id)||s.detailTransparent?.includes(m.key))rgb=rgb.map(c=>255-(255-c)*(s.layerOpacity??.22));return rgb;});
 const radius=Math.max(.8,v.step*scale*k*.77);
 const stride=nx*ny,solid=i=>v.bytes[4*i+3]>=128;
 for(let z=1;z<nz-1;z++)for(let y=1;y<ny-1;y++)for(let x=1;x<nx-1;x++){
   const at=axis===0?x:axis===1?y:z;if(at>cut)continue;
   const n=x+nx*y+stride*z;if(!solid(n))continue;
   if(at!==cut&&solid(n-1)&&solid(n+1)&&solid(n-nx)&&solid(n+nx)&&solid(n-stride)&&solid(n+stride))continue;
   const pt=project([v.origin[0]+x*v.step,v.origin[1]+y*v.step,v.origin[2]+z*v.step]);
   const col=v.bytes[n*4]+256*v.bytes[n*4+1],rgb=colors[col-1];if(!rgb)continue;
   const shade=s.dimension==='2D'||at===cut?1:.81+.09*(Number(solid(n-1))-Number(solid(n+1)))+.06*(Number(solid(n+nx))-Number(solid(n-nx)));
   const xx=pt[0]*k,yy=pt[1]*k;
   for(let j=Math.max(0,Math.ceil(yy-radius));j<=Math.min(H-1,yy+radius);j++)for(let i=Math.max(0,Math.ceil(xx-radius));i<=Math.min(W-1,xx+radius);i++){
     const off=j*W+i;if(depth[off]>pt[2])continue;depth[off]=pt[2];ids[off]=col;
     for(let c=0;c<3;c++)im.data[off*4+c]=rgb[c]*shade;im.data[off*4+3]=255;
   }
 }
 ctx.putImageData(im,0,0);canvas.getContext('2d').drawImage(layer,0,0,1000,650);
 canvas.atlasPick=(x,y)=>v.mat[ids[Math.floor(y*k)*W+Math.floor(x*k)]-1];return true;
}
// Anchor interior callouts to material actually intersected by the current plane.
function sectionLabels(v,axis,depth,labels){
 if(!v)return labels;
 const slice=clamp(Math.round((v.sectionWorld-v.origin[axis])/v.step),0,v.dims[axis]-1);
 if(v.cross?.axis!==axis||v.cross.slice!==slice){
   const points=new Map(),a=(axis+1)%3,b=(axis+2)%3,pos=[0,0,0];pos[axis]=slice;
   for(pos[a]=0;pos[a]<v.dims[a];pos[a]++)for(pos[b]=0;pos[b]<v.dims[b];pos[b]++){
     const off=4*(pos[0]+v.dims[0]*(pos[1]+v.dims[1]*pos[2]));
     if(v.bytes[off+3]<128)continue;
     const m=v.mat[v.bytes[off]+256*v.bytes[off+1]-1];if(!m)continue;
     if(!points.has(m.key))points.set(m.key,[]);points.get(m.key).push(pos.map((n,i)=>v.origin[i]+n*v.step));
   }
   v.cross={axis,slice,points};
 }
 return labels.map(label=>{
   const points=v.cross.points.get(label.detail||label.id);if(!points)return label;
   let p=label.p,best=Infinity;
   for(const q of points){const d=(q[0]-label.p[0])**2+(q[1]-label.p[1])**2+(q[2]-label.p[2])**2;if(d<best){best=d;p=q;}}
   return {...label,p};
 });
}
function release(canvas){canvas.atlasPick=null;if(device?.current){device.gl.activeTexture(device.gl.TEXTURE0);device.gl.texImage3D(device.gl.TEXTURE_3D,0,device.gl.RGBA8,1,1,1,0,device.gl.RGBA,device.gl.UNSIGNED_BYTE,null);device.current=null;}}
P.atlasVolume={render,sectionLabels,materials,bounds,axes,release,available:()=>!!gpu()};
})();
