'use strict';
(() => {
  let opened;
  function db(){return opened ||= new Promise((resolve,reject)=>{const r=indexedDB.open('forbidden-design-library',1);r.onupgradeneeded=()=>{r.result.createObjectStore('designs',{keyPath:'id'});r.result.createObjectStore('drafts');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('The diagram library could not be opened. Export a .fte3d file to keep your work.'));});}
  async function run(store,mode,operation){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(store,mode),r=operation(tx.objectStore(store));let value;r.onsuccess=()=>value=r.result;tx.oncomplete=()=>resolve(value);tx.onerror=tx.onabort=()=>reject(tx.error||Error('Diagram storage failed. Export a file to keep your work.'));});}
  window.FTEDesignStorage={list:()=>run('designs','readonly',s=>s.getAll()),put:item=>run('designs','readwrite',s=>s.put(item)),remove:id=>run('designs','readwrite',s=>s.delete(id)),draft:(dimension)=>run('drafts','readonly',s=>s.get(dimension||'current')),saveDraft:(d,dimension)=>run('drafts','readwrite',s=>s.put(d,dimension||'current'))};
})();
