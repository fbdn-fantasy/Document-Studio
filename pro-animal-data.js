/* Original procedural comparison diagrams. No third-party meshes or images. */
'use strict';
(() => {
const species = [
 ['Dog','Canis lupus familiaris','mammal'],['Cat','Felis catus','mammal'],['Horse','Equus caballus','mammal'],['Cow','Bos taurus','mammal'],['Rabbit','Oryctolagus cuniculus','mammal'],['Bat','Myotis lucifugus','mammal'],['Dolphin','Tursiops truncatus','mammal'],
 ['Chicken','Gallus gallus domesticus','bird'],['Eagle','Haliaeetus leucocephalus','bird'],['Penguin','Aptenodytes forsteri','bird'],['Snake','Pantherophis guttatus','reptile'],['Turtle','Trachemys scripta','reptile'],['Crocodile','Crocodylus niloticus','reptile'],['Frog','Rana temporaria','amphibian'],['Salamander','Salamandra salamandra','amphibian'],['Bony fish','Danio rerio','fish'],['Shark','Squalus acanthias','fish'],
 ['Beetle','Tenebrio molitor','arthropod'],['Spider','Araneus diadematus','arthropod'],['Crab','Carcinus maenas','arthropod'],['Earthworm','Lumbricus terrestris','annelid'],['Snail','Cornu aspersum','mollusk'],['Octopus','Octopus vulgaris','mollusk'],['Jellyfish','Aurelia aurita','cnidarian'],['Starfish','Asterias rubens','echinoderm']
];
const chapters={mammal:'29-6-mammals',bird:'29-5-birds',reptile:'29-4-reptiles',amphibian:'29-3-amphibians',fish:'29-2-fishes',arthropod:'28-6-superphylum-ecdysozoa-arthropods',mollusk:'28-4-superphylum-lophotrochozoa-mollusks-and-annelids',annelid:'28-4-superphylum-lophotrochozoa-mollusks-and-annelids',cnidarian:'28-2-phylum-cnidaria',echinoderm:'28-7-superphylum-deuterostomia'};
const catalog=[],tau=2*Math.PI;
const series=(n,fn)=>Array.from({length:n},(_,i)=>fn(i));
const point=(p,r,color='base')=>({p,r,color});
const tube=(pts,r=.075,color='base')=>({kind:'path',pts,r,color});
const oval=(x,y,z,a,b,c,color)=>point([x,y,z],[a,b,c],color);
function makeSpecies([name,latin,group]){
 const key=name.toLowerCase().replace(/ /g,'-'),records=[];
 const sourceUrl='https://openstax.org/books/biology-2e/pages/'+chapters[group];
 function add(label,region,description,parts,landmarks,category='Skeleton/body support'){
  const legacyId=key+'/'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  // In V15 some forefeet and hindfeet shared the same lookup id. Old lookups opened the forefoot.
  const id=records.some(e=>e.id===legacyId)?legacyId+'-hindlimb':legacyId;
  const labels=Object.entries(landmarks).map(([name,p])=>({name,p,id}));
  const e={id,name:label,species:name,latin,group,category,region,description,sourceUrl,parts:parts.map(p=>({...p,id})),labels};
  records.push(e);return e;
 }
 const is=n=>name===n, bird=group==='bird', fish=group==='fish', snake=is('Snake'), frog=is('Frog'), bat=is('Bat'), dolphin=is('Dolphin');
 const vertebrate=['mammal','bird','reptile','amphibian','fish'].includes(group);
 if(vertebrate){
  const long=is('Horse')||is('Crocodile')||dolphin||is('Shark'), skullX=-2.05, skullY=bird||is('Horse')?1.45:.6;
  const muzzle=long?.98:bird?.62:frog?.2:.46;
  const jawTip=[skullX-muzzle,skullY-.15,0],skull=[skullX,skullY,0];
  add(is('Shark')?'Chondrocranium':'Skull','Head',is('Shark')?'Cartilage supports the brain and sensory organs.':'The cranium encloses the brain. The paired jaws frame the mouth.',[oval(...skull,.46,frog?.20:.37,frog?.48:.32),...[-1,1].map(j=>tube([[skullX+.2,skullY-.12,j*.24],[skullX-.2,skullY-.24,j*.25],jawTip],.09)),tube([skull,jawTip],.16)],{'Braincase':skull,'Rostral end':jawTip});
  const end=frog?.60:snake?5:fish||dolphin||is('Crocodile')||is('Salamander')?3.9:1.65;
  const centra=snake?37:frog?9:19;
  const spine=series(centra,i=>{const t=i/(centra-1);return [-1.68+(end+1.68)*t,.52+(skullY-.52)*Math.exp(-t*12)+(snake?.45*Math.sin(t*10):.13*Math.sin(t*5)),snake?.65*Math.sin(t*9):0];});
  add('Vertebral column','Axial',is('Shark')?'Schematic series of cartilaginous vertebral centra.':'A sampled series shows the axial column from the back of the skull toward the tail.',spine.map((p,i)=>point(p,[.17,.13,.14].map(v=>v*(1-.45*i/spine.length)))),{'Anterior centrum':spine[0],'Posterior centrum':spine.at(-1)});
  if(!frog&&!is('Turtle')&&!is('Shark')){
   const ribs=[];for(const p of spine.slice(3,snake?-3:10))for(const j of [-1,1])ribs.push(tube([p,[p[0]+.06,p[1]-.11,j*.43+p[2]],[p[0]+.15,p[1]-.5,j*.46+p[2]],[p[0]+.17,p[1]-.68,j*.26+p[2]]],.048));
   add('Rib series','Trunk','Paired curved elements illustrate the relation of ribs to the axial column. Repetitions are sampled.',ribs,{'Vertebral end':ribs[0].pts[0],'Distal rib':ribs[0].pts.at(-1)});
  }
  if(is('Turtle')){
   add('Carapace','Shell','The dorsal bony shell incorporates broadened ribs and vertebral elements.',[oval(0,.42,0,1.56,.61,.83)],{'Dorsal midline':[0,1.03,0],'Shell margin':[0,.42,.83]});
   add('Plastron','Shell','The ventral bony shell forms the floor of the shell.',[oval(0,-.16,0,1.37,.10,.72)],{'Anterior lobe':[-1.35,-.16,0],'Posterior lobe':[1.35,-.16,0]});
  }
  if(bird){
   add('Keeled sternum','Thorax','The ventral keel provides an attachment surface for flight musculature, including the swimming muscles of penguins.',[oval(-.25,0,0,.76,.13,.4),oval(-.25,-.19,0,.64,.3,.06)],{'Sternal plate':[-.25,0,.32],'Keel':[-.25,-.46,0]});
  }
  if(!fish&&!snake){
   for(const fore of [true,false]){
    if(dolphin&&!fore){add('Pelvic remnants','Pelvic region','Paired reduced pelvic bones are separate from the vertebral column.',[-1,1].map(j=>tube([[1.15,-.05,j*.28],[1.43,-.10,j*.31]],.06)),{'Pelvic element':[1.15,-.05,.28]});continue;}
    const x=fore?-.89:1.01,wing=fore&&(bird||bat||dolphin),leg=is('Horse')?1.55:is('Cow')?1.28:bird?.94:frog&&!fore?1.45:.84;
    for(const j of [-1,1]){
     const side=j===1?'Left':'Right',root=[x,.39,j*.27],joint=[x+(fore?.29:-.42),wing?.38:.39-leg*.53,j*(wing?(is('Eagle')?1.18:is('Penguin')?.75:.90):.39)],wrist=[x+(fore?-.05:.33),wing?.17:.39-leg,j*(wing?(is('Eagle')?2.1:is('Penguin')?1.31:1.7):.48)];
     const limb=fore?'Humerus':'Femur';
     add(side+' '+limb,fore?'Forelimb':'Hindlimb',limb+' spans the proximal limb between the girdle and the next joint.',[tube([root,joint],.11),point(root,[.13,.13,.13]),point(joint,[.13,.10,.12])],{'Proximal head':root,'Distal joint':joint});
     const distal=fore?(frog?'Radioulna':'Radius and ulna'):(frog?'Tibiofibula':bird?'Tibiotarsus':'Tibia');
     const parts=[tube([joint,wrist],.082)];if(fore&&!frog)parts.push(tube([joint,[joint[0]+.12,(joint[1]+wrist[1])/2,(joint[2]+wrist[2])/2],wrist],.052));
     add(side+' '+distal,fore?'Forelimb':'Hindlimb','Distal limb support between the elbow or knee and the wrist or ankle.',parts,{'Proximal end':joint,'Distal end':wrist});
     if(wing||is('Horse')||is('Cow')||is('Rabbit')||frog){
      const n=bat?4:dolphin?5:is('Cow')?2:is('Horse')?1:bird?1:3;
      const rays=series(n,i=>tube([wrist,[wrist[0]+(wing?.12:-.12),wrist[1]-.09,wrist[2]+j*(wing?.36:.03)],[wrist[0]+(wing?(i-(n-1)/2)*.30:-.31),wrist[1]-(wing?.12:.23),wrist[2]+j*(wing?(bat?1.28:.62):.12*i)]],.05));
      add(side+' '+(wing?(bat?'Elongated wing digits':dolphin?'Flipper digits':'Distal wing'):is('Horse')?'Digit III':is('Cow')?'Principal digits III and IV':'Distal foot'),fore?'Forelimb':'Hindlimb','Schematic distal supports. Individual phalanges are grouped along each illustrated ray.',rays,{'Proximal articulation':wrist,'Distal tip':rays[0].pts.at(-1)});
     }
    }
   }
  }else if(fish){
   for(const j of [-1,1]){
    const base=[-.9,.29,j*.24],tip=[-.4,-.38,j*1.12];
    add((j===1?'Left':'Right')+' pectoral fin supports','Fins',is('Shark')?'Cartilaginous basal and radial supports are shown as a fan.':'Segmented dermal fin rays spread from the base of the paired fin.',series(5,i=>tube([base,[tip[0]+i*.14,tip[1]+i*.05,tip[2]-j*i*.06]],.047)),{'Fin base':base,'Distal fan':tip});
   }
   add('Caudal fin supports','Tail',is('Shark')?'The axial skeleton extends into the upper caudal lobe.':'The caudal rays fan out behind the terminal axial skeleton.',series(9,i=>tube([spine.at(-1),[4.58,.47+(i-4)*.16,0]],.046)),{'Caudal base':spine.at(-1),'Upper margin':[4.58,1.11,0]});
  }
 }else if(group==='arthropod'){
  const crab=is('Crab'),spider=is('Spider'),count=crab?5:spider?4:3;
  const shell=(label,x,a,b)=>add(label,'Body cuticle','Cuticular covering of this body region. Interior tissue is omitted.',[oval(x,0,0,a,b,.36)],{'Anterior margin':[x-a,0,0],'Lateral margin':[x,b,0]});
  if(is('Beetle')){shell('Head capsule',-1.28,.37,.45);shell('Thoracic cuticle',-.58,.52,.62);for(const j of [-1,1])add((j===1?'Left':'Right')+' elytron','Forewings','A hardened forewing covers the abdomen and the folded flight wing.',[oval(.63,j*.34,.15,1,.31,.23)],{'Wing base':[-.28,j*.34,.15],'Apex':[1.59,j*.34,.15]});}
  else{shell(crab?'Carapace':'Prosoma carapace',-.38,crab?1.2:.65,crab?1:.65);if(spider)shell('Abdominal cuticle',.85,.75,.67);}
  for(const j of [-1,1])for(let i=0;i<count;i++){
   const x=crab?-.91+i*.30:spider?-.84+i*.25:-.91+i*.27,b=[x,j*.4,0],k=[x+(i-(count-1)/2)*.29,j*1.12,.23],tip=[k[0]+(i-(count-1)/2)*.33,j*(1.67+.12*Math.sin(i)),0];
   const claw=crab&&i===0,parts=[tube([b,k,tip],claw?.14:.075)];if(claw)parts.push(tube([k,[tip[0]+.18,tip[1]-.09,.03]],.09));
   add((j===1?'Left':'Right')+' '+(claw?'cheliped':'leg '+(crab?i:i+1)),'Appendages',claw?'The first leg bears the pincer.':'Jointed cuticular segments transmit movement around flexible articulations.',parts,{'Body articulation':b,'Distal end':tip});
  }
 }else if(is('Earthworm')){
  const tubeRing=(x,r)=>tube(series(25,i=>[x,r*Math.cos(tau*i/24),r*Math.sin(tau*i/24)]),.05);
  add('Circular muscle layers','Body wall','Contraction narrows a segment and lengthens it against coelomic fluid.',series(15,i=>tubeRing(-2.1+i*.30,.37)),{'Circumferential band':[0,.37,0]});
  add('Longitudinal muscle layer','Body wall','Longitudinal shortening widens segments during crawling.',series(6,i=>tube([[-2.12,.31*Math.cos(i),.31*Math.sin(i)],[2.12,.31*Math.cos(i),.31*Math.sin(i)]],.044)),{'Axial fibres':[0,.31,0]});
  add('Segmental coelom','Hydrostatic support','Fluid compartments act against the body-wall muscles. Rings mark representative segment boundaries.',series(9,i=>oval(-1.6+i*.4,0,0,.18,.25,.25,'accent')),{'Fluid compartment':[0,0,0]});
 }else if(is('Snail')){
  const spiral=series(81,i=>{const a=i*tau/28,r=.04+i*.012;return [r*Math.cos(a),.35+r*Math.sin(a),i*.005];});
  add('Coiled shell','Shell','The shell grows at its aperture around a spiral axis.',[tube(spiral,.16)],{'Apex':spiral[0],'Aperture':spiral.at(-1)});
  add('Muscular foot','Locomotor support','A broad ventral foot supports the body and advances by muscular waves.',[oval(.12,-.69,0,1.48,.23,.52)],{'Sole':[.12,-.92,0],'Anterior end':[-1.32,-.69,0]});
 }else if(is('Octopus')||is('Starfish')){
  const oct=is('Octopus'),n=oct?8:5;
  add(oct?'Mantle musculature':'Central disc ossicles','Central body',oct?'Mantle muscles enclose the mantle cavity.':'Calcareous ossicles form an internal support network in the disc.',oct?[oval(0,.62,-.32,.55,.90,.50)]:series(10,i=>oval(.34*Math.cos(i*tau/10),.34*Math.sin(i*tau/10),0,.17,.17,.12)),{'Central region':[0,oct?.62:0,0]});
  for(let i=0;i<n;i++){const a=tau*i/n,pts=series(13,k=>{const r=.38+k*.12;return [r*Math.cos(a+k*(oct?.037:.008)),r*Math.sin(a+k*(oct?.037:.008)),.12*Math.sin(k*.36)];});
   add('Arm '+(i+1)+(oct?' muscular hydrostat':' ossicle series'),'Arms',oct?'Longitudinal, transverse and oblique muscles change arm shape while conserving volume.':'A sampled row represents the articulated endoskeletal ossicles of the arm.',oct?[tube(pts.slice(0,6),.15),tube(pts.slice(5,10),.10),tube(pts.slice(9),.05)]:pts.map((p,k)=>point(p,[.16-k*.006,.14-k*.005,.11])),{'Arm base':pts[0],'Arm tip':pts.at(-1)});
  }
 }else{
  const ring=(r,y)=>tube(series(33,i=>[r*Math.cos(tau*i/32),y,r*Math.sin(tau*i/32)]),.05);
  add('Bell mesoglea','Bell','The hydrated elastic layer between epithelia helps the bell regain its shape.',series(9,i=>ring(.17+i*.15,.76*Math.cos(i*Math.PI/16))),{'Bell apex':[0,.76,0],'Bell margin':[1.37,0,0]});
  add('Subumbrellar muscle','Bell underside','The circular swimming muscles contract the bell during propulsion.',[ring(1.18,-.06),ring(1.05,-.02)],{'Contractile ring':[1.18,-.06,0]});
  add('Oral arms','Oral region','Four soft oral arms extend beneath the bell around the mouth.',series(4,i=>tube([[.12*Math.cos(i*tau/4),.18,.12*Math.sin(i*tau/4)],[.3*Math.cos(i*tau/4),-.54,.3*Math.sin(i*tau/4)],[.42*Math.cos(i*tau/4),-1.05,.42*Math.sin(i*tau/4)]],.10)),{'Oral attachment':[0,.18,0],'Distal arm':[.42,-1.05,0]});
 }
 if(is('Frog'))add('Urostyle','Pelvis','A slender rod extends posteriorly along the pelvic axis.',[tube([[.56,.55,0],[1.55,.40,0]],.09)],{'Anterior articulation':[.56,.55,0],'Posterior tip':[1.55,.40,0]});
 if(['Dog','Cat','Rabbit','Cow','Horse','Bat','Eagle','Chicken','Penguin'].includes(name)){
  const length={Dog:1.45,Cat:1.92,Rabbit:.30,Cow:1.73,Horse:1.02,Bat:.58,Eagle:.37,Chicken:.34,Penguin:.28}[name];
  const pts=series(9,i=>[1.62+i*length/8,.41-(name==='Cat'?-.3:.45)*Math.sin(i/8*1.5),.12*Math.sin(i/8*2)]);
  add(bird?'Caudal vertebrae and pygostyle':'Caudal vertebrae','Tail',bird?'A short caudal series terminates in the fused pygostyle.':'The tail tapers distally. Segment number and length are illustrative.',pts.map((p,i)=>point(p,[length/13,.11-i*.008,.10-i*.007])),{'Tail base':pts[0],'Distal end':pts.at(-1)});
 }
 if(vertebrate&&!fish&&!snake){
  for(const side of [-1,1]){
   const prefix=side===1?'Left ':'Right ',shoulder=[-.89,.39,side*.27];
   add(prefix+'scapula','Shoulder girdle','The shoulder blade meets the upper forelimb at the glenoid region.',[{kind:'plate',pts:[shoulder,[-.52,.81,side*.36],[-.19,.71,side*.34]],depth:.08,color:'base'},point(shoulder,[.12,.1,.11])],{'Glenoid region':shoulder,'Blade':[-.52,.81,side*.36]});
   if(!dolphin)add(prefix+'pelvic girdle','Pelvic region','The illustrated half-girdle connects the hip joint to the axial skeleton.',[tube([[.55,.61,side*.15],[1.01,.39,side*.27],[1.32,.25,side*.24]],.12)],{'Hip socket':[1.01,.39,side*.27],'Iliac region':[.55,.61,side*.15]});
  }
 }
 if(bird)add('Furcula','Shoulder girdle','The fused clavicles form a spring-like brace between the shoulders.',[tube([[-.94,.47,-.42],[-1.02,-.08,0],[-.94,.47,.42]],.06)],{'Midline junction':[-1.02,-.08,0],'Lateral tip':[-.94,.47,.42]});
 if(is('Crocodile'))add('Dorsal osteoderms','Integument','Dermal bony plates reinforce the dorsal body surface.',series(14,i=>oval(-.85+Math.floor(i/2)*.32,.75,i%2?.23:-.23,.14,.05,.16)),{'Dorsal plate':[.11,.75,.23]});
 if(is('Shark'))add('Branchial arches','Pharynx','Paired cartilaginous arches support the gill region behind the jaws.',series(10,i=>{const x=-1.62+Math.floor(i/2)*.13,j=i%2?1:-1;return tube([[x,.62,0],[x,.44,j*.34],[x,.04,j*.27],[x,-.08,0]],.044);}),{'Dorsal arch':[-1.62,.62,0],'Ventral arch':[-1.62,-.08,0]});
 if(is('Octopus'))add('Beak','Buccal mass','Two opposed chitinous jaws are embedded in the central buccal mass.',[tube([[-.19,.10,.25],[0,.04,.36],[.08,-.13,.38]],.07),tube([[.17,-.17,.29],[0,-.10,.35],[-.06,-.01,.40]],.06)],{'Upper jaw':[0,.04,.36],'Lower jaw':[0,-.10,.35]});
 const support=records.slice();
 const whole={id:key,name:'Whole body · '+name,species:name,latin,group,category:'Skeleton/body support',region:'Whole body',description:'Whole-body support overview for '+latin+'. Select an individual structure to display its landmarks.',sourceUrl,children:support};
 function cell(label,family,desc,parts,marks){const e=add(label,'Cells',desc,parts,marks,'Cells');e.family=family;}
 if(vertebrate){
  const mammal=group==='mammal';
  const rings=series(15,i=>{const a=tau*i/15;return oval(.65*Math.cos(a),.62*Math.sin(a),0,.32,.30,.18,'membrane');});
  cell('Mature erythrocyte',mammal?'Mammalian erythrocyte':'Nucleated vertebrate erythrocyte',mammal?'Shared mammalian model. A mature red cell lacks a nucleus. The central depression is shown in relief.':'Shared non-mammalian vertebrate model. A central nucleus occupies part of the oval cell. Dimensions vary by species.',mammal?[oval(0,0,0,.79,.76,.085,'membrane'),...rings]:[oval(0,0,0,1.05,.58,.20,'membrane'),oval(0,0,.16,.39,.23,.14,'nucleus')],mammal?{'Central depression':[0,0,.085],'Thick rim':[.67,0,.18]}:{'Nucleus':[0,0,.28],'Cell margin':[1.05,0,0]});
 }
 if(vertebrate){
  records.at(-1).reference=['https://openstax.org/books/biology/pages/40-2-components-of-the-blood','OpenStax · blood cell comparison'];
  cell('Multipolar motor neuron','Shared human and vertebrate motor neuron','The same motor-neuron geometry used in the human catalog illustrates the soma, dendrites and axon. Branch counts and axon length are schematic.',[],{});
  records.at(-1).humanModel='Multipolar motor neuron';
 }
 if(group==='arthropod'||group==='mollusk'||group==='echinoderm'||group==='annelid'){
  const label=group==='arthropod'||group==='mollusk'?'Phagocytic hemocyte':'Phagocytic coelomocyte';
  const rim=series(22,i=>{const a=tau*i/22,r=.67+.13*Math.cos(5*a);return [r*Math.cos(a),r*Math.sin(a),.04*Math.sin(2*a)];});
  cell(label,'Invertebrate phagocyte', 'A mobile immune cell extends processes and encloses particles in vesicles. This comparison model groups phagocytic cell forms. Subtype names and granule content vary.',[{kind:'plate',pts:rim,depth:.19,color:'membrane'},oval(-.19,.04,.16,.25,.21,.12,'nucleus'),oval(.28,-.16,.19,.13,.13,.11,'lipid')],{'Cell process':rim[0],'Nucleus':[-.19,.04,.22],'Phagocytic vesicle':[.28,-.16,.25]});
 }
 if(is('Octopus')){
  const rays=series(10,i=>{const a=tau*i/10;return tube([[.36*Math.cos(a),.36*Math.sin(a),0],[1.06*Math.cos(a),1.06*Math.sin(a),.06]],.048,'accent');});
  cell('Chromatophore organ','Cephalopod pigment cell and radial muscles','The central cell contains an elastic pigment sac. Separate radial muscle cells pull the sac outward. The diagram shows the multicellular organ.',[oval(0,0,0,.46,.46,.17,'lipid'),...rays],{'Pigment sac':[0,0,.17],'Radial muscle':rays[0].pts[1]});
  records.at(-1).reference=['https://pubmed.ncbi.nlm.nih.gov/11762491/','Cephalopod chromatophores · review'];
 }
 if(is('Bony fish')){
  cell('Gill ionocyte','Freshwater fish ionocyte','An ion-transporting epithelial cell presents an apical surface to the water and contains many mitochondria. Transporter subtypes are omitted.',[oval(0,0,0,.62,.86,.36,'membrane'),oval(0,-.35,.28,.20,.18,.12,'nucleus'),...series(8,i=>oval(.37*Math.cos(i*tau/8),.45*Math.sin(i*tau/8),.29,.12,.065,.06,'mito')),tube([[-.32,.7,.13],[0,.79,.17],[.32,.7,.13]],.055,'accent')],{'Apical interface':[0,.79,.17],'Mitochondria':[.37,0,.30],'Nucleus':[0,-.35,.33]});
  records.at(-1).reference=['https://pubmed.ncbi.nlm.nih.gov/14598386/','Freshwater fish ion transport · review'];
 }
 if(group==='cnidarian'){
  const coil=series(39,i=>[.26*Math.cos(i*.54),-.35+i*.018,.20*Math.sin(i*.54)+.12]);
  cell('Cnidocyte','Cnidarian stinging cell','The nematocyst capsule stores a coiled tubule. This view shows the undischarged state.',[oval(0,0,0,.7,1,.32,'membrane'),oval(0,-.65,.22,.22,.15,.12,'nucleus'),oval(0,.1,.12,.38,.55,.17,'lipid'),tube(coil,.038,'accent'),tube([[0,.69,0],[0,1.12,.09]],.04,'accent')],{'Capsule':[.36,.12,.22],'Coiled tubule':coil[12],'Trigger region':[0,1.08,.08]});
 }else{
 const muscle=vertebrate||group==='arthropod';
 const myo=[oval(0,0,0,1.45,.32,.26,'membrane'),...series(4,i=>tube([[-1.13,(i-1.5)*.11,.17],[1.13,(i-1.5)*.11,.17]],.026,'accent')),oval(-.9,.16,.17,.21,.09,.07,'nucleus')];
 if(muscle)for(let i=0;i<11;i++)myo.push(tube([[-.93+i*.18,-.18,.22],[-.93+i*.18,.18,.22]],.026,'mito'));
 cell(muscle?'Striated muscle fibre':'Contractile muscle cell',muscle?'Striated muscle comparison':'Invertebrate contractile cell',muscle?'Shared contractile-fibre diagram. Bands indicate repeating contractile units. Nuclear position, fibre size and band spacing are illustrative.':'Shared teaching model of a contractile cell. Filaments run along the long axis. Ultrastructure and arrangement differ between tissues.',myo,{'Contractile filaments':[.4,.16,.18],'Nucleus':[-.9,.16,.2]});
 }
 catalog.push(whole,...records);
}
species.forEach(makeSpecies);
const api={species,catalog};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof FTEPro!=='undefined'){FTEPro.animalData=api;FTEPro.medicalData.animals=catalog;}
})();
