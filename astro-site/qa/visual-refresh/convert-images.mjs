// Deterministic WebP encoding only; artwork is generated with imagegen.
// node qa/visual-refresh/convert-images.mjs <generated-image-folder>
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const input=process.argv[2];if(!input)throw new Error('Supply the folder containing the six generated PNGs.');
const assets=[
  {name:'Dolce Vita',source:'exec-e584443b-c6c5-4471-95a3-8a94d79b524a.png',target:'src/shared/assets/catalog/packages/sharm/dolce_vita_family/poster.webp',width:1200},
  {name:'Indiana Jones',source:'exec-ee6eff57-ded1-4db5-a93e-20c5c756ad0b.png',target:'src/shared/assets/catalog/packages/sharm/indiana_jones_adventure/poster.webp',width:1200},
  {name:'One Thousand and One Nights',source:'exec-fc913a20-bbad-4ef3-8c62-bb2ed82fcca8.png',target:'src/shared/assets/catalog/packages/sharm/mille_e_una_notte/poster.webp',width:1200},
  {name:'Homepage — Red Sea',source:'exec-3cb8a257-0c60-4d1a-8497-9d23b674ef3e.png',target:'src/features/home/presentation/assets/comandamenti-images/1.webp',width:1440},
  {name:'Homepage — Giza',source:'exec-c433c91d-c3b4-4d3a-8a16-5000b6de3877.png',target:'src/features/home/presentation/assets/comandamenti-images/2.webp',width:1440},
  {name:'Homepage — Sinai',source:'exec-b8b05db1-23d2-450a-924f-1811e6928822.png',target:'src/features/home/presentation/assets/comandamenti-images/3.webp',width:1440},
];
const results=[];
for(const asset of assets){
  const source=await readFile(resolve(input,asset.source));
  const before=await readFile(asset.target);
  const output=await sharp(source).rotate().resize({width:asset.width,withoutEnlargement:true}).webp({quality:78,effort:6}).toBuffer();
  await writeFile(asset.target,output);
  const metadata=await sharp(output).metadata();
  results.push({...asset,sourceBytes:source.length,previousBytes:before.length,webpBytes:output.length,height:metadata.height,quality:78,format:metadata.format,sha256:createHash('sha256').update(output).digest('hex')});
}
await writeFile(new URL('./assets.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
for(const item of results)console.log(`${item.name}: ${item.width}x${item.height} WebP, ${(item.webpBytes/1024).toFixed(1)} KiB (PNG ${(item.sourceBytes/1024).toFixed(0)} KiB).`);
