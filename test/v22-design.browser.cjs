'use strict';
// Run after staging web assets + npm run build. Requires Playwright and Chromium.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml'};
(async()=>{const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(b);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;try{browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('pageerror',e.message);});
 await page.addInitScript(()=>{window.print=()=>{window.__printCalled=true;};window.__TAURI_INTERNALS__={transformCallback:()=>1,invoke:async(command,params)=>{if(command!=='desktop_command')return 1;switch(params.method){case 'init':return {settings:{autosave:false},startup:false,recoveryAvailable:false};case 'dictionaries':return {items:[{id:'en-US',label:'English (US)'}],active:'en-US'};case 'fonts':case 'recoveries':case 'recent':return [];case 'documentInfo':return {path:'',name:''};case 'open':case 'recentFile':return {name:'transport.txt',bytes:[72,101,108,108,111]};case 'runImport':return {name:'transport.docx',docx:[80,75,3,4]};case 'spell':return params.args[0].filter(w=>w==='teh');case 'spellSuggestions':return params.args[0]==='teh'?['the']:[];case 'addPersonal':return true;default:return null;}}};});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);const editor=page.frameLocator('iframe[title="Document Studio editor"]');await editor.locator('#pages-container > .sheet').first().waitFor();const frame=page.frames().find(f=>f.url().endsWith('/editor.html'));await frame.waitForFunction(()=>window.FTESurfaceFiles&&window.FTEPro);
 await frame.waitForFunction(()=>window.FTEDesignWorkspace&&window.FTEDesignTools);
 page.on('dialog',d=>d.type()==='prompt'?d.accept('V22 renamed blueprint'):d.accept());
 const tab=name=>editor.locator('#tabs').getByRole('button',{name,exact:true});
 const clickTab=async name=>{await frame.evaluate(n=>clickTab(n),name);await frame.evaluate(()=>document.getElementById('tabs').dispatchEvent(new Event('click')));};
 const button=name=>editor.getByRole('button',{name,exact:true});
 const checks=[];
 const menus=await frame.evaluate(()=>Array.from(tabs.children,b=>b.textContent));
 for(const name of ['Medical','Geology','Physics','Chemistry','Mathematics','Electrical'])assert(!menus.includes(name),name+' premade tab removed');
 for(const name of ['Teachers','2D Design','3D Design','Saved diagrams'])assert(menus.includes(name));checks.push('main navigation');assert.equal(await frame.evaluate(()=>FTEPro.commands.some(c=>/^(Physics diagram |Nuclear physics diagram|Astrophysics gravity )/.test(c.keywords||''))),false,'No premade diagrams in command search');
 await clickTab('2D Design');await editor.locator('#design-subjects').getByRole('button',{name:'Architecture',exact:true}).click();
 await button('Room / house shell').click();await editor.locator('#design-construction-fields').getByLabel('Width',{exact:true}).fill('9');await button('Add construction').click();
 assert.equal(await frame.evaluate(()=>FTEDesignWorkspace.scene.objects.filter(o=>o.kind==='wall').length),5);
 assert.equal(await frame.evaluate(()=>FTEDesignWorkspace.scene.category),'Architecture');
 await button('Draw wall').click();const canvas=editor.locator('#design-canvas'),box=await canvas.boundingBox();await page.mouse.click(box.x+box.width*.3,box.y+box.height*.3);await page.mouse.click(box.x+box.width*.6,box.y+box.height*.3);
 assert.equal(await frame.evaluate(()=>FTEDesignWorkspace.scene.objects.filter(o=>o.kind==='wall').length),6);
 await button('Undo').click();assert.equal(await frame.evaluate(()=>FTEDesignWorkspace.scene.objects.filter(o=>o.kind==='wall').length),5);await button('Redo').click();checks.push('blueprint builder, pointer wall drawing and undo/redo');
 await editor.locator('#design-object-list').selectOption({index:0});await button('Repeat selected part…').click();await editor.locator('#design-repeat-fields').getByLabel('Copies',{exact:true}).fill('2');await button('Create copies').click();
 assert.equal(await frame.evaluate(()=>FTEDesignWorkspace.scene.objects.length),9);checks.push('repeat parts');
 await editor.locator('#design-actions').getByRole('button',{name:'Save diagram',exact:true}).click();await editor.locator('#design-save-fields').getByLabel('Diagram name',{exact:true}).fill('V22 blueprint');await button('Save to library').click();
 assert.equal(await frame.evaluate(async()=>(await FTEDesignStorage.list()).length),1);
 await button('Copy to other dimension').click();assert.equal(await frame.evaluate(()=>FTEDesignWorkspace.dimension),'3D');assert.equal(await frame.evaluate(()=>FTEDesignWorkspace.scene.objects.length),9);
 await editor.locator('#design-subjects').getByRole('button',{name:'Architecture',exact:true}).click();await button('Bridge builder').click();await button('Add construction').click();assert.equal(await frame.evaluate(()=>{const s=FTEDesignWorkspace.scene,c=document.createElement('canvas');c.width=1200;c.height=760;const r=FTEDesignRenderer.render(c,s),a=r.project([0,0,0]),b=r.project([0,0,3]);FTEDesignRenderer.release(c);return b.y<a.y && Math.abs(b.x-a.x)<.001;}),true,'Architecture Z elevation is vertical');
 await editor.locator('#design-actions').getByRole('button',{name:'Save diagram',exact:true}).click();await editor.locator('#design-save-fields').getByLabel('Diagram name',{exact:true}).fill('V22 bridge');await button('Save to library').click();
 assert.equal(await frame.evaluate(async()=>(await FTEDesignStorage.list()).length),2);checks.push('2D/3D copy and independent save');
 fs.mkdirSync(path.join(__dirname,'../reports/v22'),{recursive:true});await page.screenshot({path:path.join(__dirname,'../reports/v22/architecture-3d.png')});
 for(const subject of ['Medical','Geology','Physics','Chemistry','Mathematics','Electrical']){
   await editor.locator('#design-subjects').getByRole('button',{name:subject,exact:true}).click();assert(await editor.locator('#design-parts button').count()>=10);await editor.locator('#design-parts button').last().click();
 }checks.push('all profession palettes add components');
 await clickTab('Saved diagrams');await button('Browse saved diagrams').click();await editor.locator('.design-library-card').nth(1).waitFor();assert.equal(await editor.locator('.design-library-card').count(),2);
 await editor.locator('#design-library-controls').getByLabel('Dimension',{exact:true}).selectOption('2D');assert.equal(await editor.locator('.design-library-card').count(),1);
 await editor.locator('.design-library-card').getByRole('button',{name:'Rename',exact:true}).click();await editor.getByText('V22 renamed blueprint',{exact:true}).waitFor();
 await editor.locator('.design-library-card').getByRole('button',{name:'Open in 2D Design',exact:true}).click();assert.equal(await frame.evaluate(()=>FTEDesignWorkspace.scene.title),'V22 renamed blueprint');checks.push('library filtering, rename and load');
 await editor.locator('#design-actions').getByRole('button',{name:'Teacher question',exact:true}).click();await editor.getByRole('heading',{name:'Visual question builder',exact:true}).waitFor();assert.equal(await frame.evaluate(()=>currentTab),'Teachers');
 assert.equal(await editor.locator('dialog[open] canvas').count(),1);await editor.locator('dialog[open]').getByRole('button',{name:'Close',exact:true}).click();checks.push('user-created teacher labeling question');
 // Every grouped teacher tool must open its workspace without a runtime error.
 const teachers=await editor.getByRole('combobox',{name:'Subject Tools',exact:true}).locator('option').allTextContents();assert(!teachers.includes('Anatomy labeling'));assert(teachers.includes('Label my saved diagram'));
 for(const group of ['Assessments','Lesson Planning','Subject Tools','Classroom Resources','Student Records']){
   const pick=editor.getByRole('combobox',{name:group,exact:true});const choices=await pick.locator('option').evaluateAll(os=>os.map(o=>o.value).filter(Boolean));
   for(const name of choices){await pick.selectOption(name);await page.waitForTimeout(70);assert(await editor.locator('dialog[open]').count()>0,'Teacher tool opens: '+name);await frame.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));}
 }checks.push('all teacher menu entry points');
 await page.reload();await editor.locator('#pages-container > .sheet').first().waitFor();const reloaded=page.frames().find(f=>f.url().endsWith('/editor.html'));await reloaded.waitForFunction(()=>window.FTEDesignWorkspace);
 const saved=await reloaded.evaluate(()=>FTEDesignStorage.list());assert.equal(saved.length,2);assert(saved.some(x=>x.file.title==='V22 renamed blueprint'));checks.push('saved-library persistence after reload');
 await reloaded.evaluate(()=>FTEDesignWorkspace.library());await editor.getByLabel('Search saved diagrams',{exact:true}).fill('no match');assert.equal(await editor.locator('.design-library-card').count(),0);await editor.getByLabel('Search saved diagrams',{exact:true}).fill('bridge');assert.equal(await editor.locator('.design-library-card').count(),1);
 await page.screenshot({path:path.join(__dirname,'../reports/v22/saved-diagrams.png')});checks.push('saved-library search');
 // Exports remain editable, and older user-created libraries import only once.
 await reloaded.evaluate(()=>{download=async(blob,name)=>{window.v22Export={text:await blob.text(),name};return true;};});
 await editor.locator('.design-library-card').getByRole('button',{name:'Export file',exact:true}).click();await reloaded.waitForFunction(()=>window.v22Export);
 const exported=await reloaded.evaluate(()=>window.v22Export);assert(exported.name.endsWith('.fte3d'));assert.equal(JSON.parse(exported.text).payload.category,'Architecture');
 const chooser=page.waitForEvent('filechooser');await button('Import file to library…').click();await (await chooser).setFiles({name:'backup.fte3d',mimeType:'application/json',buffer:Buffer.from(exported.text)});
 await reloaded.waitForFunction(async()=>(await FTEDesignStorage.list()).length===3);checks.push('editable file export and import');
 await reloaded.evaluate(()=>FTEPro.diagramLibrary.write([{id:'older-test',name:'My older physics sketch',subject:'Physics',spec:{type:'diagram',subject:'Physics',title:'Old sketch',width:560,dimension:'2D',nodes:[],lines:[]},thumbnail:''}]));
 await button('Import older saved diagrams').click();await reloaded.waitForFunction(async()=>(await FTEDesignStorage.list()).length===4);await button('Import older saved diagrams').click();await page.waitForTimeout(100);assert.equal(await reloaded.evaluate(async()=>(await FTEDesignStorage.list()).length),4);
 await editor.getByLabel('Search saved diagrams',{exact:true}).fill('My older');await editor.locator('.design-library-card').getByRole('button',{name:'Delete',exact:true}).click();await reloaded.waitForFunction(async()=>(await FTEDesignStorage.list()).length===3);assert.equal(await reloaded.evaluate(()=>FTEPro.diagramLibrary.read().length),1);checks.push('older saved-diagram migration and library deletion');
 const rendered=await reloaded.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=380;c.fteMeshDisabled=true;let count=0;for(const dim of ['2D','3D'])for(const p of FTEDesignTools.definitions){const s=FTEDesignCore.scene(p[2],'Part rendering',dim);s.objects=[FTEDesignCore.object(p[0])];if(FTEDesignRenderer.render(c,s).hits.length!==1)throw Error('No geometry for '+p[0]);count++;}return count;});assert(rendered>=100);checks.push('all new professional component renderers in both dimensions');
 assert.deepEqual(errors,[]);const report={status:'passed',checks};fs.writeFileSync(path.join(__dirname,'../reports/v22/browser-tests.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
