import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createHotelScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#172737');
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(6.8, 3.6, 9.3);
  const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.shadowMap.enabled=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.55;
  container.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera, renderer.domElement);
  controls.enableDamping=true; controls.target.set(0,1.5,-3);
  controls.minDistance=3; controls.maxDistance=19; controls.maxPolarAngle=Math.PI/2.05;
  const mat=(color,metalness=0,roughness=.72)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const cream=mat('#d9d3c5',.08,.24),wood=mat('#765239'),dark=mat('#18232c',.15,.36);
  const marble=mat('#c3bcb0',.14,.3),gold=mat('#cdac76',.65,.28),teal=mat('#28cad5',.44,.23);
  function box(x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;}
  function sphere(x,y,z,r,m){const o=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),m);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o;}
  function cylinder(x,y,z,r,h,m){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18),m);o.position.set(x,y,z);o.castShadow=true;scene.add(o);}
  box(0,-.15,0,22,.3,22,cream);
  box(0,4.7,0,22,.25,22,cream);
  box(0,2.3,-9,22,4.7,.3,wood);
  box(-10,2.3,0,.3,4.7,22,cream);
  box(10,2.3,0,.3,4.7,22,cream);
  // Two-tone geometric floor inspired by the Spazio Origine reception.
  const terracotta=mat('#a98267',.08,.25);
  for(let x=-9;x<10;x+=1.35)for(let z=-9;z<10;z+=1.35){
    const n=(Math.round((x+9)/1.35)+Math.round((z+9)/1.35))%2;
    box(x,.014,z,1.31,.022,1.31,n?cream:terracotta);
  }
  // Black stone pillars and arches, wood shelving.
  const stone=mat('#293638',.22,.33);
  for(const x of [-7,6]){
    box(x,2.15,-6.7,.85,4.3,.85,stone);
    box(x,4.2,-6.7,1.25,.35,1.25,stone);
  }
  box(1.5,2.45,-8.83,12,3.9,.18,stone);
  for(let x=-4.5;x<8;x+=1.1){
    box(x,2.5,-8.69,.08,3.9,.11,wood);
    for(let y of [1.15,2.1,3.1])box(x,y,-8.48,.9,.065,.46,wood);
  }
  // Reception desk, with branded timber fascia.
  box(1,.82,-5.8,9,1.5,1.55,wood);
  box(1,1.58,-5.8,9.3,.12,1.82,stone);
  box(1,.14,-4.99,9,.07,.09,teal);
  for(let x=-3;x<5.5;x+=.75)box(x,.83,-5.007,.022,1.32,.02,gold);
  function sign(message,x,y,z,width,height,{font='bold 106px Arial',color='#ecd6ab'}={}){
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=250;
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,1200,250);
    ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=font;ctx.fillText(message,600,125);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
    mesh.position.set(x,y,z);scene.add(mesh);
  }
  sign('SPAZIO ORIGINE',1,1.02,-4.99,6.6,.65,{font:'bold 116px Georgia',color:'#2a1e13'});
  sign('SPAZIO ORIGINE',1.5,3.55,-8.55,6.5,.9,{font:'bold 112px Georgia'});
  // Computer and ornaments on desk.
  box(-1,1.98,-6.12,1.25,.8,.07,dark);
  box(-1,1.59,-6.2,.08,.15,.32,gold);
  for(const x of [4.5,5.25])cylinder(x,1.88,-6.1,.14,.58,cream);
  // Lounge and plants.
  const navy=mat('#22384a'),green=mat('#628362');
  for(const z of [1.8,5]){
    box(-6,.5,z,3.1,.75,1.35,navy);
    box(-6,1.1,z-.58,3.1,.95,.25,navy);
    box(-7.5,.76,z,.25,.65,1.5,navy);
  }
  for(const [x,z] of [[-8,0],[8,1],[7,-6]]){
    cylinder(x,.35,z,.48,.7,wood);
    cylinder(x,1.1,z,.09,.9,wood);
    for(let n=0;n<7;n++){
      const a=n*Math.PI*2/7;sphere(x+Math.cos(a)*.5,1.55+(n%3)*.12,z+Math.sin(a)*.5,.33,green);
    }
  }
  // Stylized receptionist and guest for training interactions.
  function person(x,z,coat,angle=0){
    const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=angle;scene.add(group);
    const suit=mat(coat),skin=mat('#c9906d'),hair=mat('#241915');
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.72,4,12),suit);body.position.y=1.18;group.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.235,18,14),skin);head.position.y=1.94;group.add(head);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.24,18,12),hair);cap.scale.y=.52;cap.position.y=2.075;group.add(cap);
    for(const s of [-1,1]){
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(.13,.14,.86,12),suit);leg.position.set(.18*s,.45,0);group.add(leg);
      const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.6,4,9),suit);arm.position.set(.44*s,1.21,0);arm.rotation.z=-.15*s;group.add(arm);
    }
  }
  person(1.8,-7,'#24395b');
  person(2.4,-3.15,'#1a283e',Math.PI);
  box(3,.48,-3.2,.52,.9,.38,dark);
  // Warm ceiling rings and ambient lights.
  scene.add(new THREE.HemisphereLight(0xc6e3f2,0x53432d,2.5));
  const sunlight=new THREE.DirectionalLight(0xffdfb2,3.4);
  sunlight.position.set(5,10,8);sunlight.castShadow=true;scene.add(sunlight);
  for(const x of [-6,0,6]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.055,10,55),new THREE.MeshBasicMaterial({color:0xffdfa6}));
    ring.position.set(x,4,-1.4);ring.rotation.x=Math.PI/2;scene.add(ring);
    const lamp=new THREE.PointLight(0xffd0a0,18,11);lamp.position.set(x,3.75,-1.4);scene.add(lamp);
  }
  const held=new Set();const keys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
  function down(e){if(['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName))return;
    const k=e.key.toLowerCase();if(keys.includes(k)){held.add(k);if(k.startsWith('arrow'))e.preventDefault();}}
  function up(e){held.delete(e.key.toLowerCase())}
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);
  let raf=0,disposed=false,then=0;
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
    controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(animate);
  }
  const resize=()=>{
    const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
    camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
  };
  const observer=new ResizeObserver(resize);observer.observe(container);resize();raf=requestAnimationFrame(animate);
  return {dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);controls.dispose();scene.traverse(o=>{o.geometry?.dispose();});renderer.dispose();renderer.domElement.remove();}};
}
