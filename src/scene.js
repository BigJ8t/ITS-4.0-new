import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { installHumanCharacters } from './humans.js';

// Spazio Origine: proportional visual reconstruction from ONE reference photograph.
// Architectural proportions are relative visual estimates, not laser/metric survey.
export function createHotelScene(container) {
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#c6c0b4');
  scene.fog=new THREE.Fog('#d9d2c5',17,34);
  const camera=new THREE.PerspectiveCamera(57,1,.1,100);
  camera.position.set(8.2,2.9,7.1);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.23;
  container.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;
  controls.target.set(0.35,1.65,-5.25);
  controls.minDistance=2.7;
  controls.maxDistance=17;
  controls.maxPolarAngle=Math.PI/2.02;
  const materials={
    plaster:new THREE.MeshStandardMaterial({color:'#e9e4d9',roughness:.89}),
    ivory:new THREE.MeshStandardMaterial({color:'#f5f0e5',roughness:.78}),
    beige:new THREE.MeshStandardMaterial({color:'#c5a98d',roughness:.72}),
    stone:new THREE.MeshStandardMaterial({color:'#243735',roughness:.29,metalness:.08}),
    stoneEdge:new THREE.MeshStandardMaterial({color:'#41534d',roughness:.43}),
    countertop:new THREE.MeshStandardMaterial({color:'#2b3b36',roughness:.22,metalness:.05}),
    timber:new THREE.MeshStandardMaterial({color:'#ad7d51',roughness:.61}),
    timberDark:new THREE.MeshStandardMaterial({color:'#81573a',roughness:.62}),
    brass:new THREE.MeshStandardMaterial({color:'#c3a570',metalness:.64,roughness:.3}),
    frosted:new THREE.MeshStandardMaterial({color:'#dce4d9',roughness:.22}),
    foliage:new THREE.MeshStandardMaterial({color:'#567052',roughness:.92}),
    orange:new THREE.MeshStandardMaterial({color:'#7e3325',roughness:.89}),
    matteBlack:new THREE.MeshStandardMaterial({color:'#171c1c',roughness:.72})
  };
  function box(x,y,z,w,h,d,mat,extras={}){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);
    mesh.castShadow=extras.castShadow!==false;mesh.receiveShadow=true;
    if(extras.rotationY)mesh.rotation.y=extras.rotationY;
    scene.add(mesh);return mesh;
  }
  function line(points,material,radius=.02){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*6),radius,8,false),material);
    scene.add(mesh);return mesh;
  }
  function ring(x,y,z,r,material,tube=.028){
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,tube,7,80),material);
    mesh.position.set(x,y,z);scene.add(mesh);return mesh;
  }
  function sign(text,x,y,z,width,height,color='#1d2422',font='bold 105px Georgia'){
    const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=200;
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.font=font;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(text,canvas.width/2,canvas.height/2,canvas.width-35);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));
    mesh.position.set(x,y,z);scene.add(mesh);return mesh;
  }
  // Reference: wide ceremonial lobby, substantial vertical scale, not a compact retail shop.
  const room={width:22,depth:20,height:6.4};
  box(0,-.21,0,room.width,.42,room.depth,materials.beige);
  // Material proportions: diagonal diamond tiles approximately 55-70 cm across.
  const tileCanvas=document.createElement('canvas');
  tileCanvas.width=512;tileCanvas.height=512;
  const tx=tileCanvas.getContext('2d');
  const colors=['#e8dfca','#a96e51','#313d3b','#e2c4a6'];
  const count=8,side=512/count;
  for(let y=0;y<count;y++)for(let x=0;x<count;x++){
    tx.fillStyle=((x+y)%4===0)?colors[2]:((x+y)%2===0?colors[0]:colors[1]);
    tx.fillRect(x*side,y*side,side,side);
    tx.strokeStyle='#d1c5ac';tx.lineWidth=3;tx.strokeRect(x*side+1,y*side+1,side-2,side-2);
    tx.strokeStyle='#d5c5af';tx.lineWidth=1;tx.strokeRect(x*side+5,y*side+5,side-10,side-10);
  }
  const tileTex=new THREE.CanvasTexture(tileCanvas);
  tileTex.colorSpace=THREE.SRGBColorSpace;
  tileTex.wrapS=tileTex.wrapT=THREE.RepeatWrapping;
  tileTex.repeat.set(3.15,3.15);
  tileTex.center.set(.5,.5);tileTex.rotation=Math.PI/4;
  tileTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(22,20),new THREE.MeshStandardMaterial({map:tileTex,roughness:.42,metalness:.03}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.006;floor.receiveShadow=true;scene.add(floor);

  // Large off-white vaulted ceiling. High arch profiles are placed BEHIND
  // structural columns so no decorative ring floats through the photo-space.
  box(0,6.45,0,22,.28,20,materials.plaster);
  box(-10.8,3,0,.28,6.2,20,materials.plaster);
  box(10.8,3,0,.28,6.2,20,materials.plaster);
  box(0,3.1,-9.65,22,6.2,.28,materials.plaster);
  // Left arcade with broad semi-circular openings, framed in realistic plaster thickness.
  function archOpening(cx,z,span,shoulder=3.75,rise=1.65){
    const outer=span*.5+.52,upper=6.26;
    const shape=new THREE.Shape();
    shape.moveTo(-outer,0);shape.lineTo(outer,0);shape.lineTo(outer,upper);
    shape.lineTo(-outer,upper);shape.lineTo(-outer,0);
    const hole=new THREE.Path();
    // Curve rises from both springing points; the base of the arch is open.
    const w=span/2;
    hole.moveTo(-w,-.12);hole.lineTo(w,-.12);hole.lineTo(w,shoulder);
    for(let i=0;i<=28;i++){
      const theta=Math.PI*i/28;
      const px=w*Math.cos(theta);
      const py=shoulder+rise*Math.sin(theta);
      hole.lineTo(px,py);
    }
    hole.lineTo(-w,-.12);
    shape.holes.push(hole);
    const g=new THREE.ExtrudeGeometry(shape,{depth:.58,bevelEnabled:false,curveSegments:32});
    const mesh=new THREE.Mesh(g,materials.plaster);
    mesh.position.set(cx,0,z);mesh.receiveShadow=true;scene.add(mesh);
    // Subtle soffit curvature.
    line(Array.from({length:19},(_,i)=>{
      const theta=Math.PI*i/18;
      return [cx+w*Math.cos(theta),shoulder+rise*Math.sin(theta),z+.60];
    }),materials.ivory,.043);
  }
  archOpening(-5.55,-8.5,4.65,3.61,1.65);
  archOpening(-10,-1.75,4.3,3.55,1.74);

  // Black-green stone structural columns: strong square profiles (photo characteristic).
  function column(x,z,w=.91){
    box(x,2.85,z,w,5.7,w,materials.stone);
    box(x,.19,z,w+0.15,.38,w+0.15,materials.stoneEdge);
    box(x,5.49,z,w+0.14,.3,w+0.14,materials.stoneEdge);
    for(let i=0;i<12;i++){
      const seed=(i*17)%23;
      const a=x-w/2+.08+(seed/23)*(w-.16);
      line([[a,.5,z+w/2+.013],[a+.09,1.3+i*.24,z+w/2+.016],[a-.03,2.5+i*.17,z+w/2+.018]],materials.stoneEdge,.007);
    }
  }
  column(-7.5,-5.2,1.02);
  column(-2.55,-6.15,.98);
  column(8.6,-6.75,.9);

  // Back wall: shelving on right ONLY, preserving open archways on left.
  box(3.9,2.85,-9.05,12.8,5.7,.24,materials.beige);
  box(3.9,2.9,-8.86,12.35,4.55,.16,materials.timber);
  for(let xx=-1.98;xx<10.02;xx+=1.08){
    box(xx,2.95,-8.72,.075,4.15,.55,materials.timberDark);
    for(const yy of [1.11,2.12,3.12,4.08]){
      box(xx+.54,yy,-8.72,1.09,.075,.6,materials.timberDark);
    }
  }
  // Furnish a few cubbies, instead of a repetitively empty grid.
  for(let n=0;n<17;n++){
    const x=-1.49+(n%11)*1.08,y=1.26+(Math.floor(n/11)%3)*.99;
    if(x>8.2)continue;
    const urn=new THREE.Mesh(new THREE.CylinderGeometry(.095,.13,.24,14),n%3===0?materials.frosted:n%3===1?materials.beige:materials.ivory);
    urn.position.set(x,y,-8.32);scene.add(urn);
    if(n%5===0){
      const orb=new THREE.Mesh(new THREE.SphereGeometry(.1,12,10),materials.brass);orb.position.set(x+.25,y+.17,-8.3);scene.add(orb);
    }
  }
  // Floral "Nature First" wall seen left of the shelf in the reference.
  box(-3.7,3.45,-8.65,2.1,3.0,.16,materials.timberDark);
  for(let j=0;j<7;j++){
    const x=-4.65+j*.25;
    line([[x,2.15,-8.51],[x+.13,2.85,-8.49],[x-.08,3.65,-8.49],[x+.14,4.6,-8.49]],materials.foliage,.028);
  }
  sign('NATURE FIRST',-3.7,4.57,-8.42,1.68,.32,'#f7eed6','bold 77px Arial');

  // Signature luminous circular perforated wall mosaic, high on the right.
  const center=[7.6,5.24,-8.55];
  ring(...center,1.32,materials.brass,.065);
  for(const radius of [.43,.67,.91,1.13]){
    ring(center[0],center[1],center[2]+.018,radius,materials.frosted,.023);
    const n=Math.round(16+radius*27);
    for(let k=0;k<n;k++){
      const a=Math.PI*2*k/n + radius;
      const dot=new THREE.Mesh(new THREE.SphereGeometry(.038,7,6),k%3===0?materials.brass:materials.frosted);
      dot.position.set(center[0]+radius*Math.cos(a),center[1]+radius*Math.sin(a),center[2]+.048);
      scene.add(dot);
    }
  }

  // Bank proportions: 9.8 m long, ~1.1 m tall, prominent at right foreground.
  // Place the attendant BEHIND it and guest IN FRONT of it.
  const desk={x:2.9,z:-5.24,w:9.8,front:-4.34};
  box(desk.x,.56,desk.z,desk.w,1.12,1.62,materials.timber);
  box(desk.x,1.18,desk.z,desk.w+.30,.115,1.78,materials.countertop);
  box(desk.x,.17,desk.z,desk.w,.33,1.65,materials.stone);
  // Timber fascia and narrow horizontally laid wooden strips.
  box(desk.x,.76,desk.front,desk.w-.18,.84,.065,materials.timber);
  for(let y=.41;y<1.13;y+=.105)box(desk.x,y,desk.front+.041,desk.w-.23,.013,.018,materials.timberDark);
  // Dark framing at left and right sides
  for(const xx of [desk.x-desk.w/2+.04,desk.x+desk.w/2-.04])
    box(xx,.78,desk.front+.047,.065,.92,.085,materials.timberDark);
  // Printed hotel identity on front and circular decorative emblem.
  sign('SPAZIO',desk.x-2.15,.80,desk.front+.095,1.8,.38,'#252320','bold 112px Georgia');
  sign('ORIGINE',desk.x+2.25,.80,desk.front+.095,2.0,.38,'#252320','bold 112px Georgia');
  ring(desk.x,.82,desk.front+.109,.41,materials.brass,.063);
  for(let n=0;n<12;n++){
    const a=n*Math.PI/6;
    const petal=new THREE.Mesh(new THREE.SphereGeometry(.068,10,7),n%2?materials.frosted:materials.brass);
    petal.position.set(desk.x+.22*Math.cos(a),.82+.22*Math.sin(a),desk.front+.12);
    scene.add(petal);
  }
  // Desk computing equipment, hidden behind counter from the primary visitor view.
  box(1.1,1.58,-5.83,1.15,.68,.075,materials.matteBlack);
  box(1.1,1.20,-5.94,.07,.18,.21,materials.matteBlack);
  box(2.6,1.3,-5.7,.85,.06,.37,materials.matteBlack);
  for(const x of [6.4,6.95]){
    const vase=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.27,14),materials.frosted);
    vase.position.set(x,1.4,-5.6);scene.add(vase);
  }

  // Photo shows an intimate seating area through the arches on the left.
  for(const z of [-5.0,-2.35]){
    box(-8.9,.43,z,1.55,.56,.75,materials.orange);
    box(-8.9,.85,z-.32,1.55,.58,.16,materials.orange);
  }
  // Stone-topped side table and guest information plinth.
  box(-6.1,.45,-1.1,.65,.9,.65,materials.timberDark);
  box(-6.1,.94,-1.1,.85,.08,.72,materials.stone);
  box(-6.8,.80,-6.2,.65,1.58,.52,materials.stone);
  box(-6.8,1.59,-6.2,.7,.05,.54,materials.brass);

  // Architectural photography-style lighting, no floating luminous ceiling rings.
  scene.add(new THREE.HemisphereLight(0xe9eff5,0x967559,2.05));
  const daylight=new THREE.DirectionalLight(0xfff0d8,3.4);
  daylight.position.set(-6.8,10.8,8);
  daylight.castShadow=true;
  daylight.shadow.mapSize.set(2048,2048);
  daylight.shadow.camera.left=-15;
  daylight.shadow.camera.right=15;
  daylight.shadow.camera.top=15;
  daylight.shadow.camera.bottom=-15;
  daylight.shadow.normalBias=.025;
  scene.add(daylight);
  const softFill=new THREE.PointLight(0xffd9b4,45,17);
  softFill.position.set(5,5,-3);scene.add(softFill);
  const rearFill=new THREE.PointLight(0xe4eecf,21,11);
  rearFill.position.set(8,5,-7.5);scene.add(rearFill);
  // Directed camera views for a more cinematic, yet accessible, experience.
  const viewPresets={
    overview:{position:[8.2,2.9,7.1],target:[.35,1.65,-5.25]},
    guest:{position:[4.8,2.18,-.5],target:[2.35,1.44,-3.60]},
    reception:{position:[-1.8,2.34,-1.9],target:[2.0,1.46,-6.72]}
  };
  let cameraJourney=null;
  let pulse=null;
  function setView(name,{instant=false}={}){
    const preset=viewPresets[name]||viewPresets.overview;
    const destination=new THREE.Vector3(...preset.position),lookAt=new THREE.Vector3(...preset.target);
    if(instant || manualReducedMotion || motionPref?.matches){
      camera.position.copy(destination);controls.target.copy(lookAt);controls.update();
      cameraJourney=null;
    }else{
      cameraJourney={startPos:camera.position.clone(),startTarget:controls.target.clone(),
        endPos:destination,endTarget:lookAt,elapsed:0,duration:1.25};
    }
  }
  function reactToChoice(choice){
    if(choice==='alternative')setView('reception');
    else if(choice==='negotiate')setView('guest');
    else setView('overview');
    pulse={time:0,color:choice==='alternative'?'#80ecd4':choice==='negotiate'?'#ffe2ad':'#9de0f1'};
  }
  // Small, non-flashing status lamp, synchronized to the chosen decision.
  const signal=new THREE.PointLight('#d7e9df',0,3);
  signal.position.set(3.2,1.45,-5.5);scene.add(signal);

  const held=new Set();const keys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
  function down(e){if(['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;
    const k=e.key.toLowerCase();if(keys.includes(k)){held.add(k);if(k.startsWith('arrow'))e.preventDefault();}}
  function up(e){held.delete(e.key.toLowerCase())}
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);
  let raf=0,disposed=false,then=0;
  const humans=installHumanCharacters(scene,()=>disposed);
  let manualReducedMotion=false;
  const motionPref=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const forward=new THREE.Vector3(),right=new THREE.Vector3(),move=new THREE.Vector3();
  function animate(now){
    if(disposed)return;
    const dt=Math.min(.05,(now-then)/1000||.016);then=now;
    move.set(0,0,0);camera.getWorldDirection(forward);forward.y=0;forward.normalize();
    right.crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
    if(held.has('w')||held.has('arrowup'))move.add(forward);
    if(held.has('s')||held.has('arrowdown'))move.sub(forward);
    if(held.has('d')||held.has('arrowright'))move.add(right);
    if(held.has('a')||held.has('arrowleft'))move.sub(right);
    if(move.lengthSq()>0){
      move.normalize().multiplyScalar(dt*3.5);
      const dest=controls.target.clone().add(move);
      if(Math.abs(dest.x)<8.5&&dest.z>-8&&dest.z<9){controls.target.add(move);camera.position.add(move);}
    }
    const reduced=manualReducedMotion||motionPref?.matches;
    humans.update(reduced?0:dt);
    if(cameraJourney){
      cameraJourney.elapsed+=dt;
      const t=Math.min(1,cameraJourney.elapsed/cameraJourney.duration);
      const smooth=t*t*(3-2*t);
      camera.position.lerpVectors(cameraJourney.startPos,cameraJourney.endPos,smooth);
      controls.target.lerpVectors(cameraJourney.startTarget,cameraJourney.endTarget,smooth);
      if(t>=1)cameraJourney=null;
    }
    if(pulse){
      pulse.time+=dt;
      signal.color.set(pulse.color);
      signal.intensity=reduced?0:Math.max(0,2.0*(1-pulse.time/2.2));
      if(pulse.time>2.2){pulse=null;signal.intensity=0;}
    }
    controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(animate);
  }
  const resize=()=>{
    const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
    camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
  };
  const observer=new ResizeObserver(resize);observer.observe(container);resize();raf=requestAnimationFrame(animate);
  return {setView,reactToChoice,setReducedMotion(v){manualReducedMotion=!!v;humans.setReducedMotion(!!v);if(v)signal.intensity=0},dispose(){disposed=true;humans.dispose();cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);controls.dispose();scene.traverse(o=>{o.geometry?.dispose();});renderer.dispose();renderer.domElement.remove();}};
}
