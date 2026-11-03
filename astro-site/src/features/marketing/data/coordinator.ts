import type {MarketingRepository} from './repository.ts';
import {canSaveMarketingConsent,type MarketingConsent} from '../domain/consent.ts';
import type {Locale} from '../../../shared/config/languages.ts';
export interface MarketingState {userId:string|null;status:'guest'|'loading'|'ready'|'failed';value:MarketingConsent|null;busy:boolean}
export function createMarketingCoordinator(repository:MarketingRepository,onChange:(state:MarketingState)=>void){
  let state:MarketingState={userId:null,status:'guest',value:null,busy:false},generation=0;
  const snapshot=():MarketingState=>({...state,value:state.value?{...state.value}:null});
  const emit=()=>onChange(snapshot());
  async function setAccount(userId:string|null){
    const captured=++generation;state={userId,status:userId?'loading':'guest',value:null,busy:false};emit();
    if(!userId)return;
    try{
      let value=await repository.read(userId);
      if(captured!==generation)return;
      if(value.verified&&value.pendingSignup)value=await repository.activateSignup(userId);
      if(captured!==generation)return;
      state={userId,status:'ready',value,busy:false};
    }catch{if(captured!==generation)return;state={userId,status:'failed',value:null,busy:false};}
    emit();
  }
  async function save(enabled:boolean,locale:Locale){
    if(state.status!=='ready'||state.busy||!state.userId||!canSaveMarketingConsent(state.value))return false;
    const captured=generation,userId=state.userId,current=state.value!;state.busy=true;emit();
    try{
      const value=await repository.save(userId,current,enabled,locale);
      if(captured!==generation)return false;
      state={userId,status:'ready',value,busy:false};emit();return value.enabled===enabled;
    }catch{if(captured===generation){state={userId,status:'failed',value:null,busy:false};emit();}return false;}
  }
  return {snapshot,setAccount,save};
}
