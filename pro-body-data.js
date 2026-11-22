// Original schematic geometry. X increases toward anatomical left, Y superiorly.
'use strict';
(()=>{
const D=FTEPro.medicalData, catalog=[], systems=[], groups=[];
let group,system,source,region,description;
function start(name,chapter){system=name;source='https://openstax.org/books/anatomy-and-physiology-2e/pages/'+chapter;systems.push(name);}
function section(name,detail){region=name;description=detail;group={id:system+'/'+name,name,region,system,description,sourceUrl:source,children:[]};groups.push(group);}
function part(name,shape,color){
 const id=group.id+'/'+name;
 const p=shape.p||shape.pts[Math.floor(shape.pts.length/2)];
 const item={id,name,region,system,description,sourceUrl:source,parts:[{...shape,color,id}],labels:[{id,name,p}]};
 group.children.push(item);catalog.push(item);return item;
}
const ell=(name,p,r,color)=>part(name,{kind:'ell',p,r},color);
const tube=(name,pts,r,color)=>part(name,{kind:'path',pts,r},color);
const pink='#d5818d',red='#bf525c',blue='#5186ba',gold='#d9ac59',green='#78a78c',lilac='#a38ec1';
start('Digestive','23-1-overview-of-the-digestive-system');
section('Upper digestive tract','Food passes through the pharynx and esophagus to the stomach. Accessory organs drain into the duodenum.');
ell('Oral cavity',[0,8,.4],[.48,.24,.35],pink);
tube('Pharynx',[[0,8,.4],[0,7.7,-.15],[0,7,-.18]],.18,pink);
tube('Esophagus',[[0,7,-.18],[0,5,-.3],[.15,3.4,-.28],[.5,2.8,0]],.14,pink);
ell('Stomach',[.63,2.58,0],[.56,.53,.34],pink);
ell('Liver',[-.65,2.85,.16],[.92,.43,.49],'#985b56');
ell('Gallbladder',[-.52,2.48,.18],[.19,.31,.18],green);
ell('Pancreas',[.2,2.07,-.27],[.7,.18,.21],gold);
tube('Common bile duct',[[-.52,2.48,.18],[-.49,2.15,.1],[-.4,1.91,0]],.075,green);
tube('Pancreatic duct',[[.82,2.1,-.27],[.2,2.07,-.27],[-.4,1.91,0]],.05,gold);
section('Intestines and rectum','Duodenum, jejunum and ileum lead to the cecum. The colon frames the small intestine and ends at the rectum and anal canal.');
tube('Duodenum',[[.45,2.4,0],[-.3,2.32,0],[-.48,2.08,0],[-.4,1.91,0],[.1,1.88,0]],.16,pink);
tube('Jejunum',[[.1,1.88,0],[.74,1.65,.2],[-.65,1.43,.22],[.7,1.18,.22],[-.5,1.05,.23]],.14,pink);
tube('Ileum',[[-.5,1.05,.23],[.62,.82,.18],[-.5,.62,.2],[.4,.4,.1],[-.86,.29,0]],.13,pink);
tube('Colon',[[-.86,.29,0],[-1.02,.14,0],[-1,1.9,.22],[-.3,2.15,.35],[.5,1.98,.36],[1.02,2.09,.24],[1.01,.45,0],[.65,.1,0],[.64,-.18,0],[0,-.25,-.28]],.19,'#b57b71');
tube('Rectum and anal canal',[[0,-.25,-.28],[0,-.88,-.25],[0,-1.22,-.15]],.17,pink);
start('Respiratory','22-1-organs-and-structures-of-the-respiratory-system');
section('Airways and lungs','Air descends the trachea into paired bronchi. The distal airway and alveolar detail uses a separate enlarged scale.');
tube('Nasal airway',[[0,8.55,.68],[0,8.4,0],[0,7.7,-.15],[0,7.15,.1]],.17,pink);
tube('Larynx and trachea',[[0,7.15,.1],[0,6.5,.13],[0,5.55,.13]],.2,blue);
for(const [x,side] of [[-1,'Right'],[1,'Left']]){
 tube(side+' main bronchus',[[0,5.55,.13],[x*.48,5.25,.05],[x*.84,4.85,0]],.14,blue);
 ell(side+' lung',[x*.91,4.82,-.02],[.58,1.14,.48],pink);
}
section('Alveolar exchange unit','A sampled bronchiole opens into an alveolar duct. Oxygen diffuses toward capillary blood and carbon dioxide diffuses toward air.');
tube('Bronchiole',[[-1,1,0],[-.45,.7,0],[0,.3,0]],.16,blue);
tube('Alveolar duct',[[0,.3,0],[.28,0,0],[.72,-.15,0]],.1,blue);
for(let i=0;i<5;i++)ell('Alveolus '+(i+1),[.48+.33*Math.cos(i*1.25),-.22+.28*Math.sin(i*1.25),.12*Math.sin(i)],[.23,.23,.2],pink);
tube('Pulmonary capillary',[[-.1,-.26,.2],[.1,-.5,.22],[.48,-.59,.2],[.84,-.46,.1],[.96,-.18,0]],.07,red);
start('Cardiovascular','19-1-heart-anatomy');
section('Heart and great vessels','The right heart sends venous blood to the lungs. Pulmonary veins return blood to the left heart for systemic distribution.');
for(const [name,x,y,c] of [['Right atrium',-.3,4.93,blue],['Right ventricle',-.16,4.43,blue],['Left atrium',.36,4.94,red],['Left ventricle',.42,4.39,red]])ell(name,[x,y,.35],[.29,.32,.27],c);
tube('Venae cavae',[[-.4,6.4,.22],[-.3,4.93,.35],[-.4,3.5,.05],[-.38,.2,-.23]],.14,blue);
tube('Pulmonary trunk and right artery',[[-.16,4.43,.35],[.02,5.3,.45],[-.88,5.05,0]],.14,blue);
tube('Left pulmonary artery',[[.02,5.3,.45],[.84,5.06,0]],.12,blue);
for(const x of [-1,1])tube((x<0?'Right':'Left')+' pulmonary veins',[[x*.83,4.78,-.1],[.36,4.94,.35]],.09,red);
tube('Aorta',[[.42,4.39,.35],[.18,5.35,.22],[.48,5.58,0],[.53,5.3,-.28],[.24,3,-.4],[.17,.4,-.4]],.15,red);
for(const x of [-1,1]){
 tube((x<0?'Right':'Left')+' carotid pathway',[[.39,5.52,0],[x*.39,6.2,-.1],[x*.42,7.95,-.12]],.085,red);
 tube((x<0?'Right':'Left')+' iliac and femoral pathway',[[.17,.4,-.4],[x*.72,-.45,-.1],[x*.8,-3.4,.05]],.1,red);
}
start('Lymphatic','21-1-anatomy-of-the-lymphatic-and-immune-systems');
section('Lymphatic drainage','Representative nodes and collecting vessels are shown. The thoracic duct drains into the left venous angle.');
tube('Thoracic duct',[[0,1.7,-.45],[-.1,3.8,-.48],[.16,5.35,-.45],[.51,6.15,-.2],[.71,6.02,-.05]],.075,green);
ell('Cisterna chyli',[0,1.7,-.45],[.18,.28,.13],green);
ell('Spleen',[1.25,2.77,-.24],[.27,.5,.26],lilac);
ell('Thymus',[0,5.53,.32],[.35,.39,.13],pink);
for(const x of [-1,1]){
 const side=x<0?'Right':'Left';
 for(const [n,y,a] of [['cervical',6.7,.51],['axillary',5.37,1.48],['inguinal',-.35,.78]])ell(side+' '+n+' nodes',[x*a,y,.1],[.15,.27,.14],green);
 tube(side+' lumbar lymph trunk',[[x*.78,-.35,.1],[x*.45,.6,0],[0,1.7,-.45]],.06,green);
}
start('Urinary','25-3-gross-anatomy-of-the-kidney');
section('Kidneys and outflow','Paired ureters convey urine from the renal pelves to the bladder. The urethra carries it out of the body.');
for(const x of [-1,1]){
 let side=x<0?'Right':'Left',y=2.3+x*.13;
 ell(side+' kidney',[x*.81,y,-.54],[.37,.59,.29],red);
 tube(side+' renal pelvis and ureter',[[x*.72,y,-.52],[x*.52,y-.13,-.51],[x*.53,.75,-.38],[x*.36,-.26,.12],[x*.17,-.53,.26]],.076,gold);
}
ell('Urinary bladder',[0,-.55,.27],[.47,.38,.33],gold);
tube('Urethra',[[0,-.78,.27],[0,-1.18,.22]],.085,gold);
section('Nephron detail','Pressure drives water and small solutes into the capsule. Tubules modify filtrate by reabsorption and secretion before collection.');
tube('Afferent arteriole',[[-1.3,1,0],[-.78,.85,0]],.09,red);
ell('Glomerulus',[-.6,.8,0],[.21,.21,.16],red);
tube('Glomerular capsule',[[-.85,.95,0],[-.88,.68,0],[-.7,.48,0],[-.43,.52,0],[-.32,.77,0]],.075,gold);
tube('Proximal tubule',[[-.32,.77,0],[-.05,1.05,.1],[.13,.75,0],[-.06,.53,0],[.19,.37,0]],.09,gold);
tube('Nephron loop',[[.19,.37,0],[.19,-1.05,0],[.33,-1.2,0],[.48,-1.05,0],[.48,.48,0]],.07,gold);
tube('Distal tubule',[[.48,.48,0],[.32,.81,.12],[.55,1,0],[.76,.74,0],[1,.68,0]],.08,gold);
tube('Collecting duct',[[1,1,0],[1,.68,0],[1,-1.32,0]],.1,gold);
start('Endocrine','17-1-an-overview-of-the-endocrine-system');
section('Endocrine glands','Hormones enter the circulation. Gland positions are schematized and their sizes are exaggerated for visibility.');
ell('Pituitary',[0,8.46,-.05],[.15,.13,.13],lilac);
ell('Pineal gland',[0,8.78,-.45],[.1,.1,.1],lilac);
for(const x of [-1,1]){
 ell((x<0?'Right':'Left')+' thyroid lobe',[x*.25,6.6,.25],[.2,.37,.17],pink);
 ell((x<0?'Right':'Left')+' adrenal gland',[x*.81,2.85+x*.13,-.54],[.27,.17,.21],gold);
}
tube('Thyroid isthmus',[[-.23,6.52,.25],[.23,6.52,.25]],.09,pink);
ell('Pancreatic islet region',[.16,2.08,-.28],[.69,.14,.2],gold);
start('Reproductive','27-2-anatomy-and-physiology-of-the-female-reproductive-system');
section('Uterus and adnexa','Oocytes are released near the fimbriae. Uterine tubes lead into the uterus, which communicates with the vagina through the cervix.');
ell('Uterus',[0,-.37,-.04],[.45,.48,.24],pink);
for(const x of [-1,1]){
 ell((x<0?'Right':'Left')+' ovary',[x*.87,-.27,-.07],[.22,.14,.15],lilac);
 tube((x<0?'Right':'Left')+' uterine tube',[[x*.27,-.15,0],[x*.52,.05,.04],[x*.82,.06,.08],[x*.98,-.09,.06]],.085,pink);
}
tube('Cervix and vagina',[[0,-.68,-.04],[0,-.88,-.04],[0,-1.34,.12]],.15,pink);
section('Testes and accessory ducts','Sperm pass through the epididymis and ductus deferens, then through ejaculatory ducts to the urethra.');
group.sourceUrl=source='https://openstax.org/books/anatomy-and-physiology-2e/pages/27-1-anatomy-and-physiology-of-the-male-reproductive-system';
for(const x of [-1,1]){
 ell((x<0?'Right':'Left')+' testis',[x*.35,-1.55,.3],[.21,.3,.21],lilac);
 tube((x<0?'Right':'Left')+' epididymis and ductus deferens',[[x*.37,-1.6,.13],[x*.5,-1.35,.18],[x*.65,-.65,.12],[x*.48,-.32,-.27],[x*.13,-.68,-.2]],.07,gold);
}
ell('Prostate',[0,-.76,.02],[.29,.2,.21],pink);
tube('Ejaculatory duct and urethral route',[[.13,-.68,-.2],[0,-.8,.03],[0,-1,.14],[0,-1.18,.75]],.08,gold);
start('Nervous','13-2-the-central-nervous-system');
section('Neuraxis and peripheral nerves','Representative spinal roots and peripheral trunks show trajectories. Peripheral branching and dermatomes are omitted.');
ell('Cerebrum',[0,8.88,-.19],[.79,.7,.75],pink);
ell('Cerebellum',[0,8.37,-.64],[.51,.32,.33],lilac);
tube('Brainstem',[[0,8.58,-.28],[0,8.15,-.4],[0,7.85,-.38]],.19,gold);
tube('Spinal cord',[[0,7.85,-.38],[0,6,-.48],[0,3.5,-.56],[0,1.85,-.55]],.14,gold);
for(const x of [-1,1]){
 tube((x<0?'Right':'Left')+' brachial plexus pathway',[[0,6.45,-.48],[x*.64,6.1,-.24],[x*1.5,5.72,0],[x*1.91,3.2,.05]],.09,gold);
 tube((x<0?'Right':'Left')+' lumbosacral roots and sciatic nerve',[[0,2,-.55],[x*.27,.56,-.49],[x*.77,-.52,-.39],[x*.79,-3.5,-.27]],.1,gold);
}
section('Brain lobes and coverings','External lobes share a continuous cortex. Coverings are represented as sampled layers over one hemisphere.');
for(const x of [-1,1]){
 const side=x<0?'Right':'Left';
 for(const [n,y,z,r,c] of [['frontal',.32,.62,[.55,.69,.48],pink],['parietal',.53,-.12,[.54,.51,.54],gold],['temporal',-.26,.08,[.53,.36,.6],green],['occipital',.13,-.68,[.48,.48,.39],lilac]])ell(side+' '+n+' lobe',[x*.48,y,z],r,c);
}
for(const [i,n] of ['Pia mater','Arachnoid mater','Dura mater'].entries())tube(n,[[.08,.88+i*.06,.38],[.48,1.02+i*.06,.16],[.84,.88+i*.06,-.03],[1.01+i*.04,.49,-.12]],.03,lilac);
section('Brain midline section','A medial teaching section exposes the commissure, diencephalon, hindbrain and ventricular route. Lateral ventricles are projected into this view.');
ell('Thalamus',[0,.28,0],[.32,.29,.44],lilac);ell('Hypothalamus',[0,-.02,.15],[.23,.17,.25],pink);
tube('Corpus callosum',[[0,.42,.68],[0,.76,.52],[0,.83,.03],[0,.69,-.53],[0,.49,-.59]],.115,gold);
tube('Lateral ventricle',[[.18,.46,.52],[.18,.62,.24],[.18,.58,-.35],[.18,.29,-.49],[.18,.12,-.18]],.075,blue);
ell('Third ventricle',[0,.25,.08],[.05,.26,.23],blue);
tube('Cerebral aqueduct',[[0,.17,-.12],[0,-.07,-.35],[0,-.36,-.43]],.045,blue);
ell('Fourth ventricle',[0,-.42,-.46],[.1,.19,.13],blue);
ell('Midbrain',[0,-.09,-.21],[.25,.23,.23],gold);ell('Pons',[0,-.41,-.16],[.31,.22,.28],pink);
tube('Medulla and cervical cord',[[0,-.51,-.24],[0,-.78,-.3],[0,-1.32,-.33]],.15,gold);
ell('Sectioned cerebellum',[0,-.44,-.76],[.47,.36,.32],lilac);
section('Corticospinal pathway','A representative descending motor pathway crosses in the caudal medulla and reaches a spinal motor neuron. Synapses and axon counts are schematic.');
tube('Upper motor neuron trajectory',[[-.55,1,.08],[-.22,.6,0],[-.14,.15,-.15],[-.14,-.23,-.21],[.13,-.37,-.23],[.13,-.97,-.25]],.075,lilac);
tube('Lower motor neuron trajectory',[[.13,-.97,-.25],[.55,-1,.03],[.94,-1.16,.11]],.075,gold);
for(const type of ['Multipolar','Bipolar','Pseudounipolar']){
 section(type+' neuron and synapse','Signals travel along the axon to terminals. Myelin is segmented at nodes of Ranvier. At the chemical synapse a narrow gap separates the terminal and target.');
 let soma=type==='Pseudounipolar'?[-.5,.65,0]:[-.66,0,0];
 ell('Soma',soma,[.24,.22,.19],pink);
 if(type==='Pseudounipolar')tube('Stem process',[soma,[-.5,0,0]],.065,gold);
 for(let i=0;i<(type==='Multipolar'?4:1);i++){
 let dy=(i-(type==='Multipolar'?1.5:0))*.23;
 tube(type==='Pseudounipolar'?'Peripheral process':'Dendrite '+(i+1),[[-1.72,dy*1.6,.05],[-1.25,dy,.12],[-.9,dy*.7,0],[-.5,0,0]],.06,pink);
 }
 tube('Axon',[[-.5,0,0],[.5,0,0],[1.22,.02,.04]],.065,gold);
 for(let i=0;i<3;i++){ell('Myelin segment '+(i+1),[-.18+i*.42,0,0],[.17,.12,.12],blue);if(i<2)ell('Node of Ranvier '+(i+1),[.03+i*.42,0,0],[.035,.069,.069],gold);}
 for(const y of [-.22,.21])tube(y<0?'Inferior terminal':'Superior terminal',[[1.22,.02,.04],[1.42,y,.06],[1.54,y,.06]],.07,pink);
 tube('Postsynaptic membrane',[[1.68,-.43,0],[1.67,0,.05],[1.68,.43,0]],.055,green);
}
section('Ascending touch pathway','A sampled discriminative touch pathway ascends ipsilaterally in the dorsal columns, crosses in the medulla, relays in the thalamus and reaches sensory cortex.');
tube('Dorsal column afferent',[[-1,-1,.12],[-.4,-.8,-.15],[-.16,-.76,-.3],[-.16,.04,-.35]],.07,blue);
tube('Medial lemniscus',[[-.16,.04,-.35],[.14,.18,-.28],[.2,.68,-.12]],.075,lilac);
tube('Thalamocortical projection',[[.2,.68,-.12],[.42,.86,0],[.75,1.12,.12]],.075,gold);
section('Supporting glia','Astrocytes support local homeostasis. Oligodendrocytes myelinate CNS axons. Microglia survey the tissue. Schwann cells myelinate peripheral axons.');
for(const [i,n,c] of [[0,'Astrocyte',green],[1,'Oligodendrocyte',blue],[2,'Microglia',lilac],[3,'Schwann cell',gold]]){
 const x=(i%2)*1.5-.75,y=.65-Math.floor(i/2)*1.35;
 const cell=ell(n,[x,y,0],i===3?[.42,.15,.17]:[.18,.17,.15],c);
 for(let j=0;j<(i===3?0:6);j++){const a=j*Math.PI/3;cell.parts.push({id:cell.id,kind:'path',color:c,r:.04,pts:[[x,y,0],[x+.27*Math.cos(a),y+.27*Math.sin(a),.07],[x+.47*Math.cos(a+.16),y+.46*Math.sin(a+.16),-.04]]});}
}
const bodyRegions=new Set(['Upper digestive tract','Intestines and rectum','Airways and lungs','Heart and great vessels','Lymphatic drainage','Kidneys and outflow','Endocrine glands','Uterus and adnexa','Testes and accessory ducts','Neuraxis and peripheral nerves']);
const integrated=[];
for(const reproductive of ['Uterus and adnexa','Testes and accessory ducts']){
 const children=groups.filter(g=>bodyRegions.has(g.name)&&(g.system!=='Reproductive'||g.name===reproductive)).flatMap(g=>g.children);
 integrated.push({id:'Integrated/'+reproductive,name:'Integrated body · '+reproductive,system:'Integrated body',region:'Whole body',sourceUrl:source,description:'Eight systems share a single anterior coordinate frame. Select one structure to inspect its course.',children});
}
const fullDigest={id:'Digestive/Complete route',name:'Complete digestive route',system:'Digestive',region:'Whole system',sourceUrl:groups[0].sourceUrl,description:'The upper and lower alimentary tract are shown together with accessory organs.',children:groups.filter(g=>g.system==='Digestive').flatMap(g=>g.children)};
groups.push(fullDigest);
D.systems=[...integrated,...groups,...catalog];
FTEPro.bodyAtlas={groups,systems,integrated,catalog};
})();
