// Mesh instances retain the medical catalog IDs. The one shared skeleton coordinate
// frame is also used by isolated and regional views; only the camera changes.
'use strict';
(()=>{
 const P=FTEPro,source=P.surfaceLibrary,map=P.surfaceMapping;
 const mid=(a,b)=>a.map((x,i)=>(x+b[i])/2);
 const range=parts=>{const bb=parts.map(P.atlasVolume.bounds);return [0,1].map(j=>[0,1,2].map(i=>(j?Math.max:Math.min)(...bb.map(b=>b[j][i]))));};
 function instances(keys,id,name,color,fit){
   const all=keys.map(k=>source[k]),lo=[0,1,2].map(i=>Math.min(...all.map(m=>m.lo[i]))),hi=[0,1,2].map(i=>Math.max(...all.map(m=>m.hi[i])));
   const center=mid(lo,hi),origin=fit?mid(...fit):center,scale=fit?Math.max(...fit[1].map((x,i)=>x-fit[0][i]))/Math.max(...hi.map((x,i)=>x-lo[i])):1;
   const offset=origin.map((x,i)=>x-center[i]*scale),position=p=>p.map((x,i)=>x*scale+offset[i]);
   return keys.map(k=>{const m=source[k],bounds=[position(m.lo),position(m.hi)];
     return {id,detail:id,detailName:name,mesh:k,color,p:mid(...bounds),r:bounds[1].map((x,i)=>(x-bounds[0][i])/2),bounds,meshScale:scale,meshOffset:offset};
   });
 }
function credits(parts){
   const keys=parts.map(p=>p.mesh||'');
   return [keys.some(k=>k.startsWith('FMA')||k.startsWith('BP'))?'BodyParts3D © DBCLS · CC BY-SA 2.1 JP':'',keys.some(k=>k.startsWith('ZA/'))?'Z-Anatomy · CC BY-SA 4.0':'',keys.some(k=>k.startsWith('SPL/'))?'SPL / DKFZ · 3D Slicer B':''].filter(Boolean).join('  •  ');
 }
 function skeleton(s,rows,base){
   const parts=[],labels=[];let measured=false;
   for(const b of rows){
     const keys=map.bones[b.id],row=instances(keys,b.id,b.name,'base');measured||=!!keys;
     const bounds=range(row),p=mid(...bounds);
     parts.push(...row);
     if(rows.length===1&&base.labels.length&&keys){
       const oldBounds=range(base.parts);
       for(const l of base.labels){
         const anchor=l.p.map((x,i)=>bounds[0][i]+(x-oldBounds[0][i])/Math.max(.00001,oldBounds[1][i]-oldBounds[0][i])*(bounds[1][i]-bounds[0][i]));
         labels.push({...l,detail:b.id+'::'+l.name,p:anchor});
       }
     }else labels.push({id:b.id,detail:b.id,name:b.name,p});
   }
   return {parts,labels,assembly:rows.length>1,measured,credit:credits(parts)};
 }
 const aliases={'left lung':['upper lobe of left lung','lower lobe of left lung'],'right lung':['upper lobe of right lung','middle lobe of lung','lower lobe of right lung'],pancreas:['pancreas, nsn'],pituitary:['pituitary gland'],'rectum and anal canal':['rectum']};
 function organs(base,s){
   const seen=new Set(),parts=[],labels=base.labels.map(l=>({...l}));let measured=false;
   for(const p of base.parts){
     const name=p.id.split('/').pop().toLowerCase(),names=aliases[name]||[name];
     const keys=names.flatMap(n=>map.organs[n]||[]);
     if(!keys.length||p.id.startsWith('Fauna/')||p.requires){parts.push(p);continue;}
     if(seen.has(p.id))continue;seen.add(p.id);measured=true;
     const originals=P.medicalData.systems.find(e=>e.id===p.id)?.parts||[p],fit=range(originals);
     const added=instances(keys,p.id,p.id.split('/').pop(),p.color,fit);
     if(keys.length>1)added.forEach((q,i)=>{const layer=(names.length===keys.length?names[i]:keys[i].replace(/^ZA\//,'')).replace(/^./,c=>c.toUpperCase());q.detail=p.id+'::'+layer;q.detailName=layer;labels.push({id:p.id,detail:q.detail,name:layer,p:q.p});});
     parts.push(...added);
     const l=labels.find(q=>q.id===p.id);if(l)l.p=mid(...range(added));
   }
   if(s.id==='Cardiovascular/Heart and great vessels'){
     const chambers=P.medicalData.systems.find(e=>e.id===s.id).children.filter(e=>/ (atrium|ventricle)$/.test(e.name)).flatMap(e=>e.parts);
     const shell=instances(map.organs['wall of heart'],s.id,'External myocardial wall','#ad7469',range(chambers));parts.push(...shell);
     labels.unshift({id:s.id,detail:s.id,name:'External myocardial wall',p:shell[0].p});measured=true;
   }
   return {...base,parts,labels,measured,credit:credits(parts)};
 }
 function animal(g){
   const seen=new Set(),labels=g.labels.map(l=>({...l})),parts=[];let credit='';
   for(const p of g.parts){const specimen=P.specimenSkulls?.[p.id];
     if(!specimen){parts.push(p);continue;}if(seen.has(p.id))continue;seen.add(p.id);
     const key=specimen.mesh,m=source[key],length=p.id==='cat/skull'?1.06:1.34;
     const scale=length/(m.hi[0]-m.lo[0]),off=[-1.61-m.hi[0]*scale,.57,0];
     const bounds=[m.lo,m.hi].map(q=>q.map((x,i)=>x*scale+off[i])),center=mid(...bounds);
     parts.push({id:p.id,detail:p.id,detailName:'Skull',mesh:key,p:center,r:bounds[1].map((x,i)=>(x-bounds[0][i])/2),bounds,meshScale:scale,meshOffset:off,color:'base'});
     const rostral=[bounds[0][0]+.055,center[1]-.06,0],brain=[bounds[1][0]-length*.30,center[1]+.08,0];
     for(const l of labels.filter(q=>q.id===p.id))l.p=/Rostral|muzzle/i.test(l.name)?rostral:brain;
     credit='Skull CT · Czeibert et al. (2024) · CC0 · '+specimen.specimen;
   }
   return {...g,parts,labels,measured:!!credit,credit};
 }
 P.surfaceModels={skeleton,organs,animal,range};
})();
