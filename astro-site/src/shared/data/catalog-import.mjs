import { normalizeId, isActive, numeric, required } from '../domain/offers.ts';

export const importColumns = {
  trips: ['id','slug','adult_price','child_price','min_pax','location','category','featured','badge_it','badge_en','is_active','source_order'],
  packages: ['id','slug','adult_price','child_price','min_pax','location','category','badge_key','is_active','source_order'],
  package_trips: ['package_id','trip_id','position'],
  trip_addons: ['trip_id','addon_id','label_it','label_en','price','is_active','source_order'],
  public_settings: ['key','val_it','val_en','is_active','start_date','end_date','source_order'],
};
const flag = (value, context) => {
  if (!['true','false','1','0'].includes(String(value).toLowerCase())) throw new Error(`[${context}] Invalid boolean ${JSON.stringify(value)}.`);
  return isActive(value);
};
function money(value, field, context) {
  numeric(value, field, context);
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(value)) throw new Error(`[${context}] ${field} does not fit numeric(12,2) exactly.`);
  return value; // Do not round source amounts silently.
}
function offers(rows, idField, kind) {
  const seen = new Set();
  return rows.flatMap((row, source_order) => {
    if (!row[idField] && !isActive(row.is_active)) return [];
    const id = normalizeId(required(row,idField,kind));
    if (seen.has(id)) throw new Error(`[${kind}:${id}] Duplicate ID/slug.`);
    seen.add(id);
    const context=`${kind}:${id}`;
    const min_pax = row.min_pax ? numeric(row.min_pax,'min_pax',context) : 1;
    if (!Number.isSafeInteger(min_pax)||min_pax<1||min_pax>2147483647) throw new Error(`[${context}] Invalid positive integer min_pax.`);
    const location=required(row,'location',context).toLowerCase(),category=required(row,'category',context).toLowerCase();
    for (const [field,value] of [['id',id],['location',location],['category',category]]) {
      if (!/^[a-z0-9_-]+$/.test(value)) throw new Error(`[${context}] Invalid ${field}.`);
    }
    return [{id,slug:id,adult_price:money(required(row,'adult_price',context),'adult_price',context),
      child_price:money(required(row,'child_price',context),'child_price',context),min_pax,location,category,
      ...(kind==='trips'?{featured:flag(row.featured,`${context}:featured`),badge_it:row.badge_it||'',badge_en:row.badge_en||''}:{badge_key:row.badge_key||''}),
      is_active:flag(row.is_active,`${context}:is_active`),source_order}];
  });
}
export function createCatalogImport(sources) {
  const trips=offers(sources.Trips_Prices,'trip_id','trips');
  const packages=offers(sources.Packages,'package_id','packages');
  const tripIds=new Set(trips.map(row=>row.id)),packageIds=new Set(packages.map(row=>row.id));
  const package_trips=[];
  for (const row of sources.Packages.filter(row=>row.package_id)) {
    const package_id=normalizeId(row.package_id);
    if (!packageIds.has(package_id)) throw new Error(`[package_trips:${package_id}] Unknown package.`);
    const seen=new Set();
    for (const [position,trip_id] of (row.included_trip_ids||'').split(',').map(id=>normalizeId(id)).filter(Boolean).entries()) {
      if (!tripIds.has(trip_id)) throw new Error(`[package_trips:${package_id}] Unknown trip_id ${trip_id}.`);
      if (seen.has(trip_id)) throw new Error(`[package_trips:${package_id}] Duplicate trip_id ${trip_id}.`);
      seen.add(trip_id);package_trips.push({package_id,trip_id,position});
    }
  }
  const seenAddons=new Set();
  const trip_addons=sources.Trip_Addons.map((row,source_order)=>{
    const addon_id=required(row,'addon_id','trip_addons'),trip_id=normalizeId(required(row,'trip_id',`trip_addons:${addon_id}`));
    const context=`trip_addons:${trip_id}/${addon_id}`,key=JSON.stringify([trip_id,addon_id]);
    if (!tripIds.has(trip_id)) throw new Error(`[${context}] Unknown trip_id.`);
    if (seenAddons.has(key)) throw new Error(`[${context}] Duplicate addon ID within trip.`);
    seenAddons.add(key);
    return {trip_id,addon_id,label_it:required(row,'label_it',context),label_en:required(row,'label_en',context),
      price:money(required(row,'price',context),'price',context),is_active:flag(row.is_active,`${context}:is_active`),source_order};
  });
  const seenSettings=new Set();
  const public_settings=sources.Global_Settings.flatMap((row,source_order)=>{
    const key=required(row,'key','public_settings');
    if (seenSettings.has(key)) throw new Error(`[public_settings:${key}] Duplicate key.`);
    seenSettings.add(key);
    if (key!=='promo_banner') return [];
    return [{key,val_it:required(row,'val_it',`public_settings:${key}`),val_en:required(row,'val_en',`public_settings:${key}`),
      is_active:flag(row.is_active,`public_settings:${key}:is_active`),start_date:row.start_date||'',end_date:row.end_date||'',source_order}];
  });
  return {trips,packages,package_trips,trip_addons,public_settings};
}
