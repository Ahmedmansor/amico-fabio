const columns = {
  trips: 'id,slug,adult_price,child_price,min_pax,location,category,featured,badge_it,badge_en,is_active,source_order',
  packages: 'id,slug,adult_price,child_price,min_pax,location,category,badge_key,is_active,source_order',
  package_trips: 'package_id,trip_id,position',
  trip_addons: 'trip_id,addon_id,label_it,label_en,price,is_active,source_order',
  public_settings: 'key,val_it,val_en,is_active,start_date,end_date,source_order',
};
const optional = new Set(['badge_it','badge_en','badge_key','start_date','end_date']);
function strings(table, row) {
  const context=`Supabase:${table}:${row?.id||row?.addon_id||row?.key||row?.package_id||'(missing ID)'}`;
  if (!row || typeof row!=='object' || Array.isArray(row)) throw new Error(`[${context}] Expected a catalog record.`);
  return Object.fromEntries(columns[table].split(',').map(field=>{
    const value=row[field];
    if (value===null && optional.has(field)) return [field,''];
    if (!['string','number','boolean'].includes(typeof value) || (typeof value==='number'&&!Number.isFinite(value))) {
      throw new Error(`[${context}] Missing/invalid field ${field}.`);
    }
    if(['is_active','featured'].includes(field)&&typeof value!=='boolean')throw new Error(`[${context}] Invalid boolean field ${field}.`);
    if(['position','source_order','min_pax'].includes(field)&&(!Number.isSafeInteger(value)||value<(field==='min_pax'?1:0)))throw new Error(`[${context}] Invalid integer field ${field}.`);
    return [field,String(value).trim()];
  }));
}

/** Build-time read-only REST adapter; the publishable key is sent only as a header.
 * @param {{url:string,publishableKey:string,fetchImpl?:typeof fetch,pageSize?:number,timeoutMs?:number}} options
 */
export function createSupabaseProvider({url,publishableKey,fetchImpl=fetch,pageSize=250,timeoutMs=30000}) {
  let origin;
  try { origin=new URL(url); } catch { throw new Error('[Supabase] Missing/invalid CATALOG_SUPABASE_URL.'); }
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/') throw new Error('[Supabase] CATALOG_SUPABASE_URL must be an HTTPS project origin.');
  if(typeof publishableKey!=='string'||!publishableKey.startsWith('sb_publishable_')||/\s/.test(publishableKey)) throw new Error('[Supabase] A modern sb_publishable_ key is required. Privileged/legacy keys are not accepted.');
  if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>1000)throw new Error('[Supabase] Invalid page size.');
  const requests=new Map(),logical=new Map();
  async function allRows(table) {
    const result=[];let expectedTotal;
    while(true){
      const request=new URL(`/rest/v1/${table}`,origin);
      request.searchParams.set('select',columns[table]);
      request.searchParams.set('order',table==='package_trips'?'package_id.asc,position.asc':'source_order.asc');
      request.searchParams.set('offset',String(result.length));request.searchParams.set('limit',String(pageSize));
      if(table!=='package_trips')request.searchParams.set('is_active','eq.true');
      if(table==='public_settings')request.searchParams.set('key','eq.promo_banner');
      let response;
      try { response=await fetchImpl(request,{headers:{apikey:publishableKey,Prefer:'count=exact'},signal:AbortSignal.timeout(timeoutMs)}); }
      catch { throw new Error(`[Supabase:${table}] Network request failed or timed out.`); }
      if(!response.ok)throw new Error(`[Supabase:${table}] HTTP ${response.status}.`);
      let rows;
      try { rows=await response.json(); } catch { throw new Error(`[Supabase:${table}] Invalid JSON response.`); }
      if(!Array.isArray(rows))throw new Error(`[Supabase:${table}] Expected a row array.`);
      const range=response.headers.get('content-range')?.match(/^(?:(\d+)-(\d+)|\*)\/(\d+)$/);
      if(!range)throw new Error(`[Supabase:${table}] Missing exact pagination count.`);
      const total=Number(range[3]);
      if(!Number.isSafeInteger(total)||total<0||(expectedTotal!==undefined&&total!==expectedTotal)) throw new Error(`[Supabase:${table}] Catalog changed during pagination; retry the build.`);
      expectedTotal=total;
      if(rows.length>pageSize||(rows.length&&Number(range[1])!==result.length)||(rows.length&&Number(range[2])!==result.length+rows.length-1)||(!rows.length&&result.length<total)) throw new Error(`[Supabase:${table}] Inconsistent pagination range.`);
      result.push(...rows.map(row=>strings(table,row)));
      if(result.length>total)throw new Error(`[Supabase:${table}] More rows than the exact count.`);
      if(result.length===total)return result;
    }
  }
  function tableRows(table){
    if(!requests.has(table))requests.set(table,allRows(table).catch(error=>{requests.delete(table);throw error;}));
    return requests.get(table);
  }
  return {
    name:'Supabase',
    reset(){requests.clear();logical.clear();},
    /** @param {'Trips_Prices'|'Packages'|'Trip_Addons'|'Global_Settings'} name */
    read(name){
      if(!logical.has(name))logical.set(name,(async()=>{
        if(name==='Trips_Prices')return (await tableRows('trips')).map(row=>({...row,trip_id:row.id}));
        if(name==='Packages'){
          const [packages,relations]=await Promise.all([tableRows('packages'),tableRows('package_trips')]);
          const packageIds=new Set(packages.map(row=>row.id));
          const members=new Map(),seen=new Set();
          for(const relation of relations){
            const context=`Supabase:package_trips:${relation.package_id}`;
            if(!packageIds.has(relation.package_id))throw new Error(`[${context}] Unknown package_id.`);
            if(!/^\d+$/.test(relation.position)||!Number.isSafeInteger(Number(relation.position)))throw new Error(`[${context}] Invalid position.`);
            const key=JSON.stringify([relation.package_id,relation.position]);
            if(seen.has(key))throw new Error(`[${context}] Duplicate position ${relation.position}.`);
            seen.add(key);
            if(!members.has(relation.package_id))members.set(relation.package_id,[]);
            members.get(relation.package_id).push(relation);
          }
          return packages.map(row=>({...row,package_id:row.id,included_trip_ids:(members.get(row.id)||[]).sort((a,b)=>Number(a.position)-Number(b.position)).map(item=>item.trip_id).join(',')}));
        }
        if(name==='Trip_Addons')return tableRows('trip_addons');
        if(name==='Global_Settings')return tableRows('public_settings');
        throw new Error('[Supabase] Unknown catalog source.');
      })().catch(error=>{logical.delete(name);throw error;}));
      return logical.get(name);
    },
  };
}
