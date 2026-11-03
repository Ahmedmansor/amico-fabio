import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const folder=process.argv[2];if(!folder)throw new Error('Supply the imagegen output folder.');
const assets=[
  {name:'The Big Blue',source:'exec-fd158706-9558-4177-ab7c-029877cac867.png',target:'src/shared/assets/catalog/packages/sharm/il_grande_blu/poster.webp'},
  {name:'Sharm Confidential',source:'exec-1d5cc3c2-5584-4b8b-8222-3f44296539d0.png',target:'src/shared/assets/catalog/packages/sharm/sharm_confidential/poster.webp'},
];
const results=[];
for(const asset of assets){
  const source=await readFile(resolve(folder,asset.source)),before=await readFile(asset.target);
  const output=await sharp(source).resize({width:1200,withoutEnlargement:true}).webp({quality:78,effort:6}).toBuffer();
  await writeFile(asset.target,output);
  results.push({...asset,width:1200,height:800,format:'webp',quality:78,sourceBytes:source.length,previousBytes:before.length,webpBytes:output.length,sha256:createHash('sha256').update(output).digest('hex')});
  console.log(`${asset.name}: 1200x800 WebP, ${(output.length/1024).toFixed(1)} KiB.`);
}
await writeFile(new URL('./extra-posters.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
