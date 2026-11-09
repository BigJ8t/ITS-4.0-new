import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';

// Source asset licence: CC0 MakeHuman-based models, see README and licenses.
// Characters are styled for the hotel context; not scans of real employees/guests.
const people = [
  {role:'staff',position:[2.0,0,-6.72],rotation:0,gender:'female',heightMeters:1.68,
    clothes:['shirt','jacket','skirt','shoes','hair_ponytail01'],
    colors:{shirt:'#f3efe7',jacket:'#172c41',skirt:'#172c41',shoes:'#262626',hair_ponytail01:'#372820'}},
  {role:'guest',position:[2.35,0,-3.60],rotation:Math.PI,gender:'male',heightMeters:1.82,
    clothes:['shirt','jacket','jeans','shoes','hair_short04'],
    colors:{shirt:'#f5f1e9',jacket:'#433b37',jeans:'#262f39',shoes:'#2a2320',hair_short04:'#33291f'}}
];
const basePath=import.meta.env.BASE_URL+'models/humans/';
function allMeshes(root){const output=[];root.traverse(o=>{if(o.isSkinnedMesh)output.push(o)});return output}
function nameKey(v){return String(v).replace(/\W/g,'_')}
function genderMorph(root,gender){
  root.traverse(o=>{
    if(!o.morphTargetInfluences||!o.morphTargetDictionary)return;
    for(const name of ['gender_female','gender_male']) {
      const index=o.morphTargetDictionary[name];
      if(index!==undefined)o.morphTargetInfluences[index]=(gender==='female'&&name==='gender_female'||gender==='male'&&name==='gender_male')?1:0;
    }
  });
}
function bindPart(part,body){
  const old=part.skeleton;const skeleton=body.skeleton;
  if(!old||!skeleton)return false;
  const boneIds=new Map();
  skeleton.bones.forEach((b,i)=>boneIds.set(nameKey(b.name),i));
  const mapping=old.bones.map(b=>boneIds.get(nameKey(b.name)));
  if(mapping.some(v=>v===undefined)){console.warn('Avatar: some garment bones are missing');return false;}
  const geometry=part.geometry.clone();
  const indices=geometry.getAttribute('skinIndex');
  if(indices) {
    for(let i=0;i<indices.count;i++)for(let j=0;j<indices.itemSize;j++){
      const value=indices.getComponent(i,j);
      indices.setComponent(i,j,mapping[value] ?? 0);
    }
    indices.needsUpdate=true;
  }
  part.geometry=geometry;
  part.bind(skeleton,body.bindMatrix);
  return true;
}
function hideCoveredBody(mesh,role){
  const g=mesh.geometry;
  const zones=g.getAttribute('_cczone');const index=g.getIndex();
  if(!zones||!index)return;
  // MakeHuman CCZONE: feet=1, legs=2, hips=4, torso=8, coat=16,
  // shirt=512, jacket=4096. Keep visible head, neck, hands.
  const cover=(1|2|4|8|16|512|4096);
  const original=index.array;
  const filtered=[];
  for(let i=0;i<original.length;i+=3){
    const tri=[original[i],original[i+1],original[i+2]];
    const covered=tri.every(v=>(zones.getX(v)&cover)!==0);
    if(!covered)filtered.push(...tri);
  }
  if(filtered.length>0)g.setIndex(filtered);
}
// Modern hospitality wardrobe: each role has its own coherent business palette.
// The fabric textures affect surface response, never anatomical proportions.
const wardrobes = {
  signature: {
    staff:{shirt:'#f3efe7',jacket:'#172c41',skirt:'#172c41',shoes:'#262626',hair_ponytail01:'#372820'},
    guest:{shirt:'#f5f1e9',jacket:'#433b37',jeans:'#262f39',shoes:'#2a2320',hair_short04:'#33291f'}
  },
  heritage: {
    staff:{shirt:'#fff4e5',jacket:'#766147',skirt:'#5b4b3e',shoes:'#2e271f',hair_ponytail01:'#3a281f'},
    guest:{shirt:'#fbf2e8',jacket:'#293e43',jeans:'#3d3c3a',shoes:'#332820',hair_short04:'#2c251e'}
  }
};
const fabricTextures=new Map();
function fabricBump(style){
  if(fabricTextures.has(style))return fabricTextures.get(style);
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');
  const image=ctx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    // Deterministic fine textile weave, neutral bump (not a fabric color overlay).
    const weave=style==='shirt' ? (Math.sin(x*.8)+Math.cos(y*1.1))*1.6
      : (Math.sin(x*1.5)+Math.cos(y*1.7))*3.5;
    const n=Math.max(0,Math.min(255,128+weave));
    const off=(y*128+x)*4;
    image.data[off]=n;image.data[off+1]=n;image.data[off+2]=n;image.data[off+3]=255;
  }
  ctx.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(5,5);
  fabricTextures.set(style,texture);
  return texture;
}
function dressMaterial(source,part,color){
  const m=source.clone();
  m.color.set(color);
  if(part.startsWith('hair_')){
    m.metalness=0;m.roughness=.84;
  } else if(part==='shoes'){
    m.metalness=.03;m.roughness=.49;
  } else {
    m.metalness=0;
    m.roughness=part==='shirt'?.77:.91;
    m.bumpMap=fabricBump(part==='shirt'?'shirt':'suit');
    m.bumpScale=part==='shirt'?.009:.018;
  }
  m.envMapIntensity=.42;
  m.needsUpdate=true;
  return m;
}
function toneClothing(root,color,item){
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.material=Array.isArray(obj.material)
      ?obj.material.map(m=>dressMaterial(m,item,color))
      :dressMaterial(obj.material,item,color);
    obj.castShadow=true;obj.receiveShadow=true;obj.frustumCulled=false;
  });
}
function prepareBodyMaterials(main,gender){
  // Clone face/skin materials per character: changes must never leak to the
  // other actor through shared GLTF material references.
  main.traverse(o=>{
    if(!o.isMesh)return;
    const materials=Array.isArray(o.material)?o.material:[o.material];
    const copies=materials.map(m=>{
      const c=m.clone();
      const role=(m.name||'').toLowerCase();
      if(role.includes('skin')){
        c.roughness=.78;
        c.metalness=0;
        c.color.set(gender==='female'?'#eac4ab':'#dcb296');
      }else if(role.includes('iris')){
        c.roughness=.21;c.color.set(gender==='female'?'#635947':'#5d6c63');
      }else if(role.includes('cornea')){
        c.roughness=.11;c.metalness=0;
      }
      return c;
    });
    o.material=Array.isArray(o.material)?copies:copies[0];
  });
}
export function installHumanCharacters(scene,isDisposed=()=>false){
  const state={mixers:[],roots:[],extras:[],wardrobeParts:[],status:'loading',motion:true,style:'signature',scenario:'vip'};
  const loader=new GLTFLoader();
  const needed=['base_body_anim',...new Set(people.flatMap(p=>p.clothes.map(c=>c.startsWith('hair_')?c:'clothing_'+c)))];
  const templates={};
  const loading=Promise.all(needed.map(async name=>{
    templates[name]=await loader.loadAsync(basePath+name+'.glb');
  })).then(()=>{
    if(isDisposed())return;
    for(const spec of people){
      const main=cloneSkinned(templates.base_body_anim.scene);
      const body=allMeshes(main).find(m=>m.morphTargetDictionary)||allMeshes(main)[0];
      if(!body){console.warn('Avatar model missing skinned body');continue;}
      // Each avatar needs its OWN geometry. Skinned clones otherwise share
      // a body geometry, so cutting covered triangles on one avatar can
      // remove visible anatomy on the other.
      body.geometry = body.geometry.clone();
      genderMorph(main,spec.gender);
      prepareBodyMaterials(main,spec.gender);
      hideCoveredBody(body,spec.role);
      for(const item of spec.clothes){
        const file=item.startsWith('hair_')?item:'clothing_'+item;
        const group=cloneSkinned(templates[file].scene);
        for(const mesh of allMeshes(group)){
          mesh.removeFromParent();
          mesh.position.copy(body.position);
          mesh.quaternion.copy(body.quaternion);
          mesh.scale.copy(body.scale);
          if(!bindPart(mesh,body))continue;
          body.parent.add(mesh);
          genderMorph(mesh,spec.gender);
          toneClothing(mesh,wardrobes[state.style][spec.role][item],item);
          mesh.userData.outfitItem=item;
          state.wardrobeParts.push({mesh,role:spec.role,item});
        }
      }
      main.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(main);
      const height=Math.max(.1,bounds.max.y-bounds.min.y);
      // Uniform, anatomically credible adult heights. Never stretch a
      // model independently by X/Y/Z: that distorts head, legs and shoulders.
      const scaledHeight=spec.heightMeters;
      if(height < .65 || height > 3.5) {
        console.warn('Unexpected source character height',spec.role,height);
      }
      main.scale.setScalar(scaledHeight/height);
      main.rotation.y=spec.rotation;
      main.updateMatrixWorld(true);
      const finalBox=new THREE.Box3().setFromObject(main);
      main.position.set(spec.position[0],-finalBox.min.y,spec.position[2]);
      // Raise only as much as the measured footwear requires: character
      // feet must visibly meet the floor, without floating or sinking.
      main.traverse(node=>{
        if(node.isSkinnedMesh || node.isMesh){
          node.castShadow=true;
          node.receiveShadow=true;
          node.frustumCulled=false;
        }
      });
      main.userData.characterRole=spec.role;
      scene.add(main);state.roots.push(main);
      if(templates.base_body_anim.animations.length){
        const mixer=new THREE.AnimationMixer(main);
        const clips=templates.base_body_anim.animations;
        // Avoid playing an arbitrary first clip (possibly walking or
        // running in place) at a reception counter.
        const idle=clips.find(c=>/idle|stand|breath|rest/i.test(c.name));
        if(idle){
          const action=mixer.clipAction(idle);
          action.setEffectiveWeight(.5);
          action.play();
          state.mixers.push(mixer);
        }
      }
    }
    // Additional visitors come from already-loaded, licensed rigged characters.
    // They are reused across scenarios rather than downloaded multiple times.
    const locations=[
      [-1.28,-2.30,.94,.26],[-.26,-1.61,.97,-.16],
      [.86,-.84,1.02,-.12],[1.86,.18,.96,.1]
    ];
    for(let i=0;i<locations.length;i++){
      const source=state.roots[i%2===0?1:0];
      if(!source)continue;
      const actor=cloneSkinned(source);
      actor.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const original=Array.isArray(mesh.material)?mesh.material:[mesh.material];
        const copies=original.map(m=>m.clone());
        mesh.material=Array.isArray(mesh.material)?copies:copies[0];
        const item=mesh.userData.outfitItem;
        if(item){
          const tint= i%2===0
            ? {shirt:'#eee5d9',jacket:'#384b5c',jeans:'#50535b',shoes:'#342c29',hair_short04:'#3b2b20'}[item]
            : {shirt:'#e9e2cf',jacket:'#736257',skirt:'#61534f',shoes:'#2f2a25',hair_ponytail01:'#47372c'}[item];
          if(tint)copies.forEach(m=>m.color?.set(tint));
        }
        mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
      });
      const [x,z,factor,angle]=locations[i];
      actor.scale.multiplyScalar(factor);
      actor.position.set(x,source.position.y,z);
      actor.rotation.y=angle;
      actor.visible=false;
      scene.add(actor);
      state.extras.push(actor);
      state.roots.push(actor);
    }
    applyScenarioPeople();
    state.status='ready';
  }).catch(err=>{
    state.status='failed';
    console.error('Could not load licensed MakeHuman avatars. Scenario remains usable.',err);
  });
  function applyScenarioPeople(){
    const mode=state.scenario;
    const [staff,guest]=state.roots;
    if(staff)staff.visible=true;
    if(guest)guest.visible=mode!=='revenue';
    const count=mode==='hall'||mode==='overbooking'?4:mode==='concierge'?2:0;
    state.extras.forEach((actor,index)=>{
      actor.visible=index<count;
      if(!actor.visible)return;
      if(mode==='overbooking'){
        const spots=[[-1.4,-2.0],[-.3,-1.4],[.8,-.7],[1.95,.15]];
        actor.position.x=spots[index][0];actor.position.z=spots[index][1];
      }else if(mode==='concierge'){
        const spots=[[-2.25,-2.35],[-.45,-1.9]];
        actor.position.x=spots[index]?.[0]??0;actor.position.z=spots[index]?.[1]??0;
      }else{
        const spots=[[-1.25,-2.65],[-.35,-2.0],[.7,-1.25],[1.8,-.5]];
        actor.position.x=spots[index][0];actor.position.z=spots[index][1];
      }
    });
  }
  return {
    setScenario(id){state.scenario=id;applyScenarioPeople()},
    update(dt){if(state.motion)state.mixers.forEach(m=>m.update(dt))},
    setReducedMotion(v){state.motion=!v},
    getStatus(){return state.status},
    setStyle(style){
      if(!Object.prototype.hasOwnProperty.call(wardrobes,style))return;
      state.style=style;
      for(const part of state.wardrobeParts) {
        const color=wardrobes[style][part.role][part.item];
        if(!color)continue;
        const mats=Array.isArray(part.mesh.material)?part.mesh.material:[part.mesh.material];
        for(const mat of mats)mat.color.set(color);
      }
    },
    dispose(){state.mixers.forEach(m=>m.stopAllAction());state.roots.forEach(r=>r.removeFromParent())}
  };
}
