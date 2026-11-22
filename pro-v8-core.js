/* V8 offline editable science objects. No document schema changes. */
'use strict';
(()=>{const P=FTEPro,C=v=>structuredClone(v),key='fte-v8-science-library-1';
const finite=(v,limit=10000)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=limit;
function read(){const a=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(a))throw Error('Invalid science library. Restore an exported backup.');return a;}
function write(a){localStorage.setItem(key,JSON.stringify(a));}
function valid(s){P.callouts.valid(s);if(!s||!['v8compound','v8atom','v8astro','v9medical'].includes(s.type))throw Error('Unsupported science object.');if(typeof s.title!=='string'||s.title.length>300)throw Error('A title of at most 300 characters is required.');if(['v8compound','v8astro'].includes(s.type)&&(!s.view||!['rx','ry','zoom'].every(k=>finite(s.view[k],100))||s.view.zoom<=0))throw Error('Invalid camera settings.');if(s.view){for(const k of ['rx','ry','zoom'])if(s.view[k]!==undefined&&!finite(s.view[k],100))throw Error('Invalid camera.');}P.v8.validators[s.type](s);return C(s);}
function save(s){s=valid(s);const a=read(),i=a.findIndex(x=>x.id===s.libraryId);s.libraryId=i>=0?s.libraryId:crypto.randomUUID();const item={id:s.libraryId,name:s.title,type:s.type,spec:s};if(i>=0)a[i]=item;else a.push(item);write(a);return s.libraryId;}
function library(type){const d=modal('Saved '+({v8compound:'compounds',v8atom:'atoms',v8astro:'astrophysics templates',v9medical:'medical templates'})[type],'<div id="v8-lib-tools" class="science-controls"></div><div id="v8-lib-list"></div>');P.View3D.decorate(d);const host=$('v8-lib-tools'),q=field('Search saved items','search','',host);q.oninput=render;
const exp=items=>download(new Blob([JSON.stringify({format:'FTEScienceV8',version:1,items},null,2)],{type:'application/json'}),'Forbidden-science-library.json');
button('Export all',()=>exp(read().filter(a=>a.type===type)),host);button('Import',()=>{const f=document.createElement('input');f.type='file';f.accept='.json';f.onchange=async()=>{try{if(!f.files[0])return;if(f.files[0].size>15000000)throw Error('Maximum import size is 15 MB.');const data=JSON.parse(await f.files[0].text());if(data.format!=='FTEScienceV8'||data.version!==1||!Array.isArray(data.items)||data.items.length>1000)throw Error('Unsupported library file.');const add=data.items.map(t=>{const s=valid(t.spec);if(s.type!==type)throw Error('Import the matching kind of library.');s.libraryId=crypto.randomUUID();return {id:s.libraryId,name:s.title,type,spec:s};});write([...read(),...add]);render();}catch(e){say(e.message);}};f.click();},host);
function render(){const out=$('v8-lib-list');out.replaceChildren();for(const t of read().filter(t=>t.type===type&&JSON.stringify([t.name,t.spec.graph?.atoms?.map(a=>a.element)]).toLowerCase().includes(q.value.toLowerCase()))){const row=document.createElement('div');row.className='science-controls';const title=document.createElement('strong');title.textContent=t.name;row.append(title);button('Open',()=>{d.close();P.v8.editors[type](null,C(t.spec));},row);button('Rename',()=>{const n=prompt('New name',t.name);if(n?.trim()){write(read().map(a=>a.id===t.id?{...a,name:n.trim().slice(0,300),spec:{...a.spec,title:n.trim().slice(0,300)}}:a));render();}},row);button('Duplicate',()=>{const s=C(t.spec);delete s.libraryId;s.title+=' copy';save(s);render();},row);button('Export',()=>exp([t]),row);button('Delete',()=>{if(confirm('Delete '+t.name+'?')){write(read().filter(a=>a.id!==t.id));render();}},row);out.append(row);}if(!out.children.length)out.textContent='No matching saved items.';}render();}
/* Orthographic educational scene renderer. Object coordinates remain editable. */
function scene(canvas,getState,onSelect){const ctx=canvas.getContext('2d');let drag=null,points=[],moving=false;function project(p){const s=getState(),v=s.view||{},ry=s.dimension==='2D'?0:v.ry||0,rx=s.dimension==='2D'?0:v.rx||0,z=p.z||0,x=p.x*Math.cos(ry)+z*Math.sin(ry),zz=-p.x*Math.sin(ry)+z*Math.cos(ry);return {x:500+x*70*(v.zoom||1),y:310-(p.y*Math.cos(rx)-zz*Math.sin(rx))*70*(v.zoom||1),z:p.y*Math.sin(rx)+zz*Math.cos(rx)};}
function draw(){
 const s=getState(),scale=70*(s.view?.zoom||1);ctx.setTransform(canvas.width/1000,0,0,canvas.height/620,0,0);ctx.save();if(s.mono)ctx.filter='grayscale(1)';
 ctx.fillStyle='#f5f8fb';ctx.fillRect(0,0,1000,620);
 const objects=s.objects.map((o,index)=>({o,index})),marks=[],texts=[];
 function line(a,b,col,width=2,arrow=false){const p=project(a),q=project(b);marks.push({z:(p.z+q.z)/2,draw(){ctx.lineWidth=width;ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
 if(arrow){const t=Math.atan2(q.y-p.y,q.x-p.x);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x-11*Math.cos(t-.45),q.y-11*Math.sin(t-.45));ctx.lineTo(q.x-11*Math.cos(t+.45),q.y-11*Math.sin(t+.45));ctx.closePath();ctx.fillStyle=col;ctx.fill();}}});}
 points=[];
 for(const {o,index} of objects){let anchor=o;const col=o.color;
 if(o.kind==='trajectory'){
 const pts=o.points.map(p=>({x:o.x+p.x,y:o.y+p.y,z:o.z+p.z}));
 for(let j=1;j<pts.length;j++)line(pts[j-1],pts[j],col,1.8);anchor=pts[Math.floor(pts.length*.22)];
 }else if(o.kind==='vector'){anchor={x:o.x+o.dx,y:o.y+o.dy,z:o.z+o.dz};line(o,anchor,col,3,true);}
 else if(o.kind==='field'){for(let j=0;j<16;j++){const t=j*Math.PI/8,r=o.radius;line({x:o.x+r*Math.cos(t),y:o.y+r*Math.sin(t),z:o.z},{x:o.x+r*.55*Math.cos(t),y:o.y+r*.55*Math.sin(t),z:o.z},col,1.5,true);}}
 else if(o.kind==='body'){const p=project(o),r=Math.max(2.8,o.radius*scale);marks.push({z:p.z,draw(){P.scienceMaterials.paintBody(ctx,o,p,r,s);}});}
 const p=project(anchor);points.push({...p,index});const lines=[];
 if(P.callouts.mode(s,P.callouts.uid(o))==='auto'&&o.label&&s.showNames!==false)lines.push(o.label);
 if(P.callouts.mode(s,P.callouts.uid(o))==='auto'&&o.description&&s.showDescriptions!==false)lines.push(o.description);
 if(lines.length)texts.push({p,lines,col});
 }
 marks.sort((a,b)=>a.z-b.z).forEach(m=>m.draw());
 const used=[];ctx.font='14px Arial';ctx.textAlign='left';
 for(const {p,lines,col} of texts){const w=Math.min(285,Math.max(...lines.map(t=>ctx.measureText(t).width))+12),h=lines.length*18+4;const x=Math.max(8,Math.min(990-w,p.x+16));
 let y=Math.max(44,Math.min(570-h,p.y-h-5));for(let j=0;j<26;j++){if(!used.some(b=>x<b.x+b.w&&x+w>b.x&&y<b.y+b.h&&y+h>b.y))break;y+=h+2;if(y+h>575)y=48+j*3;}
 used.push({x,y,w,h});if(s.showLeaders!==false){ctx.strokeStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(x+3,y+h*.5);ctx.stroke();}
 ctx.fillStyle='rgba(255,255,255,.92)';ctx.fillRect(x,y,w,h);ctx.fillStyle='#263442';lines.forEach((t,i)=>ctx.fillText(t,x+5,y+15+i*18,w-8));}
 const sel=points.find(p=>p.index===s.selected);if(sel){ctx.strokeStyle='#8955a1';ctx.setLineDash([3,3]);ctx.strokeRect(sel.x-9,sel.y-9,18,18);ctx.setLineDash([]);}
 if(s.showNames!==false){ctx.fillStyle='#243444';ctx.font='bold 19px Arial';ctx.fillText(s.title.slice(0,85),18,27);ctx.font='13px Arial';ctx.fillText('Scene coordinates · body sizes, distances and vector lengths are schematic',18,604);
 const p=project({x:0,y:0,z:0});for(const [label,v] of [['x',[1,0,0]],['y',[0,1,0]],['z',[0,0,1]]]){const q=project({x:v[0],y:v[1],z:v[2]}),dx=(q.x-p.x)/scale*26,dy=(q.y-p.y)/scale*26;if(Math.abs(dx)+Math.abs(dy)<3)continue;ctx.beginPath();ctx.moveTo(930,557);ctx.lineTo(930+dx,557+dy);ctx.strokeStyle='#637387';ctx.stroke();ctx.fillText(label,933+dx,559+dy);}}
 P.callouts.draw(canvas,s,points.map(p=>({key:P.callouts.uid(s.objects[p.index]),name:s.objects[p.index].label||s.objects[p.index].kind,x:p.x,y:p.y})),1000,620,{leaders:s.showLeaders!==false});
 canvas.dataset.view=JSON.stringify(s.view);ctx.restore();
}
canvas.onpointerdown=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*1000/r.width,y=(e.clientY-r.top)*620/r.height,s=getState();const hit=points.filter(p=>Math.hypot(p.x-x,p.y-y)<25).sort((a,b)=>b.z-a.z)[0];if(hit)onSelect(hit.index);moving=s.tool==='Move'&&hit;drag={x:e.clientX,y:e.clientY,index:hit?.index};canvas.setPointerCapture(e.pointerId);canvas.focus();draw();};canvas.onpointermove=e=>{if(!drag)return;const s=getState(),dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(moving){const r=canvas.getBoundingClientRect(),unit=1000/r.width/(70*(s.view.zoom||1)),o=s.objects[drag.index];const sx=dx*unit,sy=-dy*unit,rx=s.dimension==='2D'?0:s.view.rx,ry=s.dimension==='2D'?0:s.view.ry;o.x+=sx*Math.cos(ry)+sy*Math.sin(rx)*Math.sin(ry);o.y+=sy*Math.cos(rx);o.z+=sx*Math.sin(ry)-sy*Math.sin(rx)*Math.cos(ry);onSelect(drag.index);}else if(s.dimension==='3D'){s.view.ry+=dx*.01;s.view.rx+=dy*.01;}drag.x=e.clientX;drag.y=e.clientY;draw();};canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;moving=false;};canvas.addEventListener('wheel',e=>{e.preventDefault();const s=getState();s.view.zoom=Math.max(.2,Math.min(4,s.view.zoom*(e.deltaY<0?1.1:1/1.1)));draw();},{passive:false});draw();return {draw,project};}
const css=document.createElement('style');css.textContent='.v8-studio .science-layout>div:first-child{max-height:60vh;overflow:auto;padding-right:12px}.v8-studio .science-layout>div:first-child>label{display:block;margin:7px 0}.v8-studio .science-layout>div:first-child input:not([type=checkbox]):not([type=color]),.v8-studio .science-layout>div:first-child select{width:100%;box-sizing:border-box}.v8-studio .science-layout>div:first-child button{margin:3px 2px}.v8-studio .science-canvas{max-height:52vh;object-fit:contain}.v8-studio .science-help{max-height:12vh;overflow:auto}@media(max-width:760px){.v8-studio .science-layout>div:first-child{max-height:30vh}}';document.head.append(css);
P.v8={clone:C,finite,read,write,valid,save,library,scene,validators:{},editors:{}};
pages.addEventListener('dblclick',e=>{const n=e.target.closest('[data-pro-object]');if(!n)return;try{const s=JSON.parse(n.dataset.proObject);if(P.v8.editors[s.type])P.v8.editors[s.type](n,valid(s));}catch(error){say(error.message);}});
})();
