import countries from './content/countries.json';
import {languages, type Locale} from '../../../shared/config/languages';

let regions: Map<string,string> | undefined;
function countryRegions() {
  if (regions) return regions;
  const names = new Intl.DisplayNames(['en'], {type:'region'});
  regions = new Map<string,string>();
  for(let a=65;a<=90;a++) for(let b=65;b<=90;b++) {
    const code=String.fromCharCode(a,b), name=names.of(code);
    if(name && name!==code) regions.set(name,code);
  }
  for(const [name,code] of Object.entries({'Bosnia and Herzegovina':'BA','Czech Republic':'CZ','Palestine':'PS','Turkey':'TR'}))regions.set(name,code);
  return regions;
}

/** Public reference-data access for consumers sharing booking nationality choices. */
export function getBookingCountries(locale?:Locale) {
  if(!locale||locale==='it'||locale==='en')return countries;
  const display=new Intl.DisplayNames([languages[locale].languageTag],{type:'region'});
  return countries.map(country=>{
    if(country.t==='Scotland')return {...country,t:locale==='es'?'Escocia':'Escócia'};
    const code=countryRegions().get(country.t), label=code&&display.of(code);
    if(!label)throw Error(`[countries:${country.t}] Missing translation for ${locale}.`);
    return {...country,t:label};
  });
}
