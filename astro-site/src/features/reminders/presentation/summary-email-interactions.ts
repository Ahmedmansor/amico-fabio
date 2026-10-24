import {browserAuth} from '../../auth/data/browser';
import {getAccountState} from '../../auth/data/account-state';
import type {AuthConfig} from '../../auth/data/config';
import {createSummaryTestClient} from '../data/summary-test-client';
import type {getSummaryTestMessages} from '../data/summary-test-messages';
import type {Locale} from '../../../shared/config/languages';

async function initialize(){
  const root=document.querySelector<HTMLElement>('[data-summary-email-test]');if(!root)return;
  const config=JSON.parse(root.querySelector('[data-summary-email-config]')!.textContent!) as {auth:AuthConfig;endpoint:string;m:ReturnType<typeof getSummaryTestMessages>;locale:Locale;requestLocaleEnabled:boolean};
  const button=root.querySelector<HTMLButtonElement>('[data-summary-email-send]')!,status=root.querySelector<HTMLElement>('[data-summary-email-status]')!;
  const service=await browserAuth(config.auth);if(!service)return;
  const client=createSummaryTestClient({service,endpoint:config.endpoint,fetcher:fetch,timeoutMs:20000,maxResponseBytes:4096,requestLocaleEnabled:config.requestLocaleEnabled});
  let userId:string|null=null,revision=0,busy=false,finished=false,authReady=false;
  const connect=(next:string|null)=>{if(userId===next)return;revision++;userId=next;busy=false;finished=false;status.textContent='';root.hidden=!userId;root.setAttribute('aria-busy','false');button.disabled=!userId;};
  getAccountState(service).subscribe(state=>{
    authReady=state.status==='ready';
    if(state.status!=='loading')connect(authReady?state.session?.userId??null:null);
    button.disabled=!authReady||!userId||busy||finished;
  });
  button.addEventListener('click',async()=>{
    if(!authReady||!userId||busy||finished)return;
    const captured=revision,owner=userId;busy=true;button.disabled=true;status.textContent=config.m.sending;root.setAttribute('aria-busy','true');
    const result=await client.send(owner,config.locale);
    if(captured!==revision||owner!==userId)return;
    busy=false;finished=true;root.setAttribute('aria-busy','false');
    // One attempt per page load. Unknown acceptance must be reconciled before
    // another test; do not offer an automatic retry that can duplicate mail.
    status.textContent=config.m[result];button.disabled=true;
  });
}
void initialize();
