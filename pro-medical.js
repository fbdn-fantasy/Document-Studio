'use strict';
(()=>{const P=FTEPro,D=P.medicalData,V=P.v8,E=FTEProCore.escape;
const sourceBase='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const conventions='Conventional adult count: 80 axial + 126 appendicular = 206. The sacrum, coccyx and each hip bone count as one fused adult bone; the sternum counts as one. Both patellae are included. Teeth, variable sutural bones and additional sesamoids are excluded. Rib number, fusion and accessory bones vary between people. Left/right always mean the subject’s sides.';
const limits='Educational atlas. The viewer identifies reference surfaces and teaching reconstructions. Other structures and sections are teaching models. Proportions, surface detail and organelle numbers are simplified; colors are arbitrary. Cell interiors use a transparent-envelope schematic, with internal parts drawn over the membrane. Similar-looking lineages cannot be distinguished by shape alone. Bone assemblies are schematic; small skull, wrist and ear structures may overlap. Select a bone to inspect it separately. No external connection is needed.';
function defaults(kind,id,dimension){const e=D[kind].find(x=>x.id===id);return {type:'v9medical',kind,id,title:e?.name||P.anatomy.assemblies.find(a=>a[0]===id)?.[1]||id,dimension,view:{rx:kind==='animals'?.22:kind==='bones'&&/foot/i.test(id)?1.0:0,ry:kind==='bones'&&id==='Skull'?.23:kind==='systems'&&id.includes('Brain midline section')?1.57:kind==='animals'?-.16:0,zoom:1},labels:true,descriptions:true,monochrome:false,color:'#d9c6a6',cellColor:'#b8d8da',selected:'',leaderLines:true,labelPage:0};}
function valid(s){P.callouts.valid(s);
for(const view of [s.view,s.outerView])if(view?.focus!==undefined&&(!Array.isArray(view.focus)||view.focus.length!==3||!view.focus.every(n=>V.finite(n,100000))))throw Error('Invalid camera focus.');
if(s.interior!==undefined&&!['','structure','mitochondrion','tissue'].includes(s.interior))throw Error('Unknown interior view.');
if(s.outerView&&(!['rx','ry','zoom'].every(k=>V.finite(s.outerView[k],1000))||s.outerView.zoom<.2||s.outerView.zoom>160))throw Error('Invalid outer camera.');
if(s.blankLabels!==undefined&&typeof s.blankLabels!=='boolean')throw Error('Invalid blank label setting.');
if(s.sectionAxis!==undefined&&!['Sagittal','Axial','Coronal'].includes(s.sectionAxis))throw Error('Unknown section plane.');
 for(const k of ['sectionDepth','layerOpacity'])if(s[k]!==undefined&&(!Number.isFinite(s[k])||s[k]<0||s[k]>1))throw Error('Invalid section or opacity setting.');
 for(const k of ['detailHidden','detailTransparent'])if(s[k]!==undefined&&(!Array.isArray(s[k])||s[k].length>4096||s[k].some(id=>typeof id!=='string'||id.length>400)))throw Error('Invalid tissue visibility.');
 if(s.detailColors!==undefined&&(!s.detailColors||typeof s.detailColors!=='object'||Array.isArray(s.detailColors)||Object.values(s.detailColors).some(c=>!/^#[0-9a-f]{6}$/i.test(c))))throw Error('Invalid tissue color.');
if(!['bones','cells','animals','systems'].includes(s.kind)||!['2D','3D'].includes(s.dimension))throw Error('Invalid medical model type.');if(!D[s.kind].some(e=>e.id===s.id)&&!(s.kind==='bones'&&(P.anatomy.members(s.id)||D.bones.some(b=>b.region===s.id))))throw Error('Unknown catalog entry.');if(!s.view||!['rx','ry','zoom'].every(k=>V.finite(s.view[k],1000))||s.view.zoom<.2||s.view.zoom>160)throw Error('Invalid camera.');for(const k of ['color','cellColor'])if(!/^#[0-9a-f]{6}$/i.test(s[k]))throw Error('Invalid color.');for(const k of ['labels','descriptions','monochrome'])if(typeof s[k]!=='boolean')throw Error('Invalid label setting.');if(s.leaderLines!==undefined&&typeof s.leaderLines!=='boolean')throw Error('Invalid leader lines.');if(s.kind==='systems'){
 const ids=new Set(entries(s).map(e=>e.id));
 for(const key of ['partLabels','partNotes'])if(s[key]!==undefined&&(!s[key]||typeof s[key]!=='object'||Array.isArray(s[key])||Object.entries(s[key]).some(([id,v])=>!ids.has(id)||typeof v!=='string'||v.length>(key==='partLabels'?65:450))))throw Error('Invalid structure annotation.');
 for(const key of ['hidden','transparent','removed'])if(s[key]!==undefined&&(!Array.isArray(s[key])||s[key].length>ids.size||s[key].some(id=>!ids.has(id))))throw Error('Invalid part visibility.');
 if(s.partColors!==undefined&&(!s.partColors||typeof s.partColors!=='object'||Object.entries(s.partColors).some(([id,c])=>!ids.has(id)||!/^#[0-9a-f]{6}$/i.test(c))))throw Error('Invalid part color.');
 if(s.selected&&!ids.has(s.selected))throw Error('Invalid structure selection.');
}if(s.kind==='animals'&&s.selected&&!entries(s).some(e=>e.id===s.selected))throw Error('Selection does not belong to this animal.');if(typeof s.selected!=='string'||s.selected&&!D[s.kind].some(e=>e.id===s.selected))throw Error('Invalid selected structure.');if(!Number.isInteger(s.labelPage)||s.labelPage<0||s.labelPage>50)throw Error('Invalid label page.');}
function entries(s){if(s.kind==='bones'){const assembled=P.anatomy.members(s.id);if(assembled)return assembled;}if(s.kind==='systems'){const e=D.systems.find(e=>e.id===s.id);return e.children||[e];}if(s.kind==='animals'){const e=D.animals.find(e=>e.id===s.id);return e.children||[e];}return D[s.kind].filter(e=>e.id===s.id||s.id==='Complete skeleton'||e.region===s.id);}
function geometry(s){
if(s.kind==='cells'&&s.id===P.anatomy.mitoId){const m=P.anatomy.mitochondrion(s.id);return {...m,parts:m.parts.slice(0,1),labels:m.labels.slice(0,1)};}
if(s.kind==='bones'&&entries(s).length>1)return P.anatomy.assembly(entries(s));
if(s.kind==='systems'){const ee=entries(s);return {assembly:ee.length>1,parts:ee.flatMap(e=>e.parts),labels:ee.flatMap(e=>e.labels)};}
if(s.kind==='animals'){
 const ee=entries(s),assembly=ee.length>1;
 if(ee[0].humanModel){const shared=D.cells.find(e=>e.name===ee[0].humanModel);return {...D.transform(D.cellModel(shared),[0,0,0],[1,1,1],ee[0].id),assembly:false};}
 return {assembly,parts:ee.flatMap(e=>e.parts),labels:assembly?ee.map(e=>({name:e.name,p:e.labels[0].p,id:e.id})):ee[0].labels};
}
const ee=entries(s),assembly=ee.length>1;let parts=[],labels=[];for(const e of ee){let m=s.kind==='bones'?D.boneModel(e):D.cellModel(e);if(assembly)m=D.transform(m,e.pos,e.size,e.id);else m=D.transform(m,[0,0,0],s.kind==='bones'?e.size.map((v,i)=>Math.abs(v)*(i===0&&e.side==='Right'?-1:1)):[1,1,1],e.id);parts.push(...m.parts);if(assembly){labels.push({name:e.name,p:e.pos,id:e.id});}else labels.push(...m.labels);}
return {parts,labels,assembly};}
function displayGeometry(s){
 const base=geometry(s);
 if(!s.cutaway&&!s.interior&&s.kind==='bones')return P.surfaceModels.skeleton(s,entries(s),base);
 let g=P.atlasTissues.upgrade(base,s);
 if(s.interior)g=P.anatomy.interior(s,g);
 else if(!s.cutaway&&s.kind==='systems'&&!s.id.startsWith('Fauna/'))g=P.surfaceModels.organs(g,s);
 if(!s.cutaway&&!s.interior&&s.kind==='animals')g=P.surfaceModels.animal(g);
 return P.detailAtlas(g,s);
}
function renderer(canvas,get,onSelect){const ctx=canvas.getContext('2d');let lastGeometry,signature='';
function draw(){const s=get(),sig=[s.kind,s.id,s.interior,!!s.cutaway,s.interior?s.selected:''].join('|');if(signature!==sig){lastGeometry=displayGeometry(s);signature=sig;}const g=lastGeometry,bb=g.parts.map(P.atlasVolume.bounds),min=[0,1,2].map(i=>Math.min(...bb.map(b=>b[0][i]))),max=[0,1,2].map(i=>Math.max(...bb.map(b=>b[1][i]))),center=min.map((v,i)=>(v+max[i])/2),extent=Math.max(...max.map((v,i)=>v-min[i]),.01),scale=(s.cutaway&&s.id==='Cardiovascular/Heart and great vessels'&&s.sectionFocus!==false?272:Math.min(625/Math.max(max[0]-min[0],(max[2]-min[2])*.65,.01),502/Math.max(max[1]-min[1],(max[2]-min[2])*(/foot/i.test(s.id)?1:.65),.01)))*s.view.zoom;
if(s.cutaway&&s.id==='Cardiovascular/Heart and great vessels'&&s.sectionFocus!==false)center.splice(0,3,0,4.73,.35);
if(s.view.focus)center.splice(0,3,...s.view.focus);
const rx=s.dimension==='2D'?(s.cutaway&&s.sectionAxis==='Axial'?Math.PI/2:s.kind==='bones'&&!s.cutaway&&/foot/i.test(s.id)?Math.PI/2:s.kind==='animals'?.22:0):s.view.rx,ry=s.dimension==='2D'?(s.cutaway&&s.sectionAxis==='Sagittal'?-Math.PI/2:s.id.includes('Brain midline')&&!s.cutaway?1.57:s.kind==='animals'?-.16:0):s.view.ry;
ctx.setTransform(canvas.width/1000,0,0,canvas.height/650,0,0);
function project(p){let [x,y,z]=p.map((v,i)=>v-center[i]),xx=x*Math.cos(ry)+z*Math.sin(ry),zz=-x*Math.sin(ry)+z*Math.cos(ry);return [500+xx*scale,315-(y*Math.cos(rx)-zz*Math.sin(rx))*scale,y*Math.sin(rx)+zz*Math.cos(rx)];}
const body=s.kind==='systems', rows=body?entries(s):[],steps=body?FTEPro.bodyAtlas.lessons[rows[0].region]?.filter(([name])=>rows.some(e=>e.name===name)):null,step=steps&&s.step!==undefined&&s.step!==''?steps[Number(s.step)]:null;
ctx.fillStyle='white';ctx.fillRect(0,0,1000,650);
canvas.atlasFrame={center,rx,ry,scale,extent};
if(s.cutaway||s.interior)P.atlasVolume.render(canvas,s,g,project,rx,ry,scale,center);
else P.surfaceRenderer.render(canvas,s,g,project,rx,ry,scale,center,extent);
const v=g.volume,axis=P.atlasVolume.axes.indexOf(s.sectionAxis||'Coronal'),cutWorld=v?v.sectionWorld:Infinity;
const visibleLabels=s.interior&&s.cutaway?P.atlasVolume.sectionLabels(v,axis,s.sectionDepth??.5,g.labels):g.labels;
const groups=new Map();
for(let i=0;i<g.parts.length;i++){const p=g.parts[i],bounds=bb[i];
 for(const k of new Set([p.id,p.detail||p.id])){const old=groups.get(k);if(!old)groups.set(k,bounds.map(v=>v.slice()));
 else for(let j=0;j<3;j++){old[0][j]=Math.min(old[0][j],bounds[0][j]);old[1][j]=Math.max(old[1][j],bounds[1][j]);}}}
const ll=visibleLabels.filter(l=>(!s.cutaway||l.p[axis]<=cutWorld+(v?.step||0)*2)&&!s.detailHidden?.includes(l.detail||l.id)&&(!s.isolatedDetail||s.isolatedDetail===(l.detail||l.id))&&!s.hidden?.includes(l.id)&&!s.removed?.includes(l.id));
const primary=new Set(['Frontal','Mandible','Left Humerus','Right Radius','Sternum','Left Rib 5','Left Femur','Left Tibia','Right Hip bone','Left Clavicle','Left Patella','Lumbar vertebra 3']);
const targets=ll.map((l,i)=>{const key=l.detail||l.id+'::'+l.name,bounds=groups.get(key)||groups.get(l.id),world=l.p;let [x,y]=project(world);
 const pixels=bounds?Math.max(...bounds[1].map((n,k)=>n-bounds[0][k]))*scale:0;
 const region=g.assembly,landmark=l.name!==s.title&&l.name!==D[s.kind].find(e=>e.id===s.id)?.name;
 const eligible=region?(s.id==='Complete skeleton'&&s.view.zoom<1.7?primary.has(l.name):pixels>=16):!landmark||pixels>=13||s.cutaway;
 let visible=true;
 // Never terminate a visible assembly label on a different bone. Look for a
 // visible surface pixel of the requested component, keeping the anchor nearby.
 if(g.assembly&&g.measured&&s.kind==='bones'&&(eligible||P.callouts.mode(s,key)!=='auto')&&x>=0&&x<1000&&y>=45&&y<605&&canvas.atlasPick){
   if(canvas.atlasPick(x,y)?.id!==l.id){visible=false;const radius=Math.max(5,Math.min(140,pixels*.70));
     const stop=Math.max(3,Math.ceil(radius/2));
     for(let ring=1;ring<=stop&&!visible;ring++){const r=ring*radius/stop,count=Math.max(12,Math.round(r*1.8));
       for(let n=0;n<count;n++){const px=x+r*Math.cos(n*2*Math.PI/count),py=y+r*Math.sin(n*2*Math.PI/count);
         if(px<0||px>=1000||py<45||py>=605)continue;if(canvas.atlasPick(px,py)?.id===l.id){x=px;y=py;visible=true;break;}}
     }
   }
 }
 const micro=/::mito\/|::Neural arch|::Neural spine|::Lateral process|::Nucleolus|::Transport vesicles/i.test(key);
 return {key,name:s.partLabels?.[l.id]||l.name,x,y,world,pixels,visible,eligible:eligible&&(!micro||s.view.zoom>=2||s.interior==='mitochondrion'),rank:primary.has(l.name)?0:i+1,selected:s.selected===l.id};});
const style=s.blankLabels?'blank':s.labels?'named':s.leaderLines?'line':'hide';
const pageInfo=P.callouts.draw(canvas,s,targets,1000,650,{defaultMode:style,leaders:s.leaderLines!==false,page:s.labelPage,pages:page=>{s.labelPage=page;}});
const pages=pageInfo.pages;
ctx.fillStyle='white';ctx.fillRect(0,0,1000,45);ctx.fillRect(0,605,1000,45);ctx.fillStyle='#2d2435';ctx.font='bold 19px Arial';if(!s.blankLabels&&(s.labels||s.descriptions))ctx.fillText(s.title.slice(0,90),18,28);ctx.font='12px Arial';if(s.labels||s.descriptions)ctx.fillText('Anatomy · '+s.dimension+(s.labels?' · labels '+(s.labelPage+1)+'/'+pages:''),18,625);if(s.labels){const axisText=s.kind==='animals'||s.id.startsWith('Fauna/')?['X','Y','Z']:s.kind==='systems'||s.kind==='bones'?['L','S','A']:['X','Y','Z'];
 const origin=project(center);ctx.font='11px Arial';ctx.strokeStyle='#68757b';for(let i=0;i<3;i++){const pos=center.slice();pos[i]+=30/scale;const q=project(pos),dx=q[0]-origin[0],dy=q[1]-origin[1];if(Math.hypot(dx,dy)<4)continue;ctx.beginPath();ctx.moveTo(918,566);ctx.lineTo(918+dx,566+dy);ctx.stroke();ctx.fillText(axisText[i],920+dx,568+dy);}
 ctx.textAlign='right';ctx.fillText(s.cutaway?(s.sectionAxis||'Coronal')+' section · '+Math.round((s.sectionDepth??.5)*100)+'%':s.dimension+' view',982,625);ctx.textAlign='left';}if(step&&s.descriptions&&!s.blankLabels){ctx.fillStyle='#31213a';ctx.font='bold 14px Arial';ctx.fillText('Step '+(Number(s.step)+1)+' · '+step[0]+' — '+step[1],18,646,965);}canvas.dataset.surfaceSource=g.credit||(g.measured?'BodyParts3D © DBCLS · CC BY-SA 2.1 Japan':'Procedural teaching model');if(g.measured){ctx.fillStyle='#49545a';ctx.font='11px Arial';ctx.fillText(g.credit||'BodyParts3D © DBCLS · CC BY-SA 2.1 Japan',18,645);}
canvas.dataset.labelPages=pages;canvas.dataset.view=JSON.stringify(s.view);canvas.sectionNote=g.sectionNote||'';canvas.atlasProject=project;canvas.atlasMaterials=P.atlasVolume.materials(g.parts);return {pages,labels:ll.length,parts:g.parts.length};}
P.atlasCamera.controls(canvas,get,draw,onSelect);return {draw};}
function catalog(kind,dimension){const d=modal(dimension+(kind==='bones'?' bone structures':' cells'),'<p>'+ (kind==='bones'?'206 individually identified adult bones. Select a region, complete skeleton or individual bone.':D.cells.length+' curated cell entries, including one explicitly identified cell fragment. This is not every molecular subtype or cellular state.')+'</p><div id="med-search" class="science-controls"></div><div id="med-results" class="science-results"></div>');P.View3D.decorate(d);const host=$('med-search'),q=field('Search common / anatomical name','search','',host),reg=select('Body region / system',['All',...new Set(D[kind].map(e=>e.region))],'All',host,render);q.oninput=render;button('Saved templates',()=>{d.close();V.library('v9medical');},host);if(kind==='bones'){button('Complete skeleton',()=>{d.close();editor(null,defaults(kind,'Complete skeleton',dimension));},host);button('Open regional assembly',()=>{if(reg.value==='All')return say('Choose a body region first.');d.close();editor(null,defaults(kind,reg.value,dimension));},host);}function render(){const h=$('med-results');h.replaceChildren();const ee=D[kind].filter(e=>(reg.value==='All'||e.region===reg.value)&&JSON.stringify([e.name,e.anatomical,e.alias,e.region,e.features]).toLowerCase().includes(q.value.toLowerCase()));for(const e of ee)button(e.name+' · '+e.region,()=>{d.close();editor(null,defaults(kind,e.id,dimension));},h);if(!ee.length)h.textContent='No matching entries.';}render();}
function editor(existing=null,spec){let s=V.clone(spec);valid(s);if(window.FTEDesignWorkspace?.prepareLegacy(s,'Medical',existing)===false)return;const d=modal('Medical · '+s.title,'<div class="science-layout"><div id="med-controls"></div><div><canvas id="med-canvas" width="1600" height="1040" class="science-canvas" tabindex="0" aria-label="Medical educational model; drag to rotate, wheel to zoom"></canvas><p id="med-info" class="science-help"></p><div id="med-sources"></div><p id="med-status" role="status"></p></div></div>',[['Save template',()=>{try{s.libraryId=V.save(s);say('Medical template saved.');}catch(e){say(e.message);}}],['Export PNG',()=>printCanvas().toBlob(b=>download(b,'medical-model.png'))],['Export SVG',()=>{const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="650"><title>'+E(s.blankLabels||(!s.descriptions&&!s.labels)?'Anatomy exercise':s.title)+'</title><image width="1000" height="650" href="'+printCanvas().toDataURL()+'"/></svg>';download(new Blob([svg],{type:'image/svg+xml'}),'medical-model.svg');}],['Export template',()=>download(new Blob([JSON.stringify(V.valid(s),null,2)],{type:'application/json'}),'medical-template.json')],['Insert / apply',()=>{const clean=V.valid(s);d.close();P.View3D.insert(printCanvas(),clean,existing);}]]);P.View3D.decorate(d);d.classList.add('v9-medical');{const token=d.dataset.scienceSession;d.addEventListener('close',()=>{if(d.dataset.scienceSession===token)d.classList.remove('v9-medical');},{once:true});}const canvas=$('med-canvas'),host=$('med-controls');const title=field('Title','text',s.title,host);title.oninput=()=>{s.title=title.value.slice(0,300);r.draw();};select('View',['2D','3D'],s.dimension,host,value=>{s.dimension=value;r.draw();});
const check=(label,key)=>{const f=field(label,'checkbox','',host);f.checked=s[key];f.onchange=()=>{s[key]=f.checked;if(key==='descriptions'&&f.checked)s.blankLabels=false;update();};return f;};check('Show labels','labels');if(s.leaderLines===undefined)s.leaderLines=true;check('Show leader lines','leaderLines');check('Show descriptions','descriptions');check('Monochrome','monochrome');const color=field('Model color','color',s.kind!=='cells'?s.color:s.cellColor,host);color.oninput=()=>{if(s.kind==='systems')s.partColors=Object.fromEntries(entries(s).map(e=>[e.id,color.value]));s[s.kind!=='cells'?'color':'cellColor']=color.value;r.draw();};
const ee=entries(s),choice=select('Selected structure',['All labels',...ee.map(e=>[s.id.startsWith('Fauna/')?e.id:e.name,s.id.startsWith('Fauna/')?e.name+' · '+e.system:e.name])],'All labels',host,()=>{s.selected=ee.find(e=>(s.id.startsWith('Fauna/')?e.id:e.name)===choice.value)?.id||'';s.labelPage=0;update();if(s.selected)canvas.fteChooseDescriptor?.(s.selected);});choice.value=ee.find(e=>e.id===s.selected)?.[s.id.startsWith('Fauna/')?'id':'name']||'All labels';
let syncAtlas, atlasKey='';
function syncSections(){
 const key=JSON.stringify([s.interior,!!s.cutaway,s.interior?s.selected:'']);
 if(key!==atlasKey){host.querySelector('.atlas-controls')?.remove();syncAtlas=P.atlasControls(s,host,update,displayGeometry(s));host.prepend(actions);atlasKey=key;}
 syncAtlas();
}
function switchInside(mode){
 if(mode&&!s.interior)s.outerView={...s.view};
 if(!mode&&s.outerView){s.view={...s.outerView};delete s.outerView;}
 s.interior=mode;s.cutaway=!!mode;s.isolatedDetail='';s.detail='';s.detailHidden=[];s.labelPage=0;
 if(mode&&s.kind==='bones'&&ee.length>1&&!s.selected){
   const preferred=ee.find(b=>s.id==='Complete skeleton'?b.anatomical==='Femur':s.id==='Skull'?b.shape==='parietal':['metacarpal','metatarsal','humerus','femur'].includes(b.shape))||ee[0];
   s.selected=preferred.id;choice.value=preferred.name;
 }
 if(mode){s.sectionAxis='Coronal';s.sectionDepth=s.id==='Cardiovascular/Heart and great vessels'?.56:.5;s.view={rx:0,ry:0,zoom:1};}
 update();
}
const actions=document.createElement('fieldset');actions.className='section-actions';host.prepend(actions);
const inside=button('Show inner structure',()=>switchInside(s.interior?'':'structure'),actions);
const isCell=s.kind==='cells'||s.kind==='animals'&&ee[0].category==='Cells';
const hasMito=isCell&&s.id!==P.anatomy.mitoId&&geometry(s).parts.some(p=>/mitochondr/i.test(p.detailName||'')||ee[0].name==='Gill ionocyte'&&p.color==='mito');
if(s.kind==='bones')button('Magnify bone tissue',()=>switchInside('tissue'),actions);
if(hasMito)button('Inspect mitochondrion',()=>switchInside('mitochondrion'),actions);
const annotations=select('Annotations',[['named','Names and descriptions'],['blank','Empty answer boxes (quiz)'],['line','Pointers without text'],['none','No annotations']],s.blankLabels?'blank':s.labels?'named':'none',actions,mode=>{
 s.calloutOverrides={};s.blankLabels=mode==='blank';s.labels=mode==='blank'||mode==='named';s.descriptions=mode==='named';s.leaderLines=mode!=='none';update();
});
if(s.kind==='systems')FTEPro.bodyAtlas.controls(s,host,ee,update);
let annotationFields=[];
if(s.id.startsWith('Fauna/')){
 for(const [label,key,max] of [['Custom callout','partLabels',65],['Structure note','partNotes',450]]){
  const input=field(label,'text','',host);input.maxLength=max;
  input.oninput=()=>{if(!s.selected)return;s[key]={...s[key],[s.selected]:input.value};update();};
  annotationFields.push([input,key]);
 }
}

if(ee.length>1)button(s.kind!=='bones'?'Inspect selected structure':'Inspect selected bone',()=>{if(!s.selected)return say('Select a structure first.');d.close();editor(null,defaults(s.kind,s.selected,s.dimension));},host);
button('Previous labels',()=>{s.labelPage=Math.max(0,s.labelPage-1);update();},host);button('Next labels',()=>{s.labelPage=Math.min(+canvas.dataset.labelPages-1,s.labelPage+1);update();},host);button('Reset view',()=>{s.view=defaults(s.kind,s.id,s.dimension).view;s.labelPage=0;r.draw();},host);
button('Import template',()=>{const f=document.createElement('input');f.type='file';f.accept='.json';f.onchange=async()=>{try{if(!f.files[0])return;if(f.files[0].size>100000)throw Error('Medical template exceeds 100 KB.');const a=V.valid(JSON.parse(await f.files[0].text()));if(a.type!=='v9medical')throw Error('Choose a medical template.');d.close();editor(existing,a);}catch(e){say(e.message);}};f.click();},host);
const help=document.createElement('p');help.className='science-help';help.textContent='Scroll over a structure to zoom there. Shift-drag or right-drag to pan. In 3D, drag to rotate around the current focus. Double-click a structure to frame it. Labels stay upright. Assemblies use pages of 16 labels to avoid overlap; exports include the current label page. SVG export contains the rendered PNG.';host.append(help);
function printCanvas(){const hi=document.createElement('canvas');hi.width=1800;hi.height=1170;renderer(hi,()=>s,()=>{}).draw();return hi;}
const r=renderer(canvas,()=>s,id=>{s.selected=ee.some(e=>e.id===id)?id:'';choice.value=ee.find(e=>e.id===id)?.[s.id.startsWith('Fauna/')?'id':'name']||'All labels';s.labelPage=0;update();});
function update(){syncSections();inside.textContent=s.interior?'Return to outer structure':'Show inner structure';annotations.value=s.blankLabels&&s.labels?'blank':s.labels?'named':s.leaderLines?'line':'none';if(s.id.startsWith('Fauna/')){for(const op of choice.options){op.hidden=!!s.removed?.includes(op.value);}choice.value=s.selected||'All labels';}const e=ee.find(e=>e.id===s.selected)||ee[0],info=$('med-info');for(const [input,key] of annotationFields){input.disabled=!s.selected;input.value=s[key]?.[s.selected]||'';}info.hidden=!s.descriptions;info.textContent=s.kind==='systems'?e.description+' Educational schematic; scales, branches and timing are simplified. Process steps are static illustrations, not physiological simulations.':s.kind==='animals'?(e.species+' · '+e.latin+' · '+e.region+'. '+(s.selected||ee.length===1?e.description:D.animals.find(a=>a.id===s.id).description)+(e.family?' Shared model family: '+e.family+'.':'')+' Schematic proportions. Repeated structures may be sampled.'): (s.kind==='bones'?e.description+' '+(e.variant||'')+'. '+conventions:e.description)+' '+limits;if(s.partNotes?.[e.id])info.textContent+=' '+s.partNotes[e.id];const sources=$('med-sources');sources.replaceChildren();sources.hidden=!s.descriptions;const links=s.kind==='systems'?[[e.sourceUrl,e.id.startsWith('Fauna/')?'OpenStax Biology 2e · comparative reference':'OpenStax Anatomy and Physiology 2e']]:s.kind==='animals'?[...(e.reference?[e.reference]:[]),[e.sourceUrl,'OpenStax Biology 2e · comparative group reference'],['https://openstax.org/books/biology-2e/pages/38-1-types-of-skeletal-systems','Support systems']]:s.kind==='bones'?[[e.sourceUrl,'OpenStax anatomy reference']]:[[e.sourceUrl||sourceBase+e.source,'OpenStax system reference'],['https://www.proteinatlas.org/humanproteome/single+cell/single+cell+type','Human Protein Atlas classification']];for(const [url,name]of links){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.onclick=event=>{if(window.desktop?.openMedicalSource){event.preventDefault();window.desktop.openMedicalSource(url).catch(e=>say(e.message));}};a.textContent=name+' ↗ ';sources.append(a);}const result=r.draw();if(!s.interior&&canvas.dataset.surfaceSource)info.textContent+=' Model source: '+canvas.dataset.surfaceSource+'.';if(s.interior&&canvas.sectionNote)info.textContent=(s.kind==='bones'?(ee.find(b=>b.id===s.selected)||ee[0]).name+' · ':'')+canvas.sectionNote;const tissue=canvas.atlasMaterials.find(m=>m.key===s.detail);if(s.interior&&tissue&&P.anatomy.descriptions[tissue.name])info.textContent+=' '+tissue.name+' — '+P.anatomy.descriptions[tissue.name];$('med-status').textContent=(s.selected?e.name+' · ':'')+'Label page '+(s.labelPage+1)+' of '+result.pages;}
button('Use selected tissue in labeling question',()=>{const target=canvas.atlasMaterials.find(m=>m.key===(s.detail||host.querySelector('[aria-label="Tissue or component"]')?.value));if(!target)return say('Select a tissue first.');
 const clean={...s,labels:false,descriptions:false,leaderLines:false,title:'',step:''};const figure=document.createElement('canvas');figure.width=1000;figure.height=650;renderer(figure,()=>clean,()=>{}).draw();let pos=figure.atlasProject(target.p);
 // Use a visible pixel of this exact region. A clipped or occluded target cannot be issued.
 const keyAt=(x,y)=>figure.atlasPick?.(x,y)?.key;let found=false;
 for(const radius of [0,8,18,32,52,76,100]){for(let i=0;i<(radius?12:1);i++){const x=pos[0]+radius*Math.cos(i*Math.PI/6),y=pos[1]+radius*Math.sin(i*Math.PI/6);if(keyAt(x,y)===target.key){pos=[x,y];found=true;break;}}if(found)break;}
 if(!found){r.draw();return say('This tissue is obscured. Isolate it or adjust the section first.');}
 d.close();P.teacherStudio.labelingFromView(figure,'Medical',target.name,target.key,pos[0],pos[1],1000,650);},host);
P.callouts.attach(canvas,()=>s,()=>r.draw(),host,'Medical',{focus:key=>canvas.atlasFrameTarget(key)});
update();window.FTEDesignWorkspace?.attachLegacy(d,()=>(s),()=>printCanvas(),existing);P.medical.active={state:s,renderer:r,canvas};d.addEventListener('close',()=>{if(P.medical.active?.canvas===canvas){P.atlasVolume.release(canvas);P.medical.active=null;}},{once:true});}
V.validators.v9medical=valid;V.editors.v9medical=editor;P.medical={catalog,editor,defaults,valid,geometry,displayGeometry,renderer,conventions,limits};
const css=document.createElement('style');css.textContent='.v9-medical{width:min(1280px,94vw)!important;max-width:1280px!important}.v9-medical #med-sources a{color:var(--ui-link)}.v9-medical .science-layout>div:first-child{max-height:65vh;overflow:auto}.v9-medical #med-controls>label{display:block;margin:8px 0}.v9-medical #med-controls select,.v9-medical #med-controls input[type=text]{max-width:100%}.v9-medical #med-controls button{margin:4px}.v9-medical #med-info{max-height:140px;overflow:auto}.v9-medical .science-canvas{min-width:0}.v9-medical .dialog-actions{display:flex;flex-wrap:wrap;gap:6px}';document.head.append(css);
})();
