import type {SupabaseClient} from '@supabase/supabase-js';
import {createManagementRepository} from '../data/management-repository.ts';
import {createManagementService,hashManagementToken} from '../data/management-service.ts';
import {createManagementIngress,type ManagementRuntimeConfig} from '../data/management-runtime-config.ts';
import {createManagementHandler} from './management-handler.ts';
/** Separate backend composition. No Auth SDK/sign-in or email sender is invoked. */
export function createManagementRuntime(client:Pick<SupabaseClient,'rpc'>,config:ManagementRuntimeConfig){
  const ingress=createManagementIngress(client,config);
  return createManagementHandler({service:createManagementService(createManagementRepository(client,config.networkTimeoutMs),hashManagementToken),
    allowRequest:()=>ingress.take(),origins:config.origins,maxBodyBytes:config.maxBodyBytes,bodyTimeoutMs:config.bodyTimeoutMs});
}
