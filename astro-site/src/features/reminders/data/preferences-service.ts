import {isPreferenceRequestId,parsePreferenceChange,type PreferenceRepository,type PreferenceResult,type EmailPreference} from '../domain/preferences.ts';

/** Server-only orchestration. Caller must obtain userId from verified Auth,
 * never from request JSON or editable profile metadata. No mail is sent here. */
export function createPreferenceService(repository:PreferenceRepository){
  return {
    async read(verifiedUserId:string):Promise<PreferenceResult<EmailPreference|null>>{
      if(!isPreferenceRequestId(verifiedUserId))return {ok:false,reason:'invalid-input'};
      return repository.read(verifiedUserId);
    },
    async change(verifiedUserId:string,body:unknown):Promise<PreferenceResult<EmailPreference>>{
      if(!isPreferenceRequestId(verifiedUserId))return {ok:false,reason:'invalid-input'};
      const parsed=parsePreferenceChange(body);
      if(!parsed.ok)return parsed;
      return repository.change(verifiedUserId,parsed.value);
    },
  };
}
