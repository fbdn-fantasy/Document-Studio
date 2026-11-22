/* Portable scene model. No DOM dependencies; also used by the simulation tests. */
'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FTEDesignCore = api;
})(globalThis, function () {
  const categories = ['Physics', 'Chemistry', 'Mathematics', 'Medical', 'Geology', 'Electrical', 'Architecture'];
  const definitions = [
    ['rectangle','Rectangle','General','#7286ad',2,1,.01], ['circle','Circle','General','#8873bf',1.5,1.5,.01],
    ['triangle','Triangle','General','#cb925c',2,2,.01], ['polygon','Hexagon','General','#6599a8',2,2,.01],
    ['line','Line','General','#7286ad',2,.05,.01],
    ['box','Block','General','#7286ad',2,1,1], ['sphere','Sphere','General','#8873bf',1.5,1.5,1.5],
    ['cylinder','Cylinder','General','#6599a8',1.4,2,1.4], ['cone','Cone','General','#cb925c',2,2,2],
    ['pyramid','Pyramid','Mathematics','#ba8a55',2,2,2], ['prism','Triangular prism','Mathematics','#7896c6',2,2,2],
    ['torus','Torus','Mathematics','#b678ac',2,2,.6], ['plane','Plane','Mathematics','#9bbdc7',3,2,.06],
    ['axis','Coordinate axes','Mathematics','#77849a',3,3,3], ['arrow','Vector / arrow','General','#d17c60',2,.15,.15],
    ['spring','Spring','Physics','#aab4c8',2,.65,.65], ['lens','Convex lens','Physics','#86c9db',.4,2,1.5],
    ['mirror','Mirror','Physics','#c1d9df',.15,2,1.4], ['beaker','Beaker','Chemistry','#81bccb',1.4,1.8,1.4],
    ['flask','Conical flask','Chemistry','#76adbd',1.6,2,1.6], ['testtube','Test tube','Chemistry','#80b4ca',.6,2,.6],
    ['atom','Atom / particle','Chemistry','#c36878',.6,.6,.6], ['bond','Bond','Chemistry','#adb6c6',1.5,.12,.12],
    ['bone','Bone','Medical','#e0d5b3',.8,2.4,.6], ['cell','Cell','Medical','#d397a6',2,1.4,.7],
    ['neuron','Neuron','Medical','#b28ec6',3,1.8,.6], ['vessel','Blood vessel','Medical','#bb646c',2,.45,.45],
    ['layer','Rock layer','Geology','#b99875',5,.6,2.5], ['fold','Folded layer','Geology','#ceab74',5,.5,2.5],
    ['wedge','Sloping layer','Geology','#9e8374',4,1.2,2.5], ['volcano','Volcanic cone','Geology','#a18577',4,2.5,3],
    ['terrain','Terrain / landform','Geology','#8f9f75',5,1.4,3], ['crystal','Crystal','Geology','#a5bfc9',1,2,1],
    ['water','Water / aquifer','Geology','#649ebd',4,.5,2.5], ['magma','Magma chamber','Geology','#d87954',2,1.1,1.6],
    ['source','DC voltage source','Electrical','#577ec0',1.5,.85,.65],
    ['resistor','Resistor','Electrical','#cba879',1.8,.45,.45], ['capacitor','Capacitor','Electrical','#4c86b6',1.5,1,.65],
    ['inductor','Inductor','Electrical','#bb834f',1.8,.7,.7], ['diode','Diode','Electrical','#717985',1.6,.4,.4],
    ['led','LED','Electrical','#e3696a',1.4,.8,.7], ['switch','Switch','Electrical','#90a7ba',1.8,.65,.5],
    ['ground','Ground','Electrical','#8293a8',.8,.65,.1], ['junction','Junction','Electrical','#b6c7d4',.18,.18,.18],
    ['board','Circuit board','Electrical','#458879',3.8,2.6,.18], ['breadboard','Breadboard','Electrical','#dddacb',4.6,2.6,.25],
    ['perfboard','Perfboard','Electrical','#b79262',3.5,2.5,.18], ['chip','IC / chip','Electrical','#4d5868',1.6,1,.35],
    ['header','Pin header','Electrical','#514f5a',1.6,.3,.35], ['connector','Terminal block','Electrical','#6585ba',1.3,.6,.6],
    ['transistor','Transistor','Electrical','#66717e',1,.9,.45], ['transformer','Transformer','Electrical','#bd8c60',2,1.4,1.1],
    ['motor','DC motor','Electrical','#9babb5',1.8,1.2,1.1], ['bulb','Lamp','Electrical','#dfbf6c',1.5,1.1,.8],
    ['solar','Solar panel','Electrical','#4b6e9e',2.5,1.7,.12], ['label','Label','General','#46526b',1,.3,.1]
  ];
  const parts = definitions.map(([kind,name,category,color,w,h,d]) => ({kind,name,category,color,w,h,d}));
  const byKind = Object.fromEntries(parts.map(p => [p.kind,p]));
  const flatKinds=['rectangle','circle','triangle','polygon','line'];
  const solidKinds=['box','sphere','cylinder','cone','pyramid','prism','torus','plane'];
  const partsForDimension=dimension=>parts.filter(p=>!(dimension==='2D'?solidKinds:flatKinds).includes(p.kind));
  const uid = () => globalThis.crypto?.randomUUID?.() || 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2);
  const copy = value => JSON.parse(JSON.stringify(value));
  function object(kind, changes={}) {
    if (!Object.hasOwn(byKind,kind)) throw Error('Unknown component: '+kind);const p = byKind[kind];
    return {id:uid(),kind,label:p.name,x:0,y:0,z:0,w:p.w,h:p.h,d:p.d,rx:0,ry:0,rz:0,color:p.color,
      value:({source:5,resistor:1000,capacitor:100e-6,inductor:.1,diode:.7,led:2,switch:1})[kind] ?? 0,
      visible:true, ...changes};
  }
  function scene(category='Physics', title='Untitled 3D diagram',dimension='3D') {
    return {type:'design3d',version:1,title,category,dimension,objects:[],wires:[],
      view:{rx:category==='Architecture'?.55:-.38,ry:.45,zoom:1,panX:0,panY:0},labels:true,grid:true,notes:'',unit:'m',snapStep:.25};
  }
  const finite = (n, limit=10000) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n)<=limit;
  const text = (s,n) => typeof s==='string' && s.length<=n;
  const color = c => /^#[0-9a-f]{6}$/i.test(c);
  function pins(o) {
    if (o.kind==='ground'||o.kind==='junction') return [{name:'0',p:[0,0,0]}];
    if (['source','resistor','capacitor','inductor','diode','led','switch','motor','bulb','solar'].includes(o.kind))
      return [{name:'A',p:[-o.w/2,0,0]},{name:'B',p:[o.w/2,0,0]}];
    if (['board','breadboard','perfboard','chip','header','connector','transistor','transformer'].includes(o.kind)) {
      const count=o.kind==='board'?8:o.kind==='breadboard'||o.kind==='perfboard'?10:o.kind==='chip'?4:3;
      return Array.from({length:count*2},(_,i)=>({name:(i<count?'L':'R')+(i%count+1),p:[(i<count?-1:1)*o.w*.49, o.h*.4-(i%count)*o.h*.8/(count-1),o.d*.6]}));
    }
    return [];
  }
  function rotate(v,o) {
    let [x,y,z]=v, a=(o.rx||0)*Math.PI/180,b=(o.ry||0)*Math.PI/180,c=(o.rz||0)*Math.PI/180;
    [y,z]=[y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)];
    [x,z]=[x*Math.cos(b)+z*Math.sin(b),-x*Math.sin(b)+z*Math.cos(b)];
    return [x*Math.cos(c)-y*Math.sin(c),x*Math.sin(c)+y*Math.cos(c),z];
  }
  function world(o,p) {const v=rotate(p,o);return [v[0]+o.x,v[1]+o.y,v[2]+o.z];}
  function endpoint(s,e) {const o=s.objects.find(o=>o.id===e.object),p=o&&pins(o).find(p=>p.name===e.pin);return p?world(o,p.p):null;}
  function validate(s) {
    if (!s || s.type!=='design3d' || s.version!==1 || !categories.includes(s.category) || !text(s.title,160) || !s.title.trim()) throw Error('Invalid 3D diagram header.');
    if (!['2D','3D'].includes(s.dimension) || !Array.isArray(s.objects) || s.objects.length>500 || !Array.isArray(s.wires) || s.wires.length>800) throw Error('A diagram supports up to 500 parts and 800 wires.');
    if (!s.view || !['rx','ry','zoom','panX','panY'].every(k=>finite(s.view[k])) || s.view.zoom<.05 || s.view.zoom>20) throw Error('Invalid camera settings.');
    if (!text(s.notes||'',6000)) throw Error('Notes must be at most 6,000 characters.');
    if(s.unit!==undefined&&!['m','cm','mm','ft','in','units'].includes(s.unit))throw Error('Invalid drawing unit.');
    if(s.snapStep!==undefined&&(!finite(s.snapStep)||s.snapStep<.01||s.snapStep>100))throw Error('Grid spacing must be 0.01–100.');
    const ids=new Set();
    for (const o of s.objects) {
      if (!Object.hasOwn(byKind,o.kind) || !text(o.id,100) || !o.id || ids.has(o.id) || !text(o.label,160) || !color(o.color)) throw Error('Invalid or duplicated component.');
      if (!['x','y','z','w','h','d','rx','ry','rz'].every(k=>finite(o[k])) || !['w','h','d'].every(k=>o[k]>.001&&o[k]<=200)) throw Error('Invalid component coordinates or size.');
      if (!finite(o.value,1e12) || (['resistor','capacitor','inductor'].includes(o.kind)&&o.value<=0)) throw Error('Resistance, capacitance and inductance must be positive finite values.');
      if (['diode','led'].includes(o.kind)&&(o.value<0||o.value>100)) throw Error('Forward voltage must be between 0 and 100 V.');
      if (o.variant!==undefined&&!text(o.variant,80)) throw Error('Invalid part variant.');
      ids.add(o.id);
    }
    for (const w of s.wires) {
      if (!text(w.id,100)||!w.id||ids.has(w.id)||!color(w.color)||!w.a||!w.b||!endpoint(s,w.a)||!endpoint(s,w.b) || w.a.object===w.b.object&&w.a.pin===w.b.pin) throw Error('Wire endpoints must connect two distinct terminals.');
      if (w.bend!==undefined&&!finite(w.bend)) throw Error('Invalid wire bend.');
      ids.add(w.id);
    }
    return copy(s);
  }
  function wire(s,a,b,color='#d47463') {
    if(s.wires.length>=800)throw Error('A diagram supports up to 800 wires.');
    const w={id:uid(),a:{...a},b:{...b},color};
    if (!endpoint(s,a)||!endpoint(s,b)||a.object===b.object&&a.pin===b.pin) throw Error('Choose two different terminals.');
    if (s.wires.some(v=>JSON.stringify(v.a)===JSON.stringify(a)&&JSON.stringify(v.b)===JSON.stringify(b)||JSON.stringify(v.a)===JSON.stringify(b)&&JSON.stringify(v.b)===JSON.stringify(a))) throw Error('These terminals are already connected.');
    s.wires.push(w);return w;
  }
  function remove(s,id) {s.objects=s.objects.filter(o=>o.id!==id);s.wires=s.wires.filter(w=>w.id!==id&&w.a.object!==id&&w.b.object!==id);}
  function envelope(payload, category, title) {return {format:'ForbiddenDesign',version:1,category,title,payload:copy(payload)};}
  function parseFile(raw, legacyValidator) {
    if (typeof raw!=='string'||raw.length>15*1024*1024) throw Error('Diagram files must be under 15 MB.');
    let d;try {d=JSON.parse(raw);} catch {throw Error('This is not a readable diagram file.');}
    if (!d||d.format!=='ForbiddenDesign'||d.version!==1||!categories.includes(d.category)||!text(d.title,160)||!d.title.trim()) throw Error('Choose a Forbidden diagram (.fte2d or .fte3d) file.');
    if (d.payload?.type==='design3d') {d.payload=validate(d.payload);if(d.category!==d.payload.category)throw Error('The diagram category does not match its file.');}
    else if(legacyValidator) d.payload=legacyValidator(d.payload);
    else throw Error('Unsupported diagram model.');
    return d;
  }
  return {categories,parts,byKind,partsForDimension,uid,copy,object,scene,validate,pins,world,endpoint,wire,remove,envelope,parseFile};
});
