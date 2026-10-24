import type {createPreferenceController,PreferenceViewState} from '../data/preferences-controller.ts';
import type {getPreferenceMessages} from '../data/preference-messages.ts';
import type {Locale} from '../../../shared/config/languages.ts';

/** Bind only after reviewed runtime configuration and Auth integration exist. */
export function bindPreferenceView(root:HTMLElement,controller:ReturnType<typeof createPreferenceController>,locale:Locale,m:ReturnType<typeof getPreferenceMessages>){
  const form=root.querySelector<HTMLFormElement>('[data-reminder-form]')!;
  const fieldset=form.querySelector('fieldset')!;
  const choice=root.querySelector<HTMLInputElement>('[data-reminder-choice]')!;
  const save=root.querySelector<HTMLButtonElement>('[data-reminder-save]')!;
  const retry=root.querySelector<HTMLButtonElement>('[data-reminder-retry]')!;
  const status=root.querySelector<HTMLElement>('[data-reminder-status]')!;
  let draft=false;
  function dirty(state:PreferenceViewState){save.disabled=state.status!=='ready'||choice.checked===(state.preference?.enabled??false);}
  const unsubscribe=controller.subscribe(state=>{
    root.hidden=state.status==='signed-out';
    const busy=state.status==='loading'||state.status==='saving';
    form.setAttribute('aria-busy',String(busy));root.setAttribute('aria-busy',String(busy));
    fieldset.disabled=state.status!=='ready';
    choice.checked=state.status==='saving'?draft:(state.preference?.enabled??false);
    dirty(state);
    retry.hidden=state.status!=='error';retry.textContent=state.retryable?m.retry:m.reload;
    status.textContent=state.status==='loading'?m.loading:state.status==='saving'?m.saving:
      state.status==='error'?state.error==='outdated-consent'?m.outdated:m.error:
      state.status==='signed-out'?'':state.preference?.enabled?m.enabled:m.disabled;
  });
  const changed=()=>{draft=choice.checked;dirty(controller.getState());};
  const submitted=(event:SubmitEvent)=>{event.preventDefault();draft=choice.checked;void controller.save(draft,locale);};
  const retried=()=>{const state=controller.getState();void(state.retryable?controller.retry():controller.refresh());};
  choice.addEventListener('change',changed);form.addEventListener('submit',submitted);retry.addEventListener('click',retried);
  return ()=>{unsubscribe();choice.removeEventListener('change',changed);form.removeEventListener('submit',submitted);retry.removeEventListener('click',retried);root.hidden=true;};
}
