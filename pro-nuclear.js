'use strict';
(()=>{
 const P=FTEPro;
 const reactions={
 'Alpha decay':[['U-238 → Th-234 + He-4','92 → 90 + 2'],['Ra-226 → Rn-222 + He-4','88 → 86 + 2']],
 'Beta-minus decay':[['C-14 → N-14 + electron + antineutrino','6 → 7 − 1 + 0'],['H-3 → He-3 + electron + antineutrino','1 → 2 − 1 + 0']],
 'Beta-plus decay':[['F-18 → O-18 + positron + neutrino','9 → 8 + 1 + 0'],['C-11 → B-11 + positron + neutrino','6 → 5 + 1 + 0']],
 'Gamma decay':[['Tc-99m → Tc-99 + photon','43 → 43 + 0'],['Excited Ni-60 → Ni-60 + photon','28 → 28 + 0']],
 'Decay chain':[['U-238 → Th-234 → Pa-234m → U-234','α then β− then β− (principal path)']],
 'Fission':[['n + U-235 → Ba-141 + Kr-92 + 3n','One possible split: 236 nucleons. Charge: 92 = 56 + 36.']],
 'Fusion':[['H-2 + H-3 → He-4 + n','5 nucleons. Charge: 1 + 1 = 2.']]
 };
 const names=['Nuclear composition and isotope notation','Comparing isotopes',...Object.keys(reactions),'Half-life graph','Binding energy per nucleon','Radiation penetration and shielding'];
 function build(s){
 const nodes=[],shape=(kind,x,y,w,h,label='',color='#312344')=>nodes.push({kind,x,y,w,h,label,color}),text=(v,x,y)=>shape('Label',x,y,Math.min(640,v.length*11),25,v);
 text(s.name,25,12);
 if(reactions[s.name]){
 const [eq,note]=reactions[s.name][s.example||0];text(eq,28,90);shape('Arrow',35,145,515,0);text(note,28,180);
 if(s.name==='Fission'||s.name==='Fusion'){
 const fusion=s.name==='Fusion',positions=fusion?[[65,265,36],[65,328,44],[425,285,56],[450,358,12]]:[[65,285,68],[425,255,52],[425,335,41]];
 const labels=fusion?['Deuterium','Tritium','Helium-4','Neutron']:['Uranium-235','Barium-141','Krypton-92'];
 for(const [i,[x,y,r]] of positions.entries()){shape('Circle',x,y,r,r,'',i<1?'#657aa5':'#b67265');nodes.at(-1).partName=labels[i];text(labels[i],x+r+8,y-2);}
 if(!fusion){shape('Circle',20,314,12,12,'','#488990');nodes.at(-1).partName='Incident neutron';for(let j=0;j<3;j++){shape('Arrow',340,293,45+j*8,-45-j*15,'','#427665');shape('Circle',383+j*8,242-j*15,10,10,'','#488990');nodes.at(-1).partName='Emitted neutron '+(j+1);}}
 shape('Arrow',155,308,160,-22);shape('Arrow',fusion?155:310,fusion?338:285,fusion?160:85,fusion?-51:55);
 }
 if(s.name==='Decay chain'){const stages=['U-238','Th-234','Pa-234m','U-234'];stages.forEach((v,i)=>{text(v,28+i*166,285);if(i<3)shape('Arrow',98+i*166,296,70,0);});}
 if(s.name.includes('decay')){
 const emit=s.name==='Alpha decay'?'Helium nucleus':s.name==='Gamma decay'?'Gamma photon':s.name==='Beta-minus decay'?'Electron':'Positron';
 const cluster=(x,y,count)=>{for(let j=0;j<count;j++){const a=j*2.4,r=4*Math.sqrt(j);shape('Circle',x+r*Math.cos(a),y+r*Math.sin(a),17,17,'',j%2?'#446caa':'#bf4056');nodes.at(-1).z=5*Math.sin(j);}};
 cluster(83,326,16);cluster(330,326,s.name==='Alpha decay'?12:16);shape('Arrow',132,335,143,0);
 if(s.name==='Alpha decay')cluster(520,319,4);else if(s.name==='Gamma decay'){const points=Array.from({length:55},(_,i)=>({x:465+i*2,y:334+9*Math.sin(i*.45)}));nodes.push({kind:'Freehand',x:465,y:325,w:108,h:18,color:'#855ca5',points});}
 else {shape('Circle',505,320,18,18,'','#447878');shape('Arrow',525,333,44,18);text(s.name==='Beta-minus decay'?'Antineutrino':'Neutrino',526,350);}
 text('Parent',55,270);text('Daughter',295,270);text(emit,470,270);}
 if(s.name.includes('decay'))text('Parent nucleus → daughter nucleus + emitted particles',28,240);
 }else if(s.name==='Half-life graph'){
 const h=s.half||2;text('Undecayed nuclei (% of initial sample)',25,49);shape('Line',65,305,550,0);shape('Line',65,305,0,-196);
 const points=Array.from({length:101},(_,i)=>({x:65+i*5.4,y:305-190*2**(-i/10/h)}));
 nodes.push({kind:'Freehand',x:65,y:115,w:540,h:190,color:'#6a36a0',points});
 for(let i=0;i<=10;i+=2)text(String(i),62+i*54,307);
 text('Time (hours) · half-life = '+h+' h',105,340);text('100',18,99);text('50',27,198);text('0',39,280);
 for(let t=h;t<=10;t+=h){shape('Line',65+54*t,305,0,-190*2**(-t/h),'','#9484af');if(t<=3*h)text(t+' h',67+54*t,273-190*2**(-t/h));}
 }else if(s.name==='Binding energy per nucleon'){
 text('Mean binding energy (MeV per nucleon), rounded',26,55);
 for(const [i,[name,val]] of [['H-2',1.11],['He-4',7.07],['Fe-56',8.79],['U-238',7.57]].entries()){
 const x=55+i*155;shape('Rectangle',x,300-val*19,65,val*19);text(name,x,305);text(String(val),x,270-val*19);}
 }else if(s.name==='Radiation penetration and shielding'){
 for(const [i,[ray,barrier]] of [['Alpha','Paper'],['Beta','Plastic sheet'],['Gamma','Thick lead or concrete']].entries()){
 const y=90+i*75;text(ray,28,y);shape('Arrow',110,y+12,95+i*60,0);shape('Rectangle',213+i*60,y-8,9+i*8,45);text(barrier,250+i*60,y);}
 text('Qualitative attenuation depends on energy and thickness.',26,330);
 }else{
 const el=P.atoms.elements.find(e=>e.symbol===(s.element||'C')),z=el.number;
 const masses=s.name==='Comparing isotopes'?[el.massNumber,el.massNumber+1]:[el.massNumber+(s.extra||0)];
 masses.forEach((a,i)=>{const x=52+i*315;text(String(a),x,88);text(String(z),x,120);text(el.symbol,x+40,104);
 text(z+' protons, '+(a-z)+' neutrons',x,174);
 for(let j=0;j<a;j++)shape('Circle',x+(j%6)*22,226+Math.floor(j/6)*22,18,18,'',j<z?'#bc3350':'#445fa4');});
 text('Red = proton     Blue = neutron',30,335);
 }
 if(s.caption){text(s.caption,26,370);nodes.at(-1).lessonCaption=true;}
 text('Schematic · sizes and distances exaggerated',26,399);
 for(const n of nodes){if(n.kind==='Circle'){n.fill=true;n.partName=n.partName||(n.color==='#bf4056'||n.color==='#bc3350'?'Proton (schematic)':n.color==='#446caa'||n.color==='#445fa4'?'Neutron (schematic)':'Particle or nucleus');}if(n.kind==='Rectangle')n.fill=true;}
 return nodes;
 }
 function controls(model,canvas,draw){
 const s=model.nuclear,box=document.createElement('div');const side=canvas.parentElement.querySelector(':scope > aside');if(side)side.prepend(box);else canvas.before(box);
 const refresh=()=>{const next=build(s);next.forEach((n,i)=>{const old=model.nodes[i];if(old?.kind===n.kind){for(const k of ['id','description','calloutX','calloutY','z','color'])if(old[k]!==undefined)n[k]=old[k];}});model.nodes=next;draw();};
 const caption=field('Diagram caption','text',s.caption||'',box);caption.maxLength=52;
 caption.oninput=()=>{const old=model.nodes.find(n=>n.lessonCaption);s.caption=caption.value;if(old)old.label=s.caption;else model.nodes.push({kind:'Label',lessonCaption:true,label:s.caption,color:'#312344',x:26,y:370,w:630,h:25});draw();};
 if(s.name==='Half-life graph')select('Half-life (hours)',['1','2','3','4','5'],String(s.half||2),box,v=>{s.half=+v;refresh();});
 if(reactions[s.name]?.length>1)select('Worked example',reactions[s.name].map(r=>r[0]),reactions[s.name][s.example||0][0],box,v=>{s.example=reactions[s.name].findIndex(r=>r[0]===v);refresh();});
 if(names.indexOf(s.name)<2){select('Element',['C','N','O','Ne'],s.element||'C',box,v=>{s.element=v;refresh();});if(s.name===names[0])select('Extra neutrons',['0','1','2'],String(s.extra||0),box,v=>{s.extra=+v;refresh();});}
 button('Export diagram PNG',()=>{draw();canvas.toBlob(b=>download(b,'nuclear-physics.png'));},box);
 }
 function open(name,dimension='2D'){const nuclear={name};P.diagram(null,{type:'diagram',subject:'Physics',width:560,title:name,dimension,nuclear,nodes:build(nuclear),lines:[]});}
 P.nuclear={controls,build,names,open};
 for(const name of names)P.commands.push({name,keywords:'Nuclear physics diagram',fn:()=>open(name)});
 P.add('Nuclear physics diagrams',()=>{
 const d=modal('Nuclear physics diagrams','<div id="nu-search"></div><div id="nu-results"></div>'),f=field('Search diagrams','search','',$('nu-search'));
 const dimension=select('View',['2D','3D'],'2D',$('nu-search'),()=>{});function render(){const out=$('nu-results');out.replaceChildren();for(const name of names.filter(n=>n.toLowerCase().includes(f.value.trim().toLowerCase())))button(name,()=>{d.close();const nuclear={name};P.diagram(null,{type:'diagram',subject:'Physics',width:560,title:name,dimension:dimension.value,nuclear,nodes:build(nuclear),lines:[]});},out);}
 f.oninput=render;render();
 },'Physics','nuclear isotope decay half-life fission fusion radiation shielding binding energy');
})();
