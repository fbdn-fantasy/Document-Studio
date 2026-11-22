// RDKit supplies the depiction and atom coordinates in the same layout pass.
// Invisible indexing circles are removed before display or export.
'use strict';
(()=>{
 const P=FTEPro;
 function topology(atoms,bonds){
   const value=JSON.stringify([atoms.map(a=>[a.element,a.charge||0,a.isotope||0]),bonds.map(b=>[b.a,b.b,b.order])]);
   let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);
   return 'chem/'+(h>>>0).toString(36)+'/';
 }
 function atomName(a){return (FTEElements.find(e=>e.symbol===a.element)?.name||a.element);}
 function keys(graph){const prefix=topology(graph.atoms,graph.bonds);return {a:graph.atoms.map((_,i)=>prefix+'a'+i),b:graph.bonds.map((_,i)=>prefix+'b'+i)};}
 function vectorLabels(root,canvas){
   const ns='http://www.w3.org/2000/svg';const add=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text)el.textContent=text;root.append(el);};
   for(const t of canvas.fteBoxes||[]){const x=t.boxX-t.boxW/2,y=t.boxY-t.boxH/2,edge=t.x<t.boxX?x:x+t.boxW;
     add('line',{x1:t.x,y1:t.y,x2:edge,y2:t.boxY,stroke:'#59636c','stroke-width':1});
     if(t.style==='line'&&!canvas.fteMemo)continue;
     add('rect',{x,y,width:t.boxW,height:t.boxH,fill:'white',stroke:t.style==='blank'||canvas.fteMemo?'#59636c':'none'});
     if(t.style==='named'||canvas.fteMemo)add('text',{x:x+3,y:t.boxY+4,'font-size':10,'font-family':'Arial',textLength:Math.min(t.boxW-6,t.name.length*5.4),lengthAdjust:'spacingAndGlyphs',fill:'#26323c'},t.name);
   }
 }
 function mount(host,state,getMol){
   host.replaceChildren();const canvas=document.createElement('canvas');canvas.id='rdkit-diagram';canvas.style.cssText='display:block;width:100%;background:white';host.append(canvas);P.callouts.resize(canvas,600,350,3);
   let epoch=0,svg='';
   async function paint(){
     const token=++epoch,mol=getMol();if(!mol)return;
     const j=JSON.parse(mol.get_json()).molecules[0],atoms=j.atoms.map(a=>({element:FTEElements.find(e=>e.number===(a.z??6))?.symbol||'C',charge:a.chg||0,isotope:a.isotope||0}));
     const bonds=j.bonds.map(b=>({a:b.atoms[0],b:b.atoms[1],order:b.bo??1})),ids=keys({atoms,bonds});
     const opts={width:600,height:350,padding:.12,atoms:atoms.map((_,i)=>i),bonds:[],atomHighlightsAreCircles:true,highlightRadius:.035,bondLineWidth:1.8};
     const root=new DOMParser().parseFromString(mol.get_svg_with_highlights(JSON.stringify(opts)),'image/svg+xml').documentElement;
     const targets=[];
     atoms.forEach((a,i)=>{const el=root.querySelector('ellipse.atom-'+i);if(!el)return;
       targets.push({key:ids.a[i],name:atomName(a)+' · '+(i+1),x:Number(el.getAttribute('cx')),y:Number(el.getAttribute('cy'))});el.remove();
       if(P.callouts.mode(state,ids.a[i])!=='auto')for(const glyph of root.querySelectorAll('path.atom-'+i))if(![...glyph.classList].some(c=>c.startsWith('bond-')))glyph.remove();
     });
     for(let i=0;i<bonds.length;i++){const b=bonds[i],a=targets.find(t=>t.key===ids.a[b.a]),c=targets.find(t=>t.key===ids.a[b.b]);if(a&&c)targets.push({key:ids.b[i],name:'Bond '+(b.a+1)+'–'+(b.b+1),x:(a.x+c.x)/2,y:(a.y+c.y)/2});}
     const serializer=new XMLSerializer(),src=serializer.serializeToString(root),img=new Image();
     img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(src);await img.decode();if(epoch!==token)return;
     const ctx=canvas.getContext('2d');ctx.setTransform(3,0,0,3,0,0);ctx.fillStyle='white';ctx.fillRect(0,0,600,350);ctx.drawImage(img,0,0,600,350);P.callouts.draw(canvas,state,targets,600,350);
     vectorLabels(root,canvas);svg=serializer.serializeToString(root);
   }
   P.callouts.attach(canvas,()=>state,paint,host,'Chemistry');
   return {paint,canvas,get svg(){return svg;},clear(){epoch++;svg='';canvas.getContext('2d').clearRect(0,0,600,350);P.callouts.draw(canvas,state,[],600,350);}};
 }
 P.chemPlate={mount,keys,atomName};
})();
