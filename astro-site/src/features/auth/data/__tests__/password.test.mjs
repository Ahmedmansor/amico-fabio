import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAuthService} from '../service.ts';
import {readAuthConfig,authReturnPaths} from '../config.ts';
import {safeReturnPath} from '../../domain/auth.ts';
const config = {url:'https://auth.example.test',publishableKey:'sb_publishable_test',siteOrigin:'https://test.example.test',emailEnabled:true,googleEnabled:true,passwordEnabled:true,turnstileSiteKey:'synthetic-key',resendSeconds:60};
const details={firstName:'Mario',lastName:'Rossi',passwordConfirmation:'long password'};
const nameMetadata={first_name:'Mario',last_name:'Rossi',full_name:'Mario Rossi'};
function setup(overrides={},now=()=>1000) {
  const calls=[];
  const session={user:{id:'account'}};
  const auth={
    signUp:async input=>{calls.push(['signup',input]);return {data:{session:null},error:null};},
    signInWithPassword:async input=>{calls.push(['password',input]);return {data:{session},error:null};},
    signInWithOtp:async input=>{calls.push(['otp',input]);return {error:null};},
    verifyOtp:async input=>{calls.push(['verify',input]);return {data:{session},error:null};},
    resend:async input=>{calls.push(['resend',input]);return {error:null};},
    signInWithOAuth:async input=>{calls.push(['oauth',input]);return {data:{url:config.url+'/auth/v1/authorize?provider=google'},error:null};},
    exchangeCodeForSession:async()=>({data:{session},error:null}),
    getUser:async()=>({data:{user:session.user},error:null}),
    updateUser:async input=>{calls.push(['update',input]);return {error:null};},...overrides,
  };
  return {service:createAuthService({auth},config,now),calls};
}
test('sending gates stop SDK calls; signup carries CAPTCHA and intent but creates no consent write',async()=>{
  const {service,calls}=setup();
  for(const [email,password,token,reason] of [['bad','long password','token','invalid-email'],['a@gamil.com','long password','token','email-typo'],['a@mailinator.com','long password','token','disposable-domain'],['a@libero.it','long password',undefined,'captcha-required'],['a@libero.it','short','token','invalid-password']]){
    assert.deepEqual(await service.signUp(email,password,'it',undefined,token),{ok:false,reason});
  }
  assert.equal(calls.length,0);
  assert.equal((await service.signUp('a@LIBERO.IT','long password','it','//evil.test','token',false,details)).ok,true);
  assert.deepEqual(calls[0],['signup',{email:'a@libero.it',password:'long password',options:{captchaToken:'token',emailRedirectTo:'https://test.example.test/it/auth/callback/?next=%2Fit%2F',data:{site_locale:'it',marketing_consent:false,...nameMetadata}}}]);
  assert.deepEqual(await service.signUp('a@libero.it','long password','it',undefined,'token',false,details),{ok:false,reason:'rate-limited'});
});
test('password login returns session without sending and requires CAPTCHA',async()=>{
  const {service,calls}=setup();
  assert.deepEqual(await service.signInWithPassword('a@libero.it','long password'),{ok:false,reason:'captcha-required'});
  assert.equal((await service.signInWithPassword('a@libero.it','long password','token')).ok,true);
  assert.deepEqual(calls.map(c=>c[0]),['password']);
});
test('checked signup intent carries a version but never performs a consent RPC',async()=>{
  const {service,calls}=setup();
  assert.equal((await service.signUp('qa@libero.it','long password','it',undefined,'token',true,details)).ok,true);
  assert.deepEqual(calls[0][1].options.data,{site_locale:'it',marketing_consent:true,...nameMetadata,marketing_notice_version:'favorites-offers-v1'});
  assert.equal(calls.length,1);
});
test('Magic Link recovery cannot create another account and forwards token',async()=>{
  const {service,calls}=setup();
  assert.equal((await service.requestMagicLink('a@libero.it','en','/en/wishlist/','token')).ok,true);
  assert.equal(calls[0][1].options.shouldCreateUser,false);
  assert.equal(calls[0][1].options.captchaToken,'token');
});
test('Google remains the only OAuth provider and keeps the PKCE callback',async()=>{
  const {service,calls}=setup();
  assert.equal((await service.googleUrl('en','/en/wishlist/')).ok,true);
  assert.equal(calls[0][1].provider,'google');
  assert.equal((await service.completeCallback({kind:'google',code:'synthetic-code'})).ok,true);
});
test('password setting needs a verified account, never signup',async()=>{
  const {service,calls}=setup();
  assert.equal((await service.setPassword('long password','long password')).ok,true);
  assert.deepEqual(calls,[['update',{password:'long password'}]]);
  const guest=setup({getUser:async()=>({data:{user:null},error:null})});
  assert.equal((await guest.service.setPassword('long password','long password')).ok,false);
  assert.equal(guest.calls.length,0);
});
test('flags remain off by default and password activation requires Turnstile',()=>{
  const env={PUBLIC_AUTH_ENABLED:'1',PUBLIC_AUTH_SUPABASE_URL:config.url,PUBLIC_AUTH_SUPABASE_PUBLISHABLE_KEY:config.publishableKey,PUBLIC_AUTH_SITE_URL:config.siteOrigin,PUBLIC_AUTH_GOOGLE_ENABLED:'1'};
  assert.equal(readAuthConfig(env).passwordEnabled,false);
  assert.throws(()=>readAuthConfig({...env,PUBLIC_AUTH_PASSWORD_ENABLED:'1'}),/Turnstile/);
});
test('return path preserves catalog detail destinations without opening redirect or login loops',()=>{
  for(const path of ['/it/tours/boat-trip/','/en/packages/sharm_2026/'])assert.equal(safeReturnPath(path,authReturnPaths(path),'/it/'),path);
  for(const path of ['//evil.test','/it/login/','/it/tours/../login/','/it/tours/%2e%2e/','/it/tours/boat/?next=evil','/ar/tours/boat/','/it/unknown/'])assert.equal(safeReturnPath(path,authReturnPaths(path),'/it/'),'/it/');
});
test('email OTP is verified against the captured email without verifier storage or extra mail',async()=>{
  const {service,calls}=setup();
  for(const code of ['','123','abcdef','12345678901'])assert.deepEqual(await service.verifyEmailCode('qa@libero.it',code),{ok:false,reason:'invalid-code'});
  assert.equal(calls.length,0);
  assert.equal((await service.verifyEmailCode('QA@LIBERO.IT','000 123')).ok,true);
  assert.deepEqual(calls,[['verify',{email:'QA@libero.it',token:'000123',type:'email'}]]);
});
test('wrong, expired and used OTP responses stay failures with a short retry guard',async()=>{
  let now=1000,calls=0;
  const {service}=setup({verifyOtp:async()=>{calls++;return {data:{session:null},error:{code:'otp_expired'}};}},()=>now);
  assert.deepEqual(await service.verifyEmailCode('qa@libero.it','123456'),{ok:false,reason:'invalid-code'});
  assert.deepEqual(await service.verifyEmailCode('qa@libero.it','123456'),{ok:false,reason:'rate-limited'});
  assert.equal(calls,1);now+=3001;
  assert.equal((await service.verifyEmailCode('qa@libero.it','123456')).ok,false);assert.equal(calls,2);
});
test('resend confirmation needs a fresh CAPTCHA and shares signup cooldown without retaining password',async()=>{
  let now=1000;const {service,calls}=setup({},()=>now);
  await service.signUp('qa@libero.it','long password','en',undefined,'token',false,details);
  assert.deepEqual(await service.resendSignupCode('qa@libero.it','en',undefined,'token'),{ok:false,reason:'rate-limited'});
  now+=61000;
  assert.deepEqual(await service.resendSignupCode('qa@libero.it','en'),{ok:false,reason:'captcha-required'});
  assert.equal((await service.resendSignupCode('qa@libero.it','en',undefined,'fresh-token')).ok,true);
  assert.deepEqual(calls[1],['resend',{type:'signup',email:'qa@libero.it',options:{captchaToken:'fresh-token',emailRedirectTo:'https://test.example.test/en/auth/callback/?next=%2Fen%2F'}}]);
});
test('names and matching confirmation are required before signup or password update calls',async()=>{
  const {service,calls}=setup();
  assert.deepEqual(await service.signUp('qa@libero.it','long password','it',undefined,'token',false),{ok:false,reason:'invalid-name'});
  assert.deepEqual(await service.signUp('qa@libero.it','long password','it',undefined,'token',false,{...details,passwordConfirmation:'wrong password'}),{ok:false,reason:'password-mismatch'});
  assert.deepEqual(await service.setPassword('long password','different password'),{ok:false,reason:'password-mismatch'});
  assert.equal(calls.length,0);
});
