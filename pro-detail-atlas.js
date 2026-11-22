// Procedural microanatomy and comparative anatomy. Local dimensions follow the
// parent specimen. Repeated units illustrate a representative field, not a count.
'use strict';
(()=>{
 const P=FTEPro,D=P.medicalData;
 const tau=Math.PI*2;
 const part=(p,name)=>({...p,detail:p.id+'::'+name,detailName:name});
 const oval=(p,name,c,r,color)=>({...part({id:p.id},name),kind:'ell',p:c,r,color});
 const tube=(p,name,pts,r,color)=>({...part({id:p.id},name),kind:'path',pts,r,color});
 const local=(p,u,v,w)=>p.p.map((x,i)=>x+p.r[i]*[u,v,w][i]);
 function implicit(p,name,color,field,at){
   const r=Math.min(...p.r);
   return {...oval(p,name,p.p,p.r,color),anchor:local(p,...at),sample:(x,y,z)=>r*field((x-p.p[0])/p.r[0],(y-p.p[1])/p.r[1],(z-p.p[2])/p.r[2])};
 }
 function mitochondria(p){
   const m=P.anatomy.mitochondrion(p.id),scale=p.r.map((r,i)=>r/[1.7,.94,.64][i]),origin=p.p;
   const point=q=>q.map((v,i)=>origin[i]+v*scale[i]);
   return m.parts.map(q=>{const fn=q.sample;
     const result={...q,p:point(q.p),r:q.r.map((v,i)=>v*scale[i]),anchor:point(q.anchor||q.p),detail:p.id+'::mito/'+q.detailName,detailName:'Mitochondrion · '+q.detailName,
       sample:(x,y,z)=>Math.min(...scale)*fn((x-origin[0])/scale[0],(y-origin[1])/scale[1],(z-origin[2])/scale[2])};return result;
   });
 }
 function cellEnvelope(p,e){
   const bounds=P.atlasVolume.bounds(p),c=p.p||bounds[0].map((v,i)=>(v+bounds[1][i])/2);
   const r=p.p?p.r:bounds[0].map((v,i)=>Math.max(.01,(bounds[1][i]-v)/2));
   const plate=p.kind==='plate',power=plate?3.5:2,m={id:p.id,p:c,r};
   const f=(x,y,z)=>{
     const angle=Math.atan2(y,x),w=.045*Math.sin(5*angle+.37)+.028*Math.cos(3*angle-1.1)+.015*Math.sin(9*angle);
     const bow=.075*(1-y*y)*(1-z*z),u=(x-bow)/(1+w),v=y/(1+.7*w);
     return 1-(Math.abs(u)**power+Math.abs(v)**power+Math.abs(z)**(plate?2.65:2))**(1/power);
   };
   const membrane=implicit(m,'Cell membrane','#68a8aa',(x,y,z)=>{const d=f(x,y,z);return Math.min(d,.045-d);},[.95,0,0]);
   const cyto=implicit(m,'Cytoplasm','#b8d7d1',(x,y,z)=>f(x,y,z)-.043,[.51,.38,0]);
   const out=[membrane,cyto];
   const has=n=>e?.features?.includes(n);
   if(has('keratin')||has('filaments')){
     // Representative bundles connect the perinuclear region to the cortex.
     for(let i=0;i<9;i++){const a=i*2.39,pts=Array.from({length:14},(_,j)=>{const t=j/13,k=a+.24*Math.sin(t*3+i);return local(m,(.33+.55*t)*Math.cos(k),(.38+.48*t)*Math.sin(k),-.03+.035*Math.sin(t*5));});
       out.push(tube(p,has('keratin')?'Keratin filament bundles':'Cytoskeletal filaments',pts,Math.min(...r)*.014,'#839ca1'));}
   }
   if(has('rough-er')||has('ribosomes')){
     for(let j=0;j<4;j++){
       const pts=Array.from({length:21},(_,i)=>{const a=.45+i*.091;return local(m,(.48+j*.065)*Math.cos(a),(.51+j*.065)*Math.sin(a),-.03+.04*Math.cos(2*a));});
       out.push(tube(p,'Rough endoplasmic reticulum',pts,Math.min(...r)*.03,'#8798bb'));
       for(let k=1;k<19;k+=3){const at=pts[k].slice();at[2]+=.013;out.push(oval(p,'Attached ribosomes',at,r.map(v=>v*.021),'#6b628d'));}
     }
   }
   return out;
 }
 function cellPart(p,e) {
   if(p.detailName==='Cell membrane'&&(p.p||p.kind==='plate')&&!p.sample&&!['pyramid','sperm'].includes(e?.shape))return cellEnvelope(p,e);
   if(p.detailName==='Cristae'&&p.kind==='path')return [];
   if(p.p&&(p.detailName==='Mitochondrion'||p.color==='mito'&&e?.family==='Freshwater fish ionocyte'))return mitochondria(p);
   if(p.detailName==='Golgi apparatus'&&p.pts){
     const c=p.pts[Math.floor(p.pts.length/2)],out=[];
     for(let j=0;j<5;j++){
       const pts=Array.from({length:21},(_,i)=>{const t=i/20;return [c[0]+.57*(t-.5),c[1]+(j-2)*.049-.16*(2*t-1)**2,c[2]+.03*Math.cos(t*Math.PI)];});
       out.push(tube(p,'Golgi cisternae',pts,.023,'#ad8c63'));
     }
     for(let j=0;j<5;j++)out.push(oval(p,'Transport vesicles',[c[0]+.30+.07*Math.cos(j),c[1]+(j-2)*.06,c[2]+.04*Math.sin(j)],[.032,.032,.032],'#c4a67f'));
     return out;
   }
   if(p.detailName==='Nucleus'&&p.p&&!p.sample&&!['sperm','rbc','platelet'].includes(e?.shape)){
     const nucleus=part(p,'Nucleoplasm'),at=local(p,-.23,.17,-.13);
     return [nucleus,implicit(p,'Nuclear envelope','#806d94',(x,y,z)=>{const d=1-Math.hypot(x,y,z);return Math.min(d,.065-d);},[.93,0,0]),oval(p,'Nucleolus',at,p.r.map(v=>v*.25),'#705484')];
   }
   if(p.detailName==='Cell membrane'&&p.kind==='plate'){
     const b=P.atlasVolume.bounds(p),c=b[0].map((v,i)=>(v+b[1][i])/2),r=b[0].map((v,i)=>Math.max(.02,(b[1][i]-v)/2)),body={...p,p:c,r};
     const polygon=p.pts;
     function sdf(x,y,z){
       const X=c[0]+x*r[0],Y=c[1]+y*r[1],Z=Math.abs(z);
       let d=Infinity,inside=false;
       for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
         const a=polygon[j],b=polygon[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.min(1,Math.max(0,((X-a[0])*dx+(Y-a[1])*dy)/(dx*dx+dy*dy||1)));
         d=Math.min(d,Math.hypot(X-a[0]-dx*t,Y-a[1]-dy*t));
         if((a[1]>Y)!==(b[1]>Y)&&X<(b[0]-a[0])*(Y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
       }
       const rim=(inside?d:-d)/Math.min(r[0],r[1]);
       return Math.min(rim,1-Z-.14*(1-Math.min(1,rim/.22))**2);
     }
     return [implicit(body,'Cell membrane',p.color,sdf,[.82,0,0])];
   }
   return [p];
 }
 function invertebratePart(p,e){
   const name=e.name,col=p.color||'base';
   if(e.group==='arthropod'&&p.p){
     const wing=/elytron/i.test(name),crab=e.species==='Crab',spider=e.species==='Spider';
     const f=(x,y,z)=>{const taper=wing?1-.17*x:crab?1-.11*x*x:1;
       const outer=1-Math.hypot(x,(y+.08*(x*x-.3))/taper,z/taper);
       return outer-(wing?.026*(.5+.5*Math.cos(28*y+3*x))**5:0);
     };
     const shell=implicit(p,wing?'Ridged wing case':name+' cuticle',col,(x,y,z)=>{const d=f(x,y,z);return Math.min(d,.16-d);},[0,.84,0]);
     if(!crab||name!=='Carapace')return [shell];
     const extra=[shell];for(const k of [-1,1])for(let i=0;i<5;i++){const u=-.62+i*.22,v=k*Math.sqrt(1-u*u);extra.push(tube(p,'Anterolateral teeth',[local(p,u,v*.92,0),local(p,u-.07,v*1.07,.05)],Math.min(...p.r)*.06,col));}
     return extra;
   }
   if(e.group==='arthropod'&&p.pts&&p.pts.length===3){
     const [a,b,c]=p.pts,m=a.map((x,i)=>x+(b[i]-x)*.5),m2=b.map((x,i)=>x+(c[i]-x)*.58);
     return [tube(p,'Proximal leg segments',[a,m,b],p.r,col),tube(p,'Distal leg segments',[b,m2,c],p.r*.74,col),oval(p,'Articulation',b,[p.r*1.17,p.r*1.1,p.r*1.1],col)];
   }
   if(name==='Coiled shell'&&p.pts){
     const pts=p.pts,r=p.r||.16,out=[];
     for(let i=1;i<pts.length;i++){const t=i/(pts.length-1),rad=.035+.22*t**1.8;
       out.push(tube(p,'Expanding shell whorl',[pts[i-1],pts[i]],rad,col));
     }
     const tip=pts.at(-1),pre=pts.at(-2),dx=tip[0]-pre[0],dy=tip[1]-pre[1],len=Math.hypot(dx,dy)||1,ring=Array.from({length:49},(_,i)=>{const a=i*tau/48;return [tip[0]-dy/len*.25*Math.cos(a),tip[1]+dx/len*.25*Math.cos(a),tip[2]+.23*Math.sin(a)];});
     out.push(tube(p,'Aperture lip',ring,.024,col));return out;
   }
   if(name==='Bell mesoglea'&&p.pts){
     if(e.parts[0]!==p)return [];
     const m={id:p.id,p:[0,.39,0],r:[1.40,.44,1.40]};
     return [implicit(m,'Bell mesoglea','#9ac2ca',(x,y,z)=>{const radial=Math.hypot(x,z),scallop=.018*Math.cos(16*Math.atan2(z,x))*Math.max(0,radial-.65);
       const h=1.78*Math.sqrt(Math.max(0,1-radial*radial))-.90;
       return Math.min(1-radial-scallop,h-y,y-h+.15+.17*(1-radial));},[0,.84,0])];
   }
   if(e.species==='Octopus'&&/hydrostat/i.test(name)&&p.pts){
     const out=[p];for(let i=1;i<p.pts.length;i++){const c=p.pts[i],b=p.pts[i-1],dx=c[0]-b[0],dy=c[1]-b[1],len=Math.hypot(dx,dy)||1,rad=p.r*.40;
       for(const k of [-1,1]){const center=[c[0]-dy/len*k*rad,c[1]+dx/len*k*rad,c[2]+p.r*.77];
         const ring=Array.from({length:17},(_,j)=>[center[0]+rad*Math.cos(j*tau/16),center[1]+rad*Math.sin(j*tau/16),center[2]+rad*.12*Math.sin(j*tau/16)]);
         out.push(tube(p,'Sucker rim',ring,rad*.23,'#ac9283'));}}
     return out;
   }
   return null;
 }
 function skeletonPart(p,e){
   if(e){const model=invertebratePart(p,e);if(model)return model;}
   if(e?.name==='Vertebral column'&&p.p&&e.species!=='Shark'){
     const c=p.p,r=p.r,pts=f=>f.map(a=>local(p,...a)),out=[implicit(p,'Vertebral centrum',p.color,(x,y,z)=>1-Math.hypot(x*.91,y*1.15,z*1.1)-.11*Math.exp(-4*x*x),[0,-.64,0])];
     // Neural arch around a real opening, not a filled disc.
     out.push(tube(p,'Neural arch',pts([[0,.0,-.72],[0,.82,-.91],[.08,1.45,-.44],[.08,1.55,.44],[0,.82,.91],[0,0,.72]]),r[2]*.22,'base'));
     out.push(tube(p,'Neural spine',pts([[.08,1.49,0],[.30,2.15,0]]),r[2]*.25,'base'));
     for(const k of [-1,1])out.push(tube(p,'Lateral process',pts([[.0,.15,k*.48],[.12,.50,k*1.48]]),r[2]*.20,'base'));
     const index=e.parts.indexOf(p);
     if(index>=0)for(const q of out){q.detail+='/'+index;q.detailName+=' · sample '+(index+1);}
     return out;
   }
   if(e?.name==='Carapace'&&p.p){
     return [implicit(p,'Domed carapace','#b89a6e',(x,y,z)=>{
       const f=Math.hypot(x,z);if(f>1)return 1-f;
       const a=Math.atan2(z,x),h=Math.sqrt(Math.max(0,1-f*f)),seam=.035*Math.exp(-Math.min((Math.sin(a*6)*5)**2,((f-.65)*18)**2));
       return Math.min(1-f,h-y-seam,y-h+.16);
     },[0,.96,0])];
   }
   if(e?.name==='Skull'&&p.sample&&p.p){
     const bird=e.group==='bird',mammal=e.group==='mammal';
     if(!bird&&!mammal)return [p];
     const out=[p];for(const k of [-1,1]){
       const pts=Array.from({length:26},(_,i)=>{const ang=-.65+i*3.93/25;return local(p,-.30+.54*Math.cos(ang),.02+.59*Math.sin(ang),k*.81);});
       out.push(tube(p,bird?'Orbital rim':'Zygomatic arch',pts,Math.min(...p.r)*(bird?.090:.115),'base'));
     }
     return out;
   }
   return [p];
 }
 function animalOrgans(p,name,species){
   const unit=Math.min(...p.r),quad=(n,coords,r,color)=>tube(p,n,coords.map(c=>local(p,...c)),unit*r,color);
   const shell=(n,col,thickness,form)=>implicit(p,n,col,(x,y,z)=>{const d=form(x,y,z);return Math.min(d,thickness-d);},[.76,.12,0]);
   const round=(x,y,z)=>1-Math.hypot(x,y,z);
   if(/^(Right |Left )?(atrium|ventricle)$/i.test(name)){
     const thick=/atrium/i.test(name)?.09:/left ventricle/i.test(name)?.23:.15;
     const shape=(x,y,z)=>1-Math.hypot(x+.13*y,y,z)*(1+.12*Math.max(0,-y));
     return [shell(name+' wall',p.color,thick,shape)];
   }
   if(name==='Reticulorumen'){
     const retic=p.r[0]<.3,n=retic?'Reticulum wall':'Rumen wall',wall=shell(n,'#b78b75',.12,round);
     const lining=implicit(p,retic?'Reticular crests':'Ruminal papillae','#d2a187',(x,y,z)=>{
       const theta=Math.atan2(z,x),h=Math.asin(Math.min(1,Math.max(-1,y))),d=round(x,y,z);
       const relief=retic?1-Math.min(1,Math.abs(Math.sin(10*theta+5*h)*Math.sin(9*h))*4):Math.max(0,Math.cos(24*theta)*Math.cos(20*h))**3;
       return Math.min(d-.09,.13+.15*relief-d);
     },[.83,.02,0]);return [wall,lining];
   }
   if(name==='Book lung'||name==='Book lung lamella'){
     const out=[];for(let j=0;j<13;j++)out.push(oval(p,'Book lung lamellae',local(p,0,(j-6)/7,0),[p.r[0]*(.82-.25*Math.abs(j-6)/6),p.r[1]*.032,p.r[2]*.84],'#bc9493'));
     return out;
   }
   if(name==='Gastric mill'){
     const out=[shell('Gastric chamber wall','#b98b77',.10,round)];for(const k of [-1,0,1])out.push(quad(k?'Lateral tooth':'Median tooth',[[k*.68,.48,-.1],[k*.39,.18,0],[k*.2,-.12,.12]],.12,'#b89e80'));return out;
   }
   if(name==='Radula'){
     const out=[oval(p,'Radular ribbon',p.p,[p.r[0],p.r[1]*.32,p.r[2]],'#ba9979')];
     for(let i=-3;i<=3;i++)for(const j of [-1,0,1])out.push(quad('Radular teeth',[[i/4,.20,j*.48],[i/4-.11,.54,j*.48]],.048,'#d0b48f'));
     return out;
   }
   if(name==='Spiracle')return [implicit(p,'Spiracular rim','#b69c76',(x,y,z)=>Math.min(round(x,y,z),Math.hypot(x*1.3,y)-.48),[.75,.02,0])];
   if(/^(Left |Right )?lung$/i.test(name)&&['Dog','Cat','Horse','Cow','Rabbit','Bat','Dolphin','Snake','Frog','Salamander'].includes(species)){
     const out=[implicit(p,'Lung surface',p.color,(x,y,z)=>1-Math.hypot(x+.12*y*y,y,z)-.11*Math.max(0,-y)*x*x,[.70,.1,0])];
     if(!['Snake','Frog','Salamander'].includes(species)){
       for(const k of [-1,1]){out.push(quad('Intrapulmonary bronchi',[[-.76,.2,0],[-.24,.08,0],[.20,k*.44,0],[.64,k*.30,0]],.070,'#caa574'));
         out.push(quad('Bronchial branches',[[.20,k*.44,0],[.31,k*.66,.12]],.035,'#d4b98f'));}
     }
     return out;
   }
   return null;
 }
 function faunaPart(p){
   if(!p.p||p.sample)return [p];const name=p.id.split('/').at(-1),species=p.id.split('/')[1];
   const more=animalOrgans(p,name,species);if(more)return more;
   if(name==='Omasum'){
     const wall=implicit(p,'Omasal wall','#bd8d77',(x,y,z)=>{const d=1-Math.hypot(x,y,z);return Math.min(d,.11-d);},[.91,0,0]);
     const leaves=implicit(p,'Omasal laminae','#d5aa89',(x,y,z)=>Math.min(.90-Math.hypot(x,y,z),.08-Math.abs(Math.sin(15*Math.atan2(y,x)+.55*z)),Math.hypot(x,y)-.16),[.57,.1,0]);return [wall,leaves];
   }
   if(name==='Gill filament'||name==='Secondary lamella'){
     const out=[tube(p,'Gill filament axis',[local(p,-.95,0,0),local(p,.95,0,0)],p.r[1]*.16,'#bf7777')];
     for(let j=0;j<17;j++){const f=(j-8)/9;out.push(oval(p,'Secondary lamellae',local(p,f,0,0),[p.r[0]*.023,p.r[1]*(.48+.30*(1-f*f)),p.r[2]*.70],'#d19a91'));}
     return out;
   }
   if(name==='Kidney'&&['Dog','Cat','Rabbit','Horse','Cow','Dolphin'].includes(species)){
     const lobed=species==='Cow'||species==='Dolphin';
     const d=(x,y,z)=>1-Math.hypot(x,y+.23*x*x,z)-.13*Math.exp(-8*x*x-12*(y+.75)**2)-(lobed?.04*(1+Math.cos(14*x)*Math.cos(9*z)):0);
     return [implicit(p,'Renal cortex','#a96967',(x,y,z)=>Math.min(d(x,y,z),.20-d(x,y,z)),[.74,.26,0]),implicit(p,'Renal medulla','#d19886',(x,y,z)=>d(x,y,z)-.19,[0,0,0])];
   }
   if(/cerebral hemisphere|olfactory bulb|optic lobe|optic tectum/i.test(name)){
     // Cortex folding here is restricted to gyrencephalic mammalian cerebra.
     const folded=/hemisphere/i.test(name)&&['Dog','Cat','Horse','Cow','Dolphin'].includes(species);
     const f=(x,y,z)=>1-Math.hypot(x,y,z)-(folded?.07*Math.exp(-11*Math.sin(6*x+1.1*Math.sin(3*z)+2*y)**2):0);
     return [implicit(p,name,p.color,f,[.32,.66,0])];
   }
   return [p];
 }
 function enrich(g,s){
   if(g.sectionNote?.startsWith('Magnified representative tissue window')||s.id===P.anatomy.mitoId||s.interior==='mitochondrion'||s.kind==='bones')return g;
   const e=D[s.kind].find(e=>e.id===s.id),cells=s.kind==='cells'||e?.category==='Cells';const added=[];
   const parts=g.parts.flatMap(p=>{
     const row=s.kind==='animals'?D.animals.find(e=>e.id===p.id):null;
     const next=cells?cellPart(p,e):row?skeletonPart(p,row):p.id.startsWith('Fauna/')?faunaPart(p):[p];
     if(next.length!==1||next[0]!==p)for(const q of next)if(q.detail)added.push(q);
     return next;
   });
   const labels=g.labels.slice(),seen=new Set(labels.map(l=>l.detail||l.id+'::'+l.name));
   for(const q of added){if(seen.has(q.detail))continue;seen.add(q.detail);labels.push({name:q.detailName,id:q.id,detail:q.detail,p:q.anchor||q.p||q.pts[Math.floor(q.pts.length/2)]});}
   return {...g,parts,labels};
 }
 P.detailAtlas=enrich;
})();
