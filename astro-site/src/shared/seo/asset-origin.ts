export function resolveAssetOrigin(noindex:boolean,production:string,explicit?:string,vercelHost?:string):string {
 const value=noindex?(explicit||(vercelHost?`https://${vercelHost}`:'')):production;
 if(!value)throw new Error('[SEO] Test builds require VERCEL_URL or PUBLIC_SITE_URL for independent assets.');
 const url=new URL(value);
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||(url.protocol!=='https:'&&!(local&&url.protocol==='http:')))throw new Error('[SEO] Asset origin must be a bare HTTPS origin (HTTP allowed only for localhost).');
 if(noindex&&url.origin===new URL(production).origin)throw new Error('[SEO] Test assets must not use the production domain.');
 return url.origin;
}
