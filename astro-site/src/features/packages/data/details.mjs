import fs from 'node:fs';import {resolve} from 'node:path';
import {getPackages} from './packages.mjs';
import {getTourPages} from '../../tours/data/details.mjs';
import {supportedLocales} from '../../../shared/config/languages.ts';
import {validatePackageDetails} from '../domain/details.ts';
export async function getPackagePages(){
 const [packages,tours]=await Promise.all([getPackages(),getTourPages()]);
 return packages.flatMap(record=>{
  // Legacy Packages has no img_count or metadata entries: its gallery is poster-only.
  const gallery=[record.poster],available=gallery.filter(src=>fs.existsSync(resolve(src.slice(1))));
  return supportedLocales.map(locale=>validatePackageDetails(record,locale,gallery,available,tours));
 });
}
