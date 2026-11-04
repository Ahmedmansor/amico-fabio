import {getPackages} from '../../packages/data/packages.mjs';
import {getTrips} from '../../tours/data/trips.mjs';
import {getHomeContent} from '../../home/data/home';
import {programAdventures} from '../domain/journey';
import type {BluLocale} from '../domain/campaign';

export async function getBluJourney(locale:BluLocale) {
  const [packages,trips] = await Promise.all([getPackages(),getTrips()]);
  const home = getHomeContent(locale);
  const biography=home.global.who_is_fabio_content.replace(/ style="[^"]*"/g,'');
  const paragraphs=[...biography.matchAll(/<p>[\s\S]*?<\/p>/g)];
  const leadEnd=(paragraphs[2]?.index||0)+(paragraphs[2]?.[0].length||0);
  if(!leadEnd) throw new Error('[blu:biography] Missing introduction.');
  return {
    programs: packages.map(program => ({id:program.id,adventures:programAdventures(program.includedTripIds,trips)})),
    biographyLead:biography.slice(0,leadEnd),
    biography:biography.slice(leadEnd),
    biographyTitle: home.global.who_is_fabio_btn,
    reviews: home.reviews,
  };
}
