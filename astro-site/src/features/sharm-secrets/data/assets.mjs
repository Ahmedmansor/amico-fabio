import fs from 'node:fs';
import {resolve} from 'node:path';
import {guideImageLinks} from '../domain/secrets.ts';
// Node filesystem checks stay in data, following the existing catalog/legal adapters.
export function getAvailableGuideImages(content,locale) {
  const root=resolve('src/features/sharm-secrets/presentation/assets');
  const images=guideImageLinks(content).filter(({src})=>src.startsWith('/assets/images/')&&fs.existsSync(resolve(root,src.slice('/assets/images/'.length)))).map(({src})=>src);
  for(const name of ['section-hero','section-2','section-3','section-4','section-5','section-6'])if(!fs.existsSync(resolve(root,`10-comandamenti-images/secrets-bg/${name}.webp`)))throw new Error(`[sharm-secrets:${locale}] Missing background ${name}.`);
  return images;
}
