import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSummaryTestClient,readSummaryTestEndpoint,readSummaryPageLocaleFlag} from '../summary-test-client.ts';
const endpoint='https://project.example.test/functions/v1/wishlist-email-test';
test('test email stays off by default and enabled endpoint must match the Auth project exactly',()=>{
  const auth={url:'https://project.example.test'};
  assert.equal(readSummaryTestEndpoint({},auth),null);
  assert.equal(readSummaryTestEndpoint({PUBLIC_WISHLIST_EMAIL_TEST_ENABLED:'1',PUBLIC_WISHLIST_EMAIL_TEST_ENDPOINT:endpoint},auth),endpoint);
  for(const value of ['https://other.example.test/functions/v1/wishlist-email-test',endpoint+'?recipient=other',endpoint+'/'])
    assert.throws(()=>readSummaryTestEndpoint({PUBLIC_WISHLIST_EMAIL_TEST_ENABLED:'1',PUBLIC_WISHLIST_EMAIL_TEST_ENDPOINT:value},auth));
});
test('client posts page language only and obtains bearer for the expected account',async()=>{
  const calls=[];
  const client=createSummaryTestClient({endpoint,requestLocaleEnabled:true,timeoutMs:100,maxResponseBytes:4096,service:{bearerFor:async id=>{assert.equal(id,'expected-owner');return {ok:true,value:'synthetic-token'};}},
    fetcher:async(url,init)=>{calls.push([url,init]);return Response.json({status:'accepted',messageId:'synthetic',locale:'it'});}});
  assert.equal(await client.send('expected-owner','it'),'accepted');assert.equal(calls.length,1);
  assert.equal(calls[0][1].method,'POST');assert.deepEqual(JSON.parse(calls[0][1].body),{locale:'it'});assert.equal(calls[0][1].headers.Authorization,'Bearer synthetic-token');
});
test('unknown acceptance or expired test remains distinct; failed session never dispatches',async()=>{
  for(const [status,result] of [[503,'unknown'],[410,'expired'],[403,'failed']]){
    const client=createSummaryTestClient({endpoint,timeoutMs:100,maxResponseBytes:4096,service:{bearerFor:async()=>({ok:true,value:'synthetic-token'})},fetcher:async()=>Response.json({},{status})});
    assert.equal(await client.send('owner','en'),result);
  }
  let calls=0;const client=createSummaryTestClient({endpoint,timeoutMs:100,maxResponseBytes:4096,service:{bearerFor:async()=>({ok:false,reason:'failed'})},fetcher:async()=>{calls++;return Response.json({});}});
  assert.equal(await client.send('owner','en'),'failed');assert.equal(calls,0);
});

test('known pre-send block or provider rejection displays failure; ambiguous 503 stays unknown',async()=>{
  for(const [body,expected] of [[{status:'blocked'},'failed'],[{status:'rejected',reason:'provider-rejected'},'failed'],[{status:'unknown'},'unknown'],[{},'unknown']]){
    const client=createSummaryTestClient({endpoint,timeoutMs:100,maxResponseBytes:4096,service:{bearerFor:async()=>({ok:true,value:'synthetic-token'})},fetcher:async()=>Response.json(body,{status:503})});
    assert.equal(await client.send('owner','en'),expected);
  }
});
test('old or wrong-language server acknowledgement remains unknown; invalid locale never dispatches',async()=>{
  for(const locale of [undefined,'en']){
    let calls=0;
    const client=createSummaryTestClient({endpoint,requestLocaleEnabled:true,timeoutMs:100,maxResponseBytes:4096,service:{bearerFor:async()=>({ok:true,value:'synthetic-token'})},
      fetcher:async()=>{calls++;return Response.json({status:'accepted',messageId:'synthetic',...(locale?{locale}:{})});}});
    assert.equal(await client.send('owner','it'),'unknown');
    assert.equal(await client.send('owner','fr'),'failed');assert.equal(calls,1);
  }
});
test('an approved test window in another language is distinct from a sending failure',async()=>{
  const client=createSummaryTestClient({endpoint,timeoutMs:100,maxResponseBytes:4096,service:{bearerFor:async()=>({ok:true,value:'synthetic-token'})},
    fetcher:async()=>Response.json({error:'job-locale-mismatch',locale:'en'},{status:409})});
  assert.equal(await client.send('owner','it'),'localeUnavailable');
});
test('default-off page-locale protocol preserves deployed legacy test clients and preflight',async()=>{
  assert.equal(readSummaryPageLocaleFlag({}),false);
  assert.equal(readSummaryPageLocaleFlag({PUBLIC_WISHLIST_EMAIL_TEST_PAGE_LOCALE_ENABLED:'1'}),true);
  assert.throws(()=>readSummaryPageLocaleFlag({PUBLIC_WISHLIST_EMAIL_TEST_PAGE_LOCALE_ENABLED:'true'}));
  let request;
  const client=createSummaryTestClient({endpoint,timeoutMs:100,maxResponseBytes:4096,service:{bearerFor:async()=>({ok:true,value:'synthetic-token'})},
    fetcher:async(_url,init)=>{request=init;return Response.json({status:'accepted',messageId:'synthetic'});}});
  assert.equal(await client.send('owner','it'),'accepted');
  assert.equal(request.body,undefined);assert.equal(request.headers['Content-Type'],undefined);
});
