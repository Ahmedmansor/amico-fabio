import {browserAuth} from '../../auth/data/browser';
import {getAccountState} from '../../auth/data/account-state';
import type {AuthConfig} from '../../auth/data/config';
import {browserMarketing} from '../data/browser';
import {createMarketingCoordinator} from '../data/coordinator';
import type {getMarketingMessages} from '../data/messages';
import type {Locale} from '../../../shared/config/languages';

async function initialize(){
  const root=document.querySelector<HTMLElement>('[data-marketing-consent]'),node=document.getElementById('marketing-config');
  if(!root||!node)return;
  const {config,messages:m,locale}=JSON.parse(node.textContent!) as {config:AuthConfig;messages:ReturnType<typeof getMarketingMessages>;locale:Locale};
  const [service,repository]=await Promise.all([browserAuth(config),browserMarketing(config)]);
  if(!service||!repository)return;
  const checkbox=root.querySelector<HTMLInputElement>('[data-marketing-choice]')!;
  const save=root.querySelector<HTMLButtonElement>('[data-marketing-save]')!;
  const status=root.querySelector<HTMLElement>('[data-marketing-status]')!;
  const retry=root.querySelector<HTMLButtonElement>('[data-marketing-retry]')!;
  let account:string|null=null;
  const coordinator=createMarketingCoordinator(repository,state=>{
    root.hidden=!state.userId;
    checkbox.disabled=state.status!=='ready'||state.busy||!state.value?.verified;
    save.disabled=checkbox.disabled;
    checkbox.checked=state.value?.enabled??false;
    retry.hidden=state.status!=='failed';
    status.textContent=state.status==='failed'?m.failed:state.status==='loading'?m.loading:state.value&&!state.value.verified?m.verify:'';
  });
  root.querySelector('form')!.addEventListener('submit',async event=>{
    event.preventDefault();const expected=account;
    const result=await coordinator.save(checkbox.checked,locale);
    if(expected!==account)return;
    status.textContent=result?m.saved:m.failed;
  });
  retry.addEventListener('click',()=>{void coordinator.setAccount(account);});
  getAccountState(service).subscribe(state=>{
    const next=state.status==='ready'?state.session?.userId??null:null;
    if(next===account)return;account=next;void coordinator.setAccount(account);
  });
}
void initialize();
