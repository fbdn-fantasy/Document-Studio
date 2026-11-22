'use strict';
(()=>{
 const P=FTEPro,cache=new Map();
 function rgb(s){return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16)||0);}
 function paintBody(ctx,o,p,r,s){
   const name=o.label.toLowerCase(),kind=/black hole|event horizon/.test(name)?'horizon':/\bstar\b|\bsun\b|photosphere|white dwarf|red giant/.test(name)?'star':/jupiter|gas giant|saturn/.test(name)?'giant':'body';
   const n=Math.max(32,Math.min(768,Math.ceil(r*4/16)*16)),view=s.dimension==='3D'?s.view.ry:0;
   const star=s.objects.find(b=>b!==o&&b.kind==='body'&&/star|sun/i.test(b.label));
   let light=[-.52,.55,.68];
   if(star&&kind!=='star'){const dx=star.x-o.x,dy=star.y-o.y,dz=star.z-o.z,c=Math.cos(view),t=Math.sin(view),rx=s.dimension==='3D'?s.view.rx:0,depth=-dx*t+dz*c;
     light=[dx*c+dz*t,dy*Math.cos(rx)-depth*Math.sin(rx),dy*Math.sin(rx)+depth*Math.cos(rx)];const len=Math.hypot(...light)||1;light=light.map(v=>v/len);}
   const key=[kind,o.color,n,s.dimension,Math.round(view*12),...light.map(v=>Math.round(v*15))].join('|');let img=cache.get(key);
   if(!img){
     img=document.createElement('canvas');img.width=img.height=n;const c=img.getContext('2d'),im=c.createImageData(n,n),color=rgb(o.color);
     for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=(2*x+1)/n-1,v=1-(2*y+1)/n,rad=u*u+v*v;if(rad>=1)continue;
       const z=Math.sqrt(1-rad),lam=Math.atan2(u,z)+view,lat=Math.asin(v),dot=u*light[0]+v*light[1]+z*light[2];
       let shade=kind==='star'?.65+.36*z:kind==='horizon'?.10:.28+.75*Math.max(0,dot);
       if(kind==='star')shade*=.95+.045*Math.sin(27*lam+3*Math.sin(10*lat))*Math.cos(18*lat);
       if(kind==='giant')shade*=.90+.10*Math.sin(20*lat+1.4*Math.sin(lam*3));
       if(s.dimension==='2D'&&kind==='body')shade=.75+.22*z;
       const off=4*(x+y*n);for(let j=0;j<3;j++)im.data[off+j]=kind==='horizon'?12+8*(1-z):Math.min(255,color[j]*shade+(kind==='star'?22*z*z:0));im.data[off+3]=Math.min(255,255*n*(1-Math.sqrt(rad)));
     }
     c.putImageData(im,0,0);if(cache.size>=160)cache.delete(cache.keys().next().value);cache.set(key,img);
   }
   ctx.save();ctx.globalAlpha=o.opacity??1;
   if(kind==='star'&&r>8){const glow=ctx.createRadialGradient(p.x,p.y,r*.96,p.x,p.y,r*1.27);glow.addColorStop(0,o.color+'55');glow.addColorStop(1,o.color+'00');ctx.fillStyle=glow;ctx.fillRect(p.x-r*1.28,p.y-r*1.28,r*2.56,r*2.56);}
   ctx.drawImage(img,p.x-r,p.y-r,2*r,2*r);ctx.restore();
 }
 function component(ctx,n,project,three){
   const x=n.x,y=n.y,w=n.w||0,h=n.h||0,z=n.z||0,projected=pts=>pts.map(q=>project(q[0],q[1],q[2]??z));
   function face(pts,fill,edge){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.stroke();}}
   if(n.kind==='Lens'&&w>0&&h>0&&!n.opticalHidden){
     const cx=x+w/2,cy=y+h/2,color=n.color||'#58829b';
     if(!three){const a=project(cx,y,z),b=project(cx,y+h,z),l=project(cx-w*.52,cy,z),r=project(cx+w*.52,cy,z);
       const grad=ctx.createLinearGradient(l.x,l.y,r.x,r.y);grad.addColorStop(0,'#9ec3d1');grad.addColorStop(.30,'#eaf6fa');grad.addColorStop(.65,'#d4e9ed');grad.addColorStop(1,'#85b2c5');
       ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(r.x+w*.45,r.y,b.x,b.y);ctx.quadraticCurveTo(l.x-w*.45,l.y,a.x,a.y);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.7;ctx.stroke();ctx.restore();return true;
     }
     const facets=[],N=44,R=12;
     const pt=(side,i,j)=>{const rho=i/R,ang=j/N*Math.PI*2;return [cx+side*w*.47*(1-rho*rho),cy+h*.5*rho*Math.cos(ang),z+h*.5*rho*Math.sin(ang)];};
     for(const side of [-1,1])for(let i=0;i<R;i++)for(let j=0;j<N;j++){const pp=projected([pt(side,i,j),pt(side,i+1,j),pt(side,i+1,j+1),pt(side,i,j+1)]);facets.push({pp,depth:pp.reduce((a,v)=>a+v.d,0),tone:Math.round(184+38*Math.cos(j/N*Math.PI*2)*(i/R)*side)});}
     facets.sort((a,b)=>a.depth-b.depth);ctx.save();ctx.globalAlpha=.34;for(const f of facets)face(f.pp,'rgb('+f.tone+','+(f.tone+18)+','+(f.tone+28)+')');ctx.restore();return true;
   }
   const isMagnet=/^(North pole|South pole)$/.test(n.partName),block=n.partName==='Inclined plane'||n.partName==='Block'&&n.kind==='Freehand';
   if(three&&(isMagnet||block)){
     const base=isMagnet?[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]:n.points?.slice(0,-1).map(p=>[p.x,p.y]);if(!base||base.length<3)return false;
     const t=isMagnet?32:n.partName==='Block'?46:78,col=rgb(n.color||'#627e9b'),coat=f=>'rgb('+col.map(v=>Math.round(v*f)).join(',')+')';
     const faces=[{p:base.map(([a,b])=>[a,b,z]),shade:.98},{p:base.map(([a,b])=>[a,b,z-t]),shade:.72}];
     base.forEach(([a,b],i)=>{const [c,d]=base[(i+1)%base.length];faces.push({p:[[a,b,z],[c,d,z],[c,d,z-t],[a,b,z-t]],shade:.68+.18*Math.cos(i)});});
     const layered=faces.map(f=>({...f,pts:projected(f.p)}));layered.sort((a,b)=>a.pts.reduce((t,q)=>t+q.d/a.pts.length,0)-b.pts.reduce((t,q)=>t+q.d/b.pts.length,0));ctx.save();for(const f of layered)face(f.pts,coat(f.shade),'#46505b');ctx.restore();return true;
   }
   return false;
 }
 P.scienceMaterials={paintBody,component};
})();
