// Direct triangle rendering for inspection. No whole-skeleton occupancy grid
// determines which small bones survive. Both rendering paths use the same meshes.
'use strict';
(()=>{
 const P=FTEPro,materials=P.atlasVolume.materials;
 const palette={membrane:'#9bbdbd',nucleus:'#9074a2',mito:'#b27656',accent:'#527f83',lipid:'#d8ba75',hole:'#66524a'};
 function tint(part,s){
   let c=s.detailColors?.[part.detail||part.id]||s.partColors?.[part.id]||(part.color==='base'?s.color:part.color==='membrane'?s.cellColor:palette[part.color]||part.color);
   if(!/^#[a-f\d]{6}$/i.test(c))c='#c7ad90';
   let rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);
   if(s.monochrome)rgb=Array(3).fill(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114);
   return rgb;
 }
 let device,checked=false;
 function gpu(){
   if(checked)return device;checked=true;
   const surface=document.createElement('canvas'),gl=surface.getContext('webgl2',{alpha:false,antialias:true,preserveDrawingBuffer:true});
   if(!gl)return null;
   const program=gl.createProgram();
   const shader=(type,code)=>{const sh=gl.createShader(type);gl.shaderSource(sh,code);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(program,sh);gl.deleteShader(sh);};
   shader(gl.VERTEX_SHADER,`#version 300 es
   layout(location=0) in vec3 pos;layout(location=1) in vec4 normalAO;
   uniform vec3 right,up,front,focus,offset;uniform float size,scale,depthRange,logicalH,midY;
   out vec3 normal;out float ao;
   void main(){vec3 q=pos*size+offset-focus;gl_Position=vec4(dot(q,right)*scale/500.,1.-2.*midY/logicalH+dot(q,up)*scale*2./logicalH,-dot(q,front)/depthRange,1.);
    normal=vec3(dot(normalAO.xyz,right),dot(normalAO.xyz,up),dot(normalAO.xyz,front));ao=normalAO.w;}`);
   shader(gl.FRAGMENT_SHADER,`#version 300 es
   precision highp float;in vec3 normal;in float ao;uniform vec3 color,pickColor;uniform float alpha,pick,planar;out vec4 frag;
   void main(){if(pick>.5){frag=vec4(pickColor,1.);return;}
   vec3 n=normalize(normal);if(n.z<0.)n=-n;
   vec3 light=normalize(vec3(-.48,.70,.57)),halfway=normalize(light+vec3(0.,0.,1.));
   float key=max(dot(n,light),0.),rim=pow(1.-max(n.z,0.),2.),fill=.15*(n.y*.5+.5);
   float shade=.46+.49*key+fill-.14*rim;
   vec3 rgb=color*mix(shade,.77+.23*key-.12*rim,planar)*ao + vec3(.045)*pow(max(dot(n,halfway),0.),24.);
   frag=vec4(rgb,alpha);}`);
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   const u={};for(const k of 'right up front focus offset size scale depthRange logicalH midY color pickColor alpha pick planar'.split(' '))u[k]=gl.getUniformLocation(program,k);
   gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
   device={surface,gl,u,buffers:new WeakMap()};return device;
 }
 function buffers(d,m){let vao=d.buffers.get(m);if(vao)return vao;
   const gl=d.gl;vao=gl.createVertexArray();gl.bindVertexArray(vao);
   for(const [slot,data,type,count,norm] of [[0,m.pos,gl.FLOAT,3,false],[1,m.normal,gl.BYTE,4,true]]){
     const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.enableVertexAttribArray(slot);gl.vertexAttribPointer(slot,count,type,norm,0,0);
   }
   const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,m.idx,gl.STATIC_DRAW);d.buffers.set(m,vao);return vao;
 }
 function visibleParts(s,g,project,scale){
   const hidden=new Set([...(s.hidden||[]),...(s.removed||[]),...(s.detailHidden||[])]);
   const rows=[],table=materials(g.parts),index=new Map(table.map((r,i)=>[r.key,i+1]));
   for(const p of g.parts){
     const key=p.detail||p.id;if(p.carve||hidden.has(p.id)||hidden.has(p.requires)||hidden.has(key)||s.isolatedDetail&&s.isolatedDetail!==key)continue;
     const b=P.atlasVolume.bounds(p),mid=b[0].map((v,k)=>(v+b[1][k])/2),q=project(mid),diam=Math.hypot(...b[1].map((v,k)=>v-b[0][k]))*scale;
     if(q[0]+diam/2<0||q[0]-diam/2>1000||q[1]+diam/2<0||q[1]-diam/2>650)continue;
     const m=P.surfaceGeometry.get(p,diam);if(!m.idx.length)continue;
     const alpha=s.detailTransparent?.includes(key)||s.transparent?.includes(p.id)?(s.layerOpacity??.22):1;
     rows.push({p,m,index:index.get(key),alpha,rgb:tint(p,s),z:q[2]});
   }
   rows.sort((a,b)=>(a.alpha<1)-(b.alpha<1)||(a.alpha<1?a.z-b.z:b.z-a.z));return {rows,table};
 }
 function render(canvas,s,g,project,rx,ry,scale,focus,extent){
   const logicalH=canvas.fteLogicalHeight||650,midY=logicalH===650?315:logicalH/2;
   const {rows,table}=visibleParts(s,g,project,scale),d=gpu();
   const right=[Math.cos(ry),0,Math.sin(ry)],up=[Math.sin(rx)*Math.sin(ry),Math.cos(rx),-Math.sin(rx)*Math.cos(ry)],front=[-Math.cos(rx)*Math.sin(ry),Math.sin(rx),Math.cos(rx)*Math.cos(ry)];
   if(!d){software(canvas,rows,table,right,up,front,scale,focus,s.dimension==='2D');return true;}
   const {gl,u,surface}=d;
   function frame(pick){
     if(surface.width!==canvas.width||surface.height!==canvas.height){surface.width=canvas.width;surface.height=canvas.height;}
     gl.viewport(0,0,surface.width,surface.height);gl.depthMask(true);const bg=pick?0:1;gl.clearColor(bg,bg,bg,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
     for(const [k,v] of Object.entries({right,up,front,focus}))gl.uniform3fv(u[k],v);
     gl.uniform1f(u.logicalH,logicalH);gl.uniform1f(u.midY,midY);gl.uniform1f(u.depthRange,Math.max(1,extent*4+Math.hypot(...focus)));gl.uniform1f(u.scale,scale);gl.uniform1f(u.planar,s.dimension==='2D'?1:0);gl.uniform1f(u.pick,pick?1:0);
     gl.disable(gl.BLEND);let translucent=false;
     for(const r of rows){const {p,m}=r;
       if(!pick&&r.alpha<1&&!translucent){gl.enable(gl.BLEND);gl.depthMask(false);translucent=true;}
       gl.uniform1f(u.size,p.meshScale||1);gl.uniform3fv(u.offset,p.meshOffset||[0,0,0]);gl.uniform3fv(u.color,r.rgb);gl.uniform1f(u.alpha,r.alpha);
       gl.uniform3f(u.pickColor,(r.index&255)/255,(r.index>>8&255)/255,(r.index>>16)/255);
       gl.bindVertexArray(buffers(d,m));gl.drawElements(gl.TRIANGLES,m.idx.length,m.idx.BYTES_PER_ELEMENT===4?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT,0);
     }gl.depthMask(true);
   }
   frame(false);canvas.getContext('2d').drawImage(surface,0,0,1000,logicalH);
   let idPixels;
   canvas.atlasPick=(x,y)=>{if(!idPixels){frame(true);idPixels=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,idPixels);}
     const px=Math.min(canvas.width-1,Math.max(0,Math.floor(x*canvas.width/1000))),py=Math.min(canvas.height-1,Math.max(0,canvas.height-1-Math.floor(y*canvas.height/logicalH))),i=4*(px+py*canvas.width);
     return table[idPixels[i]+(idPixels[i+1]<<8)+(idPixels[i+2]<<16)-1];};
   return true;
 }
 // The fallback uses a triangle z-buffer with interpolated vertex lighting; it
 // does not enlarge a fixed bitmap or replace missing GPU support with primitives.
 function software(canvas,rows,table,right,up,front,scale,focus,flat){
   const logicalH=canvas.fteLogicalHeight||650,midY=logicalH===650?315:logicalH/2;
   const w=canvas.width,h=canvas.height,ks=w/1000,layer=document.createElement('canvas');layer.width=w;layer.height=h;
   const ctx=layer.getContext('2d'),im=ctx.createImageData(w,h);im.data.fill(255);
   const depth=new Float32Array(w*h).fill(-Infinity),ids=new Uint16Array(w*h);
   for(const r of rows){const m=r.m,off=r.p.meshOffset||[0,0,0],size=r.p.meshScale||1,n=m.pos.length/3,pr=new Float32Array(4*n);
     for(let j=0;j<n;j++){const x=m.pos[j*3]*size+off[0]-focus[0],y=m.pos[j*3+1]*size+off[1]-focus[1],z=m.pos[j*3+2]*size+off[2]-focus[2];
       const nx=m.normal[j*4]/127,ny=m.normal[j*4+1]/127,nz=m.normal[j*4+2]/127,dot=a=>nx*a[0]+ny*a[1]+nz*a[2],face=dot(front),sg=face<0?-1:1;
       pr[j*4]=(500+(x*right[0]+y*right[1]+z*right[2])*scale)*ks;pr[j*4+1]=(midY-(x*up[0]+y*up[1]+z*up[2])*scale)*ks;pr[j*4+2]=x*front[0]+y*front[1]+z*front[2];
       const lit=Math.max(0,(-.48*dot(right)+.70*dot(up)+.57*face)*sg);
       pr[j*4+3]=(flat?.76+.24*lit:.48+.51*lit+.09*dot(up)*sg)*m.normal[j*4+3]/127;
     }
     for(let t=0;t<m.idx.length;t+=3){
       const a=4*m.idx[t],b=4*m.idx[t+1],c=4*m.idx[t+2],ax=pr[a],ay=pr[a+1],bx=pr[b],by=pr[b+1],cx=pr[c],cy=pr[c+1],area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);if(Math.abs(area)<.001)continue;
       const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx))),y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
       for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
         const wb=((x+.5-ax)*(cy-ay)-(y+.5-ay)*(cx-ax))/area,wc=((bx-ax)*(y+.5-ay)-(by-ay)*(x+.5-ax))/area,wa=1-wb-wc;
         if(wa<0||wb<0||wc<0)continue;const j=y*w+x,z=wa*pr[a+2]+wb*pr[b+2]+wc*pr[c+2];if(z<depth[j])continue;
         depth[j]=z;ids[j]=r.index;const shade=wa*pr[a+3]+wb*pr[b+3]+wc*pr[c+3];
         for(let k=0;k<3;k++)im.data[4*j+k]=255*r.rgb[k]*shade*r.alpha+im.data[4*j+k]*(1-r.alpha);
       }
     }
   }
   ctx.putImageData(im,0,0);canvas.getContext('2d').drawImage(layer,0,0,1000,logicalH);
   canvas.atlasPick=(x,y)=>table[ids[Math.floor(y*h/logicalH)*w+Math.floor(x*w/1000)]-1];
 }
 P.surfaceRenderer={render};
})();
