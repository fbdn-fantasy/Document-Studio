/* Offline orthographic mesh renderer. Objects retain real XYZ coordinates. */
'use strict';
(() => {
  const C=FTEDesignCore, tau=Math.PI*2;
  const mix=(c,f)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(c.slice(i,i+2),16)*f))).toString(16).padStart(2,'0')).join('');
  function meshLayer(canvas,items,ctx,W,H){
    if(canvas.fteMeshDisabled)return false;
    try{
      let state=canvas.fteMesh;
      if(!state){
        const surface=document.createElement('canvas'),gl=surface.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});
        if(!gl){canvas.fteMeshDisabled=true;return false;}
        const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};
        const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec3 p; attribute vec3 c; varying vec3 color; void main(){gl_Position=vec4(p,1.0);color=c;}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec3 color; void main(){gl_FragColor=vec4(color,1.0);}'));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Mesh shader unavailable');
        state=canvas.fteMesh={surface,gl,program,buffer:gl.createBuffer(),p:gl.getAttribLocation(program,'p'),c:gl.getAttribLocation(program,'c')};
        surface.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.fteMeshDisabled=true;});
      }
      const {surface,gl,program,buffer,p,c}=state;if(surface.width!==canvas.width||surface.height!==canvas.height){surface.width=canvas.width;surface.height=canvas.height;}
      let depth=10;for(const item of items)for(const v of item.v)depth=Math.max(depth,Math.abs(v.z)+1);
      const vertices=[];for(const item of items.filter(i=>i.fill)){const rgb=[1,3,5].map(n=>parseInt(item.c.slice(n,n+2),16)/255);for(let i=1;i<item.v.length-1;i++)for(const v of [item.v[0],item.v[i],item.v[i+1]])vertices.push(v.x/W*2-1,1-v.y/H*2,-v.z/depth,...rgb);}
      gl.viewport(0,0,surface.width,surface.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STREAM_DRAW);gl.enableVertexAttribArray(p);gl.enableVertexAttribArray(c);gl.vertexAttribPointer(p,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(c,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,vertices.length/6);ctx.drawImage(surface,0,0,W,H);return true;
    }catch{canvas.fteMeshDisabled=true;return false;}
  }
  function render(canvas,s,{selected='',terminals=false,result=null,exporting=false}={}) {
    const ctx=canvas.getContext('2d'), W=1200,H=760, scale=64*s.view.zoom, items=[],hits=[],pinHits=[];
    const rx=s.dimension==='2D'?0:s.view.rx,ry=s.dimension==='2D'?0:s.view.ry;
    const project=p=>{let [x,y,z]=s.category==='Architecture'&&s.dimension==='3D'?[p[0],p[2],-p[1]]:p;[x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];return {x:W/2+s.view.panX+x*scale,y:H/2+s.view.panY-(y*Math.cos(rx)-z*Math.sin(rx))*scale,z:y*Math.sin(rx)+z*Math.cos(rx)};};
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);
    ctx.fillStyle=exporting?'#ffffff':'#f1f4f9';ctx.fillRect(0,0,W,H);
    if(s.grid&&!exporting){
      ctx.strokeStyle='#dce2ed';ctx.lineWidth=1;
      let step=s.snapStep||1;while(step*scale<15)step*=2;while(step*scale>100)step/=2;
      if(s.dimension==='2D'){
        const ox=W/2+s.view.panX,oy=H/2+s.view.panY,gap=step*scale;
        for(let x=((ox%gap)+gap)%gap;x<W;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
        for(let y=((oy%gap)+gap)%gap;y<H;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      }else for(let i=-12;i<=12;i++){const ends=s.category==='Architecture'?[[[i,-12,0],[i,12,0]],[[-12,i,0],[12,i,0]]]:[[[i,-2,-10],[i,-2,10]],[[-12,-2,i],[12,-2,i]]];for(const a of ends){const p=project(a[0]),q=project(a[1]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}
    }
    for(const o of s.objects.filter(o=>o.visible!==false)){
      const points=[], col=o.color;
      const wp=p=>C.world(o,p), pp=p=>project(wp(p));
      function face(ps,c=col){const ws=ps.map(wp),v=ws.map(project);points.push(...v);let shade=1;if(s.dimension==='3D'){
        const a=ws[1].map((n,i)=>n-ws[0][i]),b=ws[2].map((n,i)=>n-ws[0][i]);const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],l=Math.hypot(...n)||1;
        shade=.66+.32*Math.abs((n[0]*-.3+n[1]*.65+n[2]*.65)/l);
      }items.push({v,c:mix(c,shade),z:v.reduce((a,p)=>a+p.z,0)/v.length,fill:true});}
      function line(ps,c=col,width=2){const v=ps.map(pp);points.push(...v);items.push({v,c,width,z:v.reduce((a,p)=>a+p.z,0)/v.length+.002});}
      function box(x,y,z,w,h,d,c=col){const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(a=>[x+a[0]*w/2,y+a[1]*h/2,z+a[2]*d/2]);for(const f of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[1,2,6,5],[0,4,7,3]])face(f.map(i=>p[i]),c);}
      function ellipsoid(x,y,z,w,h,d,c=col){const seg=16,rings=9,pt=(a,b)=>[x+w/2*Math.cos(a)*Math.sin(b),y+h/2*Math.cos(b),z+d/2*Math.sin(a)*Math.sin(b)];for(let j=0;j<rings;j++)for(let i=0;i<seg;i++)face([pt(i*tau/seg,j*Math.PI/rings),pt((i+1)*tau/seg,j*Math.PI/rings),pt((i+1)*tau/seg,(j+1)*Math.PI/rings),pt(i*tau/seg,(j+1)*Math.PI/rings)],c);}
      function tube(x,y,z,r,h,c=col,axis='y',r2=r,seg=20){const pt=(a,t)=>{const rr=t>0?r2:r;return axis==='x'?[x+t*h/2,y+rr*Math.cos(a),z+rr*Math.sin(a)]:[x+rr*Math.cos(a),y+t*h/2,z+rr*Math.sin(a)];};for(let i=0;i<seg;i++){const a=i*tau/seg,b=(i+1)*tau/seg;face([pt(a,-1),pt(b,-1),pt(b,1),pt(a,1)],c);}face(Array.from({length:seg},(_,i)=>pt(i*tau/seg,1)),c);face(Array.from({length:seg},(_,i)=>pt(-i*tau/seg,-1)),c);}
      const {w,h,d}=o, electrical=['source','resistor','capacitor','inductor','diode','led','switch','ground','junction'].includes(o.kind);
      if(s.dimension==='2D'&&electrical){
        const a=-w/2,b=w/2,c='#35485e';
        if(o.kind==='ground'){line([[0,0,0],[0,-.18,0]],c);for(let i=0;i<3;i++)line([[-.33+i*.1,-.18-i*.12,0],[.33-i*.1,-.18-i*.12,0]],c);}
        else if(o.kind==='junction')ellipsoid(0,0,0,.14,.14,.14,c);
        else if(o.kind==='source'){line([[a,0,0],[-.25,0,0]],c);line([[.25,0,0],[b,0,0]],c);line([[-.22,-.36,0],[-.22,.36,0]],c,3);line([[.22,-.2,0],[.22,.2,0]],c,3);}
        else if(o.kind==='resistor'){line([[a,0,0],[-w*.3,0,0],...Array.from({length:9},(_,i)=>[-w*.3+i*w*.075,i===8?0:i%2?.15:-.15,0]),[b,0,0]],c);}
        else if(o.kind==='capacitor'){line([[a,0,0],[-.10,0,0]],c);line([[.1,0,0],[b,0,0]],c);for(const x of [-.1,.1])line([[x,-.4,0],[x,.4,0]],c,3);}
        else if(o.kind==='switch'){line([[a,0,0],[-.32,0,0],[.32,o.value?0:.4,0]],c);line([[.32,0,0],[b,0,0]],c);}
        else if(o.kind==='inductor'){line([[a,0,0],...Array.from({length:65},(_,i)=>[-w*.35+i*w*.7/64,.22*Math.abs(Math.sin(i*Math.PI/16)),0]),[b,0,0]],c);}
        else{line([[a,0,0],[b,0,0]],c);face([[-.22,-.3,0],[-.22,.3,0],[.22,0,0]],o.kind==='led'?col:'#6b7e96');line([[.22,-.3,.01],[.22,.3,.01]],c,3);if(o.kind==='led')for(const dx of [0,.22])line([[dx,.35,0],[dx+.2,.55,0],[dx+.1,.52,0]],col);}
      }else switch(C.byKind[o.kind].renderKind||o.kind){
        case 'circle':face(Array.from({length:48},(_,i)=>[Math.cos(i*tau/48)*w/2,Math.sin(i*tau/48)*h/2,0]));break;
        case 'rectangle':face([[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0]]);break;
        case 'triangle':case 'polygon':{const n=o.kind==='triangle'?3:6;face(Array.from({length:n},(_,i)=>[Math.sin(i*tau/n)*w/2,Math.cos(i*tau/n)*h/2,0]));break;}
        case 'line':line([[-w/2,0,0],[w/2,0,0]],col,3);break;
        case 'sphere':case 'atom':case 'magma':case 'cell':ellipsoid(0,0,0,w,h,d);if(o.kind==='cell'){ellipsoid(.12,.1,d*.35,w*.35,h*.38,d*.5,'#9266a6');for(let i=0;i<5;i++)ellipsoid(Math.cos(i*1.3)*w*.3,Math.sin(i*1.3)*h*.28,d*.37,.28,.15,.15,'#b46b70');}break;
        case 'cylinder':tube(0,0,0,w/2,h);break;
        case 'cone':case 'volcano':tube(0,0,0,w/2,h,col,'y',o.kind==='volcano'?w*.14:.001);if(o.kind==='volcano'){tube(0,h/2+.01,0,w*.11,.06,'#d16a49');line([[0,-h/2,d*.1],[0,h/2,d*.1]],'#e98c55',5);}break;
        case 'pyramid':{const base=[[-w/2,-h/2,-d/2],[w/2,-h/2,-d/2],[w/2,-h/2,d/2],[-w/2,-h/2,d/2]];face(base);for(let i=0;i<4;i++)face([base[i],base[(i+1)%4],[0,h/2,0]]);break;}
        case 'prism':case 'wedge':{const p=[[-w/2,-h/2,-d/2],[w/2,-h/2,-d/2],[o.kind==='wedge'?w/2:0,h/2,-d/2],[-w/2,-h/2,d/2],[w/2,-h/2,d/2],[o.kind==='wedge'?w/2:0,h/2,d/2]];for(const f of [[0,1,2],[3,5,4],[0,3,4,1],[1,4,5,2],[2,5,3,0]])face(f.map(i=>p[i]));break;}
        case 'crystal':{tube(0,-h*.1,0,w*.5,h*.65,col,'y',w*.5,6);tube(0,h*.35,0,w*.5,h*.25,col,'y',.001,6);break;}
        case 'fold':case 'terrain':{
          if(['dome','basin'].includes(o.variant)){
            const n=18,sign=o.variant==='dome'?1:-1,pt=(i,j,bottom=0)=>{const x=-w/2+i*w/n,z=-d/2+j*d/n;return [x,sign*.8*Math.cos(Math.min(1,Math.hypot(x/(w/2),z/(d/2)))*Math.PI/2)-bottom,z];};
            for(let i=0;i<n;i++)for(let j=0;j<n;j++){face([pt(i,j),pt(i+1,j),pt(i+1,j+1),pt(i,j+1)]);if(!i)face([pt(i,j),pt(i,j+1),pt(i,j+1,h),pt(i,j,h)]);if(i===n-1)face([pt(i+1,j+1),pt(i+1,j),pt(i+1,j,h),pt(i+1,j+1,h)]);if(!j)face([pt(i+1,j),pt(i,j),pt(i,j,h),pt(i+1,j,h)]);if(j===n-1)face([pt(i,j+1),pt(i+1,j+1),pt(i+1,j+1,h),pt(i,j+1,h)]);}break;
          }
          const n=32,profile=x=>o.kind==='fold'?(o.variant==='syncline'?-1:1)*.6*Math.cos(x/w*tau):.25*Math.sin(x/w*9)+.24*Math.cos(x/w*17)+h*.25;
          for(let i=0;i<n;i++){const x=-w/2+i*w/n,xx=x+w/n,y=profile(x),yy=profile(xx);face([[x,y,-d/2],[xx,yy,-d/2],[xx,yy,d/2],[x,y,d/2]]);face([[x,y,d/2],[xx,yy,d/2],[xx,yy-h,d/2],[x,y-h,d/2]]);face([[xx,yy,-d/2],[x,y,-d/2],[x,y-h,-d/2],[xx,yy-h,-d/2]]);if(i===0||i===n-1){const a=i===0?x:xx,b=profile(a);face([[a,b,-d/2],[a,b,d/2],[a,b-h,d/2],[a,b-h,-d/2]]);}}
          break;
        }
        case 'torus':{const seg=32,k=8,pt=(a,b)=>[(w/2-w*.12+w*.12*Math.cos(b))*Math.cos(a),(h/2-h*.12+h*.12*Math.cos(b))*Math.sin(a),d/2*Math.sin(b)];for(let i=0;i<seg;i++)for(let j=0;j<k;j++)face([pt(i*tau/seg,j*tau/k),pt((i+1)*tau/seg,j*tau/k),pt((i+1)*tau/seg,(j+1)*tau/k),pt(i*tau/seg,(j+1)*tau/k)]);break;}
        case 'arrow':line([[-w/2,0,0],[w/2,0,0]],col,4);face([[w/2,0,0],[w/2-.35,.18,0],[w/2-.35,-.18,0]]);break;
        case 'axis':for(const [p,c] of [[[w/2,0,0],'#be6161'],[[0,h/2,0],'#579677'],[[0,0,d/2],'#6487bc']])line([[0,0,0],p],c,3);break;
        case 'bond':case 'vessel':tube(0,0,0,h/2,w,col,'x');break;
        case 'spring':case 'inductor':{const p=Array.from({length:121},(_,i)=>[-w*.4+w*.8*i/120,Math.sin(i*tau/15)*h*.3,Math.cos(i*tau/15)*d*.3]);line([[-w/2,0,0],...p,[w/2,0,0]],col,4);break;}
        case 'resistor':tube(0,0,0,h*.42,w*.65,col,'x');line([[-w/2,0,0],[w/2,0,0]],'#929ead',3);for(const [x,c] of [[-.18,'#665044'],[-.06,'#242c39'],[.08,'#9c544a'],[.23,'#ceb263']])tube(w*x,0,0,h*.44,w*.035,c,'x');break;
        case 'source':tube(0,0,0,h/2,w*.75,col,'x');tube(-w*.4,0,0,h*.25,w*.08,'#c5ced8','x');tube(w*.37,0,0,h*.5,w*.12,'#728092','x');line([[-w/2,0,0],[w/2,0,0]],'#8493a6',3);break;
        case 'capacitor':tube(0,.12,0,d/2,h*.7);face([[-.22,h*.47,d*.3],[.22,h*.47,d*.3],[.22,h*.47,-d*.3],[-.22,h*.47,-d*.3]],'#c4d1db');for(const side of [-1,1])line([[side*w/2,0,0],[side*w*.16,-h*.33,0]],'#7e8a9b',3);break;
        case 'diode':tube(0,0,0,h/2,w*.6,col,'x');tube(w*.19,0,0,h*.52,w*.06,'#d5dce7','x');line([[-w/2,0,0],[w/2,0,0]],'#8c99aa',3);break;
        case 'led':ellipsoid(0,.15,0,w*.45,h,d,result?.parts[o.id]?.current>.001?'#f3bd4f':col);for(const side of [-1,1])line([[side*w/2,0,0],[side*w*.12,-h*.35,0],[side*w*.12,.12,0]],'#8c99aa',3);break;
        case 'switch':box(0,-.12,0,w*.7,h*.5,d);line([[-w/2,0,0],[-w*.25,.08,0],[w*.25,o.value?.08:.5,0]],'#b5c4d2',5);line([[w*.25,.08,0],[w/2,0,0]],'#aabac9',4);break;
        case 'ground':line([[0,0,0],[0,-.2,0]],col,2);for(let i=0;i<3;i++)line([[-.35+i*.1,-.2-i*.13,0],[.35-i*.1,-.2-i*.13,0]],col,2);break;
        case 'junction':ellipsoid(0,0,0,w,h,d);break;
        case 'board':case 'perfboard':case 'breadboard':{
          box(0,0,0,w,h,d);const front=d/2+.015;
          if(o.kind==='board'){
            const esp=o.variant==='esp32',nano=o.variant==='nano';box(0,0,front+.12,w*.35,h*.45,.22,esp?'#b3c2cd':'#3f4958');box(-w*.42,h*.19,front+.12,w*.2,h*.29,.28,'#c1cbd7');
            if(!esp)box(w*.34,-h*.22,front+.1,w*.13,h*.17,.2,'#48515f');
            if(esp)for(let j=0;j<4;j++)line([[-w*.14+j*.08,h*.28,front+.25],[-w*.14+j*.08,h*.42,front+.25]],'#bdad79',2);
            for(const side of [-1,1]){box(0,side*h*.42,front+.08,w*.78,.14,.18,'#3e4b5a');for(let i=0;i<(nano?12:10);i++)box(-w*.35+i*w*.7/(nano?11:9),side*h*.42,front+.19,.055,.075,.06,'#d9bd79');}
            for(let i=0;i<5;i++)box(w*.13+i*w*.04,h*.13,front+.02,.06,.14,.06,'#b2ac8b');
          }else{
            const rows=o.kind==='breadboard'?8:7,cols=18;
            if(o.kind==='breadboard'){box(0,0,front,w*.95,.16,.025,'#b6b8b5');for(const side of [-1,1])line([[-w*.45,side*h*.43,front+.02],[w*.45,side*h*.43,front+.02]],side>0?'#d57970':'#6f94b9',2);}
            for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)box(-w*.44+i*w*.88/(cols-1),-h*.33+j*h*.66/(rows-1)+(j<rows/2?-.09:.09),front+.015,.045,.045,.01,'#697383');
          }
          break;
        }
        case 'chip':case 'header':case 'connector':case 'transistor':box(0,0,0,w*.75,h*.8,d);for(const p of C.pins(o))line([p.p,[p.p[0]*.65,p.p[1],d*.3]],'#c7bd91',3);if(o.kind==='chip')ellipsoid(-w*.25,h*.2,d*.55,.1,.1,.03,'#aab1bf');break;
        case 'transformer':box(0,0,0,w,h,d,'#667384');for(const side of [-1,1])for(let i=0;i<8;i++)tube(side*w*.25,-h*.35+i*h*.1,0,w*.18,h*.045,col);break;
        case 'motor':tube(0,0,0,h/2,w*.75,col,'x');tube(w*.42,0,0,h*.1,w*.4,'#687585','x');break;
        case 'bulb':ellipsoid(0,.15,0,w*.65,h*.8,d);box(0,-h*.3,0,w*.3,h*.3,d*.6,'#91a0ad');break;
        case 'solar':box(0,0,0,w,h,d);for(let i=1;i<6;i++)line([[-w/2+i*w/6,-h/2,d*.55],[-w/2+i*w/6,h/2,d*.55]],'#b8cbd9',1);for(let j=1;j<4;j++)line([[-w/2,-h/2+j*h/4,d*.55],[w/2,-h/2+j*h/4,d*.55]],'#b8cbd9',1);break;
        case 'beaker':case 'testtube':case 'flask':{const r=w/2; tube(0,-h*.15,0,r,h*.7,col,'y',o.kind==='flask'?r*.22:r);if(o.kind==='flask')tube(0,h*.31,0,r*.22,h*.3);const rr=o.kind==='flask'?r*.22:r;line(Array.from({length:33},(_,i)=>[Math.cos(i*tau/32)*rr,h*.49,Math.sin(i*tau/32)*rr]),'#4b879f',2);break;}
        case 'lens':ellipsoid(0,0,0,w,h,d);break;
        case 'bone':tube(0,0,0,w*.22,h*.7);for(const side of [-1,1])for(const sign of [-1,1])ellipsoid(sign*w*.2,side*h*.36,0,w*.55,h*.24,d);break;
        case 'neuron':ellipsoid(-w*.2,0,0,w*.3,h*.45,d);line([[-w*.2,0,0],[w*.5,0,0]],col,4);for(let i=0;i<7;i++){const a=i*tau/7;line([[-w*.2,0,0],[-w*.2+Math.cos(a)*w*.3,Math.sin(a)*h*.35,.05],[-w*.2+Math.cos(a+.2)*w*.4,Math.sin(a+.2)*h*.5,0]],col,2);}break;
        case 'door':
          if(s.dimension==='2D'){line([[-w/2,0,0],[-w/2,w,0]],col,3);line(Array.from({length:25},(_,i)=>[-w/2+w*Math.cos(i*Math.PI/48),w*Math.sin(i*Math.PI/48),0]),col,1);}
          else{box(-w/2,0,0,.06,h,d);box(w/2,0,0,.06,h,d);box(0,0,d/2,w,h,.08);box(-w*.25,w*.25,0,w*.5,.06,d*.95);}break;
        case 'window':box(0,0,0,w,h,d,'#bedde6');for(const x of [-w/2,0,w/2])box(x,0,0,.04,h+.03,d+.03,col);break;
        case 'roof':{const p=[[-w/2,-h/2,-d/2],[w/2,-h/2,-d/2],[0,-h/2,d/2],[-w/2,h/2,-d/2],[w/2,h/2,-d/2],[0,h/2,d/2]];for(const f of [[0,1,2],[3,5,4],[0,3,4,1],[1,4,5,2],[2,5,3,0]])face(f.map(i=>p[i]));break;}
        case 'column':{const top=[],bottom=[];for(let i=0;i<24;i++){const a=i*tau/24,b=(i+1)*tau/24,p=[Math.cos(a)*w/2,Math.sin(a)*h/2],q=[Math.cos(b)*w/2,Math.sin(b)*h/2];face([[...p,-d/2],[...q,-d/2],[...q,d/2],[...p,d/2]]);top.push([...p,d/2]);bottom.push([...p,-d/2]);}face(top);face(bottom);break;}
        case 'stairs':for(let i=0;i<10;i++)box(0,-h/2+(i+.5)*h/10,-d/2+(i+1)*d/20,w,h/10,(i+1)*d/10);break;
        case 'road':box(0,0,0,w,h,d);for(let i=0;i<10;i++)line([[-w/2+(i+.15)*w/10,0,d/2+.01],[-w/2+(i+.65)*w/10,0,d/2+.01]],'#f5eed2',2);for(const side of [-1,1])line([[-w/2,side*h*.43,d/2+.01],[w/2,side*h*.43,d/2+.01]],'#eeeae1',2);break;
        case 'railing':box(0,0,d/2,w,h,.07);for(let i=0;i<=8;i++)box(-w/2+i*w/8,0,0,.07,h,d);break;
        case 'tree':box(0,0,-d*.25,w*.15,h*.15,d*.5,'#937258');ellipsoid(0,0,d*.15,w,h,d*.7);break;
        case 'dimension':line([[-w/2,0,0],[w/2,0,0]],col,1);for(const side of [-1,1]){line([[side*w/2,-h,0],[side*w/2,h,0]],col,1);line([[side*w/2,0,0],[side*(w/2-.15),.08,0]],col,1);line([[side*w/2,0,0],[side*(w/2-.15),-.08,0]],col,1);}break;
        case 'wave':line(Array.from({length:81},(_,i)=>[-w/2+i*w/80,Math.sin(i*Math.PI/20)*h/2,0]),col,2);break;
        case 'stand':box(0,-h/2,0,w,.12,d);box(0,0,0,.1,h,.1);line([[0,h*.25,0],[w*.7,h*.25,0]],col,3);break;
        case 'angle':line([[w/2,0,0],[0,0,0],[w*.35,h*.35,0]],col,2);line(Array.from({length:25},(_,i)=>[Math.cos(i*Math.PI/96)*w*.25,Math.sin(i*Math.PI/96)*h*.25,0]),col,1);break;
        case 'fuse':box(0,0,0,w*.6,h,d);line([[-w/2,0,d*.6],[w/2,0,d*.6]],col,2);break;
        case 'meter':ellipsoid(0,0,0,w,h,d);line([[-w*.25,-h*.2,d*.55],[w*.2,h*.25,d*.55]],'#344c67',3);break;
        case 'socket':box(0,0,0,w,h,d);for(const x of [-w*.2,w*.2])box(x,0,d*.55,w*.1,h*.3,.02,'#39495b');break;
        case 'label':break;
        default:box(0,0,0,w,h,d);break;
      }
      const anchor=pp([0,h/2+.1,d/2]);
      if(points.length){const x1=Math.min(...points.map(p=>p.x)),y1=Math.min(...points.map(p=>p.y)),x2=Math.max(...points.map(p=>p.x)),y2=Math.max(...points.map(p=>p.y));hits.push({id:o.id,x1,y1,x2,y2,z:pp([0,0,0]).z,anchor,o});}
      else hits.push({id:o.id,x1:anchor.x-25,y1:anchor.y-12,x2:anchor.x+25,y2:anchor.y+12,z:anchor.z,anchor,o});
      if(terminals&&!exporting)for(const p of C.pins(o))pinHits.push({...pp(p.p),object:o.id,pin:p.name});
    }
    for(const wire of s.wires){const a=C.endpoint(s,wire.a),b=C.endpoint(s,wire.b);if(!a||!b)continue;const z=Math.max(a[2],b[2])+.12,mid=wire.bend??(a[0]+b[0])/2;
      const v=[a,[a[0],a[1],z],[mid,a[1],z],[mid,b[1],z],[b[0],b[1],z],b].map(project);items.push({v,c:wire.id===selected?'#ac6ee9':wire.color,width:wire.id===selected?5:3,z:v.reduce((n,p)=>n+p.z,0)/v.length+.01,wire:wire.id});
    }
    items.sort((a,b)=>a.z-b.z);
    const depthRendered=meshLayer(canvas,items,ctx,W,H);
    for(const item of items){if(item.fill&&depthRendered)continue;ctx.beginPath();item.v.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(item.fill){ctx.closePath();ctx.fillStyle=item.c;ctx.fill();ctx.strokeStyle=mix(item.c,.92);ctx.lineWidth=.5;ctx.stroke();}else{ctx.strokeStyle=item.c;ctx.lineWidth=item.width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}}
    if(!exporting){const hit=hits.find(h=>h.id===selected);if(hit){ctx.strokeStyle='#9363d6';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(hit.x1-6,hit.y1-6,hit.x2-hit.x1+12,hit.y2-hit.y1+12);ctx.setLineDash([]);}}
    const occupied=[];ctx.font='14px Arial';
    for(const hit of hits.filter(h=>s.labels||h.o.kind==='dimension'||h.o.kind==='label')){const {o,anchor}=hit,simulation=result?.parts[o.id];let name=o.kind==='dimension'?o.w.toFixed(2)+' '+(s.unit||'units'):o.label;if(simulation)name+=' · '+(simulation.current*1000).toFixed(2)+' mA';if(!name)continue;
      const width=Math.min(290,ctx.measureText(name).width+14);let x=Math.max(8,Math.min(W-width-8,anchor.x-width/2)),y=Math.max(50,Math.min(H-35,anchor.y-28));
      for(let k=0;k<12&&occupied.some(r=>x<r.x+r.w&&x+width>r.x&&y<r.y+22&&y+22>r.y);k++)y+=25;
      if(y>H-20)continue;occupied.push({x,y,w:width});ctx.strokeStyle='#a9b4c7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);ctx.lineTo(x+width/2,y+20);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.94)';ctx.fillRect(x,y,width,22);ctx.fillStyle='#39465d';ctx.fillText(name,x+7,y+16,width-14);
    }
    for(const p of pinHits){ctx.beginPath();ctx.arc(p.x,p.y,5,0,tau);ctx.fillStyle='#f7e4a8';ctx.fill();ctx.strokeStyle='#7d6540';ctx.lineWidth=1.5;ctx.stroke();}
    if(exporting){ctx.fillStyle='#35435b';ctx.font='bold 22px Arial';ctx.fillText(s.title,24,32,1100);ctx.font='12px Arial';ctx.fillStyle='#75839b';ctx.fillText(s.category+' · '+s.dimension+' · Drawing units: '+(s.unit||'units')+' · Not to printed scale',24,H-17);}
    canvas.fteDesignHits=hits;canvas.fteDesignPins=pinHits;
    return {hits,pins:pinHits,project,wirePaths:items.filter(i=>i.wire)};
  }
  function release(canvas){canvas.fteMesh?.gl.getExtension('WEBGL_lose_context')?.loseContext();delete canvas.fteMesh;}
  window.FTEDesignRenderer={render,release};
})();
