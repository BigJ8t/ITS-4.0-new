import { mkdir, stat, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const upstream = 'https://raw.githubusercontent.com/kblood/CharacterCreator/852e48f316b90a0937234886630e4fb4cdfd1f78/output/';
const modelNames = [
  'base_body_anim', 'hair_ponytail01', 'hair_short04',
  'clothing_shirt', 'clothing_jeans', 'clothing_shoes',
  'clothing_skirt', 'clothing_jacket'
];
const dest = 'public/models/humans';
await mkdir(dest, {recursive: true});
for (const name of modelNames) {
  const file = join(dest, name + '.glb');
  try {
    const data = await readFile(file);
    if (data.length > 100 && data.subarray(0, 4).toString() === 'glTF') {
      console.log('Cached:', name); continue;
    }
  } catch {}
  console.log('Downloading CC0 MakeHuman asset:', name);
  const response = await fetch(upstream + name + '.glb');
  if (!response.ok) throw new Error('Asset unavailable: '+name+' ('+response.status+')');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 200 || bytes.subarray(0,4).toString() !== 'glTF') throw new Error('Invalid GLB: '+name);
  await writeFile(file, bytes);
  console.log('Saved',name,bytes.length,'bytes');
}
