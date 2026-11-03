/** Synthetic browser fixture only. Imported solely by the disposable QA route. */
import {createPreferenceController} from '../../src/features/reminders/data/preferences-controller';
import {bindPreferenceView} from '../../src/features/reminders/presentation/preferences-view';
import {getPreferenceMessages} from '../../src/features/reminders/data/preference-messages';
import type {EmailPreference,PreferenceChange} from '../../src/features/reminders/domain/preferences';
import type {Locale} from '../../src/shared/config/languages';

export function mountPreferenceFixture(){
  const locale=document.documentElement.lang as Locale;
  const preferences=new Map<string,EmailPreference>();
  const commands:PreferenceChange[]=[];
  const requests=new Set<string>();
  let failNext=false;
  let gate:Promise<void>|null=null,release:(()=>void)|null=null;
  async function pause(){const waiting=gate;gate=null;if(waiting)await waiting;}
  const controller=createPreferenceController({
    async read(userId){const value=preferences.get(userId)??null;await pause();return {ok:true,value};},
    async change(userId,input){
      commands.push({...input});
      const key=`${userId}:${input.requestId}`;
      if(!requests.has(key)){
        requests.add(key);
        preferences.set(userId,{enabled:input.enabled,locale:input.locale,wordingVersion:input.wordingVersion,
          updatedAt:'2026-10-24T00:00:00Z',enabledSince:input.enabled?'2026-10-24T00:00:00Z':null});
      }
      await pause();
      if(failNext){failNext=false;return {ok:false,reason:'unavailable'};}
      return {ok:true,value:preferences.get(userId)!};
    },
  },()=>crypto.randomUUID());
  bindPreferenceView(document.querySelector<HTMLElement>('[data-reminder-preferences]')!,controller,locale,getPreferenceMessages(locale));
  const fixture={
    connect:controller.connect,
    state:controller.getState,
    commands:()=>commands.map(command=>({...command})),
    failNext(){failNext=true;},
    holdNext(){gate=new Promise(resolve=>{release=resolve;});},
    release(){release?.();release=null;},
  };
  (globalThis as typeof globalThis & {reminderQA:typeof fixture}).reminderQA=fixture;
  document.querySelector('[data-qa-account]')?.addEventListener('click',()=>{void controller.connect('00000000-0000-4000-8000-000000000001');});
  document.querySelector('[data-qa-signout]')?.addEventListener('click',()=>{void controller.connect(null);});
}
