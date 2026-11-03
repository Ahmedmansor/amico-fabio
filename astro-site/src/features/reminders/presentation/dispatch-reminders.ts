import type {Locale} from '../../../shared/config/languages.ts';
import type {EmailCatalog} from '../domain/catalog.ts';
import type {WishlistDeliveryPort} from '../domain/delivery.ts';
import {settleDispatch,type DispatchQueue} from '../domain/dispatch.ts';
import {prepareReminderMessage} from './prepare-reminder-message.ts';
/** Server worker only. No browser identity, recipient, clock or force-send input.
 * begin commits the sending state/quota before HTTP. Lost acknowledgements never
 * turn into a fresh job. SQL rechecks consent/activity/locale immediately there. */
export function createReminderDispatcher(options:{queue:DispatchQueue;catalog:{load():Promise<EmailCatalog>};
  recipient:(userId:string)=>Promise<string|null>;favorites:(userId:string)=>Promise<string[]|null>;
  management:(userId:string,origin:string,locale:Locale)=>Promise<{url:string;expiresAt:string}|null>;
  delivery:WishlistDeliveryPort;environment:EmailCatalog['environment'];retrySeconds:number}){
  let running=false;
  return {async run(){
    const totals={claimed:0,accepted:0,retry:0,unknown:0,failed:0,blocked:0,unconfirmed:0};
    if(running)return totals;running=true;
    try{const jobs=await options.queue.claim();totals.claimed=jobs.length;
      for(const job of jobs){
        let message=job.payload;
        try{
          if(!message){
            const recipient=await options.recipient(job.userId),ids=await options.favorites(job.userId);
            if(!recipient||!ids?.length){await options.queue.release(job);totals.blocked++;continue;}
            const catalog=await options.catalog.load(),management=await options.management(job.userId,catalog.origin,job.locale);
            if(!management){await options.queue.release(job);totals.blocked++;continue;}
            const prepared=prepareReminderMessage({catalog,expectedEnvironment:options.environment,ids,storedLocale:job.locale,
              managementToken:new URLSearchParams(new URL(management.url).hash.slice(1)).get('token')??''});
            if(!prepared.message){await options.queue.release(job);totals.blocked++;continue;}
            message={deliveryId:job.deliveryId,recipient,content:prepared.message};
            if(!await options.queue.seal(job,message,management.expiresAt)){totals.blocked++;continue;}
          }
          // Re-verify destination even when reusing a sealed 429 payload.
          if(await options.recipient(job.userId)!==message.recipient){await options.queue.release(job);totals.blocked++;continue;}
          if(!await options.queue.begin(job)){totals.blocked++;continue;}
        }catch{totals.blocked++;continue;}
        let sent;try{sent=await options.delivery.send(message);}catch{sent={status:'unknown'} as const;}
        const result=settleDispatch(sent,options.retrySeconds);totals[result.status]++;
        try{if(!await options.queue.finish(job,result))totals.unconfirmed++;}catch{totals.unconfirmed++;}
      }
      return totals;
    }finally{running=false;}
  }};
}
