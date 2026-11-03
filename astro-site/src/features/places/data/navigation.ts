import {getCollection} from 'astro:content';
import type {Locale} from '../../../shared/config/languages';
export async function getPlaceNavigation(locale:Locale){return (await getCollection('places')).some(entry=>entry.data.lang===locale&&entry.data.kind==='country')?`/${locale}/egypt/`:undefined;}
