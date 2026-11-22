'use strict';
(()=>{
const P=FTEPro;
function install(s,host,update,geometry){
 const box=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Tissue and section';box.append(legend);host.prepend(box);
 box.className='atlas-controls';
 const layers=P.atlasVolume.materials(geometry.parts),picker=select('Tissue or component',layers.map(x=>[x.key,x.name]),s.detail||layers[0].key,box,v=>{s.detail=v;update();host.closest('dialog')?.querySelector('#med-canvas')?.fteChooseDescriptor?.(v);});
 if(layers.length>8){const search=field('Find tissue','search','',box);picker.parentNode.before(search.parentNode);
 search.oninput=()=>{const filtered=layers.filter(m=>m.name.toLowerCase().includes(search.value.toLowerCase()));picker.replaceChildren(...filtered.map(m=>new Option(m.name,m.key)));if(filtered.length){s.detail=picker.value;update();}};}
 const cut=field('Internal view','checkbox','',box),plane=select('Section plane',P.atlasVolume.axes,s.sectionAxis||'Coronal',box,v=>{s.sectionAxis=v;s.cutaway=true;orient();update();}),depth=field('Section depth','range',Math.round((s.sectionDepth??.5)*100),box);
 depth.min=0;depth.max=100;depth.step=1;const reading=document.createElement('output');depth.after(reading);
 function orient(){s.view.rx=s.sectionAxis==='Axial'?Math.PI/2:0;s.view.ry=s.sectionAxis==='Sagittal'?-Math.PI/2:0;}
 cut.onchange=()=>{s.cutaway=cut.checked;if(!cut.checked)s.interior='';if(s.cutaway){s.sectionDepth??=(s.id==='Cardiovascular/Heart and great vessels'?.56:.5);s.sectionAxis||=(s.id.includes('Brain midline')?'Sagittal':'Coronal');orient();}update();};
 depth.oninput=()=>{s.sectionDepth=+depth.value/100;s.cutaway=true;update();};
 if(s.id==='Cardiovascular/Heart and great vessels'){const focus=field('Frame heart in section','checkbox','',box);focus.checked=s.sectionFocus!==false;focus.onchange=()=>{s.sectionFocus=focus.checked;update();};}
 const color=field('Tissue color','color','#ba937c',box);color.oninput=()=>{s.detailColors={...s.detailColors,[picker.value]:color.value};update();};
 const toggle=(key)=>{const set=new Set(s[key]||[]);if(set.has(picker.value))set.delete(picker.value);else set.add(picker.value);s[key]=[...set];update();};
 button('Hide or show tissue',()=>toggle('detailHidden'),box);button('Isolate tissue',()=>{s.isolatedDetail=picker.value;s.detailHidden=[];s.hidden=[];update();},box);
 button('Make tissue translucent',()=>toggle('detailTransparent'),box);
 const alpha=field('Translucent tissue opacity','range',Math.round(100*(s.layerOpacity??.22)),box);alpha.min=5;alpha.max=95;alpha.oninput=()=>{s.layerOpacity=+alpha.value/100;s.detailTransparent=[...new Set([...(s.detailTransparent||[]),picker.value])];update();};
 button('Restore complete model',()=>{s.hidden=[];s.removed=[];s.transparent=[];s.detailHidden=[];s.detailTransparent=[];s.isolatedDetail='';s.cutaway=false;s.interior='';update();},box);
 button('Hide all annotations',()=>{s.calloutOverrides={};s.blankLabels=false;s.labels=false;s.descriptions=false;s.leaderLines=false;update();},box);
 function sync(){cut.checked=!!s.cutaway;depth.value=Math.round((s.sectionDepth??.5)*100);reading.value=depth.value+'%';plane.value=s.sectionAxis||'Coronal';if(s.detail)picker.value=s.detail;const m=layers.find(x=>x.key===picker.value);color.value=s.detailColors?.[picker.value]||s.partColors?.[m?.id]||(/^#[0-9a-f]{6}$/i.test(m?.color)?m.color:s.color);
 for(const [label,key] of [['Show labels','labels'],['Show descriptions','descriptions'],['Show leader lines','leaderLines'],['Anterior cutaway','cutaway']]){const input=host.querySelector('[aria-label="'+label+'"]');if(input)input.checked=!!s[key];}}
 return sync;
}
P.atlasControls=install;
})();
