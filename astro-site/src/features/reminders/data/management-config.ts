export interface ManagementBrowserConfig {endpoint:string;timeoutMs:number;maxResponseBytes:number}
export function readManagementBrowserConfig(env:Record<string,unknown>):ManagementBrowserConfig|null{
  const flag=env.PUBLIC_WISHLIST_EMAIL_MANAGEMENT_ENABLED;
  if(flag===undefined||flag===''||flag==='0')return null;
  if(flag!=='1'||typeof env.PUBLIC_AUTH_SUPABASE_URL!=='string')throw new Error('[reminders] Management configuration required.');
  const url=new URL(env.PUBLIC_AUTH_SUPABASE_URL);
  if(url.origin!==env.PUBLIC_AUTH_SUPABASE_URL||url.protocol!=='https:'||url.username||url.password)throw new Error('[reminders] Invalid management origin.');
  return {endpoint:`${url.origin}/functions/v1/wishlist-email-management`,timeoutMs:10000,maxResponseBytes:4096};
}
