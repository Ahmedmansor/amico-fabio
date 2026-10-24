import type { APIRoute } from 'astro';
import { getEmailCatalog } from '../features/reminders/data/catalog';

export const prerender=true;
export const GET: APIRoute=async ({request})=>{
  const dev=import.meta.env.DEV;
  const origin=dev ? new URL(request.url).origin : import.meta.env.PUBLIC_ASSET_ORIGIN;
  const environment=dev || import.meta.env.PUBLIC_NOINDEX==='1' ? 'test' : 'production';
  const manifest=await getEmailCatalog(origin,new Date().toISOString(),environment);
  return new Response(JSON.stringify(manifest),{headers:{'Content-Type':'application/json; charset=utf-8'}});
};
