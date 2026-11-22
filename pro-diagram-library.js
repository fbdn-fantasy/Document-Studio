/* Subject libraries use existing editable vector nodes, not flattened pictures. */
'use strict';
(()=>{
const P=FTEPro,key='fte-subject-diagrams-v1',clone=v=>structuredClone(v);
const n=(kind,x,y,w=80,h=60,label='')=>({kind,x,y,w,h,label,color:'#222222'});
const line=(x,y,w,h=0)=>n('Line',x,y,w,h),label=(text,x,y)=>n('Label',x,y,130,25,text);
const wave=()=>({ ...n('Freehand',30,70,240,60),points:Array.from({length:81},(_,i)=>({x:30+i*3,y:100+25*Math.sin(i*Math.PI/10)}))});
const physics=[
['Mechanics','Block on ramp',[n('Triangle',30,60,180,100),n('Rectangle',100,65,45,30),label('m',110,65)]],
['Forces','Free-body forces',[n('Rectangle',100,90,60,50),n('Arrow',130,90,0,-65),n('Arrow',130,140,0,65),n('Arrow',160,115,85,0),label('N',140,20),label('mg',140,180),label('F',220,85)]],
['Motion','Velocity and acceleration',[n('Circle',40,90,35,35),n('Arrow',80,105,100,0),n('Arrow',80,65,150,0),label('v',165,110),label('a',215,35)]],
['Vectors','Vector addition',[n('Arrow',40,160,110,0),n('Arrow',150,160,0,-90),n('Arrow',40,160,110,-90)]],
['Mechanics','Pendulum',[line(30,30,140),line(100,30,65,100),n('Circle',150,120,30,30)]],
['Mechanics','Spring mass',[n('Spring',30,90,130,0),n('Rectangle',160,70,50,45)]],
['Circuits','Series circuit',[n('Battery',50,140,80,50),line(50,140,0,-90),n('Resistor',50,50,180,0),line(230,50,0,90),line(130,140,100)]],
['Optics','Ray and lens',[n('Lens',140,35,55,160),n('Arrow',25,75,140,0),n('Arrow',165,75,120,70),line(20,115,280)]],
['Waves','Transverse wave',[wave(),n('Axes',30,30,260,130),label('Displacement / distance',50,175)]],
['Magnetism','Bar magnet',[n('Rectangle',60,80,100,45),n('Rectangle',160,80,100,45),label('N',95,90),label('S',195,90),n('Arrow',80,45,150,0),n('Arrow',80,160,150,0)]],
['Thermodynamics','Piston and gas',[n('Rectangle',60,40,120,150),line(60,90,120),line(120,90,0,-65),...Array.from({length:9},(_,i)=>n('Circle',75+(i%3)*35,110+Math.floor(i/3)*25,7,7)),n('Arrow',210,180,0,-100),label('Heat',220,120)]]
];
const chemistry=[
['Laboratory equipment','Beaker',[n('Beaker',60,40,100,130)]],['Laboratory equipment','Conical flask',[n('Flask',60,40,100,130)]],['Laboratory equipment','Test tube',[n('Test tube',60,40,30,140)]],
['Laboratory equipment','Funnel',[n('Triangle',60,40,100,-65),line(110,40,0,70)]],
['Laboratory equipment','Burette and stand',[line(45,30,0,190),line(20,220,130),n('Rectangle',90,30,14,140),line(97,170,0,35),line(80,170,35),line(45,60,60)]],
['Apparatus assemblies','Filtration',[n('Triangle',80,80,100,-65),line(130,80,0,55),n('Beaker',85,125,90,90),label('Filter paper',190,40)]],
['Apparatus assemblies','Distillation',[n('Flask',30,80,80,120),line(70,80,0,-45),line(70,35,100,45),n('Rectangle',160,60,110,45),line(270,85,50,35),n('Beaker',290,125,70,85),label('Condenser',150,20)]],
['Reaction setups','Gas collection',[n('Flask',30,90,80,110),line(70,90,0,-50),line(70,40,180),line(250,40,0,110),n('Beaker',190,120,140,110),n('Test tube',235,65,35,140)]],
['Reaction setups','Titration',[n('Rectangle',100,25,15,120),line(107,145,0,35),line(90,145,35),n('Flask',65,185,85,65),label('Titrant',145,50)]],
['Molecular bonds','Single bond',[n('Atom',35,70,30,30,'H'),line(65,82,70),n('Atom',140,70,30,30,'Cl')]],
['Molecular bonds','Double bond',[n('Atom',35,70,30,30,'O'),n('Double bond',65,82,70,0),n('Atom',140,70,30,30,'O')]],
['Molecular bonds','Triple bond',[n('Atom',35,70,30,30,'N'),n('Triple bond',65,82,70,0),n('Atom',140,70,30,30,'N')]],
['Molecular bonds','Aromatic ring',[n('Benzene ring',65,45,110,110)]],
['Reaction arrows','Reaction arrow',[n('Arrow',35,90,180,0),label('conditions',75,50)]],
['Reaction arrows','Equilibrium arrows',[n('Arrow',35,80,180,0),n('Arrow',215,100,-180,0)]],
['Energy diagrams','Exothermic reaction',[n('Axes',30,25,280,180),{...n('Freehand',40,80,240,90),points:[{x:40,y:95},{x:85,y:95},{x:125,y:40},{x:155,y:40},{x:205,y:160},{x:270,y:160}]},label('Reaction progress',70,215),label('Energy',40,0)]],
['Energy diagrams','Endothermic reaction',[n('Axes',30,25,280,180),{...n('Freehand',40,40,240,120),points:[{x:40,y:160},{x:85,y:160},{x:125,y:40},{x:155,y:40},{x:205,y:95},{x:270,y:95}]},label('Reaction progress',70,215)]],
['Particle diagrams','Gas particles',[n('Rectangle',30,30,250,160),...Array.from({length:12},(_,i)=>n('Circle',50+(i%4)*58+(i%2)*7,50+Math.floor(i/4)*50,12,12))]],
['Particle diagrams','Solid particles',[n('Rectangle',30,30,180,160),...Array.from({length:20},(_,i)=>n('Circle',55+(i%5)*25,65+Math.floor(i/5)*25,25,25))]]
];
const catalogs={Physics:physics,Chemistry:chemistry};
function read(){const a=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(a))throw Error('Saved diagram library is invalid.');return a.map(t=>t.subject==="Physics"&&t.spec?.type==="atom3d"?{...t,subject:"Chemistry"}:t);}
function write(a){localStorage.setItem(key,JSON.stringify(a));}
function valid(spec,subject){if(!spec||spec.type==='diagram'&&(!Array.isArray(spec.nodes)||spec.nodes.length>5000)||!['diagram','atom3d'].includes(spec.type))throw Error('Invalid diagram template.');if(spec.type==='atom3d'&&subject!=='Chemistry')throw Error('Atoms belong in Chemistry.');if(spec.type==='diagram'&&spec.subject!==subject)throw Error('Template belongs to a different subject.');if(spec.type==='diagram'){const kinds=new Set(['Label','Atom','Circle','Rectangle','Triangle','Polygon','Arrow','Line','Connector','Double bond','Triple bond','Benzene ring','Spring','Resistor','Battery','Capacitor','Diode','LED','Ground','Switch','Inductor','Op amp','Beaker','Flask','Test tube','Lens','Mirror','Angle','Axes','Freehand']);for(const n of spec.nodes){if(!kinds.has(n.kind)||!['x','y','w','h'].every(k=>Number.isFinite(n[k]??0))||n.kind==='Freehand'&&(!Array.isArray(n.points)||!n.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))))throw Error('Invalid drawing component.');}}else P.atoms.build(spec.symbol,spec.massNumber,spec.touchingNucleons!==false);return clone(spec);}
function save(subject,spec,thumbnail){const name=prompt('Diagram name',spec.title||subject+' diagram');if(!name?.trim())return;const a=read();a.push({id:crypto.randomUUID(),name:name.trim().slice(0,160),subject,spec:valid(spec,subject),thumbnail});write(a);say('Diagram saved in '+subject+'.');}
function open(spec){if(spec.type==='atom3d')P.atoms.editor(null,clone(spec));else P.diagram(null,clone(spec));}
function library(subject,atomsOnly=false){const d=modal(subject+' · Saved diagrams','<p>Editable templates stored on this computer. Export a backup before clearing application data.</p><div class="row" id="saved-controls"></div><div id="saved-list"></div>');const q=field('Search saved diagrams','search','',$('saved-controls'));q.oninput=render;
button('Import',()=>{const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{const f=input.files[0];if(!f)return;if(f.size>15000000)throw Error('Import exceeds 15 MB.');const doc=JSON.parse(await f.text());if(doc.format!=='FTEDiagrams'||doc.version!==1||!Array.isArray(doc.items))throw Error('Unsupported diagram library.');const additions=doc.items.map(t=>{if(t.subject==="Physics"&&t.spec?.type==="atom3d")t={...t,subject:"Chemistry"};if(t.subject!==subject)throw Error('Import this file in '+t.subject+'.');return {id:crypto.randomUUID(),name:String(t.name||'Imported diagram').slice(0,160),subject,spec:valid(t.spec,subject),thumbnail:typeof t.thumbnail==='string'&&t.thumbnail.startsWith('data:image/png;base64,')?t.thumbnail:''};});write([...read(),...additions]);render();}catch(e){say(e.message);}};input.click();},$('saved-controls'));
const exp=items=>download(new Blob([JSON.stringify({format:'FTEDiagrams',version:1,items},null,2)],{type:'application/json'}),subject+'-diagrams.json');
button('Export all',()=>exp(read().filter(t=>t.subject===subject)),$('saved-controls'));
function render(){const out=$('saved-list');out.replaceChildren();const items=read().filter(t=>t.subject===subject&&(!atomsOnly||t.spec.type==="atom3d")&&t.name.toLowerCase().includes(q.value.toLowerCase()));if(!items.length)out.textContent='No matching saved diagrams.';for(const t of items){const row=document.createElement('div');row.className='row';row.style.cssText='padding:10px;border-bottom:1px solid #685079';const im=document.createElement('img');im.src=t.thumbnail||'';im.alt=t.name;im.width=110;row.append(im);const title=document.createElement('strong');title.textContent=t.name;row.append(title);button('Open',()=>{d.close();open(t.spec);},row);button('Rename',()=>{const name=prompt('Diagram name',t.name);if(name?.trim()){write(read().map(v=>v.id===t.id?{...v,name:name.trim().slice(0,160)}:v));render();}},row);button('Duplicate',()=>{write([...read(),{...clone(t),id:crypto.randomUUID(),name:t.name+' copy'}]);render();},row);button('Export',()=>exp([t]),row);button('Delete',()=>{if(confirm('Delete '+t.name+'?')){write(read().filter(v=>v.id!==t.id));render();}},row);out.append(row);}}
render();}
function attach(d,model,canvas,draw){
 const actions=document.createElement('div');actions.className='row';actions.style.cssText='clear:both;margin:12px 0;gap:8px';
 const side=canvas.parentElement.querySelector(':scope > aside');(side||canvas.parentElement).append(actions);
 button('Save diagram',()=>{draw();save(model.subject,model,canvas.toDataURL());},actions);
 button('Saved diagrams',()=>library(model.subject),actions);
}
P.diagramLibrary={library,save,read,write,valid,open,attach,catalogs};for(const subject of ['Physics','Chemistry'])P.add('Saved diagrams',()=>library(subject),subject,'templates reusable import export');
})();
