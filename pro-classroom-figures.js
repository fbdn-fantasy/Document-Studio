'use strict';
(()=>{
 const P=FTEPro,w=820,h=470;
 function records(m){return (Object.values(m.values)[0]||'').split('\n').map(s=>s.split('|').map(v=>v.trim())).filter(r=>r[0]&&r[1]);}
 function render(canvas,m,ctx=canvas.getContext('2d')){
   const rows=records(m),targets=[];ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.lineJoin='round';ctx.lineCap='round';ctx.textBaseline='middle';ctx.textAlign='center';
   const named=k=>P.callouts.mode(m,k)==='auto';
   if(m.kind==='Concept map'){
     const edges=rows.filter(r=>r[2]),names=[...new Set(edges.flatMap(r=>[r[0],r[2]]))];
     const pos=new Map(names.map((n,i)=>{const t=2*Math.PI*i/Math.max(1,names.length)-Math.PI/2;return [w/2+Math.cos(t)*232,h/2+Math.sin(t)*148];}).map((p,i)=>[names[i],p]));
     edges.forEach(([from,label,to])=>{const a=pos.get(from),b=pos.get(to),angle=Math.atan2(b[1]-a[1],b[0]-a[0]),x=b[0]-54*Math.cos(angle),y=b[1]-20*Math.sin(angle);
       ctx.strokeStyle='#837389';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#66546f';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-9*Math.cos(angle-.42),y-9*Math.sin(angle-.42));ctx.lineTo(x-9*Math.cos(angle+.42),y-9*Math.sin(angle+.42));ctx.fill();
       const mid=a.map((v,i)=>(v+b[i])/2),key=JSON.stringify([from,label,to]);targets.push({key,name:label,x:mid[0],y:mid[1]});
       if(named(key)){ctx.fillStyle='#50445a';ctx.font='14px Arial';ctx.fillText(label,mid[0],mid[1]-9,145);}
     });
     for(const [name,[x,y]] of pos){const key='node/'+name;ctx.fillStyle='#eee7f6';ctx.strokeStyle='#867495';ctx.lineWidth=1.4;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-62,y-18,124,36,8);else ctx.rect(x-62,y-18,124,36);ctx.fill();ctx.stroke();targets.push({key,name,x,y});if(named(key)){ctx.fillStyle='#342a3c';ctx.font='600 14px Arial';ctx.fillText(name,x,y,116);}}
   }else{
     const y=h/2;ctx.strokeStyle='#7c6a86';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(65,y);ctx.lineTo(w-65,y);ctx.stroke();
     rows.forEach(([date,event],i)=>{const x=85+(w-170)*(rows.length===1?.5:i/(rows.length-1)),sign=i%2?1:-1,py=y+sign*68,k=JSON.stringify([date,event]);
       ctx.strokeStyle='#9b8f9f';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,py);ctx.stroke();ctx.beginPath();ctx.arc(x,y,4.5,0,2*Math.PI);ctx.fillStyle='#6f5c7a';ctx.fill();
       ctx.font='600 13px Arial';ctx.fillStyle='#493d50';ctx.fillText(date,x,y-sign*18,100);targets.push({key:k,name:event,x,y:py});
       if(named(k)){ctx.font='14px Arial';ctx.fillText(event,x,py+sign*13,Math.min(136,640/Math.max(2,rows.length)));}
     });
   }
   P.callouts.draw(canvas,m,targets,w,h,{context:ctx});
 }
 function attach(host,state,read,fields){
   const canvas=document.createElement('canvas');P.callouts.resize(canvas,w,h);canvas.style.cssText='display:block;width:100%;background:white';host.append(canvas);
   const draw=()=>render(canvas,{...read(),calloutOverrides:state.calloutOverrides});
   P.callouts.attach(canvas,()=>state,draw,host,'Teachers');Object.values(fields).forEach(f=>f.addEventListener('input',draw));draw();
 }
 function vector(m){
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const ctx=new C2S(w,h);ctx.canvas=canvas;ctx.setTransform=()=>{};ctx.setLineDash=()=>{};
   ctx.__parseFont=function(){const el=document.createElement('span').style;el.font=this.font;return {style:el.fontStyle||'normal',size:el.fontSize||'13px',family:el.fontFamily||'Arial',weight:el.fontWeight||'normal',decoration:'normal',href:null};};
   render(canvas,m,ctx);return ctx.getSerializedSvg().replace(/^.*?(<svg[\s>])/s,'$1');
 }
 P.classroomFigures={attach,vector};
})();
