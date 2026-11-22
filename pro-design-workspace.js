/* Full-page 3D workspace and compatibility bridge for the existing science tools. */
'use strict';
(() => {
  const P=FTEPro,C=FTEDesignCore,R=FTEDesignRenderer,T=FTEDesignTools,DB=FTEDesignStorage,E=FTEProCore.escape;
  let scene=C.scene(),selected='',tool='Rotate view',undo=[],redo=[],legacy=null,pending=null,dirtyDesign=false,libraryId=null,existing=null;
  let dimension='3D',drawStart=null;const sessions={};
  let ready=false,draftTimer,saveQueue=Promise.resolve(),renderInfo,result=null,wireStart=null,drag=null;
  const root=document.createElement('section');root.id='design-workspace';root.hidden=true;root.setAttribute('aria-label','3D Design workspace');
  root.innerHTML=`<header class="design-header"><div><span class="design-eyebrow">3D DESIGN</span><strong id="design-title">Untitled 3D diagram</strong><span id="design-category">Physics</span></div><div id="design-actions"></div></header>
    <nav id="design-subjects" aria-label="Design professions"></nav><div id="design-scene-layout"><aside class="design-left"><h3>Add to your diagram</h3><p class="design-muted">Choose a subject, then click a part to add it.</p><div id="design-part-controls"></div><div id="design-builders"></div><div id="design-parts" class="design-part-list"></div><details id="design-specialists"><summary>Specialist creation tools</summary><div id="design-specialist-buttons"></div></details></aside>
    <main class="design-stage"><nav id="design-view-tools" aria-label="Camera and editing tools"></nav><div class="design-canvas-wrap"><canvas id="design-canvas" width="1800" height="1140" tabindex="0" aria-label="3D design canvas. Drag to orbit; choose Move to move parts; scroll to zoom."></canvas></div><div id="design-hint" role="status"></div><section id="design-simulation" hidden></section></main>
    <aside class="design-right"><div id="design-scene-controls"></div><h3>Objects & wires</h3><select id="design-object-list" aria-label="Objects and wires" size="6"></select><div id="design-object-actions"></div><div id="design-properties"></div><details id="design-wiring"><summary>Connect terminals</summary><div id="design-wire-fields"></div></details><details><summary>Diagram notes</summary><textarea id="design-notes" aria-label="Diagram notes" rows="5" maxlength="6000"></textarea></details></aside></div>
    <section id="design-legacy-host" hidden></section><footer><span id="design-save-status" role="status">Ready</span><span id="design-footer-help">Drag to orbit · Scroll to zoom · Ctrl+S saves the diagram</span></footer>`;
  $('workarea').append(root);const canvas=$('design-canvas');
  const actions=$('design-actions'), left=$('design-part-controls'), view=$('design-view-tools');
  function active(){return ['2D Design','3D Design'].includes(currentTab);}
  const modelDimension=s=>s?.dimension==='2D'||s?.type==='diagram'&&s.dimension!=='3D'?'2D':'3D';
  function switchWorkspace(next){
    if(next===dimension)return;
    if(legacy||dirtyDesign||scene.objects.length||libraryId)persistDraft();legacy?.dialog.remove();
    sessions[dimension]={scene,selected,tool,undo,redo,legacy,dirtyDesign,libraryId,existing,result};
    const saved=sessions[next]||{scene:C.scene('Physics','Untitled '+next+' diagram',next),selected:'',tool:next==='3D'?'Rotate view':'Move',undo:[],redo:[],legacy:null,dirtyDesign:false,libraryId:null,existing:null,result:null};
    ({scene,selected,tool,undo,redo,legacy,dirtyDesign,libraryId,existing,result}=saved);dimension=next;wireStart=null;drag=null;
    $('design-scene-layout').hidden=!!legacy;$('design-legacy-host').hidden=!legacy;
    $('design-simulation').hidden=!result;if(result)simulationPanel();
    subjectFilter.value=category();query.value='';parts();sync();status(dirtyDesign?'Unsaved changes':libraryId?'Saved diagram':'Ready');
  }
  function title(){return legacy?legacy.title||legacy.get().title||'Scientific diagram':scene.title;}
  function category(){return legacy?legacy.category:scene.category;}
  function payload(){return legacy?validateLegacy({...legacy.get(),title:title()}):C.validate(scene);}
  function file(){return C.envelope(payload(),category(),title().slice(0,160));}
  function status(text){$('design-save-status').textContent=text;}
  function updateHeader(){$('design-title').textContent=title();$('design-category').textContent=category();root.querySelector('.design-eyebrow').textContent=dimension+' DESIGN';root.setAttribute('aria-label',dimension+' Design workspace');$('design-footer-help').textContent='Create → Save diagram → Saved diagrams';$('design-specialists').hidden=false;root.querySelectorAll('.design-restore').forEach(b=>b.hidden=b.dataset.dimension!==dimension);}
  function setTab(name){clickTab(name);visible();}
  function visible(){const on=active();if(on&&ready)switchWorkspace(currentTab.slice(0,2));root.hidden=!on;document.body.classList.toggle('design-mode',on);
    // Detach the dock while away: legacy editors use IDs also used by subject previews.
    if(legacy){if(on&&!legacy.dialog.isConnected)$('design-legacy-host').append(legacy.dialog);else if(!on&&legacy.dialog.isConnected)legacy.dialog.remove();}
    if(on){updateHeader();if(!legacy)draw();}}
  tabs.addEventListener('click',visible);
  function persistDraft(){clearTimeout(draftTimer);let record;try{record={file:file(),libraryId,modified:dirtyDesign,time:Date.now()};}catch(e){status(e.message);return Promise.resolve(false);}
    const savedDimension=dimension;saveQueue=saveQueue.catch(()=>{}).then(()=>DB.saveDraft(record,savedDimension)).then(()=>{if(savedDimension===dimension)status(dirtyDesign?'Draft saved · Use Save diagram to keep it in your subject library':'Saved diagram · Draft up to date');return true;}).catch(e=>{status(e.message);return false;});return saveQueue;
  }
  function changed(){dirtyDesign=true;result=null;$('design-simulation').hidden=true;updateHeader();status('Unsaved changes');clearTimeout(draftTimer);draftTimer=setTimeout(persistDraft,500);}
  function remember(){undo.push(C.copy(scene));if(undo.length>60)undo.shift();redo=[];}
  function update(){changed();sync();draw();}
  function replaceAllowed(){return !dirtyDesign||confirm('Replace the current design? Save it first if you want to keep a separate copy.');}
  function clearLegacy(){if(!legacy)return;const d=legacy.dialog;legacy=null;if(d.open)(d.designNativeClose||d.close.bind(d))();d.remove();$('design-legacy-host').hidden=true;$('design-scene-layout').hidden=false;}
  function openScene(s, options={}){
    const validated=C.validate(s);setTab(validated.dimension+' Design');if(!options.force&&!replaceAllowed())return false;clearLegacy();scene=validated;selected='';existing=options.existing||null;libraryId=options.libraryId||null;undo=[];redo=[];result=null;wireStart=null;tool=dimension==='3D'?'Rotate view':'Move';dirtyDesign=!!options.modified;
    subjectFilter.value=scene.category;query.value='';parts();$('design-simulation').hidden=true;sync();draw();persistDraft();return true;
  }
  function newDesign(){const d=modal('New '+dimension+' diagram','<div id="design-new-fields"></div>',[['Create',()=>{if(openScene(C.scene(cat.value,name.value.trim()||'Untitled '+dimension+' diagram',dimension))){d.close();}}]]);const h=$('design-new-fields'),name=field('Diagram name','text','Untitled '+dimension+' diagram',h),cat=select('Subject',C.categories,category(),h,()=>{});}
  function validateLegacy(s){
    if(!s||typeof s!=='object')throw Error('Invalid science diagram.');
    if(['v8compound','v8atom','v8astro','v9medical'].includes(s.type))return P.v8.valid(C.copy(s));
    if(s.type==='diagram'||s.type==='atom3d')return P.diagramLibrary.valid(s,s.type==='atom3d'?'Chemistry':s.subject);
    if(s.type==='chemistry3d'){
      const m=s.model;if(!m||!Array.isArray(m.atoms)||m.atoms.length>1500||!Array.isArray(m.bonds)||m.bonds.length>6000)throw Error('Invalid molecular model.');
      if(m.atoms.some(a=>!['x','y','z'].every(k=>Number.isFinite(a[k])&&Math.abs(a[k])<=10000)||typeof a.s!=='string'||a.s.length>8)||m.bonds.some(b=>!Array.isArray(b)||b.length!==3||!Number.isInteger(b[0])||!Number.isInteger(b[1])||!m.atoms[b[0]]||!m.atoms[b[1]]||![1,2,3,4].includes(b[2])))throw Error('Invalid molecular coordinates or bonds.');
      if(s.view&&['rx','ry','zoom'].some(k=>s.view[k]!==undefined&&(!Number.isFinite(s.view[k])||Math.abs(s.view[k])>100)))throw Error('Invalid molecular camera.');return C.copy(s);
    }throw Error('Unsupported science diagram.');
  }
  function prepareLegacy(s,subject,element){
    if(currentTab==='Teachers')return;
    setTab(modelDimension(s)+' Design');
    if(!replaceAllowed())return false;
    clearLegacy();existing=element||null;libraryId=null;dirtyDesign=false;
    pending={category:subject};return true;
  }
  const originalModal=modal;
  modal=function(name,html,items=[]){
    if(!pending)return originalModal(name,html,items);
    const dock=pending;pending=null;const d=document.createElement('dialog');d.id='design-legacy-dialog';d.className='design-docked-editor';
    d.innerHTML='<h2>'+E(name)+'</h2>'+html+'<div class="dialog-actions"></div>';
    const bar=d.querySelector('.dialog-actions');button('Return to document',()=>d.close(),bar);
    for(const [label,fn]of items)if(!/^Insert\b/.test(label))button(label,()=>fn(d),bar);
    $('design-scene-layout').hidden=true;$('design-legacy-host').hidden=false;$('design-legacy-host').replaceChildren(d);d.show();d.dataset.designCategory=dock.category;
    d.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&/^Save (atom|compound|template|diagram)$/.test(b.textContent)){e.preventDefault();e.stopImmediatePropagation();saveDesign();}},true);
    return d;
  };
  function attachLegacy(d,get,getCanvas,element){
    if(d.id!=='design-legacy-dialog')return;
    legacy={dialog:d,get,getCanvas,category:d.dataset.designCategory};existing=element||existing;
    for(const input of d.querySelectorAll('select')){
      if([...input.options].some(o=>o.value==='2D')&&[...input.options].some(o=>o.value==='3D')){input.value=dimension;input.closest('label').hidden=true;}
      if(dimension==='3D')for(const option of input.options){const names={Circle:'Sphere',Rectangle:'Block',Triangle:'Triangular prism',Polygon:'Hexagonal prism'};if(names[option.textContent])option.textContent=names[option.textContent];}
    }
    d.designNativeClose=d.close.bind(d);
    // A modeless dock survives tab switching and insertion; dispose it only when replacing it.
    d.close=()=>{persistDraft();setTab(legacy?.category||d.dataset.designCategory);};
    const mark=()=>{if(legacy?.dialog===d){dirtyDesign=true;updateHeader();clearTimeout(draftTimer);draftTimer=setTimeout(persistDraft,500);}};
    for(const event of ['input','change','click','pointerup','wheel'])d.addEventListener(event,mark);
    d.addEventListener('close',()=>{if(legacy?.dialog!==d)return;persistDraft();setTab(legacy.category);});
    updateHeader();persistDraft();
  }
  function snapshot(){if(legacy)return legacy.getCanvas();const c=document.createElement('canvas');c.width=1800;c.height=1140;R.render(c,scene,{exporting:true});R.release(c);return c;}
  function thumbnail(){const source=snapshot(),c=document.createElement('canvas');c.width=240;c.height=152;c.getContext('2d').drawImage(source,0,0,240,152);return c.toDataURL('image/png');}
  function safeName(n){return n.replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').trim().slice(0,100)||'diagram';}
  async function exportFile(d){return await download(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),safeName(d.title)+(modelDimension(d.payload)==='2D'?'.fte2d':'.fte3d'));}
  function saveDesign(){
    if(pending)return;const d=modal('Save '+dimension+' diagram','<p>Choose the subject where this diagram will appear under <strong>Load diagram</strong>. Your saved diagram stays editable.</p><div id="design-save-fields"></div><p id="design-save-error" role="status"></p>',[]),h=$('design-save-fields');
    const name=field('Diagram name','text',title(),h),cat=select('Save in',C.categories,category(),h,()=>{});name.maxLength=160;
    async function commit(withFile){try{
      const nameValue=name.value.trim();if(!nameValue)throw Error('Enter a diagram name.');const content=file();content.title=nameValue;content.category=cat.value;content.payload.title=nameValue;if(content.payload.type==='design3d')content.payload.category=cat.value;
      if(withFile&&await exportFile(content)===false){$('design-save-error').textContent='File save cancelled. Your design is still open.';return;}
      const id=libraryId||C.uid();await DB.put({id,file:content,thumbnail:thumbnail(),updated:Date.now()});libraryId=id;
      if(legacy){legacy.category=cat.value;const state=legacy.get();state.title=nameValue;legacy.title=nameValue;}else{scene.title=nameValue;scene.category=cat.value;}
      dirtyDesign=false;d.close();sync();await persistDraft();status('Saved in '+cat.value+' → Load diagram'+(withFile?' · File saved':''));
    }catch(e){$('design-save-error').textContent=e.message;}}
    button('Save to library',()=>commit(false),d.querySelector('.dialog-actions'));button('Save to library and file',()=>commit(true),d.querySelector('.dialog-actions')).classList.add('primary');
  }
  async function loadEnvelope(d,options={}){
    d=C.parseFile(JSON.stringify(d),validateLegacy);
    if(d.payload.type==='design3d')return openScene(d.payload,options);
    const s=d.payload;setTab(modelDimension(s)+' Design');if(!options.force&&!replaceAllowed())return false;dirtyDesign=false;
    if(!s.title)s.title=d.title;
    const fn=s.type==='diagram'?P.diagram:s.type==='atom3d'?P.atoms.editor:s.type==='chemistry3d'?P.chemistry3D.viewer:P.v8.editors[s.type];
    await fn(options.existing||null,s);if(legacy){legacy.category=d.category;legacy.title=d.title;libraryId=options.libraryId||null;dirtyDesign=!!options.modified;updateHeader();persistDraft();}return true;
  }
  function pickFile(onLoad){const input=document.createElement('input');input.type='file';input.accept='.fte2d,.fte3d,.json';input.onchange=async()=>{try{const f=input.files[0];if(!f)return;if(f.size>15*1024*1024)throw Error('The file exceeds 15 MB.');await onLoad(C.parseFile(await f.text(),validateLegacy));}catch(e){say(e.message);}};input.click();}
  async function library(subject='All subjects',options={}){
    const d=modal('Saved diagrams','<div id="design-library-controls"></div><div id="design-library-list" class="design-library-grid"></div><p id="design-library-message" role="status"></p>');
    const h=$('design-library-controls'),q=field('Search saved diagrams','search','',h);
    const cat=select('Subject',['All subjects',...C.categories],subject,h,filter),dim=select('Dimension',['All dimensions','2D','3D'],'All dimensions',h,filter);
    let items=[];
    const message=t=>{const el=d.querySelector('#design-library-message');if(el)el.textContent=t;};
    async function attempt(fn){try{await fn();}catch(e){message(e.message);}}
    button('Import older saved diagrams',()=>attempt(async()=>{
      const candidates=[...P.diagramLibrary.read().map(x=>({...x,source:'subject'})),...P.v8.read().map(x=>({...x,source:'science'}))];let count=0,skipped=0;
      for(const old of candidates){const id='legacy-'+old.source+'-'+old.id;if(items.some(x=>x.id===id))continue;
        try{const payload=validateLegacy(C.copy(old.spec)),cat=C.categories.includes(old.subject)?old.subject:payload.type==='v9medical'?'Medical':payload.type==='v8astro'?'Physics':'Chemistry';const title=String(old.name||payload.title||'Saved diagram').slice(0,160);payload.title=title;
          await DB.put({id,file:C.envelope(payload,cat,title),thumbnail:old.thumbnail||'',updated:Date.now()});count++;
        }catch{skipped++;}
      }
      items=await DB.list();cat.value='All subjects';dim.value='All dimensions';q.value='';filter();message('Imported '+count+' older saved diagrams.'+(skipped?' '+skipped+' could not be read; their original saved copies remain unchanged.':''));
    }),h);
    button('Load file…',()=>pickFile(async doc=>{if(await loadEnvelope(doc))d.close();}),h);
    button('Import file to library…',()=>pickFile(async doc=>{await DB.put({id:C.uid(),file:doc,thumbnail:'',updated:Date.now()});items=await DB.list();cat.value='All subjects';dim.value='All dimensions';q.value='';filter();message('Imported '+doc.title+'.');}),h);
    function filter(){const out=d.querySelector('#design-library-list');out.replaceChildren();
      const found=items.filter(i=>(cat.value==='All subjects'||i.file.category===cat.value)&&(dim.value==='All dimensions'||modelDimension(i.file.payload)===dim.value)&&(i.file.title+' '+i.file.category).toLowerCase().includes(q.value.toLowerCase())).sort((a,b)=>b.updated-a.updated);
      for(const item of found){
        const row=document.createElement('article');row.className='design-library-card';const im=document.createElement('img');if(item.thumbnail)im.src=item.thumbnail;im.alt=item.file.title;row.append(im);
        const name=document.createElement('strong');name.textContent=item.file.title;row.append(name);
        const badge=document.createElement('span');badge.className='design-muted';badge.textContent=modelDimension(item.file.payload)+' · '+item.file.category+' · '+new Date(item.updated).toLocaleDateString();row.append(badge);
        button('Open in '+modelDimension(item.file.payload)+' Design',()=>attempt(async()=>{if(await loadEnvelope(item.file,{libraryId:item.id}))d.close();}),row);
        button('Insert into document',()=>attempt(async()=>{if(item.file.payload.type==='design3d'){insertScene(item.file.payload);d.close();}else if(await loadEnvelope(item.file,{libraryId:item.id})){d.close();await new Promise(requestAnimationFrame);await insertCurrent();}}),row);
        button('Use in teacher question',()=>attempt(()=>teacherQuestion(item.file,item.thumbnail,d)),row);
        button('Rename',()=>attempt(async()=>{const title=prompt('Diagram name',item.file.title)?.trim();if(!title)return;if(title.length>160)throw Error('Use at most 160 characters.');item.file.title=title;item.file.payload.title=title;item.updated=Date.now();await DB.put(item);if(libraryId===item.id){if(legacy)legacy.title=title;else scene.title=title;sync();}filter();}),row);
        button('Export file',()=>attempt(()=>exportFile(item.file)),row);
        button('Delete',()=>attempt(async()=>{if(confirm('Delete “'+item.file.title+'” from the saved library?')){await DB.remove(item.id);items=items.filter(i=>i.id!==item.id);if(libraryId===item.id)libraryId=null;filter();}}),row);out.append(row);
      }
      if(!found.length)out.textContent='No saved diagrams match. Create a design in 2D Design or 3D Design and choose Save diagram, or import a .fte2d / .fte3d file.';
    }
    q.oninput=filter;await attempt(async()=>{items=await DB.list();filter();});
  }
  function teacherQuestion(doc,thumbnail='',dialog=null){
    let img=thumbnail,memoImg=thumbnail;
    if(doc.payload.type==='design3d'){
      const s=C.validate(doc.payload),canvas=document.createElement('canvas');canvas.width=1200;canvas.height=760;
      R.render(canvas,s,{exporting:true});memoImg=canvas.toDataURL('image/png');s.labels=false;
      s.objects=s.objects.filter(o=>!['label','dimension'].includes(o.kind));R.render(canvas,s,{exporting:true});img=canvas.toDataURL('image/png');R.release(canvas);
    }
    if(!img)throw Error('Open this older diagram, then use Teacher question from its design workspace.');
    dialog?.close();setTab('Teachers');P.teacherStudio.question({type:'Labeling',subject:doc.category,prompt:'Identify the numbered parts of '+doc.title+'.',img,memoImg,points:[]});
  }
  function insertScene(s,replace=null){const c=document.createElement('canvas');c.width=1800;c.height=1140;R.render(c,s,{exporting:true});R.release(c);setTab('Home');P.View3D.insert(c,C.validate(s),replace);}
  async function insertCurrent(){const p=payload();if(legacy){const c=snapshot();setTab('Home');P.View3D.insert(c,p,existing);}else insertScene(p,existing);existing=null;say('Saved diagram loaded into the document. Double-click it to edit.');}
  function undoScene(forward=false){if(legacy)return;const from=forward?redo:undo,to=forward?undo:redo;if(!from.length)return;to.push(C.copy(scene));scene=from.pop();selected='';update();}
  button('New',newDesign,actions);button('Save diagram',saveDesign,actions).classList.add('primary');button('Saved diagrams',()=>library(),actions);button('Insert into document',insertCurrent,actions);button('Teacher question',()=>teacherQuestion(file(),snapshot().toDataURL('image/png')),actions);button('Copy to other dimension',()=>{if(legacy)return say('Use the part-based workspace to copy between 2D and 3D.');const next=C.copy(scene);next.dimension=dimension==='2D'?'3D':'2D';next.title=(scene.title+' · '+next.dimension).slice(0,160);openScene(next,{modified:true});},actions);
  button('Export PNG',async()=>download(await new Promise(resolve=>snapshot().toBlob(resolve)),safeName(title())+'.png'),actions);
  const subjectFilter=select('Parts from',['General shapes',...C.categories],'Physics',left,()=>{if(!scene.objects.length&&C.categories.includes(subjectFilter.value)){scene.category=subjectFilter.value;scene.view.rx=scene.category==='Architecture'?.55:-.38;catField.value=scene.category;changed();}query.value='';parts();}),query=field('Find a part','search','',left);query.placeholder='Search parts…';query.oninput=parts;
  const partPicker=select('Choose a part',[],'',left,()=>{});button('Add part',()=>{if(partPicker.value)addPart(partPicker.value);},left).classList.add('primary');
  const modes={};for(const name of ['Move','Rotate object','Rotate view','Pan','Wire'])modes[name]=button(name,()=>{tool=name;wireStart=null;syncModes();draw();},view);
  button('Undo',()=>undoScene(),view);button('Redo',()=>undoScene(true),view);
  button('−',()=>{scene.view.zoom=Math.max(.1,scene.view.zoom/1.15);changed();draw();},view,'Zoom out');button('+',()=>{scene.view.zoom=Math.min(12,scene.view.zoom*1.15);changed();draw();},view,'Zoom in');
  button('Fit view',fit,view);const frontButton=button('Front',()=>{remember();scene.view.rx=scene.view.ry=0;update();},view);button('Reset view',()=>{remember();scene.view={rx:scene.category==='Architecture'?.55:-.38,ry:.45,zoom:1,panX:0,panY:0};fit();sync();},view);
  function syncModes(){for(const [name,b]of Object.entries(modes)){b.hidden=(dimension==='2D'&&name==='Rotate view')||(name==='Wire'&&scene.category!=='Electrical'&&!scene.objects.some(o=>C.pins(o).length));b.setAttribute('aria-pressed',String(tool===name));b.classList.toggle('active',tool===name);}frontButton.hidden=dimension==='2D';
    const help=tool.startsWith('Draw ')?(drawStart?'Click the end point. Esc cancels.':'Click the start point, then the end point. Esc cancels.') :tool==='Wire'?(wireStart?'Choose the second gold terminal. Esc cancels.':'Click two gold terminals to connect parts. Or choose them under Connect terminals.'):tool==='Rotate object'?'Drag a part to rotate it. Wires follow the part.':tool==='Pan'?'Drag anywhere to move your view.':tool==='Move'?'Drag a part to move it. Drag empty space to '+(dimension==='3D'?'rotate your view.':'pan.'): 'Drag anywhere to rotate your view.';
    $('design-hint').textContent=help+' Scroll to zoom · Right-drag or Shift-drag to pan';canvas.setAttribute('aria-label',dimension+' design canvas. '+help);canvas.style.cursor=tool==='Pan'||tool==='Rotate view'?'grab':tool==='Wire'?'crosshair':'default';
  }
  function fit(){const objects=scene.objects;if(!objects.length){scene.view={rx:scene.category==='Architecture'?.55:-.38,ry:.45,zoom:1,panX:0,panY:0};}else{const xs=objects.map(o=>o.x),ys=objects.map(o=>o.y),zs=objects.map(o=>o.z);const x=(Math.max(...xs)+Math.min(...xs))/2,y=(Math.max(...ys)+Math.min(...ys))/2,z=(Math.max(...zs)+Math.min(...zs))/2;const radius=Math.max(2,...objects.map(o=>Math.hypot(o.x-x,o.y-y,o.z-z)+Math.max(o.w,o.h,o.d)/2));scene.view.zoom=Math.max(.1,Math.min(3,4.7/radius));scene.view.panX=scene.view.panY=0;const p=R.render(canvas,scene).project([x,y,z]);scene.view.panX=600-p.x;scene.view.panY=380-p.y;}changed();draw();}
  function addPart(kind){
    if(scene.objects.length>=500)return say('This diagram already has 500 parts.');
    const o=C.object(kind),rx=dimension==='2D'?0:scene.view.rx,ry=dimension==='2D'?0:scene.view.ry;
    const sx=-scene.view.panX/(64*scene.view.zoom),sy=scene.view.panY/(64*scene.view.zoom),cx=sx*Math.cos(ry)+sy*Math.sin(rx)*Math.sin(ry),cy=sy*Math.cos(rx),cz=sx*Math.sin(ry)-sy*Math.sin(rx)*Math.cos(ry);
    for(let i=0;i<600;i++){const ring=Math.ceil(Math.sqrt(i)),angle=i*2.4,x=cx+Math.cos(angle)*ring*1.6,y=cy+Math.sin(angle)*ring*1.6;
      if(!scene.objects.some(p=>Math.abs(p.x-x)<(p.w+o.w)/2+.4&&Math.abs(p.y-y)<(p.h+o.h)/2+.4)){o.x=x;o.y=y;o.z=dimension==='2D'?0:cz;break;}}
    remember();scene.objects.push(o);selected=o.id;tool='Move';drawStart=null;update();
    const hit=renderInfo.hits.find(h=>h.id===o.id);if(hit&&(hit.x1<15||hit.y1<15||hit.x2>1185||hit.y2>745))fit();
    status(o.label+' added · Drag it to move, or choose Rotate object');
  }
  function parts(){if(window.FTEDesignWorkspace)professionTools();const out=$('design-parts');out.replaceChildren();const found=C.partsForDimension(dimension).filter(p=>(p.category===subjectFilter.value||p.category==='General')&&(p.name+' '+p.kind).toLowerCase().includes(query.value.toLowerCase()));
    const previous=partPicker.value;partPicker.replaceChildren(...found.map(p=>new Option(p.name,p.kind)));if(found.some(p=>p.kind===previous))partPicker.value=previous;
    for(const p of found){const b=button(p.name,()=>addPart(p.kind),out);b.title='Add '+p.name;const preview=document.createElement('canvas');preview.width=88;preview.height=64;preview.setAttribute('aria-hidden','true');preview.fteMeshDisabled=true;
      const sample=C.scene(p.category==='Architecture'?'Architecture':'Physics','Preview',dimension);sample.labels=false;sample.grid=false;sample.view.zoom=3.2;sample.objects=[C.object(p.kind)];R.render(preview,sample);b.prepend(preview);
    }if(!found.length)out.textContent='No matching parts. Try another subject or search.';}
  const sc=$('design-scene-controls');const nameField=field('Diagram name','text',scene.title,sc),catField=select('Save under subject',C.categories,scene.category,sc,v=>{remember();scene.category=v;subjectFilter.value=v;parts();update();});nameField.maxLength=160;
  nameField.onchange=()=>{if(!nameField.value.trim()){nameField.value=scene.title;return;}remember();scene.title=nameField.value.trim();update();};
  const labels=field('Labels','checkbox','',sc),grid=field('Grid','checkbox','',sc),snap=field('Snap movement','checkbox','',sc);snap.checked=true;
  const units=select('Drawing units',['m','cm','mm','ft','in','units'],scene.unit||'m',sc,v=>{remember();scene.unit=v;update();});
  units.title='Labels the drawing units. Existing coordinates are not rescaled.';
  const snapSize=field('Grid spacing','number',scene.snapStep||.25,sc);snapSize.min=.01;snapSize.max=100;snapSize.step=.01;snapSize.onchange=()=>{const v=snapSize.valueAsNumber;if(!Number.isFinite(v)||v<.01||v>100){snapSize.value=scene.snapStep||.25;return say('Use a grid spacing from 0.01 to 100.');}remember();scene.snapStep=v;update();};
  for(const [i,k]of [[labels,'labels'],[grid,'grid']])i.onchange=()=>{remember();scene[k]=i.checked;update();};
  const simulationControls=document.createElement('details');simulationControls.innerHTML='<summary>Electrical simulation</summary>';sc.append(simulationControls);button('Run DC simulation',()=>simulate(false),simulationControls);button('Run transient…',transientDialog,simulationControls);
  $('design-object-list').onchange=e=>{selected=e.target.value;properties();draw();};
  button('Duplicate',()=>{const o=scene.objects.find(o=>o.id===selected);if(!o)return;if(scene.objects.length>=500)return say('A diagram supports up to 500 parts.');remember();const next={...C.copy(o),id:C.uid(),x:o.x+.6,y:o.y+.3,label:o.label+' copy'};scene.objects.push(next);selected=next.id;update();},$('design-object-actions'));
  button('Delete',()=>{if(!selected)return;remember();C.remove(scene,selected);selected='';update();},$('design-object-actions'));
  $('design-notes').onchange=e=>{remember();scene.notes=e.target.value;update();};
  function sync(){updateHeader();if(legacy)return;units.value=scene.unit||'units';snapSize.value=scene.snapStep||.25;nameField.value=scene.title;catField.value=scene.category;labels.checked=scene.labels;grid.checked=scene.grid;$('design-notes').value=scene.notes;
    const electrical=scene.category==='Electrical'||scene.objects.some(o=>C.pins(o).length);simulationControls.hidden=!electrical;$('design-wiring').hidden=!electrical;modes.Wire.hidden=!electrical;
    const list=$('design-object-list');list.replaceChildren(...scene.objects.map(o=>new Option(o.label||C.byKind[o.kind].name,o.id)),...scene.wires.map((w,i)=>new Option('Wire '+(i+1),w.id)));list.value=selected;properties();wiring();syncModes();
  }
  function propertyChanged(){changed();const o=scene.objects.find(o=>o.id===selected),option=[...$('design-object-list').options].find(o=>o.value===selected);if(o&&option)option.textContent=o.label||C.byKind[o.kind].name;draw();}
  function properties(){const h=$('design-properties');h.replaceChildren();const o=scene.objects.find(o=>o.id===selected),w=scene.wires.find(w=>w.id===selected);if(!o&&!w){h.textContent='Select an object to edit its position, size and appearance.';return;}
    if(w){const c=field('Wire colour','color',w.color,h);c.onchange=()=>{remember();w.color=c.value;propertyChanged();};const x=field('Wire bend X','number',w.bend??(C.endpoint(scene,w.a)[0]+C.endpoint(scene,w.b)[0])/2,h);x.step='.1';x.onchange=()=>{if(!Number.isFinite(x.valueAsNumber))return;remember();w.bend=x.valueAsNumber;propertyChanged();};return;}
    const label=field('Part name','text',o.label,h);label.maxLength=160;label.onchange=()=>{remember();o.label=label.value;propertyChanged();};const color=field('Part colour','color',o.color,h);color.onchange=()=>{remember();o.color=color.value;propertyChanged();};
    const precise=document.createElement('details');precise.innerHTML='<summary>Position, size and rotation</summary>';h.append(precise);const fields=document.createElement('div');fields.className='design-number-grid';precise.append(fields);
    for(const [key,caption]of [['x','X'],['y','Y'],['z',scene.category==='Architecture'?'Elevation Z':'Z'],['w','Width'],['h',scene.category==='Architecture'?'Plan length':'Height'],['d',scene.category==='Architecture'?'Elevation size':'Depth'],['rx','Rotate X°'],['ry','Rotate Y°'],['rz','Rotate Z°']]){if(dimension==='2D'&&['z','d','rx','ry'].includes(key))continue;const input=field(caption,'number',Number(o[key].toFixed(3)),fields);input.step=key.startsWith('r')?'5':'.1';input.onchange=()=>{const v=input.valueAsNumber,old=o[key];if(!Number.isFinite(v)){input.value=old;return;}remember();o[key]=v;try{C.validate(scene);propertyChanged();}catch(e){o[key]=old;undo.pop();input.value=old;say(e.message);}};}
    const captions={source:'Voltage (V)',resistor:'Resistance (Ω)',capacitor:'Capacitance (F)',inductor:'Inductance (H)',diode:'Forward voltage (V)',led:'Forward voltage (V)'};
    if(captions[o.kind]){const v=field(captions[o.kind],'number',o.value,h);v.step='any';v.onchange=()=>{const old=o.value;remember();o.value=v.valueAsNumber;try{C.validate(scene);propertyChanged();}catch(e){o.value=old;undo.pop();v.value=old;say(e.message);}};}
    if(o.kind==='switch'){const v=field('Switch closed','checkbox','',h);v.checked=!!o.value;v.onchange=()=>{remember();o.value=v.checked?1:0;propertyChanged();};}
    if(C.pins(o).length&&!FTECircuit.supported.includes(o.kind)){const note=document.createElement('p');note.textContent='Visual component. The simulator does not emulate this part.';note.className='design-muted';h.append(note);}
  }
  function wiring(){const h=$('design-wire-fields');h.replaceChildren();const options=scene.objects.flatMap(o=>C.pins(o).map(p=>[o.id+':'+p.name,o.label+' · '+p.name]));if(options.length<2){h.textContent='Add electrical components to connect terminals.';return;}const a=select('From terminal',options,options[0][0],h,()=>{}),b=select('To terminal',options,options.at(-1)[0],h,()=>{});button('Connect',()=>{const decode=v=>{const i=v.lastIndexOf(':');return {object:v.slice(0,i),pin:v.slice(i+1)};};try{remember();C.wire(scene,decode(a.value),decode(b.value));update();}catch(e){undo.pop();say(e.message);}},h);}
  function draw(){if(legacy)return;renderInfo=R.render(canvas,scene,{selected,terminals:tool==='Wire',result});if(!scene.objects.length){const ctx=canvas.getContext('2d');ctx.fillStyle='#4a3d5d';ctx.textAlign='center';ctx.font='bold 28px Arial';ctx.fillText('Add your first '+dimension+' part',600,310);ctx.font='18px Arial';ctx.fillText('Choose a subject on the left, then click a part.',600,350);ctx.fillText(dimension==='3D'?'Sphere, block, circuit component — start anywhere.':'Circle, rectangle, circuit symbol — start anywhere.',600,382);ctx.textAlign='left';}}
  const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*1200/r.width,y:(e.clientY-r.top)*760/r.height};};
  canvas.oncontextmenu=e=>e.preventDefault();
  canvas.onpointerdown=e=>{if(![0,1,2].includes(e.button))return;e.preventDefault();canvas.focus();canvas.setPointerCapture(e.pointerId);const p=point(e),pan=e.shiftKey||e.button!==0||tool==='Pan';
    if(tool.startsWith('Draw ')&&!pan&&dimension==='2D'){
      const step=snap.checked?(scene.snapStep||.25):.001,round=v=>Math.round(v/step)*step;
      const pos={x:round((p.x-600-scene.view.panX)/(64*scene.view.zoom)),y:round((380+scene.view.panY-p.y)/(64*scene.view.zoom))};
      if(!drawStart){drawStart=pos;syncModes();return;}
      const a=drawStart,dx=pos.x-a.x,dy=pos.y-a.y,length=Math.hypot(dx,dy),kind=tool.slice(5);drawStart=null;
      if(length<.01||length>200){say('Draw a segment between 0.01 and 200 drawing units.');syncModes();return;}
      if(scene.objects.length>=500)return say('A diagram supports up to 500 parts.');
      const part=C.object(kind,{x:(a.x+pos.x)/2,y:(a.y+pos.y)/2,z:kind==='wall'?1.5:0,w:length,rz:Math.atan2(dy,dx)*180/Math.PI});
      remember();scene.objects.push(part);selected=part.id;update();return;
    }
    if(tool==='Wire'&&!pan){const pin=renderInfo.pins.filter(a=>Math.hypot(a.x-p.x,a.y-p.y)<14).sort((a,b)=>b.z-a.z)[0];if(!pin)return;const endpoint={object:pin.object,pin:pin.pin};if(!wireStart)wireStart=endpoint;else{try{remember();C.wire(scene,wireStart,endpoint);wireStart=null;update();}catch(err){undo.pop();say(err.message);}}syncModes();return;}
    const hit=renderInfo.hits.filter(h=>p.x>=h.x1-6&&p.x<=h.x2+6&&p.y>=h.y1-6&&p.y<=h.y2+6).sort((a,b)=>b.z-a.z)[0];
    if(!pan&&['Move','Rotate object'].includes(tool)){selected=hit?.id||'';if(!hit){for(const path of renderInfo.wirePaths)for(let i=1;i<path.v.length;i++){const a=path.v[i-1],b=path.v[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<7)selected=path.wire;}}sync();draw();}
    const moving=tool==='Move'&&hit&&!pan,rotating=tool==='Rotate object'&&hit&&!pan;drag={x:p.x,y:p.y,moving,rotating,pan:pan||(dimension==='2D'&&!moving&&!rotating),moved:false};
  };
  canvas.onpointermove=e=>{if(!drag)return;const p=point(e),dx=p.x-drag.x,dy=p.y-drag.y;if(!dx&&!dy)return;if(!drag.moved)remember();drag.x=p.x;drag.y=p.y;drag.moved=true;
    if(drag.pan){scene.view.panX+=dx;scene.view.panY+=dy;}else if(drag.rotating){const o=scene.objects.find(o=>o.id===selected);if(o){if(dimension==='2D')o.rz=(o.rz+dx*.6)%360;else{if(scene.category==='Architecture')o.rz=(o.rz+dx*.6)%360;else o.ry=(o.ry+dx*.6)%360;o.rx=(o.rx+dy*.6)%360;}}}else if(drag.moving){const o=scene.objects.find(o=>o.id===selected),rx=scene.dimension==='2D'?0:scene.view.rx,ry=scene.dimension==='2D'?0:scene.view.ry,sx=dx/(64*scene.view.zoom),sy=-dy/(64*scene.view.zoom);if(o){const mx=sx*Math.cos(ry)+sy*Math.sin(rx)*Math.sin(ry),my=sy*Math.cos(rx),mz=sx*Math.sin(ry)-sy*Math.sin(rx)*Math.cos(ry);o.x+=mx;if(scene.category==='Architecture'&&dimension==='3D'){o.y-=mz;o.z+=my;}else{o.y+=my;o.z+=mz;}}}else if(scene.dimension==='3D'){scene.view.ry+=dx*.008;scene.view.rx=Math.max(-1.5,Math.min(1.5,scene.view.rx+dy*.008));}draw();
  };
  canvas.onpointerup=canvas.onpointercancel=e=>{if(!drag)return;const moved=drag.moved;if(moved&&drag.moving&&snap.checked){const o=scene.objects.find(o=>o.id===selected);if(o)for(const k of ['x','y','z'])o[k]=Math.round(o[k]/(scene.snapStep||.25))*(scene.snapStep||.25);}drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(moved)update();};
  canvas.addEventListener('wheel',e=>{e.preventDefault();const p=point(e),old=scene.view.zoom;scene.view.zoom=Math.max(.1,Math.min(12,old*(e.deltaY<0?1.1:1/1.1)));const f=scene.view.zoom/old;scene.view.panX=p.x-600-(p.x-600-scene.view.panX)*f;scene.view.panY=p.y-380-(p.y-380-scene.view.panY)*f;changed();draw();},{passive:false});
  function simulate(transient,duration=1,steps=200){try{result=transient?FTECircuit.transient(scene,duration,steps):FTECircuit.dc(scene);simulationPanel();draw();}catch(e){result=null;const h=$('design-simulation');h.hidden=false;h.replaceChildren();const p=document.createElement('p');p.textContent=e.message;h.append(p);button('Close results',()=>h.hidden=true,h);draw();}}
  function transientDialog(){const d=modal('Transient circuit simulation','<p>Capacitors start uncharged and inductor currents start at zero. The time step is duration ÷ steps.</p><div id="design-transient-fields"></div>',[['Run',()=>{simulate(true,+duration.value,+steps.value);d.close();}]]),h=$('design-transient-fields'),duration=field('Duration (seconds)','number',1,h),steps=field('Steps','number',200,h);duration.step='.01';steps.min=2;steps.max=2000;}
  function simulationPanel(){const h=$('design-simulation');h.hidden=false;h.innerHTML='<div class="design-simulation-bar"><strong>'+E(result.method)+'</strong><span>Current A → B; negative source power means delivery</span></div><div id="design-result-table"></div>';
    const bar=h.firstElementChild;button('Export CSV',exportSimulation,bar);button('Close results',()=>h.hidden=true,bar);
    function table(parts){$('design-result-table').innerHTML='<table><thead><tr><th>Part</th><th>Voltage (V)</th><th>Current (mA)</th><th>Power (mW)</th></tr></thead><tbody>'+Object.entries(parts).map(([id,r])=>'<tr><td>'+E(scene.objects.find(o=>o.id===id)?.label||id)+'</td><td>'+r.voltage.toPrecision(5)+'</td><td>'+(r.current*1000).toPrecision(5)+'</td><td>'+(r.power*1000).toPrecision(5)+'</td></tr>').join('')+'</tbody></table>';}
    table(result.parts);
    if(result.samples){const controls=document.createElement('div');controls.className='design-simulation-bar';h.append(controls);const entries=scene.objects.filter(o=>result.parts[o.id]).map(o=>[o.id,o.label]);const part=select('Plot voltage across',entries,entries.find(([id])=>scene.objects.find(o=>o.id===id).kind==='capacitor')?.[0]||entries[0][0],controls,plot);const graph=document.createElement('canvas');graph.width=1000;graph.height=180;graph.className='design-transient-graph';h.append(graph);
      function plot(){const ctx=graph.getContext('2d'),values=result.samples.map(s=>s.parts[part.value].voltage),lo=Math.min(0,...values),hi=Math.max(.001,...values),span=hi-lo;ctx.fillStyle='#f2f5fa';ctx.fillRect(0,0,1000,180);ctx.strokeStyle='#d2dbe8';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(55,20+i*32);ctx.lineTo(980,20+i*32);ctx.stroke();}ctx.strokeStyle='#8c61be';ctx.lineWidth=2;ctx.beginPath();values.forEach((v,i)=>{const x=55+(i+1)/values.length*925,y=148-(v-lo)/span*128;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.fillStyle='#43536b';ctx.font='12px Arial';ctx.fillText(hi.toPrecision(3)+' V',4,20);ctx.fillText(lo.toPrecision(3)+' V',4,148);ctx.fillText('0 s',55,174);ctx.fillText(result.duration+' s',930,174);}
      const time=field('Sample','range',result.samples.length-1,controls);time.min=0;time.max=result.samples.length-1;time.step=1;const caption=document.createElement('output');controls.append(caption);time.oninput=()=>{const sample=result.samples[+time.value];caption.textContent=sample.time.toPrecision(4)+' s';table(sample.parts);R.render(canvas,scene,{selected,terminals:tool==='Wire',result:{parts:sample.parts}});};time.oninput();plot();
    }
    if(result.ignored.length){const note=document.createElement('p');note.textContent='Unconnected visual parts excluded: '+result.ignored.join(', ');h.append(note);}
  }
  function exportSimulation(){const rows=[['Time (s)','Part','Voltage (V)','Current (A)','Power (W)']];const samples=result.samples||[{time:0,parts:result.parts}];for(const sample of samples)for(const [id,v]of Object.entries(sample.parts))rows.push([sample.time,scene.objects.find(o=>o.id===id)?.label||id,v.voltage,v.current,v.power]);const quote=v=>'"'+String(typeof v==='string'&&/^[=+@-]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';return download(new Blob([rows.map(row=>row.map(quote).join(',')).join('\r\n')],{type:'text/csv'}),safeName(title())+'-simulation.csv');}
  window.addEventListener('keydown',e=>{if(!active())return;const mod=e.ctrlKey||e.metaKey;
    if(document.querySelector('#dialog[open]')){if(mod&&['s','o','n'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();}return;}
    if(mod&&['s','o','n'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();e.key.toLowerCase()==='s'?saveDesign():e.key.toLowerCase()==='n'?newDesign():library(category());return;}
    const typing=e.target.matches('input,textarea,select,[contenteditable=true]');
    if(legacy){if(!typing&&mod&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();const name=e.key.toLowerCase()==='y'||e.shiftKey?'Redo':'Undo';[...legacy.dialog.querySelectorAll('button')].find(b=>b.textContent===name)?.click();}return;}
    if(e.key==='Escape'){wireStart=null;drawStart=null;if(tool.startsWith('Draw '))tool='Move';syncModes();}
    if(!typing&&mod&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();undoScene(e.key.toLowerCase()==='y'||e.shiftKey);}
    if(!typing&&['Delete','Backspace'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(selected){remember();C.remove(scene,selected);selected='';update();}}
  },true);
  document.addEventListener('click',e=>{if(active()&&!document.querySelector('#dialog[open]')&&e.target.closest('#file-actions button')?.textContent==='Save'){e.preventDefault();e.stopImmediatePropagation();saveDesign();}},true);
  pages.addEventListener('dblclick',e=>{const image=e.target.closest('[data-pro-object]');if(!image)return;try{const s=JSON.parse(image.dataset.proObject);if(s.type==='design3d')openScene(s,{existing:image});}catch(err){say(err.message);}});
  const api=window.FTEDesignWorkspace={prepareLegacy,attachLegacy,openScene,loadEnvelope,library,teacherQuestion,save:saveDesign,new:newDesign,validateLegacy,guard:async()=>!ready||(!legacy&&!scene.objects.length&&!dirtyDesign&&!libraryId?(await saveQueue)!==false:await persistDraft()),get active(){return active();},get scene(){return scene;},get legacy(){return legacy;},get dirty(){return dirtyDesign;},get result(){return result;},get file(){return file();},get dimension(){return dimension;},draw,simulate};
  // Keep authoring commands, remove prebuilt subject browsers and their palette entries.
  const retained=['Physics diagram','Chemistry diagram','Geometry diagram','Equation','Function graph','Unit converter','Chemical formula','Validated molecule','Custom compounds','Custom atom designer'];
  for(const name of retained){const cmd=P.commands.find(c=>c.name===name);if(!cmd?.button)continue;
    if(['Physics diagram','Chemistry diagram','Geometry diagram'].includes(name)){
      const subject=name==='Geometry diagram'?'Mathematics':name.split(' ')[0];cmd.fn=()=>P.diagram(null,{type:'diagram',subject,title:name,width:560,dimension:'2D',nodes:[],lines:[]});cmd.button.onclick=()=>cmd.fn();
    }
    cmd.button.remove();button(name,()=>cmd.fn(),$('design-specialist-buttons'));
  }
  for(let i=P.commands.length-1;i>=0;i--)if(!P.commands[i].button&&/^(Physics diagram |Nuclear physics diagram|Astrophysics gravity )/.test(P.commands[i].keywords||''))P.commands.splice(i,1);
  for(const cat of C.categories){const ribbon=ribbons[cat];if(!ribbon)continue;
    for(let i=P.commands.length-1;i>=0;i--)if(P.commands[i].button&&ribbon.contains(P.commands[i].button))P.commands.splice(i,1);
    ribbon.remove();delete ribbons[cat];for(const b of [...tabs.children])if(b.textContent===cat)b.remove();
  }
  for(const dim of ['2D','3D']){
    for(const [name,fn]of [['New diagram',newDesign],['Save diagram',saveDesign],['Saved diagrams',()=>library()]])P.add(name,()=>{setTab(dim+' Design');fn();},dim+' Design',dim+' workspace');
    const picker=select('Profession',C.categories,'Physics',P.tab(dim+' Design'),v=>{setTab(dim+' Design');chooseSubject(v);});picker.dataset.designDimension=dim;
  }
  P.add('Browse saved diagrams',()=>library(),'Saved diagrams','user designs library open load import export');
  P.add('Create 2D diagram',()=>{setTab('2D Design');newDesign();},'Saved diagrams');
  P.add('Create 3D diagram',()=>{setTab('3D Design');newDesign();},'Saved diagrams');
  P.add('My diagrams',()=>library(),'Teachers','saved user diagram labeling');
  for(const cat of C.categories){const b=button(cat,()=>chooseSubject(cat),$('design-subjects'));b.dataset.subject=cat;}
  function chooseSubject(cat){subjectFilter.value=cat;query.value='';if(!legacy&&!scene.objects.length&&scene.category!==cat){remember();scene.category=cat;scene.view.rx=cat==='Architecture'?.55:-.38;catField.value=cat;changed();}parts();}
  function professionTools(){
    for(const b of $('design-subjects').children)b.setAttribute('aria-pressed',String(b.dataset.subject===subjectFilter.value));
    for(const pick of document.querySelectorAll('[data-design-dimension]'))if(pick.dataset.designDimension===dimension)pick.value=subjectFilter.value;
    const h=$('design-builders');h.replaceChildren();
    if(subjectFilter.value==='Architecture'){
      const help=document.createElement('p');help.className='design-muted';help.textContent='Blueprint: X/Y plan. 3D: Z elevation. Set drawing units before building. Sizes use those units.';h.append(help);
      for(const name of ['Room / house shell','Road builder','Bridge builder','Stair builder'])button(name,()=>construction(name),h);
      button('Add dimension',()=>addPart('dimension'),h);if(dimension==='2D')for(const name of ['wall','road','dimension'])button('Draw '+name,()=>{tool='Draw '+name;drawStart=null;syncModes();status('Click two points on the blueprint.');},h);
    }
    button('Repeat selected part…',repeatPart,h);button('Align / mirror parts…',arrangeParts,h);
  }
  function construction(kind){
    const d=modal(kind,'<p>Enter dimensions in '+E(scene.unit||'units')+'. Each component remains separately editable. Parts are added around the drawing origin.</p><div id="design-construction-fields"></div><p id="design-construction-error" role="alert"></p>');
    const h=$('design-construction-fields'),fields={};
    for(const [key,label,value]of [['width','Width',6],['length','Length',8],['height','Height',3],['thickness','Thickness',.2],['count',kind==='Stair builder'?'Steps':'Pier count',kind==='Stair builder'?12:4]]){
      if(key==='count'&&!['Stair builder','Bridge builder'].includes(kind))continue;
      if(kind==='Road builder'&&key==='height')continue;
      fields[key]=field(label,'number',value,h);fields[key].step='.1';fields[key].min='.01';
    }
    const roof=kind==='Room / house shell'&&dimension==='3D'?field('Include roof','checkbox','',h):null;
    button('Add construction',()=>{try{const objects=T.build(kind,dimension,{...Object.fromEntries(Object.entries(fields).map(([k,i])=>[k,i.valueAsNumber])),roof:!!roof?.checked});if(scene.objects.length+objects.length>500)throw Error('A diagram supports up to 500 parts.');remember();scene.objects.push(...objects);if(scene.category!=='Architecture')scene.view.rx=.55;scene.category='Architecture';selected=objects[0].id;update();fit();d.close();}catch(e){$('design-construction-error').textContent=e.message;}},d.querySelector('.dialog-actions'));
  }
  function repeatPart(){
    if(!scene.objects.some(o=>o.id===selected))return say('Select a part first.');
    const d=modal('Repeat selected part','<div id="design-repeat-fields"></div><p id="design-repeat-error" role="alert"></p>'),h=$('design-repeat-fields');
    const count=field('Copies','number',3,h),x=field('X spacing','number',2,h),y=field('Y spacing','number',0,h),z=dimension==='3D'?field('Z spacing','number',0,h):null;
    button('Create copies',()=>{try{const next=T.repeat(scene,selected,count.valueAsNumber,x.valueAsNumber,y.valueAsNumber,z?.valueAsNumber||0);remember();scene=next;update();fit();d.close();}catch(e){$('design-repeat-error').textContent=e.message;}},d.querySelector('.dialog-actions'));
  }
  function arrangeParts(){
    const d=modal('Align / mirror parts','<p>Choose the parts to arrange. Alignment uses their centres; mirroring reflects positions and rotations around the drawing origin.</p><div id="design-arrange-fields"></div><p id="design-arrange-error" role="alert"></p>'),h=$('design-arrange-fields');
    const boxes=scene.objects.map(o=>[field(o.label,'checkbox','',h),o]);for(const [b,o]of boxes)b.checked=o.id===selected;
    const op=select('Operation',['Align X','Align Y','Align Z','Mirror X','Mirror Y','Mirror Z'],'Align X',h,()=>{});
    button('Apply',()=>{const objects=boxes.filter(([b])=>b.checked).map(([,o])=>o);if(!objects.length){$('design-arrange-error').textContent='Choose at least one part.';return;}remember();const axis=op.value.at(-1).toLowerCase(),mean=objects.reduce((n,o)=>n+o[axis],0)/objects.length;for(const o of objects){o[axis]=op.value.startsWith('Align')?mean:-o[axis];if(op.value.startsWith('Mirror')){for(const k of ['rx','ry','rz'])if(k!=='r'+axis)o[k]=-o[k];}}update();d.close();},d.querySelector('.dialog-actions'));
  }
  for(const name of ['File','Home','Insert','Design','Layout','Teachers','2D Design','3D Design','Saved diagrams','References','Review','Tools','View','Writing']){const b=[...tabs.children].find(b=>b.textContent===name);if(b)tabs.append(b);}
  P.applyPreferences();parts();sync();ready=true;
  Promise.all([DB.draft('2D'),DB.draft('3D'),DB.draft()]).then(([two,three,old])=>{
    for(const dim of ['2D','3D']){const draft=(dim==='2D'?two:three)||(old&&modelDimension(old.file.payload)===dim?old:null);if(!draft)continue;
      const b=button('Restore last '+dim+' design',async()=>{if(await loadEnvelope(draft.file,{modified:draft.modified,libraryId:draft.libraryId}))b.remove();},actions);b.className='design-restore';b.dataset.dimension=dim;b.hidden=dim!==dimension;
    }
  }).catch(e=>status(e.message));
})();
