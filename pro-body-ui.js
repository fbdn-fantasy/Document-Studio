'use strict';
(()=>{
const P=FTEPro,A=P.bodyAtlas;
const lessons={
 'Upper digestive tract':[['Oral cavity','Chewing breaks food into smaller pieces.'],['Pharynx','Swallowing directs the bolus toward the esophagus.'],['Esophagus','Peristalsis advances the bolus.'],['Stomach','Muscular mixing combines food with gastric secretions.']],
 'Heart and great vessels':[['Venae cavae','Systemic veins return blood.'],['Right atrium','Blood enters the right atrium.'],['Right ventricle','The right ventricle ejects blood into the pulmonary trunk.'],['Pulmonary trunk and right artery','Pulmonary arteries carry blood toward the lungs.'],['Right pulmonary veins','After gas exchange, veins return blood from the lungs.'],['Left atrium','Pulmonary venous blood enters the left atrium.'],['Left ventricle','The left ventricle generates systemic outflow.'],['Aorta','Blood distributes to systemic arteries.']],
 'Alveolar exchange unit':[['Bronchiole','Ventilation brings fresh gas distally.'],['Alveolar duct','Air reaches the alveolar sacs.'],['Alveolus 1','Oxygen diffuses across the thin air–blood barrier.'],['Pulmonary capillary','Blood takes up oxygen and releases carbon dioxide into alveolar air.']],
 'Nephron detail':[['Afferent arteriole','Blood enters the glomerular tuft.'],['Glomerulus','Hydrostatic pressure drives filtration across the barrier.'],['Glomerular capsule','Capsular space receives water and small solutes.'],['Proximal tubule','Much of the filtered water and solute returns to the circulation.'],['Nephron loop','Loop segments differ in permeability to water and salts.'],['Distal tubule','Regulated transport adjusts tubular fluid.'],['Collecting duct','Final urine concentration depends in part on water permeability.']],
 'Multipolar neuron and synapse':[['Dendrite 1','Dendrites receive input.'],['Soma','Inputs combine near the axon initial segment.'],['Axon','An action potential propagates along the axon.'],['Node of Ranvier 1','Current spreads between nodes where the spike regenerates.'],['Superior terminal','Terminal depolarization can trigger transmitter release.'],['Postsynaptic membrane','Transmitter binding changes the response of the target cell.']]
};
A.lessons=lessons;
A.controls=function(s,host,ee,refresh){
 const cut=field('Anterior cutaway','checkbox','',host);cut.checked=!!s.cutaway;cut.parentElement.hidden=!!P.atlasVolume?.available();cut.onchange=()=>{s.cutaway=cut.checked;refresh();};
 const selected=()=>ee.find(e=>e.id===s.selected);
 const act=(label,fn)=>button(label,()=>{const e=selected();if(!e)return say('Select a named part first.');fn(e);refresh();},host);
 act('Hide / remove selected',e=>{s.hidden=[...new Set([...(s.hidden||[]),e.id])];});
 act('Restore selected',e=>{s.hidden=(s.hidden||[]).filter(id=>id!==e.id);});
 act('Isolate selected',e=>{s.hidden=ee.filter(item=>item.id!==e.id).map(item=>item.id);});
 if(s.id.startsWith('Fauna/'))act('Remove from arrangement',e=>{s.removed=[...new Set([...(s.removed||[]),e.id])];s.selected='';refresh();});
 button('Restore all parts',()=>{s.hidden=[];if(s.removed)s.removed=[];refresh();},host);
 act('Toggle selected transparency',e=>{s.transparent=(s.transparent||[]).includes(e.id)?s.transparent.filter(id=>id!==e.id):[...(s.transparent||[]),e.id];});
 const color=field('Selected part color','color','#d5818d',host);color.oninput=()=>{if(selected()){s.partColors={...s.partColors,[s.selected]:color.value};refresh();}};
 const steps=lessons[ee[0].region]?.filter(([name])=>ee.some(e=>e.name===name));if(steps&&ee.length>1&&ee.every(e=>e.region===ee[0].region)){
 const picker=select('Process step',[['','Anatomy only'],...steps.map(([n],i)=>[String(i),String(i+1)+' · '+n])],s.step??'',host,value=>{s.step=value;refresh();});
 let timer=0;const stop=()=>{clearInterval(timer);timer=0;play.textContent='Play steps';};
 const play=button('Play steps',()=>{if(timer){stop();return;}
 const advance=()=>{s.step=String(s.step===undefined||s.step===''?0:(Number(s.step)+1)%steps.length);picker.value=s.step;refresh();};
 advance();timer=setInterval(advance,2000);play.textContent='Pause steps';},host);
 host.closest('dialog').addEventListener('close',stop,{once:true});
 }
};
function browse(dim){
 const D=P.medicalData, categories=['Skeleton and bones','Cells','Body systems and neuroscience'];
 const d=modal('Human '+dim+' diagrams','<div id="human-controls" class="science-controls"></div><div id="human-results" class="science-results"></div>');
 P.View3D.decorate(d);
 const host=$('human-controls'),out=$('human-results');
 const category=select('Category',categories,categories[0],host,change);
 const filter=select('Region or system',['All'],'All',host,render);
 const search=field('Search structures, regions and landmarks','search','',host);
 search.oninput=render;
 button('Saved templates',()=>{d.close();P.v8.library('v9medical');},host);
 function kind(){return ['bones','cells','systems'][category.selectedIndex];}
 function change(){const k=kind(),values=k==='systems'?['Integrated body',...A.systems]:[...new Set(D[k].map(e=>e.region))];
 filter.replaceChildren(...['All',...values].map(v=>new Option(v,v)));search.value='';render();}
 function render(){const k=kind(),q=search.value.trim().toLowerCase();out.replaceChildren();
 const add=(id,name,region,terms='')=>{if((filter.value==='All'||filter.value===region)&&(name+' '+region+' '+terms).toLowerCase().includes(q))button(name,()=>{d.close();P.medical.editor(null,P.medical.defaults(k,id,dim));},out);};
 if(k==='bones'){for(const [id,name,region] of P.anatomy.assemblies)add(id,name,region,id+' whole skeleton complete assembly');for(const region of new Set(D.bones.map(e=>e.region)))if(!P.anatomy.assemblies.some(a=>a[0]===region))add(region,region+' · regional assembly',region);}
 if(k==='systems'){for(const e of A.integrated)add(e.id,e.name,'Integrated body');for(const e of [...A.groups,...A.catalog])add(e.id,e.name+(e.children?' · combined view':''),e.system,e.region);}
 else for(const e of D[k])add(e.id,e.name+' · '+e.region,e.region,[e.anatomical,e.alias,...(e.features||[])].join(' '));
 if(!out.children.length)out.textContent='No matching structures.';}
 change();
}
for(const dim of ['2D','3D'])P.add('Human '+dim+' diagrams',()=>browse(dim),'Medical','anatomy bones skeleton cells organs systems brain neurons');})();