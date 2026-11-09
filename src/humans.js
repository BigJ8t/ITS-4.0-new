import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';

// Source asset licence: CC0 MakeHuman-based models, see README and licenses.
// Characters are styled for the hotel context; not scans of real employees/guests.
const people = [
  {role:'staff',position:[2.0,0,-6.72],rotation:0,gender:'female',heightMeters:1.68,
    clothes:['shirt','jacket','skirt','shoes','hair_ponytail01'],
    colors:{shirt:'#f2f2f0',jacket:'#1e314c',skirt:'#1e314c',shoes:'#28282d',hair_ponytail01:'#30221c'}},
  {role:'guest',position:[2.35,0,-3.60],rotation:Math.PI,gender:'male',heightMeters:1.82,
    clothes:['shirt','jacket','jeans','shoes','hair_short04'],
    colors:{shirt:'#f0eee9',jacket:'#5a4d43',jeans:'#30333b',shoes:'#382821',hair_short04:'#28211c'}}
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
function toneClothing(root,color){
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    const updated=mats.map(m=>{
      const copy=m.clone();
      if(copy.color)copy.color.set(color);
      copy.metalness=Math.min(copy.metalness??0,.12);copy.roughness=.82;
      return copy;
    });
    obj.material=Array.isArray(obj.material)?updated:updated[0];
    obj.castShadow=true;obj.receiveShadow=true;obj.frustumCulled=false;
  });
}
export function installHumanCharacters(scene,isDisposed=()=>false){
  const state={mixers:[],roots:[],status:'loading',motion:true};
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
          toneClothing(mesh,spec.colors[item]);
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
    state.status='ready';
  }).catch(err=>{
    state.status='failed';
    console.error('Could not load licensed MakeHuman avatars. Scenario remains usable.',err);
  });
  return {
    update(dt){if(state.motion)state.mixers.forEach(m=>m.update(dt))},
    setReducedMotion(v){state.motion=!v},
    getStatus(){return state.status},
    dispose(){state.mixers.forEach(m=>m.stopAllAction());state.roots.forEach(r=>r.removeFromParent())}
  };
}
