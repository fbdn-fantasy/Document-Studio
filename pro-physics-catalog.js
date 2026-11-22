// Editable Physics templates use the existing node model. Anchors use ids local to each instance.
'use strict';
(()=>{
const P=FTEPro,ink='#344858',red='#be5444',blue='#327e99',gold='#ab792c',green='#47815e';
function template(title){
 const ns=[];function add(kind,key,name,x,y,w,h,color,extra={}){const n={id:key,kind,partName:name,x,y,w,h,color,...extra};ns.push(n);return n;}
 const ray=(key,name,x,y,w,h,color,extra)=>add('Arrow',key,name,x,y,w,h,color,extra);
 const line=(key,name,x,y,w,h,color=ink,extra)=>add('Line',key,name,x,y,w,h,color,extra);
 const label=(name,x,y)=>add('Label','caption'+ns.length,name,x,y,250,20,ink,{label:name});
 const rect=(key,name,x,y,w,h,color)=>add('Rectangle',key,name,x,y,w,h,color,{fill:true});
 const curve=(key,name,pts,color)=>{const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);return add('Freehand',key,name,x,y,Math.max(...xs)-x,Math.max(...ys)-y,color,{points:pts.map(([x,y])=>({x,y}))});};
 const sphere=(key,name,x,y,r,c)=>add('Circle',key,name,x-r,y-r,r*2,r*2,c,{fill:true});
 function force(key,name,body,ox,oy,dx,dy,c){return ray(key,name,body.x+ox,body.y+oy,dx,dy,c,{anchor:{key:body.id,dx:ox,dy:oy},nameAtTip:true});}
 switch(title){
 case 'Block on ramp':{const pts=[[100,325],[550,325],[550,145],[100,325]];curve('ramp','Inclined plane',pts,ink);
 const block=curve('mass','Block',[[295,247],[351,225],[333,180],[277,202],[295,247]],blue);
 force('weight','Weight',block,38,35,0,84,red);force('normal','Normal reaction',block,45,59,-28,-70,green);force('friction','Static friction',block,47,58,29,-12,gold);label('Incline at rest · arrows show direction',132,375);break;}
 case 'Free-body forces':{line('floor','Surface',108,277,480,0);const b=rect('block','Block',278,184,109,92,blue);force('weight','Weight  4 N',b,54,46,0,96,red);force('normal','Normal  4 N',b,46,91,0,-96,green);force('push','Applied  5 N',b,0,48,120,0,gold);label('Force scale   24 drawing units = 1 N',115,382);break;}
 case 'Velocity and acceleration':{line('rail','Track',100,282,510,0);const b=rect('cart','Cart',200,207,90,46,blue);for(const dx of [16,72])sphere('wheel'+dx,'Wheel',b.x+dx,265,14,ink).anchor={key:b.id,dx:dx-14,dy:44};force('v','Velocity',b,45,0,150,0,green);force('a','Acceleration',b,45,-48,82,0,red);label('Horizontal motion · arrows qualitative',115,370);break;}
 case 'Vector addition':ray('a','A',145,293,210,0,blue,{nameAtTip:true});ray('b','B',355,293,82,-158,red,{nameAtTip:true});ray('r','A + B',145,293,292,-158,green,{nameAtTip:true});label('Head-to-tail addition',160,367);break;
 case 'Pendulum':{rect('support','Support',265,66,150,18,ink);const pivot=sphere('pivot','Pivot',340,87,7,ink);line('vertical','Equilibrium direction',340,88,0,230,ink,{dash:true});line('cord','Suspension cord',340,88,82,190,blue);const b=sphere('bob','Bob',422,278,23,gold);force('tension','Tension',b,23,23,-38,-87,green);force('weight','Weight',b,23,23,0,92,red);break;}
 case 'Spring mass':{line('wall','Fixed support',110,132,0,160);add('Spring','spring','Spring',110,215,260,0,blue);const b=rect('mass','Mass',370,180,85,70,gold);force('restoring','Restoring force',b,0,35,-100,0,red);line('track','Track',90,253,475,0);label('Displaced to the right of equilibrium',143,355);break;}
 case 'Series circuit':{
 add('Battery','cell','Cell',170,300,125,0,blue,{hardware:'cell'});add('Resistor','load','Resistor',269,125,154,0,gold,{hardware:'resistor'});
 for(const [key,a,b] of [['positive',['cell',0],['load',0]],['negative',['load',1],['cell',1]]]){
 const x=key==='positive'?135:550;add('Freehand',key,'Insulated conductor',x,125,1,175,ink,{points:[{x,y:125},{x,y:300}],wire:{a,b,bend:x}});}
 label('Single closed loop',224,372);break;}
 case 'Ray and lens':{line('axis','Optical axis',65,225,575,0,ink,{dash:true});add('Lens','lens','Thin converging lens',315,100,54,250,blue);
 ray('incident','Incident ray',74,163,268,0,red);ray('refracted','Refracted ray',342,163,255,102,red);sphere('focus','Focal point',497,225,4,gold);line('normal','Normal at the optical centre',275,225,135,0,green,{dash:true});label('Optical bench',115,373);break;}
 case 'Transverse wave':{const pts=Array.from({length:195},(_,i)=>[95+i*2.6,212-62*Math.sin(2*Math.PI*i/80)]);curve('wave','Displacement',pts,blue);line('axis','Distance axis',95,212,525,0,ink,{dash:true});line('y','Displacement axis',95,92,0,220);for(let i=0;i<=2;i++){line('tick'+i,'Distance tick',95+208*i,208,0,9);label(i+' m',88+208*i,276);}label('+1 cm',17,138);label('−1 cm',17,253);ray('travel','Travel',350,92,100,0,green,{nameAtTip:true});break;}
 case 'Bar magnet':{rect('north','North pole',220,191,120,55,red);rect('south','South pole',340,191,120,55,blue);for(const side of [-1,1])for(const layer of [1,2]){const pts=Array.from({length:65},(_,i)=>{const t=i*Math.PI/64;return [340-(141+19*layer)*Math.cos(t),219+side*(58+35*layer)*Math.sin(t)];});curve('field'+side+layer,'External field',pts,green);ray('direction'+side+layer,'Field direction',334,219+side*(58+35*layer),18,0,green);}label('N',259,203);label('S',385,203);label('Field direction outside the magnet',156,376);break;}
 case 'Piston and gas':{curve('chamber','Cylinder cutaway',[[224,103],[224,319],[435,319],[435,103]],ink);rect('piston','Piston',225,157,209,17,blue);line('rod','Piston rod',330,157,0,-79);for(let i=0;i<17;i++)sphere('gas'+i,'Gas particle '+(i+1),242+(i*47)%169,194+(i*31)%108,4,gold).z=23*Math.sin(i*1.73);ray('heat','Heat input',138,252,78,0,red,{nameAtTip:true});ray('work','Expansion',492,218,0,-86,green,{nameAtTip:true});label('Particle positions schematic',177,369);break;}
 }
 return ns;
}
function instantiate(name){const ns=template(name),ids=new Map(ns.map(n=>[n.id,crypto.randomUUID()]));for(const n of ns){n.id=ids.get(n.id);if(n.anchor)n.anchor.key=ids.get(n.anchor.key);if(n.wire)for(const t of [n.wire.a,n.wire.b])t[0]=ids.get(t[0]);}return ns;}
function links(nodes){const map=new Map(nodes.map(n=>[n.id,n]));for(const n of nodes){const b=n.anchor&&map.get(n.anchor.key);if(b){n.x=b.x+n.anchor.dx;n.y=b.y+n.anchor.dy;n.z=(b.z||0)+(n.anchor.dz||0);}
 if(n.wire){const {a,b,bend}=n.wire,from=map.get(a[0]),to=map.get(b[0]);if(!from||!to)continue;const point=(p,t)=>({x:p.x+p.w*t,y:p.y+(['Battery','Resistor'].includes(p.kind)?0:p.h/2),z:p.z||0}),start=point(from,a[1]),end=point(to,b[1]);n.points=[start,{...start,x:bend},{...end,x:bend},end];n.x=Math.min(...n.points.map(p=>p.x));n.y=Math.min(start.y,end.y);n.w=Math.max(...n.points.map(p=>p.x))-n.x;n.h=Math.abs(start.y-end.y);}}
}
for(const entry of P.diagramLibrary.catalogs.Physics){entry[2]=template(entry[1]);const [category,name]=entry;P.commands.push({name,keywords:'Physics diagram '+category+' 2D 3D',fn:()=>open(name)});}
function open(name,dimension='2D'){P.diagram(null,{type:'diagram',subject:'Physics',width:560,title:name,dimension,nodes:instantiate(name),lines:[]});}
P.add('Browse physics diagrams',()=>{
 const d=modal('Physics diagrams','<div id="physics-browse"></div>'),host=$('physics-browse');
 const q=field('Search topics or diagrams','search','',host),dim=select('View',['2D','3D'],'2D',host,()=>{}),pick=select('Physics diagram',[],'',host,()=>{});
 const items=[...P.diagramLibrary.catalogs.Physics.filter(([family])=>!['Circuits','Magnetism'].includes(family)).map(([family,name])=>({family,name,run:()=>open(name,dim.value)})),...P.nuclear.names.map(name=>({family:'Nuclear physics',name,run:()=>P.nuclear.open(name,dim.value)})),...P.astroCatalog.map(t=>({family:t.category,name:t.title,run:()=>P.astrophysics.editor(null,P.astrophysics.fromTopic(t,dim.value))}))];
 function filter(){pick.replaceChildren(...items.map((t,i)=>({...t,i})).filter(t=>(t.family+' '+t.name).toLowerCase().includes(q.value.toLowerCase())).map(t=>new Option(t.family+' · '+t.name,t.i)));}
 q.oninput=filter;filter();button('Open diagram',()=>{if(pick.value==='')return;d.close();items[+pick.value].run();},host);
 },'Physics','search browse templates 2D 3D diagrams');
P.physicsCatalog={instantiate,links,open};
})();
