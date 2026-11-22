'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../pro-design-core'),T=require('../pro-design-tools');
test('all new professional parts survive both file formats with complete geometry',()=>{
  for(const dim of ['2D','3D'])for(const category of C.categories){const s=C.scene(category,'My '+category,dim);s.objects=C.parts.filter(p=>p.category===category).map(p=>C.object(p.kind));assert(s.objects.length>=4);assert.deepEqual(C.parseFile(JSON.stringify(C.envelope(s,category,s.title))).payload,s);}
});
test('architecture builders create editable components and a real entrance gap',()=>{
 for(const dim of ['2D','3D'])for(const name of ['Room / house shell','Road builder','Bridge builder','Stair builder']){
   const s=C.scene('Architecture',name,dim);s.objects=T.build(name,dim,{width:6,length:10,height:3,thickness:.2,count:5,roof:true});C.validate(s);
   assert(new Set(s.objects.map(o=>o.id)).size===s.objects.length);
   if(name==='Room / house shell'){const door=s.objects.find(o=>o.kind==='door');assert.equal(door.w,.9);assert.equal(s.objects.filter(o=>o.label==='Front wall').length,2);}
   if(name==='Bridge builder')assert.equal(s.objects.filter(o=>o.kind==='column').length,10);
   if(name==='Stair builder')assert.equal(Math.max(...s.objects.map(o=>o.z+o.d/2)),3);
 }
});
test('invalid construction inputs and repetitions fail without corrupting the source',()=>{
 assert.throws(()=>T.build('Room / house shell','2D',{thickness:3}));assert.throws(()=>T.build('Road builder','3D',{width:Infinity}));
 assert.throws(()=>T.build('Stair builder','3D',{count:.1}),/whole number/);assert.throws(()=>T.build('Bridge builder','3D',{count:2.5}),/whole number/);
 const s=C.scene('Architecture','Repeated wall');s.objects=[C.object('wall')];const before=JSON.stringify(s);
 const next=T.repeat(s,s.objects[0].id,4,2,0,1);assert.equal(next.objects.length,5);assert.equal(next.objects[4].x,8);assert.equal(next.objects[4].z,4);assert.equal(JSON.stringify(s),before);
 assert.throws(()=>T.repeat(s,s.objects[0].id,501,2,0,0));assert.throws(()=>T.repeat(s,s.objects[0].id,2,Infinity,0,0));
 s.snapStep=0;assert.throws(()=>C.validate(s));s.snapStep=.1;s.unit='bad';assert.throws(()=>C.validate(s));
});
