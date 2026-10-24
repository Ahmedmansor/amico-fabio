import {browserAuth} from '../../auth/data/browser';
import type {AuthConfig} from '../../auth/data/config';
import {createSummaryTestClient} from '../data/summary-test-client';
import type {getSummaryTestMessages} from '../data/summary-test-messages';

async function initialize(){
  const root=document.querySelector<HTMLElement>('[data-summary-email-test]');if(!root)return;
  const config=JSON.parse(root.querySelector('[data-summary-email-config]')!.textContent!) as {auth:AuthConfig;endpoint:string;m:ReturnType<typeof getSummaryTestMessages>};
  const button=root.querySelector<HTMLButtonElement>('[data-summary-email-send]')!,status=root.querySelector<HTMLElement>('[data-summary-email-status]')!;
  const service=await browserAuth(config.auth);if(!service)return;
  const client=createSummaryTestClient({service,endpoint:config.endpoint,fetcher:fetch,timeoutMs:20000,maxResponseBytes:4096});
  let userId:string|null=null,revision=0,busy=false,finished=false;
  const connect=(next:string|null)=>{if(userId===next)return;revision++;userId=next;busy=false;finished=false;status.textContent='';root.hidden=!userId;root.setAttribute('aria-busy','false');button.disabled=!userId;};
  service.subscribe(session=>connect(session?.userId??null));
  const before=revision;const current=await service.currentSession();if(before===revision)connect(current.ok?current.value?.userId??null:null);
  button.addEventListener('click',async()=>{
    if(!userId||busy||finished)return;
    const captured=revision,owner=userId;busy=true;button.disabled=true;status.textContent=config.m.sending;root.setAttribute('aria-busy','true');
    const result=await client.send(owner);
    if(captured!==revision||owner!==userId)return;
    busy=false;finished=true;root.setAttribute('aria-busy','false');
    // One attempt per page load. Unknown acceptance must be reconciled before
    // another test; do not offer an automatic retry that can duplicate mail.
    status.textContent=config.m[result];button.disabled=true;
  });
}
void initialize();
