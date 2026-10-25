import {createManagementClient} from '../data/management-client.ts';
import {isManagementToken,type ManagementCommand,type ManagementState} from '../domain/management.ts';
import {isLocale,type Locale} from '../../../shared/config/languages.ts';
import type {ManagementBrowserConfig} from '../data/management-config.ts';
import type {getManagementMessages} from '../data/management-messages.ts';
const root=document.querySelector<HTMLElement>('[data-email-management]');
if(root){
  const hash=new URLSearchParams(location.hash.slice(1)),token=hash.get('token');
  // No storage, analytics, Auth or external scripts on this capability page.
  history.replaceState(null,'',location.pathname);
  // A second email link can navigate within this same tab by fragment only.
  // Rebind from a fresh document rather than retain the earlier capability.
  addEventListener('hashchange',()=>{if(location.hash)location.reload();});
  const {config,m,locale}=JSON.parse(document.getElementById('email-management-config')!.textContent!) as {
    config:ManagementBrowserConfig|null;m:ReturnType<typeof getManagementMessages>;locale:Locale};
  const form=root.querySelector<HTMLFormElement>('[data-management-form]')!,choice=root.querySelector<HTMLSelectElement>('[data-management-language]')!;
  const save=root.querySelector<HTMLButtonElement>('[data-management-save]')!,stop=root.querySelector<HTMLButtonElement>('[data-management-stop]')!;
  const retry=root.querySelector<HTMLButtonElement>('[data-management-retry]')!,status=root.querySelector<HTMLElement>('[data-management-status]')!;
  if(config){
    if(!isManagementToken(token)||hash.size!==1)status.textContent=m.invalid;
    else{
      const capability=token,client=createManagementClient(config,(input,init)=>fetch(input,init));
      let state:ManagementState|null=null,pending:ManagementCommand|null=null,busy=false;
      async function perform(command:ManagementCommand){
        if(busy)return;busy=true;pending=command;
        save.disabled=stop.disabled=choice.disabled=retry.disabled=true;root!.setAttribute('aria-busy','true');
        status.textContent=command.operation==='read'?m.loading:m.saving;
        const result=await client.execute(capability,command);busy=false;root!.setAttribute('aria-busy','false');retry.disabled=false;
        if(!result.ok){retry.hidden=result.reason==='invalid-link';form.hidden=true;status.textContent=result.reason==='invalid-link'?m.invalid:m.error;return;}
        state=result.state;pending=null;form.hidden=false;choice.value=state.locale;save.disabled=choice.disabled=false;stop.disabled=!state.enabled;retry.hidden=true;
        status.textContent=result.conflict?m.conflict:!state.enabled?m.stopped:command.operation==='language'?m.saved:m.enabled;
      }
      form.addEventListener('submit',event=>{event.preventDefault();if(!state||!isLocale(choice.value)||save.disabled)return;
        void perform({operation:'language',locale:choice.value,expectedRevision:state.revision,requestId:crypto.randomUUID()});});
      stop.addEventListener('click',()=>{if(!stop.disabled)void perform({operation:'unsubscribe',requestId:crypto.randomUUID(),consentLocale:locale});});
      retry.addEventListener('click',()=>{if(pending)void perform(pending);});
      void perform({operation:'read'});
    }
  }
}
