/* V22 editable professional components and parameter-driven construction tools. */
'use strict';
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./pro-design-core'):root.FTEDesignCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.FTEDesignTools=api;})(globalThis,function(C){
  const defs=[
    ['wall','Wall','Architecture','box',4,.2,3,'#8293a5'],['door','Door opening / swing','Architecture','door',.9,.2,2.1,'#b18b60'],
    ['window','Window','Architecture','window',1.2,.2,1.2,'#6aafc5'],['slab','Floor / foundation','Architecture','box',6,4,.2,'#a6afb5'],
    ['roof','Gable roof','Architecture','roof',6,4,2,'#b17363'],['column','Column / pier','Architecture','column',.4,.4,3,'#9ba6b1'],
    ['beam','Beam / girder','Architecture','box',5,.3,.5,'#8c9cac'],['stairs','Stair flight','Architecture','stairs',1.2,3,2.8,'#8fa3b3'],
    ['road','Road segment','Architecture','road',12,6,.15,'#647181'],['deck','Bridge deck','Architecture','box',12,4,.4,'#9cabb8'],
    ['railing','Railing','Architecture','railing',6,.12,1.1,'#66869c'],['tree','Site tree','Architecture','tree',2,2,3,'#739e73'],
    ['furniture','Furniture block','Architecture','box',1.8,.8,.8,'#b99b7c'],['dimension','Dimension line','General','dimension',4,.25,.02,'#527fa0'],
    ['pulley','Pulley','Physics','torus',1.4,1.4,.35,'#9da5b5'],['mass','Mass / load','Physics','box',1,1,1,'#829bb4'],
    ['ramp','Inclined plane','Physics','wedge',4,1.5,2,'#a58b72'],['screen','Optics screen','Physics','box',.1,3,2,'#b5c8d2'],
    ['force','Force vector','Physics','arrow',2,.12,.12,'#cb795b'],['wave','Wave / oscillation','Physics','wave',4,1,.1,'#6d99c2'],
    ['pipette','Pipette','Chemistry','bond',2.5,.12,.12,'#7fb7c9'],['stand','Laboratory stand','Chemistry','stand',1,3,1,'#8796ac'],
    ['funnel','Funnel','Chemistry','cone',1.4,1.3,1.4,'#84b5bb'],['dish','Petri dish','Chemistry','cylinder',1.8,.25,1.8,'#9ebbc1'],
    ['reaction','Reaction arrow','Chemistry','arrow',2,.15,.15,'#b17ba2'],['tube','Laboratory tubing','Chemistry','vessel',2,.15,.15,'#b3a3cb'],
    ['tissue','Tissue section','Medical','box',2.5,1.2,.35,'#c58e9b'],['organ','Organ / custom volume','Medical','sphere',1.5,2,1,'#be7882'],
    ['joint','Joint','Medical','sphere',1,1,1,'#d4c9a7'],['nerve','Nerve fibre','Medical','vessel',2.5,.15,.15,'#d5b271'],
    ['membrane','Membrane','Medical','plane',2.5,2,.08,'#b191bd'],['flow','Flow direction','Medical','arrow',1.5,.12,.12,'#bd6472'],
    ['borehole','Borehole / core','Geology','cylinder',.35,3,.35,'#a58766'],['fault','Fault trace','Geology','line',4,.05,.02,'#ba7265'],
    ['sediment','Sediment lens','Geology','sphere',3,.5,1.5,'#c0ac80'],['sample','Sample marker','Geology','cone',.35,.7,.35,'#bd8661'],
    ['contour','Contour / boundary','Geology','wave',4,.6,.05,'#7b986d'],['flowgeo','Groundwater flow','Geology','arrow',2,.1,.1,'#6d9db9'],
    ['angle','Angle / arc','Mathematics','angle',2,2,.03,'#ad80b4'],['ellipse','Ellipse','Mathematics','sphere',3,1.5,.03,'#a88abc'],
    ['gridplane','Coordinate plane','Mathematics','plane',4,4,.02,'#8eafbf'],['point','Point','Mathematics','sphere',.18,.18,.18,'#be738f'],
    ['segment','Line segment','Mathematics','line',3,.05,.02,'#6b8cae'],['normal','Normal vector','Mathematics','arrow',2,.1,.1,'#8ca773'],
    ['fuse','Fuse','Electrical','fuse',1.6,.45,.25,'#9c9fba'],['ammeter','Ammeter','Electrical','meter',1.2,1.2,.5,'#78a7b5'],
    ['voltmeter','Voltmeter','Electrical','meter',1.2,1.2,.5,'#89a9bf'],['relay','Relay block','Electrical','box',1.6,1.3,.7,'#a28fb1'],
    ['socket','Outlet / socket','Electrical','socket',1,1,.2,'#afb8c0'],['earthbar','Earth bar','Electrical','box',3,.25,.25,'#b0aa74']
  ];
  for(const [kind,name,category,renderKind,w,h,d,color]of defs){const p={kind,name,category,renderKind,w,h,d,color};C.parts.push(p);C.byKind[kind]=p;}
  function positive(v,name,max=150){v=Number(v);if(!Number.isFinite(v)||v<=0||v>max)throw Error(name+' must be greater than 0 and at most '+max+'.');return v;}
  function count(v,name,max){v=positive(v,name,max);if(!Number.isInteger(v))throw Error(name+' must be a whole number.');return v;}
  function build(kind,dimension,options={}){
    const w=positive(options.width??6,'Width'),l=positive(options.length??8,'Length'),h=positive(options.height??3,'Height',50),t=positive(options.thickness??.2,'Thickness',5);
    const objects=[],add=(kind,label,x,y,z,w,h,d,extra={})=>objects.push(C.object(kind,{label,x,y,z,w,h,d,...extra}));
    if(kind==='Room / house shell'){
      if(t>=Math.min(w,l)/3)throw Error('Wall thickness must be less than one third of the room size.');
      const door=Math.min(.9,w/3),a=(w-door)/2;
      add('wall','Back wall',0,l/2,h/2,w,t,h);add('wall','Left wall',-w/2,0,h/2,t,l,h);add('wall','Right wall',w/2,0,h/2,t,l,h);
      for(const side of [-1,1])add('wall','Front wall',side*(door/2+a/2),-l/2,h/2,a,t,h);
      add('door','Entrance',0,-l/2,Math.min(2.1,h)/2,door,t,Math.min(2.1,h));
      if(dimension==='3D'){add('slab','Foundation',0,0,-t/2,w,l,t);if(options.roof)add('roof','Roof',0,0,h+Math.min(w/3,2)/2,w+.4,l+.4,Math.min(w/3,2));}
    }else if(kind==='Road builder'){
      add('road','Road',0,0,0,l,w,t);for(const side of [-1,1])add('slab','Footpath',0,side*(w/2+.6),t,l,1.2,t);
    }else if(kind==='Bridge builder'){
      const n=count(options.count??4,'Pier count',30);
      add('deck','Deck',0,0,h,l,w,t);for(const side of [-1,1])add('railing','Parapet',0,side*w/2,h+.55,l,.12,1.1);
      for(let i=0;i<n;i++)for(const side of [-1,1])add('column','Pier '+(i+1),-l/2+(i+.5)*l/n,side*w*.32,h/2,Math.max(t,.3),Math.max(t,.3),h);
    }else if(kind==='Stair builder'){
      const n=count(options.count??12,'Steps',50);
      for(let i=0;i<n;i++)add('slab','Step '+(i+1),0,-l/2+(i+.5)*l/n,(i+1)*h/n/2,w,l/n,(i+1)*h/n);
    }else throw Error('Choose a construction tool.');
    const s=C.scene('Architecture',kind,dimension);s.objects=objects;C.validate(s);return objects;
  }
  function repeat(scene,id,count,dx,dy,dz){
    const o=scene.objects.find(o=>o.id===id);if(!o)throw Error('Select a part first.');
    if(!Number.isInteger(count)||count<1||count>100||scene.objects.length+count>500)throw Error('Use 1–100 copies, within the 500 part limit.');
    if(![dx,dy,dz].every(Number.isFinite))throw Error('Enter finite spacing.');
    const next=C.copy(scene);for(let i=1;i<=count;i++)next.objects.push({...C.copy(o),id:C.uid(),x:o.x+dx*i,y:o.y+dy*i,z:o.z+dz*i});return C.validate(next);
  }
  return {build,repeat,definitions:defs};
});
