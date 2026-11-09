import * as THREE from 'three';

// The base architecture stays in src/scene.js. Each variant adds only the
// actors, desk equipment and props justified by the scenario narrative.
export const scenarioVisuals={
  vip:{camera:[4.5,2.3,1.5],target:[2.1,1.35,-4.9],extras:0,mood:'premium'},
  hall:{camera:[6.9,3.0,5.0],target:[1.1,1.4,-3.8],extras:4,mood:'busy'},
  data:{camera:[5.6,2.8,0.2],target:[3.8,1.55,-5.0],extras:0,mood:'information'},
  overbooking:{camera:[7.0,3.0,5.0],target:[1.4,1.5,-3.5],extras:4,mood:'busy'},
  revenue:{camera:[6.4,3.0,0.8],target:[4.8,1.5,-5.1],extras:0,mood:'analytic'},
  concierge:{camera:[0.5,2.65,2.8],target:[-1.2,1.25,-4.5],extras:2,mood:'welcoming'}
};
const words={
  it:{vip:'BENVENUTO',hall:'CHECK-IN · ATTESA',data:'STATO CAMERA DA VERIFICARE',overbooking:'DISPONIBILITÀ ESAURITA',revenue:'OCCUPAZIONE · TARIFFE',concierge:'ESPERIENZE ACCESSIBILI',simulated:'DATI DIMOSTRATIVI'},
  en:{vip:'WELCOME',hall:'CHECK-IN · WAITING',data:'VERIFY ROOM STATUS',overbooking:'FULLY BOOKED',revenue:'OCCUPANCY · RATES',concierge:'ACCESSIBLE EXPERIENCES',simulated:'ILLUSTRATIVE DATA'},
  es:{vip:'BIENVENIDOS',hall:'REGISTRO · ESPERA',data:'VERIFICAR ESTADO',overbooking:'COMPLETO',revenue:'OCUPACIÓN · TARIFAS',concierge:'EXPERIENCIAS ACCESIBLES',simulated:'DATOS ILUSTRATIVOS'},
  fr:{vip:'BIENVENUE',hall:'ACCUEIL · ATTENTE',data:'VÉRIFIER LA CHAMBRE',overbooking:'COMPLET',revenue:'OCCUPATION · TARIFS',concierge:'EXPÉRIENCES ACCESSIBLES',simulated:'DONNÉES ILLUSTRATIVES'}
};
const mat=(color,metalness=.02,roughness=.68)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const brass=mat('#b89c65',.68,.34),black=mat('#18232c',.15,.45),cocoa=mat('#64463b'),ivory=mat('#dcd9c8'),paper=mat('#eee9db');
const burgundy=mat('#72483f'),blue=mat('#364f60'),leather=mat('#8d6851');
const led=mat('#68b4b5',.12,.3);
function cuboid(parent,x,y,z,w,h,d,material){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function cylinder(parent,x,y,z,r,h,material){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),material);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function board(parent,x,y,z,width,height,back='#1b313e'){
  cuboid(parent,x,y,z,width,height,.05,mat(back));
  const face=new THREE.Group();face.position.set(x,y,z+.037);parent.add(face);return face;
}
function createText(parent,x,y,z,width,height,color='#f2eee6'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;
  const ctx=canvas.getContext('2d');const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
  m.position.set(x,y,z);parent.add(m);
  return {
    set(value){
      ctx.clearRect(0,0,1024,160);
      ctx.font='bold 72px Arial';ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(String(value),512,80,985);
      texture.needsUpdate=true;
    },
    dispose(){texture.dispose()}
  };
}
function bag(parent,x,z,{size=.52,color=black,angle=0}={}){
  const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=angle;parent.add(group);
  cuboid(group,0,.43,0,size,.75,size*.47,color);
  cuboid(group,0,.43,size*.245,size*.88,.13,.022,brass);
  const handle=cuboid(group,0,.94,0,size*.42,.035,.035,black);
  for(const side of [-1,1])cylinder(group,side*size*.17,.10,0,.065,.14,black);
  return group;
}
function queuePole(parent,x,z){
  const group=new THREE.Group();group.position.set(x,0,z);parent.add(group);
  cylinder(group,0,.04,0,.21,.08,black);
  cylinder(group,0,.54,0,.035,1.0,brass);
  cylinder(group,0,1.06,0,.09,.08,black);
  return group;
}
function deskScreen(parent,x,z,{wide=1.15}={}){
  cuboid(parent,x,1.66,z,wide,.62,.07,black);
  cuboid(parent,x,1.31,z-.07,.045,.18,.12,black);
  cuboid(parent,x,1.23,z-.12,.34,.027,.22,black);
  return board(parent,x,1.66,z+.043,wide*.88,.49,'#243e4c');
}
function brochure(parent,x,y,z){
  const b=cuboid(parent,x,y,z,.43,.016,.58,paper);b.rotation.y=-.2;
  const line=cuboid(parent,x,y+.01,z,.34,.008,.08,blue);line.rotation.y=-.2;
  return b;
}
function makeScenarioRoot(){return new THREE.Group()}
export function createScenarioVisuals(scene){
  const roots={};const labels={};const resources=[];
  let language='it',activeId='vip';
  for(const id of Object.keys(scenarioVisuals)){
    roots[id]=makeScenarioRoot();roots[id].visible=false;scene.add(roots[id]);
  }
  // VIP: one guest with carry-on luggage, an uncluttered luxury lobby.
  bag(roots.vip,3.17,-3.53,{size:.45,color:cocoa,angle:.14});
  const welcome=board(roots.vip,5.65,1.47,-4.38,1.8,.47);
  labels.vip=createText(welcome,0,0,.017,1.65,.24);
  // Lobby rush: realistic luggage, queue stanchions and public waiting information.
  for(const [x,z] of [[-1.1,-2.5],[.35,-2.5],[1.6,-1.8],[2.7,-1.65]]){
    queuePole(roots.hall,x,z);
  }
  cuboid(roots.hall,.8,1.06,-2.5,3.72,.035,.027,burgundy);
  bag(roots.hall,-.65,-.9,{size:.54,color:blue});
  bag(roots.hall,1.3,.1,{size:.4,color:cocoa});
  const hallInfo=board(roots.hall,5.15,1.54,-4.36,2.8,.62);
  labels.hall=createText(hallInfo,0,0,.019,2.56,.32);
  // Conflicting information: screen facing waiting guest, no fictional room status.
  const dataScreen=deskScreen(roots.data,5.8,-4.16,{wide:1.76});
  labels.data=createText(dataScreen,0,0,.016,1.47,.24);
  cuboid(roots.data,5.55,1.34,-4.07,.42,.015,.20,paper);
  // Overbooking: group luggage with an availability warning, not an empty lobby.
  for(const [x,z,size,color] of [[-1.5,-1.0,.55,cocoa],[-.7,-.55,.42,black],[.7,.0,.52,blue],[1.75,.25,.45,cocoa]]){
    bag(roots.overbooking,x,z,{size,color});
  }
  const full=board(roots.overbooking,5.6,1.6,-4.29,2.65,.58);
  labels.overbooking=createText(full,0,0,.016,2.42,.29);
  // Revenue management: distinguish this from front-office disputes.
  // Bars are clearly fictitious teaching graphics, not real hotel data.
  const revenue=deskScreen(roots.revenue,5.7,-4.22,{wide:2.32});
  labels.revenue=createText(revenue,0,.13,.017,1.95,.21);
  const levels=[.21,.34,.46,.38,.58,.61,.49];
  levels.forEach((v,i)=>{
    cuboid(revenue,-.83+i*.275,-.16+v*.19,.029,.17,v*.35,.021,i>4?brass:led);
  });
  const note=board(roots.revenue,5.7,1.08,-4.25,2.32,.20);
  labels.simulated=createText(note,0,0,.018,2.02,.12,'#edf4eb');
  // Concierge: brochures and a map at a realistic information stand.
  cuboid(roots.concierge,-1.15,.61,-3.35,1.8,1.22,.68,mat('#947450'));
  cuboid(roots.concierge,-1.15,1.23,-3.35,1.98,.07,.85,mat('#263936'));
  for(const x of [-1.55,-1.15,-.75]) brochure(roots.concierge,x,1.29,-3.3);
  const mapFace=board(roots.concierge,-1.15,2.12,-3.66,2.05,1.32,'#e1dac6');
  // A schematic local itinerary (not a claim about real routes).
  const path=[[-.73,-.12,.05],[-.45,.2,.05],[0,.08,.05],[.36,.38,.05],[.79,.15,.05]];
  const curve=new THREE.CatmullRomCurve3(path.map(p=>new THREE.Vector3(...p)));
  mapFace.add(new THREE.Mesh(new THREE.TubeGeometry(curve,30,.018,7,false),blue));
  for(const [x,y,z] of path){const dot=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),brass);dot.position.set(x,y,z);mapFace.add(dot);}
  labels.concierge=createText(mapFace,0,-.48,.025,1.83,.22,'#203a44');

  function apply(id){
    activeId=scenarioVisuals[id]?id:'vip';
    for(const [key,root] of Object.entries(roots))root.visible=key===activeId;
    setLanguage(language);
    return scenarioVisuals[activeId];
  }
  function setLanguage(nextLanguage){
    language=words[nextLanguage]?nextLanguage:'it';
    const copy=words[language];
    Object.entries(labels).forEach(([id,label])=>label.set(copy[id]));
  }
  function dispose(){
    for(const label of Object.values(labels))label.dispose();
    for(const root of Object.values(roots)){root.removeFromParent();root.traverse(obj=>obj.geometry?.dispose())}
  }
  apply('vip');
  return {apply,setLanguage,dispose,getCurrent:()=>activeId};
}
