// Depth-tested sphere and cylinder models for atoms, bonds and electron rings.
'use strict';
(()=>{
 const P=FTEPro;
 function draw(canvas,state,atoms,bonds,rings,center,scale,extent,cache){
   const v=state.view||state,rx=v.rx||0,ry=v.ry||0,style=v.style||'Ball and stick';
   const sig=JSON.stringify([atoms,bonds,rings,style]);
   if(cache.signature!==sig){
     cache.signature=sig;const parts=atoms.map(a=>({id:a.key,p:a.pos,r:[a.radius,a.radius,a.radius],color:a.color,detailName:a.name}));
     if(style!=='Space filling')for(const b of bonds){const a=atoms[b.a],c=atoms[b.b];if(!a||!c)continue;
       const d=c.pos.map((x,i)=>x-a.pos[i]),len=Math.hypot(...d)||1,lateral=Math.hypot(d[0],d[1]),side=lateral>len*.01?[-d[1]/lateral,d[0]/lateral,0]:[1,0,0];
       const n=b.order===4?2:Math.max(1,b.order||1),r=style==='Wireframe'?.018:.055;
       for(let j=0;j<n;j++){const shift=(j-(n-1)/2)*r*2.5,point=f=>a.pos.map((x,i)=>x+d[i]*f+shift*side[i]);
         for(const [lo,hi,color] of [[0,.5,b.color||a.color],[.5,1,b.color||c.color]]){
           if(b.order===4&&j===1){for(let t=lo;t<hi;t+=.14)parts.push({id:b.key,kind:'path',pts:[point(t),point(Math.min(t+.08,hi))],r,color});}
           else parts.push({id:b.key,kind:'path',pts:[point(lo),point(hi)],r,color});
         }
       }
     }
     rings.forEach((ring,i)=>{const pts=Array.from({length:129},(_,j)=>{const t=j*Math.PI/64;return [ring.radius*Math.cos(t),ring.radius*Math.sin(t)*Math.cos(ring.tilt),ring.radius*Math.sin(t)*Math.sin(ring.tilt)];});parts.push({id:'shell/'+i,pts,r:.012,color:v.colors?.ring||'#8092a8'});});
     cache.parts=parts;
   }
   const ctx=canvas.getContext('2d');canvas.fteLogicalHeight=620;ctx.setTransform(canvas.width/1000,0,0,canvas.height/620,0,0);ctx.fillStyle='white';ctx.fillRect(0,0,1000,620);
   function project(p){const x=p[0]-center[0],y=p[1]-center[1],z=p[2]-center[2],a=x*Math.cos(ry)+z*Math.sin(ry),b=-x*Math.sin(ry)+z*Math.cos(ry);return [500+a*scale,310-(y*Math.cos(rx)-b*Math.sin(rx))*scale,y*Math.sin(rx)+b*Math.cos(rx)];}
   P.surfaceRenderer.render(canvas,state,{parts:cache.parts},project,rx,ry,scale,center,extent+3);
   const targets=atoms.map((a,i)=>{const [x,y]=project(a.pos);return {key:a.key,name:a.name+' · '+(i+1),symbol:a.element,radius:a.radius*scale,x,y};});
   for(const b of bonds){const a=atoms[b.a],c=atoms[b.b];if(!a||!c||style==='Space filling')continue;const [x,y]=project(a.pos.map((n,i)=>(n+c.pos[i])/2));targets.push({key:b.key,name:(['','Single','Double','Triple','Aromatic'][b.order]||'Single')+' bond '+(b.a+1)+'–'+(b.b+1),x,y});}
   rings.forEach((r,i)=>{const [x,y]=project([r.radius,0,0]);targets.push({key:'shell/'+i,name:'Electron shell '+(i+1),x,y});});return targets;
 }
 P.molecularRender=draw;
})();
