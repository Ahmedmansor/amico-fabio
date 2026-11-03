import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBrevoDelivery} from '../brevo-delivery.ts';
import {createEmailAccountSource} from '../email-account-source.ts';
import {createEmailCatalogSource} from '../email-catalog-source.ts';
import {buildEmailCatalog} from '../../domain/catalog.ts';
import {createClient} from '@supabase/supabase-js';
const userId='00000000-0000-4000-8000-000000000001';
const deliveryId='00000000-0000-4000-8000-000000000002';
const input={deliveryId,recipient:'allowed@example.test',content:{subject:'Favorites',htmlContent:'<p>Local template</p>',textContent:'Local template'}};
function fixture(overrides={}){
  const calls=[];const delivery=createBrevoDelivery({apiKey:'synthetic-brevo-key',isDispatchAllowed:()=>true,sender:{email:'sender@example.test',name:'Fabio Egypt'},
    allowedRecipients:[input.recipient],timeoutMs:100,maxResponseBytes:1024,maxRequestBytes:10000,
    fetcher:async(url,init)=>{calls.push([url,init]);return Response.json({messageId:'<synthetic@example.test>'},{status:201});},...overrides});
  return {delivery,calls};
}
test('real REST adapter sends local HTML/text, one allowlisted recipient and stable provider idempotency identity',async()=>{
  const f=fixture();assert.deepEqual(await f.delivery.send(input),{status:'accepted',messageId:'<synthetic@example.test>'});
  const [url,init]=f.calls[0];assert.equal(url,'https://api.brevo.com/v3/smtp/email');assert.equal(init.method,'POST');
  assert.equal(init.headers['api-key'],'synthetic-brevo-key');assert.equal(init.redirect,'error');
  const body=JSON.parse(init.body);assert.deepEqual(body.to,[{email:input.recipient,contactPixelTrackingConsent:false}]);
  assert.deepEqual(body.headers,{idempotencyKey:deliveryId});assert.equal(body.htmlContent,input.content.htmlContent);assert.equal(body.textContent,input.content.textContent);
  for(const key of ['templateId','bcc','cc','messageVersions','scheduledAt'])assert.equal(key in body,false);
});
test('invalid content, disallowed recipient, missing secret or excessive payload never dispatch',async()=>{
  const f=fixture();assert.deepEqual(await f.delivery.send({...input,recipient:'other@example.test'}),{status:'rejected',reason:'recipient-not-allowed'});
  assert.equal((await f.delivery.send({...input,content:{...input.content,subject:'bad\nheader'}})).status,'rejected');assert.equal(f.calls.length,0);
  for(const config of [{apiKey:null},{maxRequestBytes:5},{isDispatchAllowed:()=>false}]){const f=fixture(config);assert.equal((await f.delivery.send(input)).status,'rejected');assert.equal(f.calls.length,0);}
});
test('uncertain acceptance never auto-retries or becomes success, including duplicate_parameter and malformed 201',async()=>{
  for(const fetcher of [async()=>{throw new Error('private details');},async()=>Response.json({code:'duplicate_parameter'},{status:400}),
    async()=>Response.json({private:'not accepted evidence'},{status:201}),async()=>Response.json({message:'internal'},{status:500})]){
    let calls=0;const f=fixture({fetcher:async(...args)=>{calls++;return fetcher(...args);}});
    assert.deepEqual(await f.delivery.send(input),{status:'unknown'});assert.equal(calls,1);
  }
});
test('429 is deferred without sending again; explicit 4xx rejection exposes no provider content',async()=>{
  const throttled=fixture({fetcher:async()=>Response.json({private:'details'},{status:429,headers:{'Retry-After':'17'}})});
  assert.deepEqual(await throttled.delivery.send(input),{status:'deferred',retryAfterSeconds:17});
  const denied=fixture({fetcher:async()=>Response.json({message:'private credentials details'},{status:401})});
  assert.deepEqual(await denied.delivery.send(input),{status:'rejected',reason:'provider-rejected'});
});
test('recipient uses confirmed Auth email and exact owner, ignoring editable metadata',async()=>{
  const base={id:userId,email:input.recipient,email_confirmed_at:'2026-10-24T00:00:00Z',user_metadata:{email:'other@example.test'}};
  const source=user=>createEmailAccountSource({auth:{admin:{getUserById:async id=>{assert.equal(id,userId);return {data:{user},error:null};}}}},{from:()=>{throw new Error('No wishlist read expected.');}},[input.recipient],100);
  assert.deepEqual(await source(base).recipient(userId),{ok:true,email:input.recipient});
  for(const user of [{...base,email_confirmed_at:null},{...base,email:'other@example.test'},{...base,id:deliveryId}])
    assert.deepEqual(await source(user).recipient(userId),{ok:false});
});

test('favorites use the bearer-bound public client and both ownership-filtered tables, never the admin client',async()=>{
  const calls=[];
  const wishlist=createClient('https://project.example.test','sb_publishable_synthetic',{
    auth:{persistSession:false,autoRefreshToken:false},accessToken:async()=>'synthetic-owner-token',
    global:{fetch:async(url,init)=>{
      const parsed=new URL(url),table=parsed.pathname.split('/').at(-1),column=table==='wishlists'?'trip_id':'package_id';
      assert.equal(new Headers(init.headers).get('Authorization'),'Bearer synthetic-owner-token');
      assert.equal(new Headers(init.headers).get('apikey'),'sb_publishable_synthetic');
      assert.equal(parsed.searchParams.get('user_id'),'eq.'+userId);
      assert.equal(parsed.searchParams.get('select'),column);
      calls.push(table);
      return Response.json(parsed.searchParams.has(column)?[]:[{[column]:'saved'}]);
    }},
  });
  const identity={auth:{},from:()=>{throw new Error('Admin must not read favorites.');}};
  const source=createEmailAccountSource(identity,wishlist,[input.recipient],1000);
  assert.deepEqual(await source.favorites(userId),{ok:true,value:['package:saved','saved']});
  assert.deepEqual(calls,['wishlists','wishlists','package_wishlists','package_wishlists']);
});
test('catalog loader refuses absent, stale, future, wrong-origin or wrong-environment manifests before sending',async()=>{
  const origin='https://preview.example.test',stamp='2026-10-24T00:00:00Z';
  const catalog=buildEmailCatalog([],origin,stamp,'test');
  const options={url:origin+'/tours-manifest.json',origin,environment:'test',maxAgeMs:60000,now:()=>Date.parse(stamp)+1000,timeoutMs:100,maxResponseBytes:4096};
  assert.deepEqual(await createEmailCatalogSource({...options,fetcher:async()=>Response.json(catalog)}).load(),catalog);
  for(const manifest of [{...catalog,generated_at:'2026-10-23T00:00:00Z'},{...catalog,generated_at:'2026-10-25T00:00:00Z'},
    {...catalog,origin:'https://other.example.test'},{...catalog,environment:'production'}])
    await assert.rejects(()=>createEmailCatalogSource({...options,fetcher:async()=>Response.json(manifest)}).load());
  await assert.rejects(()=>createEmailCatalogSource({...options,fetcher:async()=>new Response('missing',{status:404})}).load());
});
