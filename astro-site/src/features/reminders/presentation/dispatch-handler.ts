import {authenticatedHeader,boundedJson} from '../data/bounded-json.ts';
import {parseReminderProviderEvent} from '../domain/provider-event.ts';
import type {createReminderDispatcher} from './dispatch-reminders.ts';
export function createDispatchHandler(dispatcher:ReturnType<typeof createReminderDispatcher>,authorize:(request:Request)=>Promise<boolean>){
  return async(request:Request)=>{
    if(request.method!=='POST')return new Response(null,{status:405});
    try{if(!await authorize(request))return new Response(null,{status:401});}catch{return new Response(null,{status:503});}
    // Cron has no caller-controlled account, locale, delay or recipient payload.
    try{return Response.json(await dispatcher.run(),{headers:{'Cache-Control':'no-store'}});}
    catch{return Response.json({error:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
  };
}
export function createReminderWebhook(options:{secret:string;maxBytes:number;timeoutMs:number;record:(event:NonNullable<ReturnType<typeof parseReminderProviderEvent>>)=>Promise<boolean>}){
  if(options.secret.length<32)throw new Error('[reminders] Webhook authentication required.');
  return async(request:Request)=>{
    if(request.method!=='POST')return new Response(null,{status:405});
    if(!await authenticatedHeader(request,'authorization','Bearer '+options.secret))return new Response(null,{status:401});
    if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return new Response(null,{status:415});
    let body;try{body=await boundedJson(request,options.maxBytes,options.timeoutMs);}catch{return new Response(null,{status:400});}
    const event=parseReminderProviderEvent(body);if(!event)return new Response(null,{status:202});
    try{await options.record(event);return new Response(null,{status:204});}catch{return new Response(null,{status:503});}
  };
}
