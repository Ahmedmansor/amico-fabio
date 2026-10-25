import type {createManagementService} from '../data/management-service.ts';
/** Separate public Edge handler. Deployment must inject trusted ingress limiting;
 * token authentication is in the service/atomic DB operation, not Supabase Auth. */
export function createManagementHandler(options:{service:ReturnType<typeof createManagementService>;origins:readonly string[];
  allowRequest:(request:Request)=>Promise<boolean>;maxBodyBytes:number;bodyTimeoutMs:number}){
  if(!Number.isSafeInteger(options.maxBodyBytes)||options.maxBodyBytes<1||!Number.isSafeInteger(options.bodyTimeoutMs)||options.bodyTimeoutMs<1
    ||!options.origins.length||options.origins.some(origin=>{const url=new URL(origin);
      return url.origin!==origin||(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)));}))throw new Error('[reminders] Invalid management limits.');
  return async(request:Request)=>{
    const origin=request.headers.get('origin'),headers=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer',Vary:'Origin'});
    const response=(status:number,body:unknown)=>Response.json(body,{status,headers});
    if(!origin||!options.origins.includes(origin))return response(403,{error:'denied'});
    headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Methods','POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return response(405,{error:'method-not-allowed'});
    if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return response(415,{error:'json-required'});
    try{if(!await options.allowRequest(request))return response(429,{error:'unavailable'});}catch{return response(503,{error:'unavailable'});}
    const reader=request.body?.getReader();if(!reader)return response(400,{error:'invalid-link'});
    let size=0,text='',expired=false;const decoder=new TextDecoder('utf-8',{fatal:true});
    const timer=setTimeout(()=>{expired=true;void reader.cancel().catch(()=>{});},options.bodyTimeoutMs);
    let body;
    try{while(true){const part=await reader.read();if(expired)return response(408,{error:'unavailable'});if(part.done)break;
      size+=part.value.byteLength;if(size>options.maxBodyBytes){void reader.cancel().catch(()=>{});return response(413,{error:'invalid-link'});}
      text+=decoder.decode(part.value,{stream:true});}body=JSON.parse(text+decoder.decode());
    }catch{return response(400,{error:'invalid-link'});}finally{clearTimeout(timer);reader.releaseLock();}
    const result=await options.service.execute(body);
    return result.ok?response(result.conflict?409:200,{state:result.state,conflict:result.conflict})
      :response(result.reason==='invalid-link'?400:503,{error:result.reason});
  };
}
