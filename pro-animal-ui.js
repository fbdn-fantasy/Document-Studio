'use strict';
(() => {
 const P=FTEPro,M=P.medical,A=P.animalData;
 function browse(dimension){
  const d=modal('Animal '+dimension+' diagrams','<div id="animal-controls" class="science-controls"></div><div id="animal-results" class="science-results"></div>');
  P.View3D.decorate(d);
  const host=$('animal-controls');
  const category=select('Category',['Skeleton/body support','Cells','Body systems and neuroscience','Compare animals'],'Skeleton/body support',host,render);
  const animal=select('Representative animal',A.species.map(row=>row[0]),'Dog',host,render);
  const search=field('Search structures, regions and landmarks','search','',host);
  search.oninput=render;
  button('Saved templates',()=>{d.close();P.v8.library('v9medical');},host);
  function render(){
   const results=$('animal-results');results.replaceChildren();
   const term=search.value.trim().toLowerCase();
   if(category.value==='Body systems and neuroscience'||category.value==='Compare animals'){
    const compare=category.value==='Compare animals';
    const rows=compare?P.faunaComparisons:P.faunaAtlas.find(e=>e.name===animal.value).groups;
    for(const row of rows){
     const matches=[row,...(compare?[]:row.children.filter(e=>e.region===row.region))];
     for(const entry of matches.filter(e=>(e.name+' '+e.region).toLowerCase().includes(term)))
      button(entry.name,()=>{d.close();M.editor(null,M.defaults('systems',entry.id,dimension));},results);
    }
    return;
   }
   for(const item of A.catalog){
    if(item.species!==animal.value||item.category!==category.value)continue;
    if(![item.name,item.region,item.latin,item.family,...(item.labels||[]).map(l=>l.name)].join(' ').toLowerCase().includes(term))continue;
    button(item.name+' · '+item.region+' · '+item.latin,()=>{d.close();M.editor(null,M.defaults('animals',item.id,dimension));},results);
   }
   if(!results.children.length)results.textContent='No matching structures for this animal.';
  }
  render();
 }
 for(const dimension of ['2D','3D'])P.add('Animal '+dimension+' diagrams',()=>browse(dimension),'Medical','animal comparative anatomy cells skeleton support');
})();
