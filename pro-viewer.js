// The editor shares one modal shell. Keep chooser nodes alive during a drill-down
// so their search, filters, scroll positions and event handlers survive the trip.
'use strict';
(() => {
 const canvases = '#med-canvas,#pro-diagram,#as-canvas,#vc-canvas,#va-canvas,#atom-canvas,#chem3-canvas,#molecule-canvas,#pro-chart-preview,#rdkit-diagram';
 const catalogs = '#human-results,#animal-results,#physics-browse,#nu-results,#astro-catalog,#v8-lib-list,#saved-list,#med-results';
 let pending, origin, active, nativeOwner=false;
 document.addEventListener('click', event => {
   const dialog=event.target.closest('dialog[open]');
   if (!dialog || !dialog.querySelector(catalogs) || !event.target.closest('button') || event.target.closest('.dialog-actions')) return;
   pending={dialog,classes:dialog.className,scroll:[...dialog.querySelectorAll('div')].filter(n=>n.scrollTop).map(n=>[n,n.scrollTop]),focus:event.target.closest('button')};
   setTimeout(()=>{if(dialog.open&&pending?.dialog===dialog)pending=null;});
 },true);
 function leave(dialog) {
   dialog.classList.remove('diagram-full');
   if(nativeOwner && document.fullscreenElement===document.documentElement) document.exitFullscreen().catch(()=>{});
   nativeOwner=false;
 }
 function before(dialog,html) {
   const viewer=/<canvas id="(?:med-canvas|pro-diagram|as-canvas|vc-canvas|va-canvas|atom-canvas|chem3-canvas|molecule-canvas|pro-chart-preview)"/.test(html)||html.includes('id="pro-molecule-preview"');
   origin=viewer?((pending?.dialog===dialog?pending:null) || (active && dialog.querySelector(canvases)?origin:null)):null;
   pending=null;
   const replace=(viewer||active)&&!dialog.open;
   leave(dialog);active=null;
   if(!replace)return dialog;
   const next=dialog.cloneNode(false);next.classList.remove('v9-medical','v8-studio','science-dialog','diagram-full');
   dialog.replaceWith(next);return next;
 }
 function mount(dialog) {
   const canvas=dialog.querySelector(canvases);
   if(!canvas)return;
   dialog.style.setProperty('--diagram-ratio',String(canvas.width/canvas.height));
   const bar=document.createElement('nav');bar.className='diagram-nav';dialog.querySelector('h2').after(bar);active=bar;
   function back(){
     const kept=origin, title=dialog.querySelector('h2').textContent;
     const state=window.FTEPro?.medical?.active?.state;
     dialog.close();leave(dialog);active=null;origin=null;
     if(kept){
       dialog.replaceWith(kept.dialog);kept.dialog.className=kept.classes;kept.dialog.showModal();for(const [el,top] of kept.scroll)el.scrollTop=top;kept.focus.focus({preventScroll:true});return;
     }
     const P=FTEPro;
     if(canvas.id==='med-canvas'&&state){const animal=state.kind==='animals'||state.id.startsWith('Fauna/');P.commands.find(c=>c.name===(animal?'Animal ':'Human ')+state.dimension+' diagrams')?.fn();}
     else if(canvas.id==='as-canvas')P.astrophysics.catalog();
     else if(canvas.id==='pro-diagram'&&title.startsWith('Physics'))P.commands.find(c=>c.name==='Browse physics diagrams')?.fn();
     else if(canvas.id==='pro-diagram')P.diagramLibrary.library('Chemistry');
     else if(canvas.id==='vc-canvas'||canvas.id==='va-canvas')P.v8.library(canvas.id==='vc-canvas'?'v8compound':'v8atom');
   }
   if(origin||['med-canvas','as-canvas','pro-diagram','vc-canvas','va-canvas'].includes(canvas.id))button('Back to diagrams',back,bar);
   function fit(){
     if(!dialog.classList.contains('diagram-full')||!dialog.open)return;
     const available=Math.max(96,window.innerHeight-canvas.getBoundingClientRect().top-12);
     dialog.style.setProperty('--diagram-height',available+'px');
   }
   const observer=new ResizeObserver(fit);observer.observe(dialog);
   const toggle=button('Full screen',async()=>{
     if(dialog.classList.contains('diagram-full')){leave(dialog);toggle.textContent='Full screen';return;}
     dialog.classList.add('diagram-full');toggle.textContent='Exit full screen';dialog.scrollTop=0;fit();
     if(!document.fullscreenElement){try{await document.documentElement.requestFullscreen();nativeOwner=true;fit();}catch{/* Window-filling layout also works when native fullscreen is disabled. */}}
   },bar);
   dialog.scrollTop=0;
   const cleanup=()=>{observer.disconnect();if(active===bar && !dialog.open){leave(dialog);active=null;origin=null;}};
   dialog.addEventListener('close',cleanup,{once:true});
 }
 function escape(e){const d=document.querySelector('dialog[open].diagram-full');if(d&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();leave(d);d.querySelector('.diagram-nav button:last-child').textContent='Full screen';}}
 document.addEventListener('keydown',escape,true);
 document.addEventListener('fullscreenchange',()=>{if(nativeOwner&&!document.fullscreenElement){nativeOwner=false;const d=document.querySelector('dialog#dialog.diagram-full');if(d){d.classList.remove('diagram-full');d.querySelector('.diagram-nav button:last-child').textContent='Full screen';}}});
 const style=document.createElement('style');
 style.textContent=`
 .diagram-nav{display:flex;align-items:center;gap:8px;margin:4px 0 10px}
 dialog#dialog.diagram-full{inset:0!important;margin:0!important;width:100vw!important;height:100dvh!important;max-width:100vw!important;max-height:100dvh!important;box-sizing:border-box;border-radius:0;display:flex;flex-direction:column;gap:4px;overflow:auto;padding:8px 14px}
 dialog#dialog.diagram-full h2{font-size:17px;margin:0;order:-5}
 dialog#dialog.diagram-full .diagram-nav{order:-4;margin:0}
 dialog#dialog.diagram-full>.dialog-actions{order:-3;position:static!important;flex:none;margin:0;padding:2px 0;display:flex;flex-wrap:wrap;gap:4px}
 dialog#dialog.diagram-full>p:first-of-type{font-size:12px;margin:0}
 dialog#dialog.diagram-full .science-layout,dialog#dialog.diagram-full .v16-physics-layout{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:4px;flex:1;min-height:0}
 dialog#dialog.diagram-full .science-layout>div:first-child,dialog#dialog.diagram-full .v16-physics-layout>aside,dialog#dialog.diagram-full>#pro-diagram-tools,dialog#dialog.diagram-full>details{display:block!important;flex:none;width:100%!important;max-height:clamp(60px,10vh,92px)!important;overflow:auto!important;padding:4px;border:1px solid var(--border);box-sizing:border-box}
 dialog#dialog.diagram-full .science-layout>div:first-child label,dialog#dialog.diagram-full fieldset label{display:inline-flex!important;align-items:center;margin:3px 7px!important;gap:4px}
 dialog#dialog.diagram-full .science-layout>div:last-child{display:flex;flex-direction:column;align-items:stretch;min-height:0;flex:1;overflow:auto}
 dialog#dialog.diagram-full canvas{display:block;align-self:center;flex:none;max-height:var(--diagram-height,60vh)!important;max-width:100%!important;width:min(100%,calc(var(--diagram-height,60vh)*var(--diagram-ratio)))!important;height:auto!important;margin:0 auto;position:static!important}
 dialog#dialog.diagram-full .science-layout>div:last-child>p{margin:2px;font-size:12px}
 `;document.head.append(style);
 window.FTEViewer={before,mount};
})();
