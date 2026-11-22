// Original procedural tissue models. Distances are normalized educational proportions.
'use strict';
(()=>{
const P=FTEPro,D=P.medicalData;
const ell=(x,y,z,a,b,c)=>Math.min(a,b,c)*(1-Math.sqrt((x/a)**2+(y/b)**2+(z/c)**2));
const soft=(a,b,r)=>Math.max(a,b)+Math.max(0,r-Math.abs(a-b))**2/(4*r);
function body(id,name,p,r,color,sample,anchor=p){
 return {id,detail:id+'::'+name,detailName:name,p,r,color,sample,anchor};
}
function path(id,name,pts,r,color){return {id,detail:id+'::'+name,detailName:name,pts,r,color,kind:'path'};}
function femur(id,sign){
 const p=[0,0,0],r=[.8,2.6,.55];
 function outer(x,y,z){
  x*=sign;const t=Math.min(1,Math.abs(y)/2.1),w=.19+.12*t**3+.16*Math.max(0,-y/2.1)**6;
  const shaft=Math.min(2.08-Math.abs(y),w-Math.hypot(x-.08*Math.sin(y*1.05),z-.075*(1-t*t)));
  const head=ell(x+.45,y-2.16,z,.31,.33,.31),neck=ell((x+.19)*.8+(y-1.91)*-.6,(x+.19)*.6+(y-1.91)*.8,z,.19,.55,.2);
  let f=soft(shaft,soft(head,neck,.12),.12);f=soft(f,ell(x-.18,y-1.90,z,.22,.30,.24),.09);
  for(const side of [-1,1])f=soft(f,ell(x-side*.22,y+2.04,z+.05,.24,.31,.33),.05);
  return f;
 }
 const cortex=body(id,'Compact bone',p,r,'#dfcba7',(x,y,z)=>{const d=outer(x,y,z);return Math.min(d,.083-d);},[.2,0,0]);
 const lattice=body(id,'Spongy bone',p,r,'#ba875b',(x,y,z)=>{const density=Math.cos(25*x+8*y)*Math.sin(22*z)+Math.cos(21*z-4*y)*Math.sin(18*y)+Math.cos(18*y)*Math.sin(25*x);return Math.min(outer(x,y,z)-.075,Math.abs(y)-1.32,(.69-Math.abs(density))*.06);},[.1,-1.9,.03]);
 return [cortex,lattice];
}
function kidney(p){
 const id=p.id,[cx,cy,cz]=p.p,side=Math.sign(cx)||1,[a,b,c]=p.r;
 const point=(x,y,z=0)=>[cx+x*a*side,cy+y*b,cz+z*c];
 const shape=(x,y,z)=>{const outer=1-Math.sqrt((x-.03*y*y)**2+y*y+z*z);const hilum=Math.hypot((x+1.03)/.51,y/.34,z/.8)-1;return Math.min(outer,.38*hilum);};
 const make=(name,color,fn,at)=>body(id,name,p.p,[a*1.55,b*1.1,c*1.1],color,(x,y,z)=>a*fn((x-cx)/a*side,(y-cy)/b,(z-cz)/c),point(...at));
 const parts=[make('Renal cortex','#ad5455',(x,y,z)=>{const f=shape(x,y,z);return Math.min(f,.19-f);},[.8,.2,.1])];
 for(let i=0;i<7;i++){const angle=(-1.71+i*3.42/6),dx=Math.cos(angle),dy=Math.sin(angle),base=[.82*dx-.04,.81*dy],tip=[.37*dx-.22,.51*dy],vx=base[0]-tip[0],vy=base[1]-tip[1],l=vx*vx+vy*vy;
 parts.push(make('Medullary pyramid '+(i+1),'#ca7d72',(x,y,z)=>{const t=((x-tip[0])*vx+(y-tip[1])*vy)/l;return Math.min(t,1-t,.035+.115*t-Math.hypot(x-tip[0]-t*vx,y-tip[1]-t*vy,z*.67),shape(x,y,z)-.13);},base));
 parts.push(path(id,'Calyces',[point(...tip),point(-.28,.81*tip[1]),point(-.47,.36*tip[1]),point(-.52,0)],a*.073,'#e8c48a'));}
 parts.push(path(id,'Renal pelvis and proximal ureter',[point(-.32,.05),point(-.53,0),point(-.77,-.10),point(-.85,-.38),point(-.86,-1.03)],a*.12,'#dfb15e'));return parts;
}
function erythrocyte(id){
 return [body(id,'Biconcave disc',[0,0,0],[1.1,1.1,.34],'#bf454b',(x,y,z)=>{const u=x*x+y*y;if(u>=1)return -Math.hypot(Math.sqrt(u)-1,z);const h=Math.sqrt(1-u)*(.095+.56*u-.22*u*u);return h-Math.abs(z);},[.66,0,.22])];
}
function heart(p){
 const [x,y,z]=p.p,id=p.id,atrial=id.endsWith('atrium'),left=id.includes('Left'),r=atrial?[.33,.28,.31]:[.32,.43,.32],thick=atrial?.045:left?.10:.06;
 const shell=body(id,atrial?'Atrial wall':'Ventricular wall',p.p,r,left?'#b96864':'#a37c90',(a,b,c)=>{const yy=b-y,tilt=atrial?0:yy*.28,d=ell(a-x+tilt,yy,c-z,...r);const inlet=(atrial?yy<-.08:yy>.16)?Math.hypot(a-x+.04,c-z)-.115:1;
 return Math.min(d,thick-d,inlet);},[x+r[0]*.86,y,z]);
 if(atrial)return [shell];
 const valve=left?'Mitral valve':'Tricuspid valve',count=left?2:3,parts=[shell];
 for(let i=0;i<count;i++){const angle=i*2*Math.PI/count,dx=Math.cos(angle)*.10,dz=Math.sin(angle)*.10;
 parts.push(path(id,valve,[[x+dx*1.6,y+.28,z+dz*1.6],[x+dx*.65,y+.17,z+dz*.65]],.037,'#e4c9a3'));}
 const outName=left?'Aortic valve':'Pulmonary valve',outX=left?.30:-.15,outY=4.69;
 for(let i=0;i<3;i++){const a=i*2*Math.PI/3;parts.push(path(id,outName,Array.from({length:9},(_,j)=>{const t=a+j*Math.PI/12;return [outX+.074*Math.cos(t),outY+.023*Math.sin(j*Math.PI/8),.3+.074*Math.sin(t)];}),.013,'#e7bf95'));}
 if(left)parts.push(body(id,'Interventricular septum',[x-.26,y,z],[.075,.39,.20],'#b76865',(a,b,c)=>ell(a-x+.26+(b-y)*.21,b-y,c-z,.07,.38,.19),[x-.26,y,z]));
 return parts;
}
function greatVessel(part){
 const name=part.id.split('/').pop(),paths={
 'Venae cavae':[[-.58,6.40,-.04],[-.55,5.44,.09],[-.48,5.13,.19],[-.39,4.97,.30],[-.55,4.81,.11],[-.63,4.57,-.09],[-.60,3.50,-.20],[-.38,.2,-.23]],
 'Pulmonary trunk and right artery':[[-.15,4.68,.36],[-.11,4.85,.53],[.03,5.13,.50],[.10,5.27,.27],[-.18,5.30,.05],[-.88,5.05,0]],
 'Left pulmonary artery':[[.10,5.27,.27],[.42,5.24,.13],[.84,5.06,0]],
 'Aorta':[[.30,4.69,.26],[.21,4.87,.32],[.17,5.20,.33],[.20,5.40,.22],[.33,5.52,.10],[.47,5.53,-.04],[.54,5.42,-.22],[.51,5.17,-.36],[.46,4.30,-.43],[.24,3,-.40],[.17,.40,-.40]]};
 if(!paths[name])return part;return {...part,pts:paths[name],r:name==='Aorta'?.105:name==='Pulmonary trunk and right artery'?.103:name==='Venae cavae'?.112:.083};
}
function bird(p){
 const id=p.id,name=id.split('/').pop(),a=id.includes('Penguin')?.86:id.includes('Eagle')?1.13:1,parts=[];
 for(const side of [-1,1]){const z=side*.32;
 if(name==='Posterior air sac'||name==='Anterior air sac'){
 const rear=name.startsWith('Posterior'),x=rear?.60:-.57,y=rear?.05:.22;
 parts.push(body(id,name,[x,y,z],[a*.49,.26,.20],'#8bb8c7',(xx,yy,zz)=>{const d=ell(xx-x,yy-y+(xx-x)*.13,zz-z,.47*a,.24,.19);return Math.min(d,.037-d);}));
 parts.push(path(id,name,[[x,y,z],[-.1,.34,z]],.052,'#83a9b2'));
 }else if(name==='Parabronchial lung'){
 parts.push(body(id,'Parabronchial lung',[-.08,.40,z],[.42,.20,.17],'#b77475',(x,y,zz)=>ell(x+.08,y-.4,zz-z,.41,.16,.15)));
 for(let i=0;i<6;i++)parts.push(path(id,'Parabronchi',[[-.32,.31,z+(i-2.5)*.04],[.03,.46,z+(i-2.5)*.04],[.22,.43,z+(i-2.5)*.04]],.016,'#e5b6a5'));
 }else if(name==='Primary bronchus')parts.push(path(id,name,[[-1,.24,0],[-.63,.22,z],[-.1,.26,z],[.56,.12,z]],.055,'#bd997c'));
 }return parts;
}
function cerebrum(p){
 const [cx,cy,cz]=p.p,[a,b,c]=p.r,id=p.id;
 function surface(x,y,z){const qx=(x-cx)/a,qy=(y-cy)/b,qz=(z-cz)/c;
 const fissure=Math.exp(-15*Math.sin(7*qz+1.8*Math.sin(qy*3)+qx*1.2)**2);
 const fold=.047*fissure+.021*Math.cos(9*qy+3*qz)*Math.sin(7*qx);
 return (1-Math.hypot(qx,qy,qz))*Math.min(a,b,c)-fold;}
 return [body(id,'Cortical ribbon',p.p,p.r,p.color,(x,y,z)=>{const d=surface(x,y,z);return Math.min(d,.065-d);}),body(id,'Subcortical white matter',p.p,p.r,'#e8d7bd',(x,y,z)=>surface(x,y,z)-.06)];
}
// Hollow vessels and viscera retain actual empty space anywhere along the section.
function hollowPath(p,name){
 const outer={...p,detail:p.id+'::'+name,detailName:name},innerRadius=p.r*.58;
 const inner=p.pts.slice(1).map((b,i)=>{const a=p.pts[i],v=b.map((x,j)=>x-a[j]),length=v.reduce((s,x)=>s+x*x,0)||1;
 const lo=a.map((x,j)=>Math.min(x,b[j])-innerRadius),hi=a.map((x,j)=>Math.max(x,b[j])+innerRadius);
 return {...outer,carve:true,bounds:[lo,hi],sample:(x,y,z)=>{x-=a[0];y-=a[1];z-=a[2];const t=Math.max(0,Math.min(1,(x*v[0]+y*v[1]+z*v[2])/length));return innerRadius-Math.hypot(x-v[0]*t,y-v[1]*t,z-v[2]*t);}};});
 return [outer,...inner];
}
function organWall(p,name){
 const [cx,cy,cz]=p.p,[a,b,c]=p.r,k=name==='Gizzard'?.37:.15;
 return [body(p.id,name+' wall',p.p,p.r,p.color,(x,y,z)=>{const u=(x-cx)/a,v=(y-cy)/b,w=(z-cz)/c,angle=Math.atan2(v,w);
 const d=1-Math.sqrt(u*u+(v+.16*u*u)**2+w*w);const folds=k+.055*Math.cos(8*angle+3*u)*Math.max(0,1-u*u);
 return Math.min(a,b,c)*Math.min(d,folds-d);},[cx,cy+b*.8,cz])];
}
// Build regional support tissue in the existing species' local joint frame.
function limbBone(p){
 const a=p.pts[0],b=p.pts.at(-1),u=b.map((x,i)=>x-a[i]),len=Math.hypot(...u);if(len<.001)return [p];u.forEach((x,i)=>u[i]=x/len);
 const lateral=Math.abs(u[2])<.8?[0,0,1]:[1,0,0],t=lateral.reduce((v,x,i)=>v+x*u[i],0),vx=lateral.map((v,i)=>v-u[i]*t),mag=Math.hypot(...vx);vx.forEach((v,i)=>vx[i]=v/mag);
 const vy=[u[1]*vx[2]-u[2]*vx[1],u[2]*vx[0]-u[0]*vx[2],u[0]*vx[1]-u[1]*vx[0]],r=Math.min(p.r,len*.15),center=a.map((x,i)=>(x+b[i])/2),reach=u.map((v,i)=>Math.abs(v)*len/2+2.4*r),bound=[center.map((v,i)=>v-reach[i]),center.map((v,i)=>v+reach[i])];
 const id=p.id,isFemur=/femur/.test(id),bird=/^(chicken|eagle|penguin)\//.test(id),sign=id.includes('/right-')?-1:1;
 function surface(x,y,z){x-=a[0];y-=a[1];z-=a[2];const along=(x*u[0]+y*u[1]+z*u[2])/len,w=(x*vx[0]+y*vx[1]+z*vx[2])*sign,h=x*vy[0]+y*vy[1]+z*vy[2],f=Math.max(0,Math.min(1,along));
 const width=r*(.65+.68*(2*f-1)**4),bow=r*.35*Math.sin(Math.PI*f);
 const shaft=Math.min(along*len,(1-along)*len,width-Math.hypot(w-bow,h*.87));
 const head=ell(w+(isFemur?.9:.45)*r,along*len,h,1.18*r,1.08*r,1.08*r);
 const tubercle=ell(w-.82*r,(along-.065)*len,h,.72*r,1.08*r,.74*r);
 const condyles=Math.max(ell(w-.76*r,(along-1)*len,h+.2*r,.86*r,1.12*r,.90*r),ell(w+.73*r,(along-.99)*len,h+.18*r,.89*r,1.06*r,.86*r));
 return soft(soft(shaft,soft(head,tubercle,.3*r),.38*r),condyles,.24*r);}
 const make=(name,color,sample)=>({...p,bounds:bound,detail:id+'::'+name,detailName:name,anchor:center,color,sample});
 return [make('Cortical shell','#d5bf9f',(x,y,z)=>{const d=surface(x,y,z);return Math.min(d,r*(bird?.25:.33)-d);}),make('Epiphyseal trabeculae','#b89570',(x,y,z)=>{const f=((x-a[0])*u[0]+(y-a[1])*u[1]+(z-a[2])*u[2])/len;const lattice=Math.abs(Math.sin(x*7/r)*Math.cos(y*6/r)+Math.sin(z*5/r));return Math.min(surface(x,y,z)-r*.25,(Math.abs(f-.5)-.27)*len,(.54-lattice)*r*.22);})];
}
function braincase(p){
 const [cx,cy,cz]=p.p,[a,b,c]=p.r;const f=(x,y,z)=>ell(x-cx,y-cy,z-cz,a,b,c);
 const skull=body(p.id,'Braincase',p.p,p.r,'base',(x,y,z)=>{const d=f(x,y,z),u=(x-cx)/a,v=(y-cy)/b,w=(z-cz)/c;
 const orbit=Math.hypot((u+.51)/.36,(v+.04)/.42,(Math.abs(w)-.78)/.43)-1;
 const foramen=Math.hypot((u-.87)/.42,(v+.26)/.30,w/.36)-1;return Math.min(d,.17*Math.min(a,b,c)-d,orbit*.25*a,foramen*.22*a);},[cx+.2*a,cy+.86*b,cz]);return [skull];
}
function detailParts(p){
 if(p.pts&&p.id?.startsWith('Cardiovascular/Heart and great vessels/'))p=greatVessel(p);
 const name=p.id?.split('/').pop()||'',species=p.id?.split('/')[1];
 if(p.pts&&p.r&&!p.requires&&/aorta|artery|arteriole|vein|vena cava|trachea|bronch|ureter|esophagus|collecting duct|bile duct|intestine/i.test(name)&&!p.id.startsWith('Fauna/Compare'))return hollowPath(p,name+' wall');
 if(p.p&&/^(Stomach|Gizzard|Bladder|Gallbladder|Crop|Abomasum|Main stomach|Forestomach|Pyloric stomach)$/.test(name))return organWall(p,name);
 if(p.p&&p.detailName==='Mitochondrion'){const parts=[p],r=p.r;for(let i=-2;i<=2;i++){const x=p.p[0]+i*r[0]*.27;parts.push(path(p.id,'Cristae',[[x-r[0]*.07,p.p[1]-.45*r[1],p.p[2]],[x+r[0]*.07,p.p[1]+.5*r[1],p.p[2]+.25*r[2]]],.12*Math.min(...r),'#e3b594'));}return parts;}
 if(p.p&&p.id.startsWith('Fauna/')&&name==='Cerebellum'){
 const [x,y,z]=p.p,[a,b,c]=p.r;return [body(p.id,'Foliate cortex',p.p,p.r,p.color,(xx,yy,zz)=>ell(xx-x,yy-y,zz-z,a,b,c)-.018*(1+Math.cos((xx-x)*60)),[x,y+b*.7,z])];}
 if(p.p&&species&&name==='Parabronchial lung')return bird(p);
 return [p];
}
function upgrade(g,s){
 const e=D[s.kind].find(x=>x.id===s.id);let parts=g.parts;
 if(e?.shape==='femur'){parts=femur(e.id,e.side==='Right'?-1:1);g.labels=[{id:e.id,name:'Femoral head',p:[(e.side==='Right'?1:-1)*.45,2.16,0]},{id:e.id,name:'Medullary cavity',p:[0,0,0]},{id:e.id,name:'Distal condyles',p:[0,-2.05,0]}];}
 else if(e?.id==='cell-042'||(e?.family==='Mammalian erythrocyte')){parts=erythrocyte(e.id);g.labels=[{id:e.id,name:'Thin central region',p:[0,0,.095]},{id:e.id,name:'Peripheral rim',p:[.73,0,.23]}];}
 else {if(s.id==='Nervous/Brain midline section'||s.id==='Nervous/Brain lobes and coverings'){
 const region=s.id.endsWith('section')?'Brain lobes and coverings':'Brain midline section',other=D.systems.find(e=>e.children&&e.name===region);
 if(other){const extra=other.children.flatMap(e=>e.parts).map(p=>({...p,detailName:p.id.split('/').pop()}));parts=s.id.endsWith('section')?[...extra,...parts]:[...parts,...extra];}}
 const seen=new Set(),limbs=new Set(parts.filter(p=>p.pts&&/^[a-z-]+\/(left|right)-(femur|humerus|tibia|tibiotarsus|tibiofibula|radioulna|radius-and-ulna)$/.test(p.id)).map(p=>p.id));parts=parts.flatMap(p=>{
 if(limbs.has(p.id))return p.pts?limbBone(p):[];
 if(p.p&&/^[a-z-]+\/(skull|chondrocranium)$/.test(p.id))return braincase(p);
 if(/^Nervous\/Brain lobes and coverings\/.* lobe$/.test(p.id)&&p.p)return cerebrum(p);
 if(/^Urinary\/Kidneys and outflow\/(Left|Right) kidney$/.test(p.id)&&p.p)return kidney(p);
 if(/^Cardiovascular\/Heart and great vessels\/(Left|Right) (atrium|ventricle)$/.test(p.id)&&p.p)return heart(p);
 if(/^Fauna\/(Chicken|Eagle|Penguin)\/Respiratory\/(Anterior air sac|Posterior air sac|Parabronchial lung|Primary bronchus)$/.test(p.id)){if(seen.has(p.id))return [];seen.add(p.id);return bird(p);}
 return detailParts(p);});}
 if(!g.assembly&&parts.some(p=>p.detail)){for(const m of P.atlasVolume.materials(parts)){if(m.key!==m.id&&!g.labels.some(l=>l.name===m.name))g.labels.push({id:m.id,detail:m.key,name:m.name,p:m.p});}}
 return {...g,parts};
}
P.atlasTissues={upgrade};
})();
