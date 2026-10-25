import type {AuthService} from '../../auth/data/service.ts';
import type {PreferenceBrowserConfig} from './preferences-browser-config.ts';
import {createPreferenceClient} from './preferences-client.ts';
import {createPreferenceController} from './preferences-controller.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';
import {createLocaleClient} from '../../auth/data/locale-client.ts';
import type {LocaleCommand} from '../../auth/domain/locale-preference.ts';
import type {PreferenceClient} from './preferences-client.ts';

/** Feature-owned consent bridge. Auth supplies identity/bearer, never table access. */
export function createBrowserPreferenceController(options: {
  service: Pick<AuthService, 'bearerFor'>;
  config: PreferenceBrowserConfig;
  fetcher: typeof fetch;
  requestId: () => string;
}) {
  let currentUser: string | null = null;
  const client = createPreferenceClient({...options.config, fetcher: options.fetcher,
    session: async () => {
      const expected = currentUser;
      if (!expected) return null;
      const bearer = await options.service.bearerFor(expected);
      return bearer.ok && currentUser === expected ? {userId: expected, bearer: bearer.value} : null;
    }});
  const locales=createLocaleClient({endpoint:new URL('account-locale',options.config.endpoint).href,
    timeoutMs:options.config.timeoutMs,maxResponseBytes:options.config.maxResponseBytes,fetcher:options.fetcher,
    session:async expected=>{
      if(currentUser!==expected)return null;
      const bearer=await options.service.bearerFor(expected);
      return bearer.ok&&currentUser===expected?{userId:expected,bearer:bearer.value}:null;
    }});
  let pendingLanguage:{userId:string;requestId:string;command:LocaleCommand}|null=null;
  const combined:PreferenceClient={read:client.read,async change(userId,input){
    const previous=controller.getState().preference;
    const languageOnly=!!previous&&previous.enabled===input.enabled;
    // A language-only save must not create a new consent event or re-subscribe
    // an account withdrawn in another tab. Actual consent changes use its RPC.
    const result=languageOnly?await client.read(userId):await client.change(userId,input);
    if(!result.ok)return result;
    if(currentUser!==userId)return {ok:false,reason:'account-changed'};
    if(!result.value||languageOnly&&result.value.enabled!==input.enabled)return {ok:false,reason:'outdated-consent'};
    if(result.value.locale===input.locale){pendingLanguage=null;return {ok:true,value:result.value};}
    if(!pendingLanguage||pendingLanguage.userId!==userId||pendingLanguage.requestId!==input.requestId){
      const state=await locales.read(userId);
      if(!state.ok)return {ok:false,reason:'failed'};
      if(currentUser!==userId)return {ok:false,reason:'account-changed'};
      pendingLanguage={userId,requestId:input.requestId,command:{kind:'site',locale:input.locale,
        requestId:input.requestId,expectedRevision:state.value.revision}};
    }
    // Preserve exactly the same command on an uncertain response/retry.
    const changed=await locales.change(userId,pendingLanguage.command);
    if(currentUser!==userId)return {ok:false,reason:'account-changed'};
    if(!changed.ok)return {ok:false,reason:changed.reason==='conflict'?'outdated-consent':'failed'};
    if(changed.value.state.siteLocale!==input.locale)return {ok:false,reason:'outdated-consent'};
    pendingLanguage=null;
    const confirmed=await client.read(userId);
    return confirmed.ok&&confirmed.value?{ok:true,value:confirmed.value}:confirmed.ok?{ok:false,reason:'failed'}:confirmed;
  }};
  const controller = createPreferenceController(combined, options.requestId);
  return {controller,
    async connect(userId: string | null) {
      const next = isPreferenceRequestId(userId) ? userId : null;
      if (next === currentUser) return;
      pendingLanguage=null;
      currentUser = next; await controller.connect(next);
    }};
}
