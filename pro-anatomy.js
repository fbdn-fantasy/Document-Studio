// Assembled landmarks share world coordinates with the V9 human skeleton.
// Detail views use their own scale (a tissue window is not a whole-bone scan).
'use strict';
(() => {
 const D=FTEPro.medicalData;
 const assemblies=[
   ['Complete skeleton','Full skeleton · assembled (206 bones)','All'],
   ['Skull','Assembled skull (22 bones)','Skull'],
   ...['Hand','Foot','Upper limb','Lower limb'].flatMap(region=>['Left','Right'].map(side=>[side+' '+region.toLowerCase(),'Assembled '+side.toLowerCase()+' '+region.toLowerCase(),region]))
 ];
 const members=id=>{
   const row=assemblies.find(row=>row[0]===id);if(!row)return null;
   return D.bones.filter(b=>id==='Complete skeleton'||b.region===row[2]&&(id==='Skull'||id.startsWith(b.side+' ')));
 };
 const tube=(id,name,pts,r,color)=>({id,detail:id+'::'+name,detailName:name,kind:'path',pts,r,color});
 const oval=(id,name,p,r,color)=>({id,detail:id+'::'+name,detailName:name,kind:'ell',p,r,color});
 const solid=(id,name,p,r,color,sample,anchor)=>({...oval(id,name,p,r,color),sample,anchor});
 const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 function hand(b) {
   const sign=b.side==='Right'?-1:1, id=b.id, pt=(x,y,z=.03)=>[sign*x,y,z];
   const carpal=['Scaphoid','Lunate','Triquetrum','Pisiform','Trapezium','Trapezoid','Capitate','Hamate'].indexOf(b.anatomical);
   const wrists=[[2.04,1.12],[1.9,1.14],[1.74,1.1],[1.72,1.1,.15],[2.12,.93],[2.0,.94],[1.86,.94],[1.70,.93]];
   if(carpal>=0){const p=pt(...wrists[carpal]);return {parts:[oval(id,b.name,p,[.089,.107,.084],'base')],p};}
   const digit=Number(b.name.match(/(\d)$/)?.[1]);if(!digit)return null;
   const i=digit-1,start=pt([2.14,2.025,1.9,1.775,1.67][i],.85);
   const end=pt([2.49,2.19,1.97,1.76,1.54][i],[.49,.22,.15,.21,.29][i],i===0?.16:.06);
   const tip=pt([2.78,2.29,2.01,1.74,1.42][i],[.12,-.37,-.51,-.38,-.17][i],i===0?.26:.09);
   const breaks=i===0?[0,.56,1]:[0,.47,.77,1];
   const segment=b.shape==='metacarpal'?-1:/Proximal/.test(b.name)?0:/Middle/.test(b.name)?1:breaks.length-2;
   const a=segment<0?start:mix(end,tip,breaks[segment]),z=segment<0?end:mix(end,tip,breaks[segment+1]);
   const radius=segment<0?.054:.041;
   return {p:mix(a,z,.5),parts:[tube(id,b.name,[mix(a,z,.05),mix(a,z,.95)],radius,'base'),oval(id,b.name,mix(a,z,.92),[radius*1.3,radius,radius*1.2],'base')]};
 }
 function skull(b) {
   // Adjacent angular territories form a continuous vault above the orbits.
   const vault=['frontal','parietal','occipital','temporal'];
   if(!vault.includes(b.shape))return null;
   const center=[0,8.33,-.05],r=[.73,.78,.74],side=b.side==='Right'?-1:1;
   const anchor={frontal:[0,8.6,.61],parietal:[side*.53,8.84,-.12],temporal:[side*.68,8.11,-.1],occipital:[0,8.32,-.77]}[b.shape];
   function sample(x,y,z){const u=x/r[0],v=(y-center[1])/r[1],w=(z-center[2])/r[2];
     const shell=.73*(1-Math.hypot(u,v,w)),front=w-.41+.12*v,back=-w-.58-.12*v,lower=-v-.16;
     const territory=b.shape==='frontal'?front:b.shape==='occipital'?Math.min(-front,back):Math.min(-front,-back,side*u,b.shape==='temporal'?lower:-lower);
     // Keep a shallow notch between the superior orbital rims.
     const brow=-.33-(.11*Math.cos(2*Math.PI*u));
     const orbit=Math.hypot((Math.abs(x)-.35)/.236,(y-8.21)/.185)-1;
     return Math.min(shell,.090-shell,(territory-.009)*.7,(v-(w>.35?brow:-.72))*.7,w>.12?orbit*.20:1);
   }
   return {p:anchor,parts:[solid(b.id,b.name,center,r,'base',sample,anchor)]};
 }
 // Joint coordinates use the same frame as the trunk, wrists and ankles.
 function shaft(b) {
   const sign=b.side==='Right'?-1:1;
   const joints={
     humerus:[[1.42,5.53,.04],[1.74,3.28,.04],.135],
     radius:[[1.83,3.24,.10],[2.02,1.22,.07],.082],
     ulna:[[1.68,3.30,-.04],[1.73,1.22,-.04],.088],
     femur:[[.62,.48,.04],[.65,-3.35,0],.185],
     tibia:[[.63,-3.43,0],[.61,-6.30,0],.142],
     fibula:[[.89,-3.54,-.03],[.85,-6.38,-.05],.071]
   }[b.shape];if(!joints)return null;
   const [a,end,r]=joints,pt=t=>{const v=mix(a,end,t);v[0]=(v[0]+(b.shape==='femur'?.19:0)*(1-t)+.065*Math.sin(t*Math.PI))*sign;v[2]+=.055*Math.sin(t*Math.PI);return v;};
   const pts=[0,.18,.48,.78,1].map(pt),parts=[tube(b.id,b.name,pts,r,'base')];
   const pad=(p,x,y,z)=>parts.push(oval(b.id,b.name,p,[r*x,r*y,r*z],'base'));
   if(b.shape==='femur'){pad([sign*.49,.51,.04],1.48,1.48,1.48);parts.push(tube(b.id,b.name,[[sign*.49,.51,.04],pt(.055)],r*1.05,'base'));pad(pt(.045),1.32,1.6,1.30);}
   else pad(pt(.035),b.shape==='tibia'?1.7:1.35,1.4,1.25);
   for(const side of [-1,1]){const p=pt(.98);p[0]+=side*.66*r;pad(p,b.shape==='femur'?1.17:1.01,1.22,1.2);}
   return {p:pt(.48),parts};
 }
 function rib(b){
   const n=Number(b.name.match(/\d+$/)[0]),side=b.side==='Right'?-1:1,w=.72+.64*Math.sin((n-.6)/13*Math.PI),y=5.46-(n-1)*.245;
   const pts=Array.from({length:29},(_,i)=>{const t=i/28*(n>10?.67:n>7?.86:1);
     return [side*(.13+w*Math.sin(t*Math.PI)),y-.49*Math.sin(t*Math.PI*.79)-.09*t,-.38+.93*(1-Math.cos(t*Math.PI))*.60];});
   return {p:pts[12],parts:[tube(b.id,b.name,pts,.049+.012*Math.sin(n/12*Math.PI),'base')]};
 }
 function face(b){
   const k=b.side==='Right'?-1:1,pt=(x,y,z)=>[k*x,y,z];
   const name=b.shape,parts=[],path=(pts,r)=>parts.push(tube(b.id,b.name,pts.map(p=>pt(...p)),r,'base'));
   if(name==='zygomatic'){
     path([[.17,8.20,.62],[.28,8.12,.66],[.46,8.12,.59],[.59,8.24,.48],[.57,8.39,.44]],.068);
     path([[.53,8.17,.52],[.64,8.12,.30],[.68,8.04,.06]],.071);
   }else if(name==='maxilla'){
     path([[.10,8.38,.66],[.14,8.17,.66],[.21,8.03,.65],[.41,8.05,.54],[.48,8.12,.54]],.067);
     path([[.21,8.03,.65],[.26,7.91,.64],[.33,7.83,.53],[.39,7.79,.36]],.102);
     path([[.02,7.85,.72],[.17,7.84,.69],[.29,7.84,.60],[.39,7.79,.36]],.086);
   }else if(name==='mandible'){
     const arc=Array.from({length:25},(_,i)=>{const a=Math.PI*i/24;return [.53*Math.cos(a),7.56-.055*Math.sin(a),.12+.61*Math.sin(a)];});
     parts.push(tube(b.id,b.name,arc,.102,'base'));
     for(const side of [-1,1])parts.push(tube(b.id,b.name,[[side*.53,7.56,.12],[side*.55,7.7,.08],[side*.56,8.00,-.02]],.109,'base'));
   }else if(name==='nasal'){path([[.05,8.32,.67],[.078,8.16,.76],[.09,8.04,.80]],.066);}
   else return null;
   return {p:parts[0].pts[Math.floor(parts[0].pts.length/2)],parts};
 }
 function foot(b){
   const sign=b.side==='Right'?-1:1,pt=(x,y,z)=>[x*sign,y,z];
   const tarsals={
     Talus:[[.65,-6.40,.02],[.21,.17,.23]],Calcaneus:[[.67,-6.64,-.09],[.22,.19,.31]],
     Navicular:[[.60,-6.50,.29],[.17,.13,.15]],Cuboid:[[.88,-6.63,.32],[.16,.14,.25]],
     'Medial cuneiform':[[.42,-6.57,.50],[.12,.12,.17]],'Intermediate cuneiform':[[.59,-6.56,.51],[.11,.11,.16]],
     'Lateral cuneiform':[[.74,-6.58,.53],[.11,.12,.16]]
   }[b.anatomical];
   if(tarsals){const p=pt(...tarsals[0]);return {p,parts:[oval(b.id,b.name,p,tarsals[1],'base')]};}
   const digit=Number(b.name.match(/(\d)$/)?.[1]);if(!digit)return null;
   const i=digit-1,root=pt(.40+.125*i,-6.61,.62-(i===4?.15:0)),joint=pt(.32+.177*i,-6.76,[1.28,1.36,1.32,1.22,1.08][i]),tip=pt(.28+.19*i,-6.81,[1.73,1.79,1.71,1.57,1.40][i]);
   const breaks=i===0?[0,.53,1]:[0,.48,.75,1],seg=b.shape==='metatarsal'?-1:/Proximal/.test(b.name)?0:/Middle/.test(b.name)?1:breaks.length-2;
   const a=seg<0?root:mix(joint,tip,breaks[seg]),end=seg<0?joint:mix(joint,tip,breaks[seg+1]),r=(seg<0?.057:.039)*(i===0?1.4:1);
   return {p:mix(a,end,.5),parts:[tube(b.id,b.name,[mix(a,end,.04),mix(a,end,.96)],r,'base'),oval(b.id,b.name,mix(a,end,.95),[r*1.2,r,r],'base')]};
 }
 function placed(b){
   const special=b.region==='Hand'?hand(b):b.region==='Foot'?foot(b):b.region==='Skull'?(skull(b)||face(b)):b.shape==='rib'?rib(b):shaft(b);
   if(special)return special;
   const model=D.transform(D.boneModel(b),b.pos,b.size,b.id);
   // Use a point on the actual part instead of the nominal origin (notably ribs).
   return {parts:model.parts,p:model.labels[0]?.p||b.pos};
 }
 function assembly(bones){
   const parts=[],labels=[];
   for(const b of bones){const m=placed(b);parts.push(...m.parts.map(p=>({...p,detail:b.id,detailName:b.name})));labels.push({id:b.id,detail:b.id,name:b.name,p:m.p});}
   if(bones.length===206){
     const overview=['Frontal','Mandible','Left Clavicle','Sternum','Left Rib 5','Left Humerus','Right Radius','Left Ulna','Lumbar vertebra 3','Right Hip bone','Left Metacarpal 3','Left Femur','Right Patella','Left Tibia','Right Fibula','Left Talus'];
     const rank=l=>{const index=overview.indexOf(l.name);return index<0?999:index;};
     labels.sort((a,b)=>rank(a)-rank(b));
   }
   return {parts,labels,assembly:true};
 }
 // Slightly deformed hexagonal cells give a connected trabecular network in
 // section. Vary its phase through depth rather than extruding a flat pattern.
 function trabecula(x,y,z,scale=1) {
   const k=.28*scale;
   const xx=x/k+.22*Math.sin(3*y+4*z)+.48*z/k,yy=y/k+.19*Math.cos(4*x-2*z)+.31*z/k;
   const cy=Math.round(yy/1.5);let nearest=Infinity,next=Infinity;
   for(let j=cy-1;j<=cy+1;j++){const offset=(j&1)*.5,cx=Math.round(xx/1.732-offset);
     for(let i=cx-1;i<=cx+1;i++){const d=(xx-1.732*(i+offset))**2+(yy-1.5*j)**2;
       if(d<nearest){next=nearest;nearest=d;}else if(d<next)next=d;}
   }
   return (.40-(next-nearest))*k*.42;
 }
 function longBoneSection(b){
   const id=b.id,side=b.side==='Right'?-1:1,femur=b.shape==='femur',humerus=b.shape==='humerus';
   const r=[1.02,2.45,.59],p=[0,0,0],parts=[],labels=[];
   function surface(x,y,z){
     x*=side;const u=Math.min(1,Math.abs(y/1.95)),width=.236+.20*u**3;
     const shaft=Math.min(1.98-Math.abs(y),width-Math.hypot(x-.052*Math.sin(1.4*y),z*.94));
     const ellipse=(dx,dy,dz,a,b,c)=>Math.min(a,b,c)*(1-Math.hypot(dx/a,dy/b,dz/c));
     let d=shaft;
     if(femur||humerus){
       const reach=femur?.47:.20;d=Math.max(d,ellipse(x+reach,y-1.96,z,.37,.36,.34),
         ellipse(x+.18,y-1.8,z,.39,.27,.26),ellipse(x-.25,y-1.78,z,.23,.36,.24));
     }else d=Math.max(d,ellipse(x,y-1.88,z,.46,.28,.36));
     for(const sign of [-1,1])d=Math.max(d,ellipse(x-sign*.22,y+1.91,z+.02,.27,.29,.34));
     return d;
   }
   function add(name,color,fn,anchor){
     parts.push(solid(id,name,p,r,color,fn,anchor));labels.push({id,name,detail:id+'::'+name,p:anchor});
   }
   add('Compact bone (cortex)','#dec69c',(x,y,z)=>{const d=surface(x,y,z);return Math.min(d,.083-d);},[side*.21,.4,0]);
   add('Trabeculae (spongy bone)','#c69465',(x,y,z)=>Math.min(surface(x,y,z)-.076,Math.abs(y)-1.10,trabecula(x,y,z,.47)),[.12,1.64,0]);
   add('Marrow spaces','#ac6671',(x,y,z)=>Math.min(surface(x,y,z)-.081,Math.abs(y)-1.10,-trabecula(x,y,z,.47)),[0,-1.65,0]);
   add('Medullary cavity with marrow','#dfaf66',(x,y,z)=>Math.min(surface(x,y,z)-.083,1.10-Math.abs(y)),[0,.06,0]);
   return {parts,labels,assembly:false,sectionNote:'Longitudinal teaching section. The compact shaft encloses the medullary cavity. Spongy bone and marrow occupy the expanded ends. Select Magnify bone tissue for a closer view.'};
 }
 function boneWindow(id,long,flat) {
   const parts=[],labels=[],add=(name,col,fn,at)=>{
     parts.push(solid(id,name,[0,0,0],[1.5,1.22,.70],col,fn,at));labels.push({id,name,detail:id+'::'+name,p:at});
   };
   const outer=(x,y,z)=>Math.min(1.45-Math.abs(x),1.16-Math.abs(y),.65-Math.abs(z));
   const wall=(x,y,z)=>flat?.15:.21;
   add(flat?'Compact outer and inner tables':'Compact bone (cortex)','#e7cf9e',(x,y,z)=>{const d=outer(x,y,z);const edge=flat?.65-Math.abs(z):d;return Math.min(d,wall(x,y,z)-edge);},flat?[0,.8,-.54]:[-1.34,.78,0]);
   const interior=(x,y,z)=>Math.min(outer(x,y,z)-.02,(flat?.65-Math.abs(z):outer(x,y,z))-wall(x,y,z));
   // Interconnecting rods and plates border irregular marrow spaces.
   const zone=(x)=>long?.56-x:2;
   add(flat?'Diploë (spongy bone)':'Trabeculae (spongy bone)','#bb8551',(x,y,z)=>Math.min(interior(x,y,z),zone(x),trabecula(x,y,z)),[-.55,.18,0]);
   add('Marrow spaces','#ad5e67',(x,y,z)=>Math.min(interior(x,y,z),zone(x),-trabecula(x,y,z)),[-.74,-.40,0]);
   if(long)add('Medullary cavity with marrow','#dfac59',(x,y,z)=>Math.min(interior(x,y,z),x-.55),[.9,.18,0]);
   return {parts,labels,assembly:false,sectionNote:'Magnified representative tissue window. '+(flat?'Spongy diploë lies between compact cranial tables.':long?'The trabecular region meets the marrow cavity of the shaft.':'Compact cortex surrounds a network of trabeculae and marrow spaces.')};
 }
 function mitochondrion(id) {
   const parts=[],labels=[];
   const body=(name,p,r,c,fn,at)=>{parts.push(solid(id,name,p,r,c,fn,at));labels.push({id,detail:id+'::'+name,name,p:at});};
   const p=[0,0,0],r=[1.7,.82,.62],dist=(x,y,z)=>.62*(1-Math.hypot(x/r[0],(y-.10*Math.cos(2*x))/r[1],z/r[2]));
   body('Outer membrane',p,[1.72,.94,.64],'#b55f4c',(x,y,z)=>{const d=dist(x,y,z);return Math.min(d,.052-d);},[-1.66,.01,0]);
   body('Intermembrane space',p,[1.72,.94,.64],'#f3cc8a',(x,y,z)=>{const d=dist(x,y,z);return Math.min(d-.053,.104-d);},[0,.80,0]);
   body('Inner membrane',p,[1.72,.94,.64],'#9b4a36',(x,y,z)=>{const d=dist(x,y,z);return Math.min(d-.105,.151-d);},[0,-.55,0]);
   body('Matrix',p,[1.72,.94,.64],'#eeb98f',(x,y,z)=>dist(x,y,z)-.152,[.47,.11,0]);
   for(let i=0;i<7;i++){const x=-1.1+i*.37,side=i%2?-1:1,h=.82*Math.sqrt(1-(x/1.7)**2)*.78;
     const pts=[[x-.11,side*h+.10*Math.cos(2*x),0],[x-.08,side*.17,0],[x+.02,-side*.20,0],[x+.10,-side*.18,0],[x+.14,side*h+.10*Math.cos(2*x),0]];
     const segments=pts.slice(1).map((q,j)=>{const a=pts[j],dx=q[0]-a[0],dy=q[1]-a[1];return [a,dx,dy,dx*dx+dy*dy];});
     const fold=(xx,yy,zz)=>{
       const bend=xx-.10*zz*zz;let nearest=Infinity;
       for(const [a,dx,dy,len] of segments){const t=Math.max(0,Math.min(1,((bend-a[0])*dx+(yy-a[1])*dy)/len));nearest=Math.min(nearest,Math.hypot(bend-a[0]-dx*t,yy-a[1]-dy*t));}
       return Math.min(.041-nearest,.28-Math.abs(zz),dist(xx,yy,zz)-.102);
     };
     parts.push(solid(id,'Cristae (inner membrane folds)',[x,0,0],[.25,.86,.30],'#98523c',fold,pts[2]));
   }
   labels.push({id,detail:id+'::Cristae (inner membrane folds)',name:'Cristae (inner membrane folds)',p:[.07,-.14,0]});
   return {parts,labels,assembly:false,sectionNote:'Magnified mitochondrion. The folded inner membrane encloses the matrix. Cristae and membrane spacing are enlarged for inspection.'};
 }
 const mitoId='organelle-mitochondrion';
 D.cells.push({id:mitoId,name:'Mitochondrion',region:'Organelles',shape:'mitochondrion',features:['cristae','matrix','outer membrane','inner membrane'],description:'An organelle with an outer membrane and a folded inner membrane.',sourceUrl:'https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells'});
 function cellInside(g){
   // Place catalogued organelles within the exposed half of the schematic cell.
   // The original models use positive depth to draw organelles over the surface.
   const parts=g.parts.map(p=>{
     if(p.color==='membrane')return p;
     const local=v=>[v[0],v[1],v[2]*.12-.025];
     return p.p?{...p,p:local(p.p)}:{...p,pts:p.pts.map(local)};
   });
   const labels=g.labels.map(l=>({...l,p:[l.p[0],l.p[1],-.02]}));
   return {...g,parts,labels,sectionNote:'Cell section showing this entry’s modeled structures. Individual organelles are enlarged for visibility.'};
 }
 // Work in each human organ's local frame so the same tissues stay connected
 // when the organ is viewed alone or inside a larger arrangement.
 function organParts(part){
   if(!part.p||part.id.startsWith('Fauna/')||part.sample)return [part];
   const name=part.id.split('/').at(-1),id=part.id,[a,b,c]=part.r,[cx,cy,cz]=part.p,unit=Math.min(a,b,c);
   const point=(x,y,z=0)=>[cx+x*a,cy+y*b,cz+z*c];
   const make=(label,color,fn,at)=>solid(id,label,part.p,part.r,color,(x,y,z)=>unit*fn((x-cx)/a,(y-cy)/b,(z-cz)/c),point(...at));
   const dist=(x,y,z)=>1-Math.hypot(x,y,z);
   const layer=(label,c,lo,hi,at)=>make(label,c,(x,y,z)=>Math.min(dist(x,y,z)-lo,hi-dist(x,y,z)),at);
   const core=(label,c,lo,at)=>make(label,c,(x,y,z)=>dist(x,y,z)-lo,at);
   const path=(n,coords,r,col)=>tube(id,n,coords.map(p=>point(...p)),r*unit,col);
   const bead=(n,at,r,col)=>oval(id,n,point(...at),r.map((x,i)=>x*part.r[i]),col);
   if(/ lung$/.test(name)){
     const direction=name.startsWith('Right')?-1:1,parts=[core('Lung parenchyma','#d79094',0,[.68,.1,0])];
     const start=[-.85*direction,.24,0],hub=[-.15*direction,.17,0];
     parts.push(path('Main bronchus',[start,hub],.13,'#dfbc84'));
     const branches=name.startsWith('Right')?[.64,.02,-.65]:[.64,-.65];
     for(const h of branches){const end=[.22*direction,h,0];
       parts.push(path('Lobar bronchi',[hub,end],.083,'#e5c28d'));
       for(const q of [-1,1])parts.push(path('Segmental bronchi',[end,[(.22+q*.32)*direction,h*.99+.10,0]],.044,'#edd9af'));
     }return parts;
   }
   if(/adrenal gland$/.test(name))return [layer('Adrenal cortex','#d3a559',0,.36,[.77,0,0]),core('Adrenal medulla','#ac756d',.36,[0,0,0])];
   if(name==='Spleen'){
     const parts=[core('Red pulp','#aa6578',0,[.5,.1,0])];
     for(const [x,y] of [[-.41,.33],[.31,.47],[-.12,-.46],[.45,-.36]])parts.push(bead('White pulp',[x,y,-.02],[.14,.11,.14],'#d9bcac'));
     return parts;
   }
   if(name==='Pancreas'||name==='Pancreatic islet region'){
     const parts=[core('Exocrine tissue','#d8ac79',0,[.44,.25,0]),path('Pancreatic duct',[[-.9,0,0],[-.35,-.06,0],[.35,.10,0],[.87,.02,0]],.085,'#9a6f54')];
     for(const [x,y] of [[-.4,.3],[.17,-.46],[.46,.36],[-.5,-.32]])parts.push(bead('Islets (enlarged)',[x,y,0],[.08,.13,.1],'#bd7185'));
     return parts;
   }
   if(name==='Liver'){
     const parts=[core('Liver parenchyma','#a8655e',0,[.55,.24,0])];
     for(const [label,color,offset] of [['Portal vein branches','#7897ba',-.12],['Intrahepatic bile ducts','#8daa70',.04]]){
       for(const side of [-1,1]){const joint=[side*.35,offset+.05,0];
         parts.push(path(label,[[0,-.70+offset,0],joint,[side*.72,.13+offset,0]],.048,color));
         parts.push(path(label,[joint,[side*.45,.49+offset,0]],.033,color));
       }
     }return parts;
   }
   if(name==='Uterus')return [layer('Myometrium','#b66b79',0,.65,[.68,0,0]),make('Endometrium','#dfaaa9',(x,y,z)=>Math.min(dist(x,y,z)-.38,.1-Math.abs(z),.38+.22*y-Math.abs(x),.64-Math.abs(y)),[.18,.15,0]),make('Uterine cavity','#f4dfcd',(x,y,z)=>Math.min(.48-Math.abs(y),.08+.32*(y+.48)-Math.abs(x),.038-Math.abs(z)),[0,.12,0])];
   if(/ ovary$/.test(name)){
     const parts=[layer('Ovarian cortex','#b682a8',0,.40,[.8,0,0]),core('Ovarian medulla','#cf9c9b',.40,[0,0,0])];
     for(const [x,y,r] of [[.63,.22,.18],[-.62,.13,.12],[.05,-.69,.14]])parts.push(bead('Follicles',[x,y,0],[r,r*1.2,r],'#e3c492'));
     return parts;
   }
   if(name==='Urinary bladder')return [layer('Detrusor muscle','#c98883',0,.16,[.91,0,0]),layer('Mucosa','#e3af9c',.16,.22,[.79,0,0])];
   return [part];
 }
 function stomach(part){
   if(!part.sample||part.detailName!=='Stomach wall'||part.id.startsWith('Fauna/'))return [part];
   const [cx,cy,cz]=part.p,[a,b,c]=part.r,id=part.id;
   const layers=[['Muscular wall','#ba7777',0,.18],['Submucosa','#e6b79c',.18,.25],['Mucosa and rugae','#cf8580',.25,.35]];
   return layers.map(([name,col,lo,hi])=>solid(id,name,part.p,part.r,col,(x,y,z)=>{
     const u=(x-cx)/a,v=(y-cy)/b,w=(z-cz)/c,d=1-Math.hypot(u,v+.11*u*u,w);
     const fold=name==='Mucosa and rugae'?.12*(1+Math.cos(8*Math.atan2(v,w)+3*u))*(1-Math.min(1,u*u)):0;
     return Math.min(a,b,c)*Math.min(d-lo,hi+fold-d);
   },[cx+a*(1-(hi+lo)/2),cy,cz]));
 }
 function interior(s,g) {
   const e=D[s.kind].find(e=>e.id===s.id);
   if(s.id===mitoId||s.interior==='mitochondrion')return mitochondrion(s.id);
   if(s.kind==='bones'||s.kind==='animals'&&e?.category==='Skeleton/body support'&&/femur|humerus|tibia|vertebra|skull|radius|ulna|bone/i.test(e.name)){
     const selected=D.bones.find(b=>b.id===(s.selected||s.id));
     if(s.interior!=='tissue'&&selected&&['femur','humerus','tibia','radius','ulna','fibula'].includes(selected.shape))return longBoneSection(selected);
     return boneWindow(selected?.id||e?.id||g.labels[0].id,
       /^(femur|humerus|tibia|ulna|radius|fibula|metacarpal|metatarsal|phalanx|toe)$/.test(selected?.shape)||/femur|humerus|tibia|radius|ulna/i.test(e?.name||''),['frontal','parietal','occipital'].includes(selected?.shape));
   }
   if(s.kind==='cells'||s.kind==='animals'&&e?.category==='Cells')return cellInside(g);
   const parts=s.kind==='systems'?g.parts.flatMap(p=>p.detailName==='Stomach wall'?stomach(p):organParts(p)):g.parts;
   const materials=FTEPro.atlasVolume.materials(parts);
   const labels=materials.filter(m=>!s.selected||m.id===s.selected).map(m=>({id:m.id,detail:m.key,name:m.name,p:m.p}));
   return {...g,parts,labels:labels.length?labels:g.labels,sectionNote:'Section through the modeled structures. Named tissues are shown where the catalog supplies internal anatomy.'};
 }
 const descriptions={
   'Compact bone (cortex)':'The dense outer layer surrounds the less dense interior.',
   'Trabeculae (spongy bone)':'These interconnected bony struts separate the marrow spaces.',
   'Marrow spaces':'Marrow occupies the spaces between trabeculae.',
   'Medullary cavity with marrow':'This cavity runs through the shaft of a long bone.',
   'Diploë (spongy bone)':'The spongy layer lies between the two compact tables of a flat cranial bone.',
   'Compact outer and inner tables':'The compact surfaces enclose the diploë of the cranial vault.',
   'Outer membrane':'This membrane forms the outer boundary of the mitochondrion.',
   'Inner membrane':'The inner membrane separates the matrix from the intermembrane space.',
   'Intermembrane space':'This narrow space lies between the outer and inner membranes.',
   'Cristae (inner membrane folds)':'Folds of the inner membrane increase the area available for energy conversion.',
   'Matrix':'The matrix is the compartment enclosed by the inner membrane.',
   'Renal cortex':'This outer kidney region contains renal corpuscles and parts of the nephron tubules.',
   'Muscular wall':'Smooth muscle mixes the stomach contents.',
   'Mucosa and rugae':'Folds of the stomach lining flatten as the stomach expands.',
   'Lobar bronchi':'Each of these airways distributes air to a lobe of the lung.',
   'Nucleus':'The nucleus houses most of the DNA in this cell.',
   'Golgi apparatus':'These membranes modify and sort products for transport.'
 };
 FTEPro.anatomy={descriptions,assemblies,members,assembly,interior,mitochondrion,mitoId};
})();
