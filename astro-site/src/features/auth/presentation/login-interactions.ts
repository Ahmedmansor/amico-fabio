import {browserAuth} from '../data/browser';
import {getAccountState} from '../data/account-state';
import {authReturnPaths,defaultAuthReturn,type AuthConfig} from '../data/config';
import {safeReturnPath,suggestEmailCorrection,type AuthFailure} from '../domain/auth';
import {emailSendingGate,validNewPassword} from '../domain/login';
import type {Locale} from '../../../shared/config/languages';
import type {getAuthMessages} from '../data/messages';
import {mountTurnstile} from './turnstile';

async function initialize(){
  const root=document.querySelector<HTMLElement>('[data-login-page]');
  const node=document.getElementById('login-config');
  if(!root||!node)return;
  const {config,messages:m,locale}=JSON.parse(node.textContent!) as {config:AuthConfig|null;messages:ReturnType<typeof getAuthMessages>;locale:Locale};
  if(!config)return;
  const service=await browserAuth(config);
  const status=root.querySelector<HTMLElement>('[data-login-status]')!;
  if(!service){status.textContent=m.unavailable;return;}
  const requested=new URLSearchParams(location.search).get('redirect');
  const destination=safeReturnPath(requested,authReturnPaths(requested),defaultAuthReturn(locale));
  const guest=root.querySelector<HTMLElement>('[data-login-guest]')!;
  const account=root.querySelector<HTMLElement>('[data-login-account]')!;
  const returnLink=root.querySelector<HTMLAnchorElement>('[data-login-return]')!;
  returnLink.href=destination;
  const form=root.querySelector<HTMLFormElement>('[data-login-form]');
  const email=root.querySelector<HTMLInputElement>('#login-email');
  const password=root.querySelector<HTMLInputElement>('#login-password');
  const submit=root.querySelector<HTMLButtonElement>('[data-login-submit]');
  const error=root.querySelector<HTMLElement>('[data-login-error]');
  const suggestion=root.querySelector<HTMLElement>('[data-login-suggestion]');
  const recovery=root.querySelector<HTMLButtonElement>('[data-login-recovery]');
  const marketingIntent=root.querySelector<HTMLInputElement>('[data-login-marketing-intent]');
  const cooldown=root.querySelector<HTMLElement>('[data-login-cooldown]')!;
  const modes=[...root.querySelectorAll<HTMLButtonElement>('[data-login-mode]')];
  const oauth=[...root.querySelectorAll<HTMLButtonElement>('[data-login-oauth]')];
  let mode:'signin'|'signup'|'recovery'=config.passwordEnabled?'signin':'recovery';
  let pending=false,token='',signedIn=false,ready=false;
  let captcha:Awaited<ReturnType<typeof mountTurnstile>>|undefined;
  const message=(reason:AuthFailure)=>reason==='invalid-email'?m.invalidEmail:reason==='disposable-domain'?m.disposableEmail:reason==='email-typo'?m.checkTypo:reason==='captcha-required'?m.captchaRequired:reason==='invalid-password'?m.passwordGuidance:reason==='rate-limited'?m.rateLimited:m.failed;
  function render(){
    const sending=mode!=='signin';
    const check=email?emailSendingGate(email.value,!!config!.turnstileSiteKey,token):null;
    const typo=email?suggestEmailCorrection(email.value):null;
    if(suggestion){suggestion.hidden=!sending||!typo;suggestion.querySelector('span')!.textContent=typo?m.didYouMean.replace('{suggestion}',typo.suggested):'';}
    if(email){
      const invalid=!!email.value&&sending&&check&&!check.ok&&check.reason!=='captcha-required';
      email.setAttribute('aria-invalid',String(!!invalid));
      if(error){error.hidden=!invalid;error.textContent=invalid&&!check!.ok?message(check!.reason):'';}
    }
    if(password){password.autocomplete=mode==='signup'?'new-password':'current-password';password.required=mode!=='recovery';}
    const passwordRow=root!.querySelector<HTMLElement>('[data-login-password-row]');
    if(passwordRow)passwordRow.hidden=mode==='recovery';
    const hint=root!.querySelector<HTMLElement>('[data-login-password-hint]');if(hint)hint.hidden=mode!=='signup';
    const marketingRow=root!.querySelector<HTMLElement>('[data-login-marketing-row]');if(marketingRow)marketingRow.hidden=mode!=='signup';
    if(submit){submit.textContent=mode==='signup'?m.signUp:mode==='signin'?m.signIn:m.send;
      submit.disabled=!ready||pending||signedIn||(!sending&&(!email?.value||!password?.value))||(sending&&(!check?.ok||(mode==='signup'&&!validNewPassword(password?.value??''))))||!!config!.turnstileSiteKey&&!token||(sending&&service!.remainingCooldown()>0);}
    for(const button of modes){button.disabled=pending;button.setAttribute('aria-pressed',String(button.dataset.loginMode===mode));}
    for(const button of oauth)button.disabled=pending||!ready;
    if(recovery){recovery.disabled=pending;recovery.hidden=mode==='signup';recovery.textContent=mode==='recovery'?m.backToSignIn:m.forgotPassword;}
    const remaining=service!.remainingCooldown();cooldown.hidden=!remaining;cooldown.textContent=remaining?m.resend.replace('{seconds}',String(remaining)):'';
    form?.setAttribute('aria-busy',String(pending));
  }
  if(config.turnstileSiteKey){
    void mountTurnstile(root.querySelector('[data-login-captcha]')!,config.turnstileSiteKey,locale,value=>{token=value;render();})
      .then(value=>{captcha=value;}).catch(()=>{status.textContent=m.captchaUnavailable;});
  }
  email?.addEventListener('input',render);password?.addEventListener('input',render);
  root.querySelector('[data-login-correct]')?.addEventListener('click',()=>{const typo=suggestEmailCorrection(email!.value);if(typo){email!.value=typo.suggested;render();email!.focus();}});
  function changeMode(next:typeof mode){if(pending)return;mode=next;status.textContent='';if(password)password.value='';captcha?.reset();render();}
  for(const button of modes)button.addEventListener('click',()=>changeMode(button.dataset.loginMode as 'signin'|'signup'));
  recovery?.addEventListener('click',()=>changeMode(mode==='recovery'?'signin':'recovery'));
  form?.addEventListener('submit',async event=>{
    event.preventDefault();if(pending||!ready||signedIn||!email)return;
    const attempted=mode;
    if(attempted!=='signin'){
      const gate=emailSendingGate(email.value,!!config.turnstileSiteKey,token);
      if(!gate.ok){status.textContent=message(gate.reason);render();return;}
    }
    pending=true;status.textContent=m.pending;render();
    const result=attempted==='signup'?await service.signUp(email.value,password!.value,locale,destination,token,marketingIntent?.checked===true):attempted==='signin'?await service.signInWithPassword(email.value,password!.value,token):await service.requestMagicLink(email.value,locale,destination,token);
    pending=false;if(password)password.value='';captcha?.reset();
    if(result.ok&&attempted==='signin'){location.assign(destination);return;}
    status.textContent=result.ok?(attempted==='signup'?m.signupSent:m.sent):message(result.reason);render();
  });
  for(const button of oauth)button.addEventListener('click',async()=>{
    if(pending||!ready)return;pending=true;status.textContent=m.pending;render();
    const result=await service.googleUrl(locale,destination);
    if(result.ok){location.assign(result.value);return;}
    pending=false;status.textContent=message(result.reason);render();
  });
  const setForm=root.querySelector<HTMLFormElement>('[data-login-set-password]');
  setForm?.addEventListener('submit',async event=>{
    event.preventDefault();if(pending||!signedIn)return;
    const input=setForm.querySelector<HTMLInputElement>('input')!;
    pending=true;const button=setForm.querySelector('button')!;button.disabled=true;
    const result=await service.setPassword(input.value);input.value='';pending=false;button.disabled=false;
    status.textContent=result.ok?m.passwordSaved:message(result.reason);render();
  });
  getAccountState(service).subscribe(state=>{
    ready=state.status==='ready';signedIn=!!state.session;
    guest.hidden=signedIn;account.hidden=!signedIn;
    if(state.status==='failed')status.textContent=m.failed;
    render();
  });
  window.setInterval(render,1000);
}
void initialize();
