import fs from 'node:fs';
import {resolve} from 'node:path';
export function availableOfferImages(images) {
 return Object.values(images).filter(src=>src.startsWith('/assets/images/')&&fs.existsSync(resolve('src/features/sharm-offer/presentation/assets',src.slice('/assets/images/'.length))));
}
