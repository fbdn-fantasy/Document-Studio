/* Original procedural teaching diagrams. No downloaded artwork is required. */
'use strict';
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./pro-design-core.js'):root.FTEDesignCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.FTEDesignCatalog=api;})(globalThis,function(C){
  const geology=[
    ['normal','Normal fault','Faults','Extension lowers the hanging wall.'],['reverse','Reverse fault','Faults','Compression raises the hanging wall.'],
    ['thrust','Thrust fault','Faults','A shallow reverse fault.'],['strike','Strike-slip fault','Faults','Blocks move horizontally past one another.'],
    ['horst','Horst','Faults','A raised block between normal faults.'],['graben','Graben','Faults','A lowered block between normal faults.'],
    ['anticline','Anticline','Folds','An upward arch in layered rock.'],['syncline','Syncline','Folds','A downward trough in layered rock.'],
    ['monocline','Monocline','Folds','A step-like bend in otherwise flatter beds.'],['dome','Structural dome','Folds','Beds rise around a central high.'],['basin','Structural basin','Folds','Beds dip toward a central low.'],
    ['strata','Horizontal strata','Stratigraphy','A stack of sedimentary beds.'],['tilted','Tilted strata','Stratigraphy','Beds rotated after deposition.'],
    ['angular','Angular unconformity','Stratigraphy','Younger beds overlie eroded, tilted older beds.'],['disconformity','Disconformity','Stratigraphy','An erosional break separates parallel sedimentary beds.'],
    ['dyke','Igneous dyke','Igneous geology','An intrusion cuts across existing layers.'],['sill','Igneous sill','Igneous geology','An intrusion lies parallel to bedding.'],['batholith','Batholith','Igneous geology','A large intrusive igneous body.'],
    ['shield','Shield volcano','Volcanism','A broad volcanic edifice with gentle slopes.'],['stratovolcano','Composite volcano','Volcanism','A steep volcanic edifice built by repeated eruptions.'],['cinder','Cinder cone','Volcanism','A small, steep cone around a vent.'],['caldera','Caldera','Volcanism','A depression formed by volcanic collapse.'],
    ['subduction','Subduction zone','Plate tectonics','An oceanic plate descends beneath another plate.'],['ridge','Mid-ocean ridge','Plate tectonics','Oceanic plates diverge at a spreading centre.'],['rift','Continental rift','Plate tectonics','Extension thins continental crust.'],['transform','Transform boundary','Plate tectonics','Plates slide along a shared boundary.'],
    ['unconfined','Unconfined aquifer','Groundwater','The water table is the upper saturated boundary.'],['confined','Confined aquifer','Groundwater','A saturated layer lies between confining beds.'],['artesian','Artesian well','Groundwater','A well taps a confined aquifer under pressure.'],['karst','Karst landscape','Groundwater','Dissolution forms caves and sinkholes in soluble rock.'],
    ['meander','River meander','Landforms','A curved channel crosses its floodplain.'],['delta','River delta','Landforms','Distributaries spread sediment at a river mouth.'],['fan','Alluvial fan','Landforms','Sediment spreads where a stream leaves steep terrain.'],['vvalley','V-shaped valley','Landforms','River incision creates a narrow valley.'],['uvalley','U-shaped valley','Glaciation','Glacial erosion creates a broad trough.'],
    ['glacier','Valley glacier','Glaciation','Ice occupies and moves down a mountain valley.'],['moraine','Terminal moraine','Glaciation','Debris accumulates near a glacier terminus.'],['landslide','Rotational landslide','Mass movement','A displaced mass moves along a curved slip surface.'],['crystal','Hexagonal crystal habit','Minerals','A simplified six-sided crystal form.'],['earth','Earth interior','Earth structure','A nested section through crust, mantle and core.']
  ];
  const electrical=[
    ['series','Series resistors','DC circuits','Two resistors share the same branch current.'],['parallel','Parallel resistors','DC circuits','Two branches share the source voltage.'],
    ['divider','Voltage divider','DC circuits','Two equal resistors divide 10 V into 5 V at the midpoint.'],['loaded','Loaded voltage divider','DC circuits','A load resistor changes the midpoint voltage.'],
    ['bridge','Balanced Wheatstone bridge','DC circuits','Equal resistor ratios give zero bridge current.'],['unbalanced','Unbalanced bridge','DC circuits','Unequal ratios produce a bridge voltage.'],
    ['closed','Closed switch','DC circuits','A closed switch completes the circuit.'],['open','Open switch','DC circuits','An open switch interrupts the circuit.'],
    ['ledcircuit','LED with current limiter','Diodes and LEDs','A series resistor limits LED current.'],['diodeforward','Forward-biased diode','Diodes and LEDs','The piecewise-linear diode conducts above its forward voltage.'],['diodereverse','Reverse-biased diode','Diodes and LEDs','The diode blocks current apart from model leakage.'],
    ['rc','RC charging','Transient circuits','A 1 kΩ resistor charges a 100 µF capacitor; time constant 0.1 s.'],['rcladder','Two-stage RC ladder','Transient circuits','Two RC stages respond over time.'],['rl','RL step response','Transient circuits','Inductor current rises after DC is applied.'],['rlc','Series RLC response','Transient circuits','Resistance, inductance and capacitance govern the transient.'],['twosource','Two series sources','DC circuits','Two sources add their voltages.'],
    ['uno','Arduino Uno-style board','Boards','Illustrative layout: drawing terminals are not an electrical pinout.'],['nano','Arduino Nano-style board','Boards','A compact, breadboard-friendly board illustration.'],['esp32','ESP32-style board','Boards','A module, antenna region and headers shown schematically.'],['breadboard','Solderless breadboard','Boards','Editable physical illustration; holes do not imply electrical connections.'],['perfboard','Perfboard','Boards','A perforated prototyping board illustration.'],['populated','Populated circuit board','Boards','A starter PCB assembly with discrete parts and an IC.'],
    ['resistor','Axial resistor','Components','A resistor body, bands and leads.'],['capacitor','Electrolytic capacitor','Components','A capacitor can and two terminals.'],['inductor','Air-core inductor','Components','A wound conductor stores energy in a magnetic field.'],['diode','Rectifier diode','Components','A diode body with a cathode band.'],['led','LED package','Components','A light-emitting diode with two leads.'],['switch','Toggle switch','Components','A movable contact opens or closes a path.'],['chip','Dual-inline IC','Components','A visual integrated-circuit package.'],['transistor','Transistor package','Components','A visual three-lead semiconductor package.'],['transformer','Transformer','Components','A visual core and two winding assemblies.'],['motor','DC motor','Components','A visual motor housing and shaft.'],['solar','Solar panel','Components','A visual array of photovoltaic cells.'],['bulb','Lamp','Components','A visual bulb and base.'],['header','Pin header','Components','A connector for removable connections.'],['connector','Screw terminal block','Components','A visual field-wiring connector.'],['source','Battery / DC source','Components','Terminal A is positive relative to terminal B.'],['ground','Reference ground','Components','Ground defines the zero-volt reference.'],['junction','Wire junction','Components','Wires joined at this terminal share one electrical node.'],['wiring','Wired resistor assembly','Assembly examples','A source and resistor joined by editable terminal wires.']
  ];
  const catalog=[...geology.map(([id,title,group,notes])=>({id:'geo-'+id,key:id,title,group,notes,category:'Geology'})),...electrical.map(([id,title,group,notes])=>({id:'elec-'+id,key:id,title,group,notes,category:'Electrical'}))];
  function build(id, dimension='3D') {
    const t=catalog.find(t=>t.id===id);if(!t)throw Error('Diagram not found.');
    const s=C.scene(t.category,t.title);s.dimension=dimension;s.notes=t.notes;
    const add=(kind,label,x=0,y=0,z=0,changes={})=>{const o=C.object(kind,{label,x,y,z,...changes});s.objects.push(o);return o;};
    const connect=(a,b,ap='B',bp='A',color='#617b9d')=>C.wire(s,{object:a.id,pin:ap},{object:b.id,pin:bp},color);
    const strata=(x=0,offset=0,width=5,angle=0)=>{for(let i=0;i<4;i++)add('layer',['Basal bed','Sandstone','Siltstone','Upper bed'][i],x,-1.5+i*.6+offset,0,{w:width,h:.55,d:2.6,color:['#8b817d','#b99c74','#aeb08d','#d3bb92'][i],rz:angle});};
    const arrow=(label,x,y,rz=0)=>add('arrow',label,x,y,1.8,{w:1,rz,color:'#bb6f5e'});
    function path(points,color='#668fae',width=.14,label=''){
      points.slice(1).forEach((b,i)=>{const a=points[i],dx=b[0]-a[0],dy=b[1]-a[1];add('bond',i===0?label:'',(a[0]+b[0])/2,(a[1]+b[1])/2,b[2]||1.6,{w:Math.hypot(dx,dy),h:width,d:width,rz:Math.atan2(dy,dx)*180/Math.PI,color});});
    }
    if(t.category==='Geology')switch(t.key){
      case 'normal':case 'reverse':case 'thrust':case 'strike':case 'transform':{
        const shift=t.key==='normal'?-.8:t.key==='reverse'||t.key==='thrust'?.8:0;
        strata(-1.65,0,3);strata(1.65,shift,3);
        add('plane','Fault plane',0,-.5,0,{w:.06,h:3.5,d:3,rz:t.key==='thrust'?55:t.key==='strike'||t.key==='transform'?0:22,color:'#b66b66'});
        if(t.key==='strike'||t.key==='transform'){s.objects.filter(o=>o.x>1).forEach(o=>o.z+=.8);arrow('Horizontal slip',-1.4,1.5,0);arrow('Horizontal slip',1.4,1.5,180);}
        else {arrow(shift<0?'Extension':'Compression',-2,1.7,shift<0?180:0);arrow('Hanging-wall motion',2,1.7,shift<0?-90:90);}break;
      }
      case 'horst':case 'graben':case 'rift':strata(-2.4,0,2.1);strata(0,t.key==='horst'?.75:-.8,2.1);strata(2.4,0,2.1);arrow('Extension',-2,1.5,180);arrow('Extension',2,1.5,0);break;
      case 'anticline':case 'syncline':for(let i=0;i<4;i++)add('fold','Folded bed '+(i+1),0,-1.3+i*.5,0,{variant:t.key,color:['#8c7c71','#bc9877','#d1b38a','#a7ae8f'][i]});break;
      case 'monocline':strata(-2,.5,2);strata(2,-.6,2);for(let i=0;i<4;i++)add('layer','Flexure '+(i+1),0,-1.3+i*.6,0,{w:2.4,rz:-28});break;
      case 'dome':case 'basin':for(let i=0;i<4;i++)add('fold','Curved layer '+(i+1),0,-1.3+i*.5,0,{variant:t.key,d:4,color:['#8c7c71','#bc9877','#d1b38a','#a7ae8f'][i]});break;
      case 'strata':strata();break;
      case 'tilted':strata(0,0,5,22);break;
      case 'angular':strata(0,-.8,4,20);add('layer','Erosion surface',0,.9,0,{h:.12,color:'#8f7161'});add('layer','Younger horizontal bed',0,1.3,0,{h:.65,color:'#c9b48e'});break;
      case 'disconformity':strata();add('terrain','Eroded contact',0,.9,0,{h:.2,d:2.6,color:'#8c806b'});add('layer','Younger bed',0,1.35,0,{h:.45,color:'#d9c4a3'});break;
      case 'dyke':case 'sill':case 'batholith':strata();if(t.key==='batholith')add('magma','Intrusive body',0,-.8,1.1,{w:3,h:2.2,d:1.6,color:'#b87769'});else add('layer',t.key==='dyke'?'Cross-cutting intrusion':'Concordant intrusion',0,-.2,1.45,{w:t.key==='dyke'?.38:5.1,h:t.key==='dyke'?3.4:.28,d:.25,rz:t.key==='dyke'?-13:0,color:'#b7756a'});break;
      case 'shield':case 'stratovolcano':case 'cinder':case 'caldera':{
        add('layer','Country rock',0,-1.6,0,{h:.5,w:6,d:3.6});const height=t.key==='shield'?1.1:t.key==='cinder'?1.7:2.5;
        add('volcano',t.title,0,height/2-1.35,0,{w:t.key==='shield'?5.8:3.7,h:height});add('magma','Magma chamber',0,-2,1.2);
        if(t.key==='caldera')add('torus','Collapse rim',0,1,0,{w:2.1,h:2.1,d:.45,rx:90,color:'#ba9f8b'});break;
      }
      case 'subduction':add('layer','Oceanic plate',-2,.2,0,{w:3.5,h:.45,color:'#6c8b97'});add('layer','Descending slab',.8,-.85,0,{w:3.8,h:.4,rz:-32,color:'#6c8b97'});add('wedge','Overriding continent',2,.4,.2,{w:3.5,h:1.1});add('volcano','Volcanic arc',2.8,1.6,0,{w:1.4,h:1.7,d:1.4});arrow('Convergence',-3,1.4,0);break;
      case 'ridge':add('wedge','Oceanic crust',-1.9,-.5,0,{w:3.6,h:1,ry:0,color:'#79959d'});add('wedge','Oceanic crust',1.9,-.5,0,{w:3.6,h:1,ry:180,color:'#79959d'});add('magma','Upwelling magma',0,-1,0,{w:.7,h:2});arrow('Spreading',-2,1.1,180);arrow('Spreading',2,1.1,0);break;
      case 'unconfined':case 'confined':case 'artesian':add('layer','Impermeable base',0,-1.5,0,{color:'#8c7d80'});add('water','Saturated aquifer',0,-.8,0,{w:5,h:.8});add('layer',t.key==='unconfined'?'Unsaturated soil':'Confining bed',0,.1,0,{h:t.key==='unconfined'?1:.35,color:'#c0a883'});if(t.key!=='unconfined')add('layer','Upper permeable layer',0,.7,0,{h:.7,color:'#b7b399'});add('cylinder',t.key==='artesian'?'Artesian well':'Observation well',1.4,.6,1.35,{w:.16,d:.16,h:2.5,color:'#6f8b9f'});break;
      case 'karst':add('terrain','Limestone surface',0,.6,0,{h:1.8,color:'#b3ac97'});add('sphere','Cave cross-section',0,-.3,1.55,{w:2.8,h:1.1,d:.2,color:'#505c69'});add('cylinder','Sinkhole',-1,.8,.8,{w:.6,d:.6,h:1.3,color:'#596b78'});path([[-1,.3],[0,-.7],[2,-.4]],'#6b9db8',.13,'Underground stream');break;
      case 'meander':case 'delta':case 'fan':add('layer','Floodplain',0,-.4,0,{w:6,h:3.5,d:.25,color:'#bdc39d'});if(t.key==='meander')path(Array.from({length:31},(_,i)=>[-2.5+i/6,Math.sin(i*.3)*1.15]),'#6eabc3',.18,'River channel');else{path([[0,1.3],[0,.1]],'#6eabc3',.17,'Main channel');for(let i=0;i<5;i++)path([[0,.1],[-2+i,-1.6]],t.key==='fan'?'#c69c69':'#6eabc3',.14,i===0?(t.key==='fan'?'Sediment fan':'Distributaries'):'');}break;
      case 'vvalley':case 'uvalley':case 'glacier':case 'moraine':add('wedge','Valley wall',-1.9,.2,0,{w:2.4,h:2.5,ry:180,color:'#a3a88c'});add('wedge','Valley wall',1.9,.2,0,{w:2.4,h:2.5,color:'#a3a88c'});add(t.key==='vvalley'?'water':'layer',t.key==='glacier'||t.key==='moraine'?'Glacial ice':'Valley floor',0,-.7,0,{w:t.key==='vvalley'?.3:1.7,h:t.key==='glacier'||t.key==='moraine'?1:.25,d:3,color:t.key==='glacier'||t.key==='moraine'?'#b6d7df':'#91adaf'});if(t.key==='moraine')for(let i=0;i<7;i++)add('sphere','',-1+i*.33,-.4,1.55,{w:.4,h:.45,d:.4,color:'#9a9086'});break;
      case 'landslide':add('wedge','Slope',0,-.3,0,{w:5,h:2.7});add('terrain','Displaced mass',-1,-.2,1.3,{w:2.5,h:.6,d:1,color:'#b6a383',rz:18});arrow('Movement',-.8,1.4,210);break;
      case 'crystal':for(let i=0;i<4;i++)add('crystal',i===0?'Hexagonal crystal':'',-.9+i*.6,i%2*.3,0,{h:1.8+(i%2)*.7,w:.65,d:.65,rz:(i-1)*12});break;
      case 'earth':for(const [label,size,z,color] of [['Crust',4.5,0,'#789680'],['Mantle',4.2,.4,'#c49a6b'],['Outer core',2.5,1.3,'#d7ad6b'],['Inner core',1.2,2.1,'#e3cf99']])add('sphere',label,0,0,z,{w:size,h:size,d:.3,color});break;
    }
    else if(['uno','nano','esp32','breadboard','perfboard','populated'].includes(t.key)){
      const board=add(['breadboard','perfboard'].includes(t.key)?t.key:'board',t.title,0,0,0,{variant:t.key,w:t.key==='nano'?2.2:t.key==='esp32'?2.5:5,h:t.key==='nano'?3.8:t.key==='esp32'?4:3.5});
      if(t.key==='populated'){add('capacitor','C1',-1,-.6,.6);add('resistor','R1',1,.5,.5);add('chip','U1',.8,-.6,.4);}
      s.notes+=' Board geometry is illustrative, not fabrication CAD. Boards and their firmware are not simulated.';
    }else if(C.byKind[t.key]){add(t.key,t.title);s.view.zoom=1.4;}
    else {
      const source=add('source','V1 · 10 V',-3,0,0,{value:10,rz:-90}),ground=add('ground','Ground',-3,-2,0);
      const r1=add('resistor','R1 · 1 kΩ',0,1.7,0,{value:1000}),r2=add('resistor','R2 · 1 kΩ',3,0,0,{value:1000,rz:-90});
      connect(source,ground,'B','0');connect(source,r1,'A','A');connect(r1,r2,'B','A');connect(r2,source,'B','B');
      if(['parallel','bridge','unbalanced'].includes(t.key)){
        s.wires=[];r1.x=0;r1.y=0;r1.rz=90;r2.x=3;r2.y=0;connect(source,ground,'B','0');connect(source,r1,'A','A');connect(source,r2,'A','A');
        if(t.key==='parallel'){connect(r1,source,'B','B');connect(r2,source,'B','B');}
        else {r1.y=1.2;r2.y=1.2;const r3=add('resistor','R3 · 1 kΩ',0,-1.2,0,{rz:90}),r4=add('resistor',t.key==='bridge'?'R4 · 1 kΩ':'R4 · 2 kΩ',3,-1.2,0,{rz:90,value:t.key==='bridge'?1000:2000}),r5=add('resistor','Bridge resistor',1.5,0,0,{w:1.4});connect(r1,r3);connect(r2,r4);connect(r3,source,'B','B');connect(r4,source,'B','B');connect(r1,r5);connect(r5,r2,'B','B');}
      }
      if(t.key==='loaded'){const r3=add('resistor','Load · 1 kΩ',.5,-1.2,0,{rz:90});connect(r1,r3);connect(r3,source,'B','B');}
      if(['closed','open'].includes(t.key)){r2.kind='switch';r2.label=t.key==='open'?'Open switch':'Closed switch';r2.value=t.key==='open'?0:1;r2.color='#8c9eb2';}
      if(['ledcircuit','diodeforward','diodereverse'].includes(t.key)){r2.kind=t.key==='ledcircuit'?'led':'diode';r2.label=t.key==='ledcircuit'?'LED · 2 V':'Diode · 0.7 V';r2.value=t.key==='ledcircuit'?2:.7;r2.color=t.key==='ledcircuit'?'#d76c75':'#768397';if(t.key==='diodereverse'){s.wires.forEach(w=>{for(const e of [w.a,w.b])if(e.object===r2.id)e.pin=e.pin==='A'?'B':'A';});r2.rz=-90;}}
      if(['rc','rcladder','rl','rlc'].includes(t.key)){r2.kind=t.key==='rl'?'inductor':'capacitor';r2.value=t.key==='rl'?.1:100e-6;r2.color='#6e99b8';r2.label=t.key==='rl'?'L1 · 0.1 H':'C1 · 100 µF';if(t.key==='rl'){r1.value=10;r1.label='R1 · 10 Ω';}
        if(t.key==='rcladder'){const r3=add('resistor','R2 · 1 kΩ',1.5,-1.3,0),c2=add('capacitor','C2 · 100 µF',3,-2.1,0,{value:100e-6});connect(r1,r3);connect(r3,c2);connect(c2,source,'B','B');}
        if(t.key==='rlc'){r1.value=10;r1.label='R1 · 10 Ω';const l=add('inductor','L1 · 0.1 H',0,-1.6,0,{value:.1});s.wires=s.wires.filter(w=>!(w.a.object===r2.id&&w.b.object===source.id));connect(r2,l);connect(l,source,'B','B');}
      }
      if(t.key==='twosource'){const v2=add('source','V2 · 5 V',0,-1.7,0,{value:5});s.wires=s.wires.filter(w=>!(w.a.object===r2.id&&w.b.object===source.id));connect(r2,v2,'B','B');connect(v2,source,'A','B');}
      if(t.key==='wiring'){C.remove(s,r2.id);connect(r1,source,'B','B');}
      s.notes+=' Simulation uses ideal DC sources, linear R/C/L, finite switch resistance and approximate constant-drop diodes. Use Transient for capacitor and inductor behaviour.';
    }
    return C.validate(s);
  }
  return {items:catalog,build};
});
