'use strict';
(()=>{
 function basis(rx,ry){return [[Math.cos(ry),0,Math.sin(ry)],[Math.sin(rx)*Math.sin(ry),Math.cos(rx),-Math.sin(rx)*Math.cos(ry)]];}
 function controls(canvas,get,draw,onSelect){
   let drag=null;const pt=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*1000/r.width,(e.clientY-r.top)*650/r.height];};
   function shift(view,x,y,scale){const {center,rx,ry}=canvas.atlasFrame,[right,up]=basis(rx,ry);view.focus=center.map((v,i)=>v+(right[i]*x+up[i]*y)/scale);}
   function zoom(f,x=500,y=315){
     const s=get(),v=s.view,next=Math.max(.25,Math.min(160,v.zoom*f)),old=v.zoom;
     shift(v,(x-500)*(1-old/next),(315-y)*(1-old/next),canvas.atlasFrame.scale);
     v.zoom=next;s.labelPage=0;draw();
   }
   function frame(key){const t=canvas.fteTargets?.find(t=>t.key===key);if(!t?.world)return;
     const s=get(),v=s.view;v.focus=t.world.slice();v.zoom=Math.max(.25,Math.min(160,v.zoom*240/Math.max(t.pixels||24,1)));s.labelPage=0;draw();}
   canvas.atlasFrameTarget=frame;
   canvas.oncontextmenu=e=>e.preventDefault();
   canvas.onpointerdown=e=>{const p=pt(e);drag={p,start:p,pan:get().dimension==='2D'||e.shiftKey||e.button!==0};canvas.setPointerCapture(e.pointerId);canvas.focus();};
   canvas.onpointermove=e=>{if(!drag)return;const p=pt(e),dx=p[0]-drag.p[0],dy=p[1]-drag.p[1],s=get();
     if(drag.pan)shift(s.view,-dx,dy,canvas.atlasFrame.scale);else{s.view.rx+=dy*.008;s.view.ry+=dx*.008;}
     drag.p=p;draw();};
   canvas.onpointerup=e=>{if(drag){const p=pt(e);if(Math.hypot(p[0]-drag.start[0],p[1]-drag.start[1])<5){
     const target=canvas.atlasPick?.(...p);if(target){const s=get();s.detail=target.key;onSelect(target.id);canvas.fteChooseDescriptor?.(target.key);}
   }}drag=null;};canvas.onpointercancel=()=>{drag=null;};
   canvas.ondblclick=e=>{const p=pt(e),hit=canvas.atlasPick?.(...p);if(hit&&canvas.fteTargets?.some(t=>t.key===hit.key))frame(hit.key);else zoom(2,...p);};
   canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-Math.sign(e.deltaY)*Math.min(.56,Math.max(.095,Math.abs(e.deltaY)*.0025))),...pt(e));},{passive:false});
   canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key))return;e.preventDefault();
     if(['+','-','='].includes(e.key))return zoom(e.key==='-'?1/1.25:1.25);
     const v=get().view,x=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0,y=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;
     if(e.shiftKey||get().dimension==='2D')shift(v,x*35,-y*35,canvas.atlasFrame.scale);else{v.ry+=x*.12;v.rx+=y*.12;}draw();};
 }
 FTEPro.atlasCamera={controls};
})();
