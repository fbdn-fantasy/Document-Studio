/* Modified nodal analysis with piecewise-linear diodes and backward-Euler C/L.
   Terminal A -> B is the positive voltage/current reference for every part. */
'use strict';
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./pro-design-core.js'):root.FTEDesignCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.FTECircuit=api;})(globalThis,function(C){
  const supported=new Set(['source','resistor','capacitor','inductor','diode','led','switch','ground','junction']);
  function linear(A,b){
    const n=b.length, m=A.map((r,i)=>[...r,b[i]]);
    for(let k=0;k<n;k++){
      let p=k;for(let i=k+1;i<n;i++)if(Math.abs(m[i][k])>Math.abs(m[p][k]))p=i;
      if(Math.abs(m[p][k])<1e-14)throw Error('No unique solution. Check floating terminals, shorted sources, and loops of ideal voltage sources.');
      [m[k],m[p]]=[m[p],m[k]];
      for(let i=k+1;i<n;i++){const f=m[i][k]/m[k][k];if(!f)continue;for(let j=k;j<=n;j++)m[i][j]-=f*m[k][j];}
    }
    const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let v=m[i][n];for(let j=i+1;j<n;j++)v-=m[i][j]*x[j];x[i]=v/m[i][i];}
    if(x.some(v=>!Number.isFinite(v)||Math.abs(v)>1e12))throw Error('Unbounded result. Check source values and connections.');
    return x;
  }
  function compile(scene){
    C.validate(scene);if(scene.objects.length>100)throw Error('Simulation supports up to 100 components.');
    const electrical=scene.objects.filter(o=>C.pins(o).length), connected=new Set(scene.wires.flatMap(w=>[w.a.object,w.b.object]));
    const unsupported=electrical.filter(o=>!supported.has(o.kind)&&connected.has(o.id));
    if(unsupported.length)throw Error('Visual-only parts are wired into this circuit: '+unsupported.map(o=>o.label).join(', ')+'. Use supported discrete parts for simulation.');
    const objects=electrical.filter(o=>supported.has(o.kind));
    if(!objects.some(o=>o.kind==='source'))throw Error('Add a DC voltage source.');
    const parent=new Map(), key=(id,p)=>id+':'+p;
    objects.forEach(o=>C.pins(o).forEach(p=>parent.set(key(o.id,p.name),key(o.id,p.name))));
    function find(a){if(!parent.has(a))return null;let r=a;while(parent.get(r)!==r)r=parent.get(r);while(parent.get(a)!==a){const next=parent.get(a);parent.set(a,r);a=next;}return r;}
    function join(a,b){a=find(a);b=find(b);if(a&&b)parent.set(a,b);}
    scene.wires.forEach(w=>join(key(w.a.object,w.a.pin),key(w.b.object,w.b.pin)));
    const grounds=objects.filter(o=>o.kind==='ground');if(!grounds.length)throw Error('Add Ground and wire it to a reference terminal (usually source B).');
    grounds.slice(1).forEach(o=>join(key(grounds[0].id,'0'),key(o.id,'0')));
    const ref=find(key(grounds[0].id,'0')), roots=[...new Set([...parent.keys()].map(find))].filter(r=>r!==ref);
    const index=new Map(roots.map((r,i)=>[r,i]));index.set(ref,-1);
    const node=(o,p)=>index.get(find(key(o.id,p)));
    const elements=objects.filter(o=>!['ground','junction'].includes(o.kind)).map(o=>({...o,a:node(o,'A'),b:node(o,'B')}));
    const sources=elements.filter(o=>o.kind==='source');
    if(sources.some(o=>o.a===o.b))throw Error('A voltage source is short-circuited. Remove the direct wire across its terminals.');
    return {elements,sources,n:roots.length,node,objects,ignored:scene.objects.filter(o=>!supported.has(o.kind)).map(o=>o.label)};
  }
  function solveCompiled(net, options={}){
    const {elements,sources,n}=net, dt=options.dt||0, previous=options.previous||{}, count=n+sources.length;
    const diodes=elements.filter(o=>o.kind==='diode'||o.kind==='led');
    let active=Object.fromEntries(diodes.map(o=>[o.id,previous[o.id]?.on||false])), solution,models,stable=false;
    for(let iteration=0;iteration<80;iteration++){
      const A=Array.from({length:count},()=>Array(count).fill(0)),rhs=Array(count).fill(0);models={};
      const stamp=(a,b,g,i)=>{if(a>=0){A[a][a]+=g;rhs[a]-=i;}if(b>=0){A[b][b]+=g;rhs[b]+=i;}if(a>=0&&b>=0){A[a][b]-=g;A[b][a]-=g;}};
      for(const o of elements){let g=0,i=0;
        if(o.kind==='source'){
          const k=n+sources.findIndex(s=>s.id===o.id);
          if(o.a>=0){A[o.a][k]+=1;A[k][o.a]+=1;}if(o.b>=0){A[o.b][k]-=1;A[k][o.b]-=1;}rhs[k]=o.value;continue;
        }
        if(o.kind==='resistor')g=1/o.value;
        if(o.kind==='switch')g=o.value?1/0.01:1e-12;
        if(o.kind==='capacitor'){g=dt?o.value/dt:1e-12;i=-g*(dt?(previous[o.id]?.voltage||0):0);}
        if(o.kind==='inductor'){g=dt?dt/o.value:1e6;i=dt?(previous[o.id]?.current||0):0;}
        if(o.kind==='diode'||o.kind==='led'){g=active[o.id]?1/2:1e-12;i=active[o.id]?-g*o.value:0;}
        models[o.id]={g,i};stamp(o.a,o.b,g,i);
      }
      solution=linear(A,rhs);const v=k=>k<0?0:solution[k];stable=true;
      for(const o of diodes){const voltage=v(o.a)-v(o.b), on=active[o.id]?voltage>=o.value-1e-8:voltage>o.value+1e-8;if(on!==active[o.id]){active[o.id]=on;stable=false;}}
      if(stable)break;
    }
    if(!stable)throw Error('Diode model did not converge. Check circuit topology and add series resistance.');
    const voltage=k=>k<0?0:solution[k], parts={};
    for(const o of elements){const v=voltage(o.a)-voltage(o.b),i=o.kind==='source'?solution[n+sources.findIndex(s=>s.id===o.id)]:models[o.id].g*v+models[o.id].i;parts[o.id]={voltage:v,current:i,power:v*i,on:!!active[o.id]};}
    const terminals={};net.objects.forEach(o=>C.pins(o).forEach(p=>terminals[o.id+':'+p.name]=voltage(net.node(o,p.name))));
    return {parts,terminals,ignored:net.ignored,method:dt?'Backward Euler transient':'DC operating point'};
  }
  function dc(s){return solveCompiled(compile(s));}
  function transient(s,duration=1,steps=200){
    if(!Number.isFinite(duration)||duration<=0||duration>10000||!Number.isInteger(steps)||steps<2||steps>2000)throw Error('Use a duration above 0 and at most 10,000 s, and 2–2,000 steps.');
    const net=compile(s), dt=duration/steps, samples=[];let previous={},result;
    for(let k=1;k<=steps;k++){result=solveCompiled(net,{dt,previous});previous=result.parts;samples.push({time:k*dt,parts:result.parts});}
    return {...result,samples,duration,dt,initialConditions:'Capacitor voltages and inductor currents start at zero.'};
  }
  return {supported:[...supported],compile,dc,transient};
});
