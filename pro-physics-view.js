'use strict';
(()=>{
 const P=FTEPro;
 function studio(m,canvas,getSelected,setSelected,draw){
 const host=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=(m.subject||'Science')+' diagram view and parts';host.append(legend);canvas.before(host);
 const wrapper=document.createElement('div'),side=document.createElement('aside');wrapper.className='v16-physics-layout';canvas.before(wrapper);wrapper.append(side,canvas);side.append(host);side.prepend(document.getElementById('pro-diagram-tools'));
 const view=m.camera||(m.camera={yaw:.32,pitch:-.23,zoom:.88});
 const dim=select('Diagram view',['2D','3D'],m.dimension||'2D',host,v=>{m.dimension=v;draw();});
 const parts=select('Diagram part',[],'',host,v=>{setSelected(+v);draw();});
 const color=field('Selected part color','color','#312344',host);
 const px=field('Part position X','number',0,host),py=field('Part position Y','number',0,host);for(const [input,key,offset] of [[px,'x','dx'],[py,'y','dy']])input.oninput=()=>{const n=selected();if(!n||!Number.isFinite(input.valueAsNumber))return;const delta=input.valueAsNumber-n[key];if(n.anchor)n.anchor[offset]+=delta;else n[key]+=delta;if(n.wire&&key==='x')n.wire.bend+=delta;if(n.points)for(const pt of n.points)pt[key]+=delta;draw();};
 const depth=field('Part depth (Z)','number',0,host);
 const desc=field('Part description','text','',host);desc.maxLength=100;
 const dx=field('Description offset X','number',54,host),dy=field('Description offset Y','number',-28,host);
 const toggles={};
 for(const [label,key] of [['Show names','showNames'],['Show descriptions','showDescriptions'],['Show description lines','showLeaders'],['Monochrome','mono']]){
 const f=field(label,'checkbox','',host);toggles[key]=f;f.checked=key==='mono'?!!m[key]:m[key]!==false;f.onchange=()=>{m[key]=f.checked;draw();};}
 if(m.showLeaders===undefined&&m.showDescriptions===false){m.showLeaders=false;toggles.showLeaders.checked=false;}
 button('Hide all annotations',()=>{for(const k of ['showNames','showDescriptions','showLeaders']){m[k]=false;toggles[k].checked=false;}draw();},host);
  const selected=()=>m.nodes[getSelected()];
 color.oninput=()=>{if(selected()){selected().color=color.value;draw();}};
 for(const [input,key] of [[depth,'z'],[dx,'calloutX'],[dy,'calloutY']])input.oninput=()=>{if(selected()&&input.value!==''&&Number.isFinite(+input.value)){selected()[key]=Math.max(-900,Math.min(900,+input.value));draw();}};
 desc.oninput=()=>{if(selected()){selected().description=desc.value;draw();}};
 function opticalBench(){
 const normal=m.nodes.find(n=>n.partName==='Normal at the optical centre');if(!normal)return;
 const controls=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Optical bench parameters';controls.append(summary);side.prepend(controls);
 const lens=m.nodes.find(n=>n.kind==='Lens'),inc=m.nodes.find(n=>n.partName==='Incident ray'),out=m.nodes.find(n=>n.partName==='Refracted ray'),focus=m.nodes.find(n=>n.partName==='Focal point');if(!lens||!inc||!out||!focus)return;
 const settings=m.optics||(m.optics={mode:'Thin lens',focal:155,angle:35,index:1.50});
 const mode=select('Optical model',['Thin lens','Air to glass'],settings.mode,controls,v=>{settings.mode=v;refresh();draw();});
 const f=field('Focal length (drawing units)','number',settings.focal,controls),a=field('Incidence angle (degrees)','number',settings.angle,controls),n=field('Refractive index of glass','number',settings.index,controls);f.min=40;f.max=245;a.min=1;a.max=75;n.min=1;n.max=2.5;n.step=.01;
 const display=document.createElement('output');controls.append(display);
 function refresh(){const boundary=settings.mode==='Air to glass',theta=settings.angle*Math.PI/180,refr=Math.asin(Math.sin(theta)/settings.index),x=lens.x+lens.w/2,y=lens.y+lens.h/2;
 f.disabled=boundary;a.disabled=n.disabled=!boundary;
 if(boundary){const y0=y;Object.assign(inc,{x:x-175*Math.cos(theta),y:y0-175*Math.sin(theta),w:175*Math.cos(theta),h:175*Math.sin(theta)});Object.assign(out,{x,y:y0,w:200*Math.cos(refr),h:200*Math.sin(refr)});Object.assign(normal,{x:x-91,y:y0,w:182,h:0});}
 else{const h=-62;Object.assign(inc,{x:x-245,y:y+h,w:245,h:0});Object.assign(out,{x,y:y+h,w:255,h:-h*255/settings.focal});Object.assign(focus,{x:x+settings.focal-focus.w/2,y:y-focus.h/2});}
 focus.opticalHidden=boundary;lens.interface=boundary;normal.opticalHidden=!boundary;
 display.textContent=boundary?'Air n = 1.00 · θᵢ '+settings.angle+'° · θₜ '+(refr*180/Math.PI).toFixed(1)+'° (from normal)':'Focal length '+settings.focal+' drawing units';
 }
 for(const [input,k] of [[f,'focal'],[a,'angle'],[n,'index']])input.oninput=()=>{if(!input.value||!input.validity.valid)return;settings[k]=+input.value;refresh();draw();};
 refresh();return {settings,lens};
 }
 const terminalTypes=new Set(['Battery','Resistor','Capacitor','Diode','LED','Switch','Inductor']);
 const wiring=document.createElement('details'),wireSummary=document.createElement('summary');wireSummary.textContent='Circuit connections';wiring.append(wireSummary);side.append(wiring);
 const from=select('From component',[],'',wiring,()=>{}),fromTerminal=select('From terminal',['A','B'],'A',wiring,()=>{}),to=select('To component',[],'',wiring,()=>{}),toTerminal=select('To terminal',['A','B'],'B',wiring,()=>{});
 button('Connect terminals',()=>{if(!from.value||!to.value||from.value===to.value)return say('Choose two different components.');const a=[from.value,Number(fromTerminal.value==='B')],b=[to.value,Number(toTerminal.value==='B')];if(m.nodes.some(n=>n.wire&&[JSON.stringify([n.wire.a,n.wire.b]),JSON.stringify([n.wire.b,n.wire.a])].includes(JSON.stringify([a,b]))))return say('These terminals are already connected.');
 const owner=m.nodes.find(n=>n.id===from.value),bend=Math.min(665,Math.max(35,owner.x+(a[1]?owner.w+45:-45)));m.nodes.push({kind:'Freehand',id:crypto.randomUUID(),partName:'Insulated conductor',color:'#384d58',x:0,y:0,w:1,h:1,points:[],wire:{a,b,bend}});draw();},wiring);
 let lastPorts='';
 function syncPorts(){const ports=m.nodes.filter(n=>terminalTypes.has(n.kind)),key=ports.map(n=>n.id+' '+(n.partName||n.kind)).join('|');if(key===lastPorts)return;lastPorts=key;for(const select of [from,to]){const prev=select.value;select.replaceChildren(...ports.map((n,i)=>new Option((i+1)+' · '+(n.partName||n.kind),n.id)));if(ports.some(n=>n.id===prev))select.value=prev;}if(to.value===from.value&&ports.length>1)to.selectedIndex=1;}
 function junctions(ctx){
 const wires=m.nodes.filter(n=>n.wire&&n.points?.length>1);if(!wires.length)return;
 const ends=new Map(),segments=[];
 for(const n of wires){for(const [e,k] of [[n.wire.a,0],[n.wire.b,n.points.length-1]]){const key=e.join('/'),p=n.points[k];ends.set(key,{count:(ends.get(key)?.count||0)+1,p:project(p.x,p.y,p.z||0)});}
 if(!is3D())for(let k=1;k<n.points.length;k++){const a=n.points[k-1],b=n.points[k];segments.push({n,a,b});}}
 ctx.save();
 for(let i=0;i<segments.length;i++){const u=segments[i];for(const v of segments.slice(0,i)){if(u.n===v.n)continue;const h=u.a.y===u.b.y?u:v,t=h===u?v:u;if(h.a.y!==h.b.y||t.a.x!==t.b.x)continue;
 const x=t.a.x,y=h.a.y;if(x<=Math.min(h.a.x,h.b.x)+4||x>=Math.max(h.a.x,h.b.x)-4||y<=Math.min(t.a.y,t.b.y)+4||y>=Math.max(t.a.y,t.b.y)-4)continue;
 const p=project(x,y,0);ctx.fillStyle='white';ctx.fillRect(p.x-6,p.y-5,12,10);ctx.strokeStyle=t.n.color;ctx.beginPath();ctx.moveTo(p.x,p.y-6);ctx.lineTo(p.x,p.y+6);ctx.stroke();ctx.strokeStyle=h.n.color;ctx.beginPath();ctx.arc(p.x,p.y,6,Math.PI,2*Math.PI);ctx.stroke();}}
 for(const {count,p} of ends.values())if(count>1){ctx.beginPath();ctx.arc(p.x,p.y,4.3,0,2*Math.PI);ctx.fillStyle='#283944';ctx.fill();}ctx.restore();
 }
 const bench=opticalBench();
 const cameraMode=select('View control',['Rotate view','Move parts','Pan'],'Rotate view',host,()=>{});
 const reset=button('Reset 3D camera',()=>{Object.assign(view,{yaw:.32,pitch:-.23,zoom:.88,panX:0,panY:0});draw();},host);
 button('Export current view PNG',()=>{setSelected(-1);draw();canvas.toBlob(b=>download(b,'physics-diagram.png'));},host);
 button('Use selected part in labeling question',()=>{
 const i=getSelected(),n=m.nodes[i];if(!n)return say('Select the target part first.');
 const prior=[m.showNames,m.showDescriptions,m.showLeaders];m.showNames=m.showDescriptions=m.showLeaders=false;setSelected(-1);draw();const img=document.createElement('canvas');img.width=canvas.width;img.height=canvas.height;img.getContext('2d').drawImage(canvas,0,0);[m.showNames,m.showDescriptions,m.showLeaders]=prior;setSelected(i);draw();
 const pos=project(n.x+n.w/2,n.y+(n.hardware?0:n.h/2),n.z||0);canvas.closest('dialog').close();P.teacherStudio.labelingFromView(img,'Physics',n.partName||n.label||n.kind,n.id,pos.x,pos.y,700,440);
 },host);
 const hint=document.createElement('small');hint.textContent=' Drag to rotate your view. Choose Move parts to drag a part. Pan, Shift-drag or right-drag moves the view. Scroll to zoom.';host.append(hint);
 let drag=null,labels=[];
 const is3D=()=>dim.value==='3D';
 const hitAt=e=>{const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)*700/box.width,y=(e.clientY-box.top)*440/box.height;return order().reverse().find(({i})=>{const n=m.nodes[i],p=project(n.x+n.w/2,n.y+(n.hardware?0:n.h/2),n.z||0);return Math.hypot(x-p.x,y-p.y)<Math.max(14,Math.min(45,Math.abs(n.w)*.45));});};
 canvas.addEventListener('contextmenu',e=>{if(is3D())e.preventDefault();});
 let down;canvas.addEventListener('pointerdown',e=>{if(!is3D())return;down=[e.clientX,e.clientY];e.preventDefault();e.stopImmediatePropagation();const hit=hitAt(e),pan=e.shiftKey||e.button!==0||cameraMode.value==='Pan';if(hit&&!pan)setSelected(hit.i);drag={x:e.clientX,y:e.clientY,pan,moving:!pan&&cameraMode.value==='Move parts'&&hit};canvas.setPointerCapture(e.pointerId);draw();},true);
 canvas.addEventListener('pointermove',e=>{if(!is3D())return;e.stopImmediatePropagation();if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y,box=canvas.getBoundingClientRect(),sx=dx*700/box.width,sy=dy*440/box.height;
 if(drag.pan){view.panX=(view.panX||0)+sx;view.panY=(view.panY||0)+sy;}
 else if(drag.moving){const n=selected(),x=(sx*Math.cos(view.yaw)+sy*Math.sin(view.pitch)*Math.sin(view.yaw))/view.zoom,y=sy*Math.cos(view.pitch)/view.zoom,z=(sx*Math.sin(view.yaw)-sy*Math.sin(view.pitch)*Math.cos(view.yaw))/view.zoom;if(n){if(n.anchor){n.anchor.dx+=x;n.anchor.dy+=y;n.anchor.dz=(n.anchor.dz||0)+z;}else{n.x+=x;n.y+=y;n.z=(n.z||0)+z;}if(n.points)for(const p of n.points){p.x+=x;p.y+=y;p.z=(p.z||0)+z;}if(n.wire)n.wire.bend+=x;}}
 else{view.yaw+=dx*.009;view.pitch=Math.max(-1.4,Math.min(1.4,view.pitch+dy*.009));}drag.x=e.clientX;drag.y=e.clientY;draw();}},true);
 for(const event of ['pointerup','pointercancel','dblclick'])canvas.addEventListener(event,e=>{if(is3D()){e.stopImmediatePropagation();if(event==='pointerup'&&down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<4){const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)*700/box.width,y=(e.clientY-box.top)*440/box.height;const hits=order().reverse().filter(({i})=>{const n=m.nodes[i],p=project(n.x+n.w/2,n.y+(n.hardware?0:n.h/2),n.z||0);return Math.hypot(x-p.x,y-p.y)<Math.max(14,Math.min(45,Math.abs(n.w)*.45));});if(hits.length)setSelected(hits[0].i);draw();}drag=null;}},true);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const factor=e.deltaY<0?1.1:1/1.1;if(is3D())view.zoom=Math.max(.25,Math.min(4,view.zoom*factor));else m.zoom2D=Math.max(.25,Math.min(4,(m.zoom2D||1)*factor));draw();},{passive:false});
 function sync(){syncPorts();const names=m.nodes.map((n,i)=>(i+1)+' · '+(n.partName||n.label||n.kind));if(names.length!==labels.length||names.some((v,i)=>v!==labels[i])){parts.replaceChildren(...names.map((v,i)=>new Option(v,i)));labels=names;}
 parts.selectedIndex=getSelected();const n=selected();for(const input of [px,py,color,depth,desc,dx,dy])input.disabled=!n;
 if(n){color.value=n.color||'#312344';for(const [input,value] of [[px,n.x],[py,n.y],[depth,n.z||0],[dx,n.calloutX??54],[dy,n.calloutY??-28],[desc,n.description||'']])if(document.activeElement!==input)input.value=value;}
 depth.disabled=!n||!is3D();reset.disabled=!is3D();cameraMode.closest('label').hidden=!is3D();}
 function project(x,y,z){if(!is3D()){const k=m.zoom2D||1;return {x:350+(x-350)*k,y:220+(y-220)*k,d:0};}const cy=Math.cos(view.yaw),sy=Math.sin(view.yaw),cx=Math.cos(view.pitch),sx=Math.sin(view.pitch);
 x-=350;y-=220;const back=-sy*x+cy*z;return {x:350+(view.panX||0)+view.zoom*(cy*x+sy*z),y:220+(view.panY||0)+view.zoom*(cx*y-sx*back),d:sx*y+cx*back};}
 const thickness=n=>['Label','Line','Arrow','Axes','Freehand','Connector'].includes(n.kind)?0:n.kind==='Circle'?Math.min(20,Math.abs(n.w)/2):10;
 function matrix(ctx,n,z){if(!is3D()){const k=m.zoom2D||1;ctx.translate(350*(1-k),220*(1-k));ctx.scale(k,k);return;}const a=project(0,0,z),b=project(1,0,z),c=project(0,1,z);ctx.transform(b.x-a.x,b.y-a.y,c.x-a.x,c.y-a.y,a.x,a.y);}
 function order(){const rows=m.nodes.map((n,i)=>({i,d:project(n.x+n.w/2,n.y+(n.hardware?0:n.h/2),n.z||0).d}));return is3D()?rows.sort((a,b)=>a.d-b.d):rows;}
 function solid(ctx,n){if(!is3D()||!thickness(n))return;
 const z=n.z||0,t=thickness(n),x=n.x,y=n.y,w=n.w,h=n.h;
 if(n.kind==='Circle'){const p=project(x+w/2,y+h/2,z),r=Math.max(1,Math.min(Math.abs(w),Math.abs(h))*view.zoom/2),g=ctx.createRadialGradient(p.x-r*.3,p.y-r*.35,0,p.x,p.y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.27,n.color||'#312344');g.addColorStop(.70,n.color||'#312344');g.addColorStop(1,'#292630');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,2*Math.PI);ctx.fill();return;}
 if(!['Rectangle','Triangle','Polygon','Lens'].includes(n.kind))return;
 const verts=n.kind==='Rectangle'?[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]:Array.from({length:n.kind==='Triangle'?3:n.kind==='Polygon'?6:32},(_,i,unused)=>{const len=n.kind==='Triangle'?3:n.kind==='Polygon'?6:32,a=i*2*Math.PI/len-Math.PI/2;return [x+w/2+w/2*Math.cos(a),y+h/2+h/2*Math.sin(a)];});
 ctx.save();ctx.fillStyle=n.color||'#312344';ctx.globalAlpha=.32;for(let i=0;i<verts.length;i++){const v=verts[i],u=verts[(i+1)%verts.length];ctx.beginPath();[project(...v,z),project(...u,z),project(...u,z-t),project(...v,z-t)].forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}ctx.restore();}
 function component(ctx,n){
 if(n.opticalHidden)return true;
 if(P.scienceMaterials.component(ctx,n,project,is3D()))return true;
 if(n.interface){const x=n.x+n.w/2,pts=[[x,n.y,0],[x,n.y+n.h,0],[x,n.y+n.h,52],[x,n.y,52]].map(v=>project(...v));ctx.save();ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='#dcecf1';ctx.fill();ctx.strokeStyle=n.color;ctx.lineWidth=3;ctx.stroke();ctx.restore();return true;}
 if(is3D()&&n.partName){
 const z=n.z||0,c=n.color,pts=(arr)=>arr.map(([x,y,d])=>project(x,y,z+(d||0)));
 const path=(coordinates,closed=false,opacity=1)=>{const pp=pts(coordinates);ctx.beginPath();pp.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(closed){ctx.closePath();ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle=c;ctx.fill();ctx.restore();}ctx.stroke();};
 ctx.save();ctx.lineWidth=2;ctx.strokeStyle=c;
 if(n.partName==='Spring'){const points=Array.from({length:185},(_,i)=>{const t=i/184,a=t*14*Math.PI;return [n.x+n.w*t,n.y+12*Math.sin(a),12*Math.cos(a)];});path(points);ctx.restore();return true;}
 if(n.partName==='Cylinder cutaway'){const {x,y,w,h}=n,rad=w/2,cx=x+rad;for(const end of [y,y+h])path(Array.from({length:50},(_,i)=>{const t=i/49*2*Math.PI;return [cx+rad*Math.cos(t),end,rad*.66*Math.sin(t)];}));for(const side of [-1,1])path([[cx+side*rad,y,0],[cx+side*rad,y+h,0]]);ctx.restore();return true;}
 if(n.partName==='Piston'){const r=n.w/2;for(const y of [n.y+n.h,n.y])path(Array.from({length:49},(_,i)=>{const t=i/48*2*Math.PI;return [n.x+r+r*Math.cos(t),y,r*.66*Math.sin(t)];}),true,.72);ctx.restore();return true;}
 if(n.partName==='Inclined plane'||n.kind==='Freehand'&&n.partName==='Block'){
 const outline=n.points.slice(0,-1),width=n.partName==='Block'?46:78;const faces=outline.map((p,i)=>{const b=outline[(i+1)%outline.length];return [[p.x,p.y,0],[b.x,b.y,0],[b.x,b.y,-width],[p.x,p.y,-width]];});faces.push(outline.map(p=>[p.x,p.y,-width]),outline.map(p=>[p.x,p.y,0]));faces.sort((a,b)=>pts(a).reduce((t,p)=>t+p.d/a.length,0)-pts(b).reduce((t,p)=>t+p.d/b.length,0));faces.forEach(f=>path(f,true,.40));ctx.restore();return true;}
 ctx.restore();
 }
 if(!is3D()||(!n.hardware&&!n.wire))return false;
 const z=n.z||0, start=project(n.x,n.y,z),end=project(n.x+n.w,n.y,z);
 ctx.save();ctx.lineCap='round';
 function stroke(a,b,col,w){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=col;ctx.lineWidth=w*view.zoom;ctx.stroke();}
 if(n.wire){for(let i=1;i<n.points.length;i++){const a=n.points[i-1],b=n.points[i];stroke(project(a.x,a.y,a.z),project(b.x,b.y,b.z),n.color,4);}ctx.restore();return true;}
 const along=(t,y=0,d=0)=>project(n.x+t*n.w,n.y+y,z+d);
 function barrel(from,to,r,color){const seg=40;const faces=[];for(let j=0;j<seg;j++){const u=j*2*Math.PI/seg,v=(j+1)*2*Math.PI/seg,points=[along(from,r*Math.cos(u),r*Math.sin(u)),along(to,r*Math.cos(u),r*Math.sin(u)),along(to,r*Math.cos(v),r*Math.sin(v)),along(from,r*Math.cos(v),r*Math.sin(v))];faces.push({points,z:points.reduce((t,p)=>t+p.d,0),shade:.08+.28*(1+Math.cos(u-.3))/2});}faces.sort((a,b)=>a.z-b.z);for(const f of faces){ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.fillStyle='rgba(0,0,0,'+f.shade+')';ctx.fill();}
 for(const t of [from,to]){const a=along(t),b=along(t===from?to:from);if(a.d<b.d)continue;ctx.beginPath();for(let j=0;j<=seg;j++){const u=j*2*Math.PI/seg,p=along(t,r*Math.cos(u),r*Math.sin(u));j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.fillStyle=color;ctx.fill();}}
 stroke(start,end,'#687986',4);
 if(n.hardware==='cell'){barrel(.12,.84,17,n.color);barrel(.07,.14,12,'#bbced3');barrel(.025,.075,7,'#9fabaf');barrel(.82,.91,17,'#817e75');}else{barrel(.19,.81,11,n.color);for(const [t,col] of [[.29,'#583c2c'],[.39,'#222222'],[.49,'#ae4d34'],[.70,'#c6a452']])barrel(t,t+.035,11.4,col);}
 ctx.restore();return true;
 }
 function annotations(ctx){junctions(ctx);ctx.save();
 if(bench?.settings.mode==='Air to glass'&&m.showNames!==false){const l=bench.lens,cx=l.x+l.w/2,cy=l.y+l.h/2,a=bench.settings.angle*Math.PI/180,b=Math.asin(Math.sin(a)/bench.settings.index);
 ctx.strokeStyle='#547586';ctx.fillStyle='#293a48';ctx.font='13px Arial';
 for(const [angle,start,r,txt] of [[a,Math.PI,51,'θᵢ'],[b,0,65,'θₜ']]){ctx.beginPath();for(let i=0;i<=24;i++){const t=start+angle*i/24,p=project(cx+r*Math.cos(t),cy+r*Math.sin(t),l.z||0);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.stroke();const mid=start+angle*.5,p=project(cx+(r+20)*Math.cos(mid),cy+(r+20)*Math.sin(mid),l.z||0);ctx.fillText(txt+' '+(angle*180/Math.PI).toFixed(1)+'°',p.x-12,p.y-3);}}if(m.showNames!==false){ctx.font='bold 14px Arial';ctx.fillStyle='#283944';for(const n of m.nodes.filter(n=>n.nameAtTip&&P.callouts.mode(m,n.id)==='auto')){const p=project(n.x+n.w,n.y+n.h,n.z||0);ctx.fillText(n.partName,p.x+5,p.y-5);}}if(m.showDescriptions===false){ctx.restore();return;}ctx.font='14px Arial';for(const n of m.nodes){if(!n.description||P.callouts.mode(m,n.id)!=='auto')continue;const p=project(n.x+n.w/2,n.y+(n.hardware?0:n.h/2),n.z||0),width=Math.min(650,ctx.measureText(n.description).width+8),x=Math.max(3,Math.min(697-width,p.x+(n.calloutX??54))),y=Math.max(18,Math.min(434,p.y+(n.calloutY??-28)));ctx.strokeStyle=n.color;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(x+3,y-5);if(m.showLeaders!==false)ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(x,y-16,width,20);ctx.fillStyle='#27212d';ctx.fillText(n.description,x+4,y,642);}ctx.restore();}
 return {order,is3D,sync,matrix,solid,annotations,component,project};
 }
 P.physicsStudio=studio;
})();
