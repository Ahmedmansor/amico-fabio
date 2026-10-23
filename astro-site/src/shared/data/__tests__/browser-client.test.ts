import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const createClient=vi.hoisted(()=>vi.fn((..._args:unknown[])=>({from:vi.fn(),auth:{}})));
vi.mock('@supabase/supabase-js',()=>({createClient}));
beforeEach(()=>{vi.resetModules();createClient.mockClear();});
afterEach(()=>vi.unstubAllGlobals());
const config={url:'https://auth-qa.invalid',publishableKey:'sb_publishable_synthetic',siteOrigin:'http://127.0.0.1:4330'};
function browser(denied=false){
  const data=new Map<string,string>();
  vi.stubGlobal('window',{location:{origin:config.siteOrigin},get localStorage(){
    if(denied)throw new Error('denied');
    return {setItem:(key:string,value:string)=>data.set(key,value),getItem:(key:string)=>data.get(key)??null,removeItem:(key:string)=>data.delete(key)};
  }});
}
describe('shared browser SDK connection',()=>{
  it('is off without explicit config and never creates an SDK client',async()=>{
    const {browserSupabase}=await import('../browser-client');
    expect(await browserSupabase(null)).toBeNull();expect(createClient).not.toHaveBeenCalled();
  });
  it('shares exactly one configured client without duplicating Auth storage',async()=>{
    browser();const {browserSupabase}=await import('../browser-client');
    const [first,second]=await Promise.all([browserSupabase(config),browserSupabase({...config})]);
    expect(first).toBe(second);expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient.mock.calls[0]?.[2]).toMatchObject({auth:{flowType:'pkce',detectSessionInUrl:false,storageKey:'fabio:auth:session:v1'}});
    expect(await browserSupabase({...config,siteOrigin:'https://different.invalid'})).toBeNull();
  });
  it('fails closed on denied storage or a different site origin',async()=>{
    browser(true);let connection=await import('../browser-client');
    expect(await connection.browserSupabase(config)).toBeNull();
    vi.resetModules();browser();connection=await import('../browser-client');
    expect(await connection.browserSupabase({...config,siteOrigin:'https://other.invalid'})).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });
});
