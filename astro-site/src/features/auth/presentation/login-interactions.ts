import {browserAuth} from '../data/browser';
import {getAccountState} from '../data/account-state';
import {authReturnPaths,defaultAuthReturn,type AuthConfig} from '../data/config';
import {safeReturnPath,suggestEmailCorrection,normalizeEmail,type AuthFailure} from '../domain/auth';
import {emailSendingGate,validNewPassword,normalizeEmailCode,emailCodeLength} from '../domain/login';
import {bindEmailCodeInput} from './email-code-input';
import type {Locale} from '../../../shared/config/languages';
import type {getAuthMessages} from '../data/messages';
import {mountTurnstile} from './turnstile';

async function initialize(){
  const root=document.querySelector<HTMLElement>('[data-login-page]');
  const node=document.getElementById('login-config');
  if(!root||!node)return;
  const {config,messages:m,locale,marketingEnabled}=JSON.parse(node.textContent!) as {config:AuthConfig|null;messages:ReturnType<typeof getAuthMessages>;locale:Locale;marketingEnabled?:boolean};
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
  const codeInput=root.querySelector<HTMLInputElement>('#login-code')!;
  const codeWidget=bindEmailCodeInput(codeInput,emailCodeLength);
  const verifyCode=root.querySelector<HTMLButtonElement>('[data-login-verify-code]')!;
  const codeError=root.querySelector<HTMLElement>('[data-login-code-error]')!;
  const resendOptions=root.querySelector<HTMLDetailsElement>('[data-login-resend-options]')!;
  const resendCode=root.querySelector<HTMLButtonElement>('[data-login-resend-code]')!;
  let pendingEmail='',sentKind:'signup'|'magiclink'='signup',emailAttempt=0;
  let mode:'signin'|'signup'|'recovery'=config.passwordEnabled?'signin':'recovery';
  let pending=false,token='',signedIn=false,ready=false,awaitingEmail=false;
  let captcha:Awaited<ReturnType<typeof mountTurnstile>>|undefined;
  let captchaStarted=false;
  const message=(reason:AuthFailure)=>reason==='invalid-code'?m.invalidCode:reason==='invalid-email'?m.invalidEmail:reason==='disposable-domain'?m.disposableEmail:reason==='email-typo'?m.checkTypo:reason==='captcha-required'?m.captchaRequired:reason==='invalid-password'?m.passwordGuidance:reason==='rate-limited'?m.rateLimited:m.failed;
  function render(){
    root!.querySelector<HTMLElement>('[data-login-controls]')!.hidden=awaitingEmail;
    root!.querySelector<HTMLElement>('[data-login-check-email]')!.hidden=!awaitingEmail;
    verifyCode.disabled=pending||!awaitingEmail||!normalizeEmailCode(codeInput.value);
    codeInput.disabled=pending;
    codeInput.setAttribute('aria-invalid',String(!codeError.hidden));
    codeWidget.refresh();
    root!.querySelector('[data-login-title]')!.textContent=signedIn?m.accountTitle:awaitingEmail?m.checkInbox:m.title;
    root!.querySelector<HTMLElement>('[data-login-intro]')!.hidden=awaitingEmail&&!signedIn;
    resendCode.disabled=pending||service!.remainingCooldown()>0||!!config!.turnstileSiteKey&&!token;
    root!.querySelector<HTMLButtonElement>('[data-login-back-to-signin]')!.disabled=pending;
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
  function ensureCaptcha(){
    if(!config!.turnstileSiteKey||captchaStarted)return;
    captchaStarted=true;
    void mountTurnstile(root!.querySelector(awaitingEmail?'[data-login-resend-captcha]':'[data-login-captcha]')!,config!.turnstileSiteKey,locale,value=>{token=value;render();})
      .then(value=>{captcha=value;if(signedIn){captcha.remove();captcha=undefined;captchaStarted=false;}}).catch(()=>{captchaStarted=false;if(!signedIn)status.textContent=m.captchaUnavailable;});
  }
  email?.addEventListener('input',render);password?.addEventListener('input',render);
  root.querySelector('[data-login-correct]')?.addEventListener('click',()=>{const typo=suggestEmailCorrection(email!.value);if(typo){email!.value=typo.suggested;render();email!.focus();}});
  function changeMode(next:typeof mode){if(pending)return;mode=next;status.textContent='';if(password)password.value='';captcha?.reset();render();}
  for(const button of modes)button.addEventListener('click',()=>changeMode(button.dataset.loginMode as 'signin'|'signup'));
  recovery?.addEventListener('click',()=>changeMode(mode==='recovery'?'signin':'recovery'));
  root.querySelector('[data-login-back-to-signin]')?.addEventListener('click',()=>{
    if(pending)return;
    emailAttempt++;awaitingEmail=false;pendingEmail='';codeInput.value='';codeError.hidden=true;resendOptions.open=false;
    if(captcha){captcha.remove();captcha=undefined;captchaStarted=false;}
    changeMode(config.passwordEnabled?'signin':'recovery');ensureCaptcha();email?.focus();
  });
  form?.addEventListener('submit',async event=>{
    event.preventDefault();if(pending||!ready||signedIn||awaitingEmail||!email)return;
    const attempted=mode;
    const submittedEmail=email.value;
    if(attempted!=='signin'){
      const gate=emailSendingGate(email.value,!!config.turnstileSiteKey,token);
      if(!gate.ok){status.textContent=message(gate.reason);render();return;}
    }
    pending=true;status.textContent=m.pending;render();
    const result=attempted==='signup'?await service.signUp(submittedEmail,password!.value,locale,destination,token,marketingIntent?.checked===true):attempted==='signin'?await service.signInWithPassword(submittedEmail,password!.value,token):await service.requestMagicLink(submittedEmail,locale,destination,token);
    pending=false;if(password)password.value='';
    if(result.ok&&attempted==='signin'){location.assign(destination);return;}
    if(result.ok){
      awaitingEmail=true;status.textContent='';
      pendingEmail=normalizeEmail(submittedEmail)!;emailAttempt++;sentKind=attempted==='signup'?'signup':'magiclink';
      root.querySelector('[data-login-sent-to]')!.textContent=pendingEmail;
      codeInput.value='';codeError.hidden=true;
      root.querySelector('[data-login-delivery-message]')!.textContent=attempted==='signup'?m.signupSent:m.sent;
      if(captcha){captcha.remove();captcha=undefined;captchaStarted=false;}
      render();codeInput.focus();
    }else{captcha?.reset();status.textContent=message(result.reason);render();}
  });
  codeInput.addEventListener('input',()=>{codeError.hidden=true;render();});
  root.querySelector('[data-login-code-form]')!.addEventListener('submit',async event=>{
    event.preventDefault();if(pending||!awaitingEmail||!pendingEmail||signedIn)return;
    const captured=emailAttempt;pending=true;codeError.hidden=true;status.textContent=m.pending;render();
    const result=await service.verifyEmailCode(pendingEmail,codeInput.value);pending=false;codeInput.value='';
    if(captured!==emailAttempt){render();return;}
    if(result.ok){
      status.textContent='';
      if(marketingEnabled){try{const {browserMarketing}=await import('../../marketing/data/browser');const repository=await browserMarketing(config);await repository?.activateSignup(result.value.userId);}catch{}}
      location.assign(destination);return;
    }
    status.textContent='';codeError.textContent=message(result.reason);codeError.hidden=false;render();codeInput.focus();
  });
  resendOptions.addEventListener('toggle',()=>{if(resendOptions.open&&awaitingEmail&&!signedIn)ensureCaptcha();});
  resendCode.addEventListener('click',async()=>{
    if(pending||!awaitingEmail||!pendingEmail)return;
    const captured=emailAttempt;pending=true;status.textContent=m.pending;render();
    const result=sentKind==='signup'?await service.resendSignupCode(pendingEmail,locale,destination,token):await service.requestMagicLink(pendingEmail,locale,destination,token);
    pending=false;captcha?.reset();
    if(captured!==emailAttempt){render();return;}
    if(result.ok){codeInput.value='';codeError.hidden=true;status.textContent=m.codeResent;}else status.textContent=message(result.reason);
    render();
  });
  for(const button of oauth)button.addEventListener('click',async()=>{
    if(pending||!ready)return;pending=true;status.textContent=m.pending;render();
    const result=await service.googleUrl(locale,destination);
    if(result.ok){location.assign(result.value);return;}
    pending=false;status.textContent=message(result.reason);render();
  });
  const setForm=root.querySelector<HTMLFormElement>('[data-login-set-password]');
  const passwordSettings=root.querySelector<HTMLDetailsElement>('[data-login-password-settings]');
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
    root.querySelector('[data-login-title]')!.textContent=signedIn?m.accountTitle:m.title;
    root.querySelector('[data-login-intro]')!.textContent=signedIn?m.signedIn:m.loginIntro;
    if(signedIn){
      if(captcha){captcha.remove();captcha=undefined;captchaStarted=false;}
      if(passwordSettings&&new URLSearchParams(location.search).get('settings')==='password')passwordSettings.open=true;
    }else{
      if(passwordSettings)passwordSettings.open=false;
      if(ready&&!awaitingEmail)ensureCaptcha();
    }
    if(state.status==='failed')status.textContent=m.failed;
    render();
  });
  window.setInterval(render,1000);
}
void initialize();
