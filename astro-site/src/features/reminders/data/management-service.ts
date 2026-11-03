import {isManagementToken,parseManagementCommand,type ManagementRepository,type ManagementResult} from '../domain/management.ts';
/** Backend only. This capability cannot create consent, read favorites or sign in. */
export function createManagementService(repository:ManagementRepository,hash:(token:string)=>Promise<string>){
  return {async execute(body:unknown):Promise<ManagementResult>{
    if(!body||typeof body!=='object'||Array.isArray(body))return {ok:false,reason:'invalid-link'};
    const row=body as Record<string,unknown>;
    if(Object.keys(row).some(key=>!['token','command'].includes(key))||!isManagementToken(row.token))return {ok:false,reason:'invalid-link'};
    const command=parseManagementCommand(row.command);if(!command)return {ok:false,reason:'invalid-link'};
    try{const digest=await hash(row.token);if(!isManagementToken(digest))return {ok:false,reason:'unavailable'};
      return await repository.run(digest,command);
    }catch{return {ok:false,reason:'unavailable'};}
  }};
}
export async function hashManagementToken(token:string):Promise<string>{
  if(!isManagementToken(token))throw new Error('[reminders] Invalid capability.');
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function newManagementToken():string{
  return Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');
}
