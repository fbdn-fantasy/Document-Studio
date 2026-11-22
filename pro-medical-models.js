/* Original procedural educational anatomy. Coordinates are schematic, not scans. */
'use strict';
(()=>{const D=FTEPro.medicalData;
function model(){const m={parts:[],labels:[]};m.ell=(name,p,r,color='base')=>{m.parts.push({kind:'ell',p,r,color,detailName:name});if(name)m.labels.push({name,p:[p[0]+r[0]*.65,p[1],p[2]+r[2]*.7]});};m.path=(name,pts,r=.06,color='base')=>{m.parts.push({kind:'path',pts,r,color,detailName:name});if(name)m.labels.push({name,p:pts[Math.floor(pts.length/2)]});};m.plate=(name,pts,depth=.12,color='base')=>{m.parts.push({kind:'plate',pts,depth,color,detailName:name});if(name)m.labels.push({name,p:pts[0]});};return m;}
function bone(b){const m=model(),E=m.ell,T=m.path,Q=m.plate,s=b.shape;
const ring=(name,rx,ry,z=0,r=.12)=>T(name,Array.from({length:33},(_,i)=>[rx*Math.cos(i*Math.PI/16),ry*Math.sin(i*Math.PI/16),z]),r);
const shaft=()=>{T('Shaft (diaphysis)',[[0,-.72,0],[.04,0,-.04],[0,.72,0]],.25);};
if(['humerus','femur','radius','ulna','tibia','fibula','metacarpal','metatarsal','phalanx','toe'].includes(s)){
 shaft();let head=.4;
 if(s==='femur'){T('Neck',[[0,.72,0],[-.55,.94,0]],.22);E('Femoral head',[-.65,1,0],[.43,.25,.43]);E('Greater trochanter',[.3,.8,0],[.3,.24,.3]);E('Lesser trochanter',[-.25,.55,-.2],[.2,.13,.2]);}
 else if(s==='humerus'){E('Humeral head',[-.22,.88,0],[.6,.22,.55]);E('Greater tubercle',[.3,.82,.18],[.24,.2,.26]);}
 else if(s==='ulna'){T('Olecranon and trochlear notch',[[0,.65,.2],[0,.65,-.3],[0,1,-.35],[0,1,.2]],.23);}
 else {E(s==='radius'?'Radial head':s==='tibia'?'Tibial plateau':'Proximal articular end',[0,.84,0],[head,.17,head]);}
 E(s==='humerus'?'Trochlea':s==='femur'?'Medial condyle':'Distal articular end',[-.23,-.86,0],[.3,.15,.32]);E(s==='humerus'?'Capitulum':s==='femur'?'Lateral condyle':'Distal surface',[.23,-.86,0],[.27,.15,.3]);
 if(['tibia','fibula','radius','ulna'].includes(s))T(['tibia','fibula'].includes(s)?'Malleolus':'Styloid process',[[.3,-.8,0],[.4,-1.05,0]],.12);
 if(b.variant==='Distal')E('Distal tuft',[0,-.95,0],[.44,.12,.3]);
}else if(['vertebra','atlas','axis'].includes(s)){
 ring('Vertebral arch',.65,.7,-.25,.16);
 if(s!=='atlas')E('Vertebral body',[0,-.55,.3],[.8,.4,.6]);else {E('Lateral mass',[-.65,0,0],[.26,.45,.28]);E('',[.65,0,0],[.26,.45,.28]);}
 T('Spinous process',[[0,.65,-.25],[0,1.25,-.65]],.17);T('Transverse processes',[[-1.1,0,0],[-.6,.1,0]],.14);T('',[[.6,.1,0],[1.1,0,0]],.14);
 m.labels.push({name:'Vertebral foramen',p:[0,0,-.25]});if(s==='axis')E('Dens',[0,.2,.4],[.2,.65,.2]);
 if(b.variant==='Cervical'){for(const x of [-.9,.9])T(x<0?'Transverse foramen':'',Array.from({length:25},(_,i)=>[x+.13*Math.cos(i*Math.PI/12),.16*Math.sin(i*Math.PI/12),.15]),.04);}
}else if(s==='rib'){
 T('Shaft',Array.from({length:25},(_,i)=>{const a=i/24*Math.PI*(b.variant==='Floating rib'?.65:.95);return [Math.sin(a)*.95,-a*.15,1-Math.cos(a)];}),.09);E('Head',[0,0,0],[.15,.15,.15]);E('Tubercle',[.2,-.03,.03],[.16,.12,.13]);{const a=Math.PI*(b.variant==='Floating rib'?.65:.95);m.labels.push({name:'Anterior end',p:[Math.sin(a)*.95,-a*.15,1-Math.cos(a)]});}
}else if(s==='clavicle')T('S-shaped shaft',[[-1,0,0],[-.6,.35,.15],[0,0,0],[.55,-.25,-.1],[1,0,0]],.17),E('Sternal end',[-1,0,0],[.25,.35,.23]),E('Acromial end',[1,0,0],[.25,.15,.3]);
else if(s==='scapula'){Q('Scapular body',[[-.8,.9,0],[.85,.65,0],[-.25,-1,0]],.15);T('Spine',[[-.7,.4,-.15],[.4,.5,-.3],[1,.7,-.3]],.13);E('Glenoid cavity',[.92,.4,.05],[.13,.32,.25]);T('Acromion',[[.5,.5,-.3],[1,.8,-.1]],.18);T('Coracoid process',[[.55,.65,0],[.65,.9,.5],[1,.8,.5]],.13);}
else if(s==='hip'){Q('Ilium',[[-.8,.4,0],[-.8,1,.05],[.5,1,.05],[.9,.4,0],[.2,-.15,0]],.22);T('Pubis',[[.2,-.15,0],[.8,-.5,.3],[.4,-.9,.3]],.18);T('Ischium',[[.2,-.15,0],[-.5,-.65,0],[.4,-.9,.3]],.22);E('Acetabulum',[.15,-.1,.2],[.35,.3,.12]);m.labels.push({name:'Obturator foramen',p:[.2,-.6,.1]});}
else if(s==='sternum'){Q('Manubrium',[[-.9,1,0],[.9,1,0],[.6,.5,0],[-.6,.5,0]],.3);Q('Body',[[-.55,.5,0],[.55,.5,0],[.45,-.7,0],[-.45,-.7,0]],.2);Q('Xiphoid process',[[-.3,-.7,0],[.3,-.7,0],[0,-1,0]],.14);}
else if(s==='sacrum'){Q('Fused sacral body',[[-1,1,0],[1,1,0],[.25,-1,.15],[-.25,-1,.15]],.35);for(let i=0;i<4;i++)for(const x of [-1,1])E(i===0&&x===1?'Sacral foramina':'',[x*(.6-i*.09),.65-i*.35,.3],[.09,.08,.03],'hole');T('Median sacral crest',[[0,.8,-.3],[0,-.8,-.2]],.1);}
else if(s==='coccyx'){for(let i=0;i<4;i++)E(i===0?'Fused coccygeal segments':'',[0,.7-i*.4,i*.12],[.5-i*.1,.26,.3-i*.05]);}
else if(s==='mandible'){T('Body',[[-.8,.4,-.5],[-.9,-.4,0],[-.5,-.7,.7],[.5,-.7,.7],[.9,-.4,0],[.8,.4,-.5]],.2);for(const x of [-1,1]){T(x===1?'Ramus':'',[[x*.85,-.2,0],[x*.85,.7,-.5]],.18);E(x===1?'Condylar process':'',[x*.85,.8,-.5],[.25,.16,.17]);T(x===1?'Coronoid process':'',[[x*.8,.1,0],[x*.75,.65,.15]],.13);}}
else if(s==='hyoid'){T('Body and greater horns',[[-1,.5,-.4],[-.7,-.4,0],[0,-.6,.2],[.7,-.4,0],[1,.5,-.4]],.15);}
else if(s==='stapes'){ring('Crura',.65,.9,0,.1);E('Footplate',[0,-.9,0],[.75,.13,.35]);E('Head',[0,.9,0],[.23,.2,.23]);}
else if(s==='malleus'){E('Head',[0,.6,0],[.5,.4,.4]);T('Handle',[[0,.4,0],[.15,-1,.2]],.12);T('Lateral process',[[0,.2,0],[.6,0,0]],.1);}
else if(s==='incus'){E('Body',[0,.4,0],[.5,.45,.35]);T('Long crus',[[0,.2,0],[.2,-.9,.1]],.15);T('Short crus',[[0,.4,0],[-.8,.2,0]],.17);}
else if(s==='carpal'||s==='tarsal'){
 const n=b.variant;
 if(n==='Lunate')T('Crescent-shaped body',Array.from({length:21},(_,i)=>{const a=.4+i/20*2.34;return [.7*Math.cos(a),.75*Math.sin(a)-.35,0];}),.3);
 else if(n==='Triquetrum')Q('Pyramidal body',[[-.8,-.55,0],[.8,-.55,0],[0,.85,.25]],.7);
 else if(n==='Trapezoid')Q('Wedge-shaped body',[[-.75,-.65,0],[.75,-.65,0],[.4,.65,0],[-.35,.65,0]],.7);
 else if(n==='Cuboid')Q('Cuboid body',[[-.7,-.6,0],[.7,-.6,0],[.7,.6,0],[-.7,.6,0]],1.1);
 else if(n==='Navicular')T('Boat-shaped body',[[-.8,.2,0],[-.4,-.3,0],[.4,-.3,0],[.8,.2,0]],.35);
 else E(n+' body',[0,0,0],n==='Scaphoid'?[.95,.45,.5]:n==='Pisiform'?[.6,.65,.6]:n==='Calcaneus'?[.75,.65,1]:[.7,.65,.65]);
 if(n==='Trapezium'){T('Saddle articular surface',[[-.6,.45,.3],[0,.2,.55],[.6,.45,.3]],.13);E('Tubercle',[.5,-.4,.5],[.2,.2,.25]);}
 if(n==='Cuboid')T('Fibularis longus groove',[[-.6,-.45,.6],[.6,-.25,.6]],.07,'accent');
 if(n==='Navicular')E('Navicular tuberosity',[-.9,-.1,.2],[.28,.3,.3]);
 if(n==='Triquetrum')E('Pisiform facet',[0,-.1,.45],[.28,.3,.08]);
 if(n==='Hamate')T('Hook of hamate',[[.4,0,.4],[.7,.3,.8],[.4,.5,.8]],.12);
 else if(n==='Calcaneus'){E('Calcaneal tuberosity',[0,-.2,-.9],[.6,.55,.4]);E('Sustentaculum tali',[-.7,.3,.1],[.4,.2,.3]);}
 else if(n==='Talus'){E('Trochlea',[0,.5,-.2],[.65,.35,.6]);E('Head',[0,0,.8],[.5,.45,.35]);}
 else if(n==='Scaphoid')E('Scaphoid tubercle',[.6,.3,.4],[.3,.25,.25]);
 else if(n==='Capitate')E('Head',[0,.7,0],[.45,.4,.45]);
 else if(n.includes('cuneiform'))Q('Wedge-shaped articular body',[[-.7,-.6,0],[.7,-.6,0],[.2,.8,0]],.6);
 else m.labels.push({name:'Articular surface',p:[0,.6,.4]});
}else if(s==='patella'){Q('Anterior surface',[[-.8,.6,0],[0,1,.1],[.8,.6,0],[0,-1,0]],.5);m.labels.push({name:'Apex',p:[0,-1,0]},{name:'Base',p:[0,1,.1]});}
else if(s==='sphenoid'){E('Body',[0,0,0],[.3,.6,.5]);for(const x of [-1,1])Q(x===1?'Greater wing':'',[[x*.2,0,0],[x,.7,0],[x*.9,-.4,.1]],.15);E('Sella turcica',[0,.4,0],[.25,.15,.3]);T('Pterygoid processes',[[-.3,-.2,0],[-.3,-1,0],[.3,-1,0],[.3,-.2,0]],.1);}
else if(s==='ethmoid'){Q('Perpendicular plate',[[0,-1,-.3],[0,1,-.3],[0,1,.3],[0,-1,.3]],.08);Q('Cribriform plate',[[-1,.5,-.7],[1,.5,-.7],[1,.5,.7],[-1,.5,.7]],.08);E('Ethmoidal labyrinth',[-.6,0,0],[.3,.6,.5]);E('',[.6,0,0],[.3,.6,.5]);}
else if(s==='maxilla'){Q('Body',[[-.7,-.6,0],[.8,-.6,0],[.6,.4,0],[-.4,.7,0]],.5);T('Frontal process',[[-.4,0,0],[-.6,1,0]],.2);T('Alveolar process',[[-.7,-.65,.4],[.7,-.65,.4]],.15);E('Infraorbital foramen',[.1,.15,.4],[.09,.09,.02],'hole');}
else if(s==='temporal'){E('Squamous part',[0,.3,0],[.75,.7,.2]);T('Zygomatic process',[[0,.1,0],[1,.15,.5]],.12);E('Mastoid process',[-.5,-.6,0],[.25,.4,.3]);E('External acoustic meatus',[0,-.2,.3],[.25,.25,.04],'hole');T('Styloid process',[[.2,-.3,0],[.3,-1,0]],.07);}
else if(s==='occipital'){E('Squamous part',[0,.35,0],[1,.7,.35]);ring('Foramen magnum margin',.4,.35,.1,.18);m.labels.push({name:'Foramen magnum',p:[0,0,.1]});}
else if(s==='frontal'){E('Frontal squama',[0,.3,0],[1,.7,.4]);for(const x of [-1,1])T(x===1?'Supraorbital margin':'',[[x*.1,-.4,.3],[x*.5,-.25,.5],[x*.9,-.4,.3]],.12);}
else if(s==='parietal'){Q('Parietal surface',[[-.9,-.7,0],[-.8,.8,-.1],[.6,1,0],[1,-.5,.2]],.2);m.labels.push({name:'Sagittal border',p:[-.8,.8,-.1]},{name:'Parietal eminence',p:[0,0,.2]});}
else if(s==='zygomatic'){Q('Malar surface',[[-.7,-.5,0],[.8,-.4,0],[.5,.7,0]],.3);T('Temporal process',[[.5,.1,0],[1,.3,-.5]],.18);T('Frontal process',[[.1,.4,0],[.1,1,0]],.15);}
else if(s==='palatine'){Q('Horizontal plate',[[-1,-.5,-.7],[1,-.5,-.7],[1,-.5,.7],[-1,-.5,.7]],.1);Q('Perpendicular plate',[[-.8,-.5,-.7],[-.8,1,-.7],[-.8,1,.3],[-.8,-.5,.3]],.1);}
else if(s==='inferior-nasal-concha'){T('Curved conchal lamina',Array.from({length:20},(_,i)=>[Math.cos(i/19*3.5),i/19-.5,Math.sin(i/19*3.5)]),.18);}
else {Q(s==='vomer'?'Nasal septal plate':s==='nasal'?'Nasal bridge surface':'Lacrimal surface',[[-.6,-1,0],[.7,-.8,0],[.6,.8,0],[-.5,1,.1]],.1);if(s==='lacrimal')T('Lacrimal groove',[[-.2,-.7,.1],[-.2,.7,.1]],.05,'accent');}
return m;}
function cell(c){const m=model(),E=m.ell,T=m.path,Q=m.plate,f=c.features,has=x=>f.includes(x),s=c.shape;
let r=[1.25,1.25,.65];if(['column','goblet','dome'].includes(s))r=[.7,1.5,.6];if(s==='flat')r=[1.5,.32,1];if(['fiber','branched-fiber','spindle','schwann'].includes(s))r=[s==='spindle'?2.5:2.7,.48,.48];if(['rod','cone','bipolar','sensory'].includes(s))r=[.5,.8,.45];if(s==='small')r=[.9,.9,.65];if(s==='giant')r=[1.7,1.4,.85];if(s==='platelet')r=[.7,.45,.4];if(s==='sperm')r=[.45,.65,.25];
if(s==='rbc'){
 const pts=Array.from({length:49},(_,i)=>[Math.cos(i*Math.PI/24),Math.sin(i*Math.PI/24),0]);T('Biconcave rim',pts,.32,'membrane');E('Thin central region',[0,0,0],[.85,.85,.13],'base');
}else if(['polygon','pyramid','cuboid','column','flat','dome'].includes(s)){
 const pts=s==='pyramid'?[[-r[0],-r[1],0],[r[0],-r[1],0],[0,r[1],0]]:[[-r[0],-r[1],0],[r[0],-r[1],0],[r[0]*(s==='dome'?.65:1),r[1],0],[-r[0]*(s==='dome'?.65:1),r[1],0]];Q('Cell membrane',pts,r[2]*2,'membrane');
}else E('Cell membrane',[0,0,0],r,'membrane');
if(!has('no-nucleus')){
 let np=has('single-lipid')?[.95,-.5,.35]:has('eccentric-nucleus')?[-.6,-.3,.35]:[0,-.2,r[2]*.7];let nr=has('large-nucleus')?[.65,.65,.35]:[.4,.45,.3];
 if(has('multinuclear'))for(let i=0;i<5;i++)E(i===0?'Nuclei':'',[(i-2)*r[0]*.33,-r[1]*.6,.45],[.22,.23,.18],'nucleus');
 else if(has('segmented-nucleus')||has('bilobed-nucleus')||has('lobed-nucleus')){const count=has('bilobed-nucleus')?2:has('lobed-nucleus')?6:4;for(let i=0;i<count;i++)E(i===0?'Lobed nucleus':'',[(i-(count-1)/2)*.3,Math.sin(i*1.8)*.25,.5],[.23,.28,.22],'nucleus');}
 else if(has('kidney-nucleus'))T('Indented nucleus',[[-.4,.2,.5],[-.5,-.2,.5],[0,-.5,.5],[.4,-.2,.5]],.23,'nucleus');
 else {E('Nucleus',np,nr,'nucleus');if(has('binuclear'))E('Second nucleus',[.65,-.3,.5],nr,'nucleus');}
 if(!['sperm'].includes(s)){E('Mitochondrion',[r[0]*.55,-r[1]*.35,r[2]*.9],[.22,.11,.12],'mito');T('Golgi apparatus',[[-.4,.5,.5],[-.15,.6,.6],[.1,.5,.6]],.05,'accent');}
}
const processes=['neuron','pyramid','purkinje','stellate','podocyte'];if(processes.includes(s)&&(s!=='pyramid'||has('dendrites'))){
 let n=s==='purkinje'?12:s==='pyramid'?3:6;
 for(let i=0;i<n;i++){const a=(s==='purkinje'?.25+i/n*2.6:i/n*6.283),start=[Math.cos(a)*.6,Math.sin(a)*.6,0],end=[Math.cos(a)*2.5,Math.sin(a)*2.5,Math.sin(i)*.4];T(i===0?(has('pedicels')?'Major process':has('dendrites')?'Dendrites':'Cytoplasmic processes'):'',[start,end],.1,'membrane');for(let j=-1;j<=1;j+=2)T(i===0&&j===1&&has('pedicels')?'Foot processes':'',[end,[end[0]+j*.35,end[1]+.35,end[2]+j*.3]],.045,'membrane');}
}
if(has('axon'))T('Axon',[[0,-.5,0],[0,-1.6,0],[1,-2.4,.1],[2,-2.5,.2]],.055,'membrane');
if(s==='bipolar')T('Dendritic process',[[0,.5,0],[0,2,.1]],.06,'membrane');
if(s==='sensory')T('Peripheral and central branches',[[-2,-1.6,0],[0,-1.6,0],[2,-1.6,0]],.07,'membrane');
if(s==='branched-fiber'){T('Branch',[[.5,0,0],[1.5,1,.1],[2.5,1,.1]],.28,'membrane');}
for(const feature of f){
 if(['cilia','microvilli','stereocilia','olfactory-cilia'].includes(feature)){let h=feature==='microvilli'?.22:.6;for(let i=0;i<13;i++){let x=(i-6)*r[0]/7;T(i===0?feature.replaceAll('-',' '):'',[[x,r[1],0],[x+.07,r[1]+h*(feature==='stereocilia'?(i+2)/14:1),.08]],.025,'accent');}}
 if(feature==='primary-cilium')T('Primary cilium',[[0,r[1],0],[.15,r[1]+.7,0]],.035,'accent');
 if(['rough-er','smooth-er','basal-folds','striations','filaments','keratin','crystallin','outer-discs','uroplakin'].includes(feature))for(let i=0;i<7;i++){
  if(feature==='striations'||feature==='filaments'||feature==='crystallin')T(i===0?feature:'',[[-r[0]+i*r[0]/3.5,-.35,.4],[-r[0]+i*r[0]/3.5,.35,.4]],.025,'accent');
  else if(feature==='outer-discs')T(i===0?'Outer segment discs':'',[[-.4,1+i*.15,0],[.4*(s==='cone'?1-i*.08:1),1+i*.15,0]],.05,'accent');
  else T(i===0?feature.replaceAll('-',' '):'',[[-.6+i*.17,.3,.5],[-.6+i*.17,.75,.5]],feature==='keratin'?.025:.045,'accent');
 }
 if(feature==='myelin'){for(let i=0;i<4;i++)E(i===0?'Myelin sheath':'',s==='schwann'?[(i-1.5)*.7,0,0]:[.3+i*.4,-1.8-i*.15,0],[.28,.15,.18],'lipid');}
 if(feature==='discs')for(const x of [-1.8,1.8])T(x<0?'Intercalated disc':'',[[x,-.45,.45],[x,.45,.45]],.06,'accent');
 if(feature==='flagellum')T('Flagellum',[[0,-.6,0],[0,-1.2,0],[.2,-2,0],[1,-2.5,.2],[1.4,-3,.2]],.04,'membrane');
 if(feature==='midpiece')E('Mitochondrial midpiece',[0,-.95,0],[.14,.35,.14],'mito');
 if(feature==='acrosome')E('Acrosomal cap',[0,.45,.15],[r[0]*.9,.22,.2],'accent');
 if(feature==='single-lipid')E('Single lipid droplet',[-.15,.15,.4],[1,.95,.5],'lipid');
 if(['lipid','mitochondria','granules','dense-core','mucin','melanosomes','lysosomes','phagosome','lamellar-bodies','keratohyalin','ribosomes','glycogen','cortical-granules','apical-granules','basal-granules','eosinophil-granules','basophil-granules'].includes(feature)){
  let n=feature==='phagosome'?2:feature==='mucin'?14:10;for(let i=0;i<n;i++){let a=i*2.399,rr=.45+(i%3)*.18;let y=Math.sin(a)*r[1]*rr;if(feature==='apical-granules'||feature==='mucin')y=Math.abs(y)+.35;if(feature==='basal-granules')y=-Math.abs(y)-.3;
  E(i===0?feature.replaceAll('-',' '):'',[Math.cos(a)*r[0]*rr,y,r[2]+.08],[feature==='phagosome'?.25:.1,feature==='mitochondria'?.06:.1,.07],feature==='lipid'?'lipid':feature==='mitochondria'?'mito':'accent');}
 }
 if(feature==='zona-pellucida'||feature==='lacuna')T(feature.replaceAll('-',' '),Array.from({length:49},(_,i)=>[1.5*Math.cos(i*Math.PI/24),1.5*Math.sin(i*Math.PI/24),0]),.08,'accent');
 if(['junctions','desmosomes','overlap-junctions'].includes(feature))for(let i=0;i<4;i++)E(i===0?feature:'',[r[0],-.7+i*.4,0],[.12,.08,.15],'accent');
 if(feature==='fenestrae')for(let i=0;i<6;i++)E(i===0?'Fenestrae':'',[(i-2.5)*.4,0,r[2]+.05],[.09,.08,.02],'hole');
 if(feature==='ruffled')for(let i=0;i<12;i++)T(i===0?'Ruffled border':'',[[i*.22-1.2,-1.25,.1],[i*.22-1.2,-1.6,.1]],.06,'membrane');
 if(['canaliculi','bile-canaliculus'].includes(feature))T(feature.replaceAll('-',' '),[[-.7,.4,.8],[0,.8,.8],[.7,.4,.8]],.08,'accent');
 if(['basal-lamina','collagen','glial-envelope'].includes(feature))T(feature.replaceAll('-',' '),[[-1.5,-1.5,0],[1.5,-1.5,0]],.05,'accent');
 if(feature==='endfeet')E('Expanded endfoot',[2.4,0,.1],[.25,.4,.25],'membrane');
 if(feature==='synapse')E('Synaptic terminal',[0,-1.2,0],[.3,.2,.2],'accent');
 if(feature==='contractile')T('Contractile filaments',[[-1,-.2,.5],[1,.2,.5]],.05,'accent');
 }
return m;}
function transform(m,pos,size,id){const point=p=>p.map((v,i)=>v*size[i]+pos[i]);return {parts:m.parts.map(p=>({...p,id,detail:p.detailName?id+'::'+p.detailName:undefined,...(p.p?{p:point(p.p),r:p.r.map((v,i)=>Math.abs(v*size[i]))}:{pts:p.pts.map(point),r:p.r?Math.abs(p.r*Math.min(...size.map(Math.abs))):undefined,depth:p.depth?Math.abs(p.depth*size[2]):undefined})})),labels:m.labels.map(l=>({...l,p:point(l.p),id,detail:id+'::'+l.name}))};}
D.boneModel=bone;D.cellModel=cell;D.transform=transform;
})();
