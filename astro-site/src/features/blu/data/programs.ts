import {getPackages} from '../../packages/data/packages.mjs';
import {mapBluPrograms} from '../domain/programs';
import type {BluLocale} from '../domain/campaign';
/** Existing catalog interface owns provider access and parent/member validation. */
export async function getBluPrograms(locale:BluLocale){
 return mapBluPrograms(await getPackages(),locale);
}
