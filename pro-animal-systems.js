// Original comparative teaching geometry. Coordinates are normalized landmarks.
'use strict';
(()=>{
const P=FTEPro, atlas=[], systems=P.medicalData.systems, lessons=P.bodyAtlas.lessons;
const colors=['#bd7882','#729aca','#bd5e70','#89ac88','#d4ad60','#ab83b7','#668f92'];
const digestive={
 Cow:'Mouth|Esophagus|Reticulorumen|Omasum|Abomasum|Small intestine|Colon',
 Horse:'Mouth|Esophagus|Stomach|Small intestine|Cecum|Large colon',
 Rabbit:'Mouth|Esophagus|Stomach|Small intestine|Cecum|Colon',
 Dolphin:'Mouth|Esophagus|Forestomach|Main stomach|Pyloric stomach|Intestine',
 Chicken:'Beak|Esophagus|Crop|Proventriculus|Gizzard|Intestine|Cloaca',
 Eagle:'Beak|Esophagus|Crop|Proventriculus|Gizzard|Intestine|Cloaca',
 Penguin:'Beak|Esophagus|Proventriculus|Gizzard|Intestine|Cloaca',
 'Bony fish':'Mouth|Pharynx|Esophagus|Intestinal bulb|Intestine|Anus',
 Shark:'Mouth|Esophagus|Stomach|Spiral intestine|Rectum|Cloaca',
 Beetle:'Mouth|Foregut|Midgut|Hindgut|Anus', Spider:'Mouth|Sucking stomach|Midgut|Hindgut|Anus',
 Crab:'Mouth|Esophagus|Gastric mill|Pyloric chamber|Intestine|Anus',
 Earthworm:'Mouth|Pharynx|Esophagus|Crop|Gizzard|Intestine|Anus',
 Snail:'Radula|Esophagus|Crop|Stomach|Intestine|Anus',
 Octopus:'Beak|Esophagus|Crop|Stomach|Caecum|Intestine|Anus',
 Jellyfish:'Mouth|Manubrium|Gastric pouch|Radial canal|Ring canal',
 Starfish:'Mouth|Cardiac stomach|Pyloric stomach|Pyloric caecum'
};
const special={
 Beetle:['Spiracle|Tracheal trunk|Tracheole','Dorsal vessel|Aorta|Hemocoel','Malpighian tubule|Hindgut','Brain|Subesophageal ganglion|Ventral nerve cord|Segmental ganglion','Ovary|Oviduct'],
 Spider:['Book lung|Air space|Book lung lamella','Tubular heart|Artery|Hemocoel','Malpighian tubule|Hindgut','Supraesophageal ganglion|Subesophageal mass|Leg nerve','Ovary|Oviduct'],
 Crab:['Branchial chamber|Gill filament|Gill lamella','Heart|Artery|Hemocoel|Gill return','Antennal gland|Excretory pore','Brain|Circumesophageal connective|Thoracic ganglion|Leg nerve','Ovary|Oviduct'],
 Earthworm:['Moist epidermis|Cutaneous capillary','Dorsal vessel|Aortic arch|Ventral vessel|Segmental capillary','Nephrostome|Nephridial tubule|Nephridiopore','Cerebral ganglia|Circumpharyngeal connective|Ventral nerve cord|Segmental ganglion','Ovary|Oviduct|Female pore'],
 Snail:['Pneumostome|Mantle lung|Pulmonary vein','Atrium|Ventricle|Aorta|Hemocoel','Kidney|Ureter|Excretory pore','Cerebral ganglion|Pedal connective|Pedal ganglion','Ovotestis|Hermaphroditic duct|Spermoviduct'],
 Octopus:['Mantle cavity|Gill|Gill lamella','Branchial heart|Gill vessels|Systemic heart|Systemic artery','Renal appendage|Renal sac|Renal opening','Central brain|Brachial nerve|Axial arm cord|Arm ganglion','Ovary|Oviduct|Oviducal gland'],
 Jellyfish:['Body surface|Gastrodermis',null,'Epidermis|Surrounding water','Diffuse nerve net|Motor nerve net|Rhopalium','Gonad|Gastric pouch'],
 Starfish:['Dermal branchia|Tube foot',null,'Papula|Surrounding seawater','Circumoral nerve ring|Radial nerve|Tube foot nerve','Gonad|Gonopore']
};
const circulation={mammal:'Vena cava|Right atrium|Right ventricle|Pulmonary artery|Lung capillaries|Pulmonary vein|Left atrium|Left ventricle|Aorta',bird:'Vena cava|Right atrium|Right ventricle|Pulmonary artery|Lung capillaries|Pulmonary vein|Left atrium|Left ventricle|Aorta',fish:'Sinus venosus|Atrium|Ventricle|Ventral aorta|Gill capillaries|Dorsal aorta',amphibian:'Sinus venosus|Right atrium|Ventricle|Pulmocutaneous arch',reptile:'Sinus venosus|Right atrium|Ventricle|Pulmonary artery'};
const descriptions={
 Digestive:'Trace the route of food and inspect the named digestive regions. Fermentation chambers and glandular branches are shown schematically.',
 Respiratory:'Inspect the surfaces and passages used for gas exchange. The sequence identifies structures involved in ventilation or diffusion.',
 Circulatory:'Trace representative transport structures. Vessel diameters, flow speed and pressure are illustrative.',
 Excretory:'Follow the structures involved in waste exchange or transport. Surface exchange is shown for animals without a discrete kidney.',
 Nervous:'Inspect the organization of central and peripheral signaling structures. Branches represent selected pathways.',
 Reproductive:'Representative ovarian or egg-producing anatomy. Other sexes, seasonal changes and developmental stages are omitted.',
 'Neural cells':'Enlarged cellular detail shown on a separate scale.',
 'Water vascular':'Follow the hydraulic route toward the tube feet.'
};
for(const [name,latin,group] of P.animalData.species){
 const source=P.animalData.catalog.find(r=>r.species===name).sourceUrl;
 const groups=[],organs=[], whole=[];
 const bird=group==='bird',fish=group==='fish',invert=!!special[name],radial=['Jellyfish','Starfish'].includes(name);
 const respiratory=bird?'Trachea|Primary bronchus|Posterior air sac|Parabronchial lung|Anterior air sac':fish?'Buccal cavity|Gill arch|Gill filament|Secondary lamella':name==='Dolphin'?'Blowhole|Nasal passage|Trachea|Bronchus|Lung':name==='Snake'?'Glottis|Trachea|Right lung':group==='amphibian'?'Buccal cavity|Glottis|Lung':'Trachea|Bronchus|Lung';
 const excretory=group==='mammal'?'Kidney|Ureter|Bladder|Urethra':fish&&name==='Bony fish'?'Trunk kidney|Urinary duct|Urinary opening':'Kidney|Ureter|Cloaca';
 const neural=fish?'Olfactory bulb|Telencephalon|Optic tectum|Medulla|Spinal cord':bird?'Cerebral hemisphere|Optic lobe|Cerebellum|Medulla|Spinal cord':'Olfactory bulb|Cerebral hemisphere|Cerebellum|Medulla|Spinal cord';
 const routes={Digestive:digestive[name]||('Mouth|Esophagus|Stomach|Small intestine|'+(group==='mammal'?'Colon':'Cloaca')),Respiratory:invert?special[name][0]:respiratory,Circulatory:invert?special[name][1]:name==='Crocodile'?circulation.mammal:circulation[group],Excretory:invert?special[name][2]:excretory,Nervous:invert?special[name][3]:neural,Reproductive:invert?special[name][4]:bird?'Left ovary|Infundibulum|Magnum|Isthmus|Shell gland|Vagina|Cloaca':group==='mammal'?'Ovary|Oviduct|Uterus|Cervix|Vagina':name==='Bony fish'?'Ovary|Ovarian duct|Genital opening':'Ovary|Oviduct|Cloaca'};
 if(name==='Starfish')routes['Water vascular']='Madreporite|Stone canal|Ring canal|Radial canal|Ampulla|Tube foot';
 const scale=name==='Snake'||name==='Earthworm'?1.7:radial?.78:1;
 function addGroup(system,children,detail){
  const title=name+' · '+system;
  const row={id:'Fauna/'+name+'/'+system,name:title,system,region:title,description:detail,sourceUrl:source,children};
  groups.push(row);systems.push(row);return row;
 }
 for(const [index,[system,route]] of Object.entries(routes).entries()){
  if(!route)continue;
  const names=route.split('|'), region=name+' · '+system, segments=[];
  const details=descriptions[system]+(system==='Circulatory'?' '+(invert&&['Beetle','Spider','Crab','Snail'].includes(name)?'Open circulation returns hemolymph through body spaces.':'Closed circulation retains blood within vessels.'):'');
  const ranges=[[-2,1.75,-.3],[-1.75,-.05,.3],[-.8,.85,.12],[.35,1.7,.28],[-1.95,1.8,.75],[.4,1.7,-.55],[0,1.5,-.2]];
  let [start,end,y]=ranges[index];if(system==='Nervous'&&invert&&!radial)y=-.7;
  const pos=i=>{let t=i/Math.max(1,names.length-1);if(system==='Nervous'&&!invert)t=i===names.length-1?1:t*.4;
   return [(start+(end-start)*t)*scale,y+.16*Math.sin(t*5+index),.23*Math.cos(t*5+index)];};
  const landmarks={
   'Vena cava':[.45,.25,-.12],'Right atrium':[-.74,.29,.18],'Right ventricle':[-.58,-.03,.22],'Pulmonary artery':[-.76,.54,.16],'Lung capillaries':[-.25,.55,-.38],'Pulmonary vein':[-.51,.39,-.22],'Left atrium':[-.62,.3,-.12],'Left ventricle':[-.52,-.05,-.11],Aorta:[.62,.58,-.12],
   'Sinus venosus':[-.7,.12,0],Atrium:[-.83,.21,0],Ventricle:[-.94,-.02,.12],'Ventral aorta':[-1.2,-.12,.03],'Gill capillaries':[-1.43,.31,.08],'Dorsal aorta':[.86,.52,-.03],
   Mouth:[-2.05,.08,0],Beak:[-2.2,.16,0],Esophagus:[-1.15,.05,-.06],Reticulorumen:[.03,-.22,.21],Omasum:[.23,.03,-.26],Abomasum:[.11,-.53,-.13],Stomach:[-.05,-.05,.18],Crop:[-1.08,-.27,.21],Proventriculus:[-.58,-.09,.1],Gizzard:[-.05,-.32,.18],Cecum:[.95,-.28,-.22],Colon:[1.15,-.13,.06],Cloaca:[1.58,-.25,.03],
   Trachea:[-1.21,.19,.04],Bronchus:[-.84,.24,.03],Lung:[-.32,.32,.19],'Right lung':[.3,.19,.15],'Primary bronchus':[-.72,.25,-.06],'Posterior air sac':[.65,.19,-.16],'Parabronchial lung':[-.16,.52,-.13],'Anterior air sac':[-.85,.43,.23],
   'Olfactory bulb':[-1.99,.68,.03],Telencephalon:[-1.83,.69,.01],'Cerebral hemisphere':[-1.82,.75,0],'Optic lobe':[-1.71,.62,.17],'Optic tectum':[-1.63,.7,.1],Cerebellum:[-1.57,.77,0],Medulla:[-1.44,.59,0],'Spinal cord':[1.55,.56,-.05],
   Kidney:[.69,.44,.24],Ureter:[1.02,.04,.16],Bladder:[1.32,-.24,0],Urethra:[1.66,-.31,.03],Ovary:[.55,.32,-.21],Oviduct:[.75,.2,-.23],Uterus:[1,-.02,-.08],Cervix:[1.22,-.09,-.06],Vagina:[1.46,-.16,-.04]
  };
  const coord=i=>{
   const v=!invert&&landmarks[names[i]];
   if(!v)return pos(i);
   return [v[0]*scale,v[1],v[2]];
  };
  function item(label,parts,p){
   const id='Fauna/'+name+'/'+system+'/'+label;
   const entry={id,name:label,system,region,description:name+' · '+label+'. '+details,sourceUrl:source,parts:parts.map(v=>({...v,color:colors[index],id})),labels:[{id,name:label,p}]};
   segments.push(entry);organs.push(entry);systems.push(entry);return entry;
  }
  for(let i=0;i<names.length;i++){
   const label=names[i],p=coord(i),prev=coord(Math.max(0,i-1)),next=coord(Math.min(i+1,names.length-1));
   const mid=(a,b)=>a.map((v,k)=>(v+b[k])/2);
   let parts=[{kind:'ell',p,r:[.20,.16,.14]}];
   if(/cord|duct|artery|vein|aorta|canal|ureter|trachea|esophagus|vessel|connective|intestine|nerve$/i.test(label))parts=[{kind:'path',pts:[mid(prev,p),p,mid(p,next)],r:.085}];
   else if(/stomach|rumen|lung|gizzard|kidney|ovary|hemisphere/i.test(label))parts[0].r=[.31,.23,.21];
   if(radial&&system==='Nervous'){
    const count=name==='Starfish'?5:8;
    const ring=(r,k)=>[r*Math.cos(k*2*Math.PI/count),r*Math.sin(k*2*Math.PI/count),.08*Math.cos(k*4*Math.PI/count)];
    parts=[];for(let k=0;k<count;k++){
     const pts=i===0?[ring(.4,k),ring(.4,k+1)]:i===1?[ring(.4,k),ring(1.45,k)]:[ring(1.45,k),ring(1.55,k+.14)];
     parts.push({kind:'path',pts,r:.055});
     if(name==='Jellyfish'&&i<2)parts.push({kind:'path',pts:[ring(.4,k),ring(1.45,k+.5),ring(.4,k+1)],r:.032});
    }item(label,parts,parts[0].pts[0]);continue;
   }
   if(label==='Reticulorumen')parts=[{kind:'ell',p,r:[.53,.35,.32]},{kind:'ell',p:[p[0]-.42,p[1]+.12,p[2]],r:[.19,.18,.17]}];
   if(label==='Spinal cord')parts=[{kind:'path',pts:[prev,[0,.63,0],p],r:.065},...[-.8,-.3,.2,.7,1.2].flatMap(x=>[-1,1].map(d=>({kind:'path',pts:[[x,.6,0],[x+.09,.55,d*.15],[x+.18,.27,d*.38]],r:.028})))];
   if(/^(Small intestine|Intestine)$/.test(label))parts=[{kind:'path',pts:Array.from({length:29},(_,k)=>[p[0]-.38+k*.028,p[1]+.14*Math.sin(k*.71),p[2]+.16*Math.cos(k*.71)]),r:.072}];
   if(label==='Tracheole')parts=Array.from({length:10},(_,k)=>({kind:'path',pts:[prev,[p[0]-.15,p[1]+.12*Math.sin(k),p[2]],[p[0]+.23*Math.cos(k*.6),p[1]+.37*Math.sin(k*.6),p[2]+.16*Math.sin(k)]],r:.026}));
   if(label==='Axial arm cord')parts=Array.from({length:8},(_,k)=>({kind:'path',pts:[prev,[p[0],p[1]+.4*Math.sin(k*.785),p[2]+.4*Math.cos(k*.785)],[p[0]+.8,p[1]+.8*Math.sin(k*.785),p[2]+.8*Math.cos(k*.785)]],r:.05}));
   if(i>0)parts.push({kind:'path',pts:[prev,mid(prev,p),p],r:.046,requires:'Fauna/'+name+'/'+system+'/'+names[i-1]});
   if(/gill filament|tracheole|parabronchial|segmental ganglion|arm cord/i.test(label))
    for(let k=0;k<5;k++)for(const sign of [-1,1])parts.push({kind:'path',pts:[[p[0]+k*.065,p[1],p[2]],[p[0]+k*.065+.08,p[1]+sign*.18,p[2]+sign*.13]],r:.029});
   item(label,parts,p);
  }
  const row=addGroup(system,segments,details);whole.push(...segments);
  const actions={Mouth:'Food enters the alimentary tract.',Esophagus:'Muscular contractions move food onward.',Reticulorumen:'Microbes ferment plant material. Cud can return to the mouth.',Omasum:'Digesta passes between folds where water is absorbed.',Abomasum:'Acid and enzymes begin gastric digestion.',Crop:'Food can be stored before further digestion.',Gizzard:'Muscular contractions grind food.',Tracheole:'Oxygen diffuses directly toward nearby tissues.',Spiracle:'Air enters through the body wall.',Parabronchial:'Air passes through the gas-exchange lung.',Kidney:'Renal tissue regulates solutes and excretes wastes.',Ureter:'Urine travels away from the kidney.',Bladder:'Urine accumulates before release.',Hemocoel:'Hemolymph bathes the tissues before returning to the heart.',Aorta:'Blood leaves the heart for systemic distribution.',Gonad:'Germ cells develop within gonadal tissue.'};
  lessons[row.region]=segments.map(e=>[e.name,actions[e.name]||(/gill lamella/i.test(e.name)?'Dissolved gases diffuse across the thin exchange surface.':details.split('. ')[0]+'.')]);
  if(segments.length>=4){
   const mid=Math.ceil(segments.length/2);
   for(const [suffix,subset] of [['proximal region',segments.slice(0,mid)],['distal region',segments.slice(mid-1)]])
    addGroup(system+' · '+suffix,subset,details);
  }
 }
 const cellNames=radial?['Neuronal soma','Neurite','Terminal']:['Neuronal soma','Axon','Terminal',invert?'Glial support cell':'Peripheral Schwann cell'];
 const cellRegion=name+' · Neural cells';
 const cells=cellNames.map((label,i)=>{
  const id='Fauna/'+name+'/Neural cells/'+label,p=[[0,0,0],[.8,0,0],[1.6,0,0],[.8,.13,0]][i];
  const shapes=i===1?[{kind:'path',pts:[[0,0,0],p,[1.6,0,0]],r:.055}]:[{kind:'ell',p,r:i===0?[.22,.19,.16]:[.15,.09,.09]}];
  if(!i)for(let j=-1;j<=1;j++)shapes.push({kind:'path',pts:[p,[-.35,.17*j,.06],[-.68,.39*j,.11]],r:.045});
  const e={id,name:label,region:cellRegion,system:'Neural cells',sourceUrl:'https://openstax.org/books/biology-2e/pages/35-1-neurons-and-glial-cells',description:'Shared cellular teaching diagram for '+name+'. Generic cell shapes omit fine ultrastructure.',parts:shapes.map(v=>({...v,id,color:colors[i]})),labels:[{id,name:label,p}]};systems.push(e);organs.push(e);return e;
 });addGroup('Neural cells',cells,descriptions['Neural cells']);
 addGroup('Integrated body',whole,'Relative positions of representative systems. Enlarged cellular views are separate.');
 atlas.push({name,latin,group,groups,organs});
}
const comparisons=[];
function compare(title,system,names){
 const children=[];
 for(const [i,name] of names.entries()){
  const profile=atlas.find(a=>a.name===name);
  const original=profile.groups.find(g=>g.system===system);
  for(const e of original.children){
   const shift=p=>[p[0],p[1]+(1-i)*3.5,p[2]];
   const id='Fauna/Compare/'+title+'/'+e.id,label=name+' · '+e.name;
   const clone={...e,id,name:label,region:title,parts:e.parts.map(v=>({...v,id,...(v.requires?{requires:'Fauna/Compare/'+title+'/'+v.requires}:{}),...(v.p?{p:shift(v.p)}:{pts:v.pts.map(shift)})})),labels:e.labels.map(l=>({...l,id,name:label,p:shift(l.p)}))};
   children.push(clone);systems.push(clone);
  }
 }
 const row={id:'Fauna/Compare/'+title,name:title,region:title,system,description:title,sourceUrl:children[0].sourceUrl,children};
 comparisons.push(row);systems.push(row);
}
compare('Neural organization · axial cord, ring and net','Nervous',['Dog','Starfish','Jellyfish']);
compare('Respiration · air sacs, gills and tracheae','Respiratory',['Chicken','Bony fish','Beetle']);
compare('Circulation · open and closed routes','Circulatory',['Crab','Octopus']);
P.faunaComparisons=comparisons;
P.faunaAtlas=atlas;
})();
