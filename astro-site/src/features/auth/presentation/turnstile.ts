interface Turnstile {
  render(element:HTMLElement, options:{sitekey:string;language:string;callback:(token:string)=>void;'expired-callback':()=>void;'error-callback':()=>void}):string;
  reset(id:string):void;
  remove(id:string):void;
}
type CaptchaWindow=Window & {turnstile?:Turnstile};
let loading:Promise<Turnstile>|null=null;
function load():Promise<Turnstile>{
  if(loading)return loading;
  loading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const timeout=window.setTimeout(()=>reject(new Error('CAPTCHA unavailable')),15000);
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;
    script.onload=()=>{clearTimeout(timeout);const api=(window as CaptchaWindow).turnstile;api?resolve(api):reject(new Error('CAPTCHA unavailable'));};
    script.onerror=()=>{clearTimeout(timeout);reject(new Error('CAPTCHA unavailable'));};
    document.head.append(script);
  });
  return loading;
}
/** Only imported by the login page. Tokens live in memory and are single-use. */
export async function mountTurnstile(element:HTMLElement,sitekey:string,language:string,onToken:(token:string)=>void){
  const api=await load();
  const clear=()=>onToken('');
  const id=api.render(element,{sitekey,language,callback:onToken,'expired-callback':clear,'error-callback':clear});
  return {reset(){clear();api.reset(id);},remove(){clear();api.remove(id);}};
}
