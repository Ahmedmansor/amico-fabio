import type {createPreferenceService} from '../data/preferences-service.ts';
export type PreferenceUserResult={ok:true;userId:string}|{ok:false;reason:'unauthenticated'|'unavailable'};

/** Portable backend HTTP boundary, not an Astro API route and not deployed.
 * No cookie identity; caller supplies a verifier that validates the bearer JWT. */
export function createPreferenceHandler(options:{
  service:ReturnType<typeof createPreferenceService>;
  verifyUser:(bearer:string)=>Promise<PreferenceUserResult>;
  allowedOrigins:readonly string[];
  maxBodyBytes:number;
}){
  if(!Number.isSafeInteger(options.maxBodyBytes)||options.maxBodyBytes<1)throw new Error('[reminders] Body limit required.');
  const origins=new Set(options.allowedOrigins);
  if(!origins.size||origins.has('*'))throw new Error('[reminders] Explicit allowed origins required.');
  for(const origin of origins)if(new URL(origin).origin!==origin)throw new Error('[reminders] Invalid allowed origin.');
  return async(request:Request):Promise<Response>=>{
    const origin=request.headers.get('origin');
    const headers=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'});
    const respond=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
    if(origin&&!origins.has(origin))return respond(403,{error:'origin-denied'});
    if(origin)headers.set('Access-Control-Allow-Origin',origin);
    headers.set('Access-Control-Allow-Methods','GET, PATCH, OPTIONS');
    headers.set('Access-Control-Allow-Headers','Authorization, Content-Type, apikey');
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(!['GET','PATCH'].includes(request.method))return respond(405,{error:'method-not-allowed'});
    const bearer=request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if(!bearer)return respond(401,{error:'unauthenticated'});
    try{
      const identity=await options.verifyUser(bearer);
      if(!identity.ok)return respond(identity.reason==='unavailable'?503:401,{error:identity.reason});
      let result;
      if(request.method==='GET')result=await options.service.read(identity.userId);
      else{
        if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return respond(415,{error:'json-required'});
        const reader=request.body?.getReader();
        if(!reader)return respond(400,{error:'invalid-input'});
        const decoder=new TextDecoder('utf-8',{fatal:true});let size=0,body='';
        try{
          while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;
            if(size>options.maxBodyBytes){await reader.cancel();return respond(413,{error:'body-too-large'});}
            body+=decoder.decode(chunk.value,{stream:true});
          }
          body+=decoder.decode();
        }finally{reader.releaseLock();}
        let command:unknown;try{command=JSON.parse(body);}catch{return respond(400,{error:'invalid-input'});}
        result=await options.service.change(identity.userId,command);
      }
      if(result.ok)return respond(200,{preference:result.value});
      return respond(result.reason==='invalid-input'?400:result.reason==='outdated-consent'?409:503,{error:result.reason});
    }catch{return respond(503,{error:'unavailable'});}
  };
}
