/* Local graphical construction of RDKit-validated molecular graphs. */
'use strict';
(()=>{
 const P=FTEPro;
 function parse(block){
  const lines=block.split(/\r?\n/),count=lines.findIndex(l=>l.includes('V2000'));
  if(count<0)throw Error('This drawing editor requires a V2000 Molfile.');
  const na=+lines[count].slice(0,3),nb=+lines[count].slice(3,6),atoms=[],bonds=[];
  for(let i=0;i<na;i++){const l=lines[count+1+i];atoms.push({x:+l.slice(0,10),y:+l.slice(10,20),element:l.slice(31,34).trim(),charge:({1:3,2:2,3:1,5:-1,6:-2,7:-3})[+l.slice(36,39)]||0,isotope:0});}
  for(let i=0;i<nb;i++){const l=lines[count+1+na+i];bonds.push({a:+l.slice(0,3)-1,b:+l.slice(3,6)-1,order:+l.slice(6,9)});}
  for(const l of lines.slice(count+1+na+nb)){if(/^M  (CHG|ISO)/.test(l)){const a=l.trim().split(/\s+/);for(let i=0;i<+a[2];i++){const atom=atoms[+a[3+2*i]-1];if(atom)atom[a[1]==='CHG'?'charge':'isotope']=+a[4+2*i];}}}
  if(atoms.length){const xs=atoms.map(a=>a.x),ys=atoms.map(a=>a.y),minX=Math.min(...xs),maxY=Math.max(...ys);atoms.forEach(a=>{a.x=60+(a.x-minX)*45;a.y=60+(maxY-a.y)*45;});}
  return {atoms,bonds};
 }
 function serialize(g){
  if(g.atoms.length>999||g.bonds.length>999)throw Error('A drawing supports up to 999 atoms and bonds.');
  const n=v=>String(v).padStart(3),f=v=>v.toFixed(4).padStart(10);
  const lines=['Forbidden molecule','  Document Studio','',n(g.atoms.length)+n(g.bonds.length)+'  0  0  0  0            999 V2000'];
  for(const a of g.atoms)lines.push(f(a.x/45)+f(-a.y/45)+f(0)+' '+a.element.padEnd(3)+' 0  0  0  0  0  0  0  0  0  0  0  0');
  for(const b of g.bonds)lines.push(n(b.a+1)+n(b.b+1)+n(b.order)+'  0  0  0  0');
  for(const [key,tag]of [['charge','CHG'],['isotope','ISO']]){const entries=g.atoms.flatMap((a,i)=>a[key]?[[i+1,a[key]]]:[]);for(let i=0;i<entries.length;i+=8){const part=entries.slice(i,i+8);lines.push('M  '+tag+n(part.length)+part.map(([j,v])=>' '+n(j)+' '+n(v)).join(''));}}
  return lines.concat('M  END','').join('\n');
 }
 async function open(existing=null,spec={source:'',title:'Molecule'}){
  const rd=await P.chemistry();let graph={atoms:[],bonds:[]};
  if(spec.source){const mol=rd.get_mol(spec.source);try{if(!mol?.is_valid())throw Error('Cannot open an invalid molecule.');graph=parse(mol.get_molblock());}finally{mol?.delete();}}
  let selected=-1,bondStart=-1,drag=null,undo=[],redo=[];
  const d=modal('Visual molecule editor','<p>Atom: click to add or change an atom. Bond: click two atoms. Move: drag an atom. Erase: click an atom or bond. Charges and isotope mass apply to the next atom you add or change.</p><div id="molecule-tools" class="row"></div><canvas id="molecule-canvas" width="720" height="420" aria-label="Molecular drawing" style="width:100%;background:white;touch-action:none"></canvas><p id="molecule-message" role="status"></p>',[
   ['Undo',()=>{if(undo.length){redo.push(JSON.stringify(graph));graph=JSON.parse(undo.pop());draw();}}],
   ['Redo',()=>{if(redo.length){undo.push(JSON.stringify(graph));graph=JSON.parse(redo.pop());draw();}}],
   ['Validate',()=>validate()],
   ['Use in molecule editor',()=>{const mol=validate();if(!mol)return;const source=serialize(graph);d.close();P.molecule(existing,{...spec,type:'molecule',source});}]
  ]);
  const host=$('molecule-tools'),mode=select('Drawing tool',['Atom','Bond','Move','Erase','Benzene ring','Cyclohexane ring'],'Atom',host,()=>{bondStart=-1;}),element=select('Element',['C','N','O','H','S','P','F','Cl','Br','I','B','Si','Na','K','Mg','Ca','Fe','Zn','Cu'],'C',host,()=>{}),order=select('Bond order',['1','2','3'],'1',host,()=>{}),charge=field('Formal charge','number',0,host),isotope=field('Isotope mass (0 = natural)','number',0,host);
  const canvas=$('molecule-canvas'),ctx=canvas.getContext('2d');
  P.callouts.resize(canvas,720,420);canvas.style.aspectRatio='720 / 420';P.callouts.attach(canvas,()=>spec,draw,host,'Chemistry');
  function record(){undo.push(JSON.stringify(graph));if(undo.length>100)undo.shift();redo=[];}
  function validate(){let mol;try{if(!graph.atoms.length)throw Error('Add at least one atom.');mol=rd.get_mol(serialize(graph));if(!mol?.is_valid())throw Error('Invalid molecular graph or atom valence.');$('molecule-message').textContent='Valid: '+mol.get_smiles();return true;}catch(e){$('molecule-message').textContent=e.message;return false;}finally{mol?.delete();}}
  function draw(){const ids=P.chemPlate.keys(graph);ctx.fillStyle='white';ctx.fillRect(0,0,720,420);ctx.lineWidth=2;ctx.strokeStyle='#333';ctx.font='18px Arial';ctx.textAlign='center';ctx.textBaseline='middle';for(const b of graph.bonds){const a=graph.atoms[b.a],c=graph.atoms[b.b],dx=c.x-a.x,dy=c.y-a.y,len=Math.hypot(dx,dy)||1;for(let j=0;j<b.order;j++){const off=(j-(b.order-1)/2)*5;ctx.beginPath();ctx.moveTo(a.x-dy/len*off,a.y+dx/len*off);ctx.lineTo(c.x-dy/len*off,c.y+dx/len*off);ctx.stroke();}}graph.atoms.forEach((a,i)=>{ctx.fillStyle='white';ctx.beginPath();ctx.arc(a.x,a.y,17,0,Math.PI*2);ctx.fill();ctx.fillStyle=i===bondStart?'#7950b5':a.element==='O'?'#b02020':a.element==='N'?'#234dbc':'#222';if(P.callouts.mode(spec,ids.a[i])==='auto')ctx.fillText((a.isotope||'')+a.element+(a.charge?((Math.abs(a.charge)===1?'':Math.abs(a.charge))+(a.charge>0?'+':'−')):''),a.x,a.y);});P.callouts.draw(canvas,spec,[...graph.atoms.map((a,i)=>({key:ids.a[i],name:P.chemPlate.atomName(a)+' · '+(i+1),x:a.x,y:a.y})),...graph.bonds.map((b,i)=>({key:ids.b[i],name:'Bond '+(b.a+1)+'–'+(b.b+1),x:(graph.atoms[b.a].x+graph.atoms[b.b].x)/2,y:(graph.atoms[b.a].y+graph.atoms[b.b].y)/2}))],720,420);}
  function point(e){const r=canvas.getBoundingClientRect();return {x:Math.max(20,Math.min(700,(e.clientX-r.left)*720/r.width)),y:Math.max(20,Math.min(400,(e.clientY-r.top)*420/r.height))};}
  function atomAt(p){return graph.atoms.findIndex(a=>Math.hypot(a.x-p.x,a.y-p.y)<20);}
  canvas.onpointerdown=e=>{const p=point(e),i=atomAt(p);canvas.setPointerCapture(e.pointerId);
   if(mode.value==='Move'){if(i>=0){record();drag=i;}return;}
   if(mode.value==='Bond'){if(i<0)return;if(bondStart<0){bondStart=i;}else if(bondStart!==i){record();const b=graph.bonds.find(b=>b.a===i&&b.b===bondStart||b.b===i&&b.a===bondStart);if(b)b.order=+order.value;else graph.bonds.push({a:bondStart,b:i,order:+order.value});bondStart=-1;}draw();return;}
   record();
   if(mode.value==='Erase'){if(i>=0){graph.atoms.splice(i,1);graph.bonds=graph.bonds.filter(b=>b.a!==i&&b.b!==i).map(b=>({...b,a:b.a>i?b.a-1:b.a,b:b.b>i?b.b-1:b.b}));}else{const j=graph.bonds.findIndex(b=>{const a=graph.atoms[b.a],c=graph.atoms[b.b],dx=c.x-a.x,dy=c.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<10;});if(j>=0)graph.bonds.splice(j,1);}}
   else if(mode.value.endsWith('ring')){const start=graph.atoms.length;for(let j=0;j<6;j++){graph.atoms.push({x:p.x+45*Math.cos(j*Math.PI/3),y:p.y+45*Math.sin(j*Math.PI/3),element:'C',charge:0,isotope:0});graph.bonds.push({a:start+j,b:start+(j+1)%6,order:mode.value==='Benzene ring'&&j%2===0?2:1});}}
   else {const a={...p,element:element.value,charge:Math.max(-8,Math.min(8,Math.round(+charge.value||0))),isotope:Math.max(0,Math.min(300,Math.round(+isotope.value||0)))};if(i>=0)Object.assign(graph.atoms[i],{element:a.element,charge:a.charge,isotope:a.isotope});else graph.atoms.push(a);}
   draw();
  };
  canvas.onpointermove=e=>{if(drag!==null){Object.assign(graph.atoms[drag],point(e));draw();}};
  canvas.onpointerup=canvas.onpointercancel=()=>drag=null;draw();
 }
 P.visualMolecule=open;P.moleculeGraph={parse,serialize};
})();
