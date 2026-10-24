import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWishlistSummarySender} from '../send-wishlist-summary.ts';
import {buildEmailCatalog} from '../../domain/catalog.ts';
import {createSummaryTestClient} from '../../data/summary-test-client.ts';
import {createSummaryTestHandler} from '../summary-test-handler.ts';
const userId='00000000-0000-4000-8000-000000000001',deliveryId='00000000-0000-4000-8000-000000000002';
const origin='https://preview.example.test';
const catalog=buildEmailCatalog(['trip','package'].map(kind=>({kind,id:'saved',slug:'saved',adult_price:0,
  localized:Object.fromEntries(['it','en'].map(locale=>[locale,{title:`${kind} ${locale}`,url:`${origin}/${locale}/${kind==='trip'?'tours':'packages'}/saved/`}])),
  image:{url:origin+'/saved.jpg',width:640,height:360}})),origin,'2026-10-24T00:00:00Z','test');
function fixture(overrides={}){
  const calls=[];
  const options={account:{recipient:async id=>{assert.equal(id,userId);return {ok:true,email:'allowed@example.test'};},favorites:async id=>{assert.equal(id,userId);return {ok:true,value:['saved','package:saved','missing']};}},
    catalog:{load:async()=>catalog},environment:'test',delivery:{send:async message=>{calls.push(message);return {status:'accepted',messageId:'<synthetic@example.test>'};}},...overrides};
  return {sender:createWishlistSummarySender(options),calls,options};
}
test('full sending path renders real account selection, both groups and local bilingual content before Brevo',async()=>{
  for(const locale of ['it','en']){
    const f=fixture();assert.equal((await f.sender.sendForUser(userId,locale,deliveryId)).status,'accepted');
    assert.equal(f.calls.length,1);const message=f.calls[0];assert.equal(message.recipient,'allowed@example.test');assert.equal(message.deliveryId,deliveryId);
    assert.match(message.content.htmlContent,new RegExp(`lang="${locale}"`));assert.match(message.content.textContent,new RegExp(`trip ${locale}`));assert.match(message.content.textContent,new RegExp(`package ${locale}`));
    assert.doesNotMatch(message.content.textContent,/missing|unsubscribe|opted in/);assert.match(message.content.htmlContent,/€0/);
  }
});
test('unverified account, incomplete favorites, empty list or unavailable catalog never calls sender',async()=>{
  const base=fixture().options;
  for(const overrides of [{account:{...base.account,recipient:async()=>({ok:false})}},
    {account:{...base.account,favorites:async()=>({ok:false,reason:'failed'})}},
    {account:{...base.account,favorites:async()=>({ok:true,value:[]})}},
    {catalog:{load:async()=>{throw new Error('404');}}}]){
    const f=fixture(overrides);assert.ok(['blocked','empty'].includes((await f.sender.sendForUser(userId,'en',deliveryId)).status));assert.equal(f.calls.length,0);
  }
});
test('unknown delivery is retained and does not become blocked or trigger another send',async()=>{
  let calls=0;const f=fixture({delivery:{send:async()=>{calls++;throw new Error('uncertain response');}}});
  assert.deepEqual(await f.sender.sendForUser(userId,'en',deliveryId),{status:'unknown'});assert.equal(calls,1);
});
test('page-to-handler-to-renderer preserves IT/EN subjects, item links and booking actions without reading correspondence consent',async()=>{
  for(const locale of ['it','en']){
    const f=fixture(),now=Date.parse('2026-10-25T00:00:00Z');
    const handler=createSummaryTestHandler({senderForBearer:()=>f.sender,verifyUser:async()=>({ok:true,userId}),
      userId,deliveryId,locale,allowedOrigin:'http://127.0.0.1:4322',createdAt:now,expiresAt:now+1200000,now:()=>now,bodyTimeoutMs:100});
    const client=createSummaryTestClient({requestLocaleEnabled:true,service:{bearerFor:async()=>({ok:true,value:'synthetic'})},
      endpoint:'https://api.example.test/functions/v1/wishlist-email-test',timeoutMs:1000,maxResponseBytes:4096,
      fetcher:async(url,init)=>handler(new Request(url,init))});
    assert.equal(await client.send(userId,locale),'accepted');assert.equal(f.calls.length,1);
    const content=f.calls[0].content;
    assert.equal(content.subject,locale==='it'?'I tuoi preferiti di Fabio Egypt':'Your Fabio Egypt favorites');
    assert.match(content.htmlContent,new RegExp(`lang="${locale}"`));
    assert.match(content.textContent,new RegExp(`/${locale}/tours/saved/`));
    assert.match(content.textContent,new RegExp(`/${locale}/packages/saved/`));
    const links=[...content.textContent.matchAll(/https:\/\/wa\.me\/[^\s]+/g)].map(match=>new URL(match[0]));
    assert.equal(links.length,4);
    for(const link of links)assert.match(link.searchParams.get('text'),locale==='it'?/Ciao Fabio Egypt/:/Hi Fabio Egypt/);
    assert.doesNotMatch(content.textContent,new RegExp(`/${locale==='it'?'en':'it'}/(?:tours|packages)/`));
  }
});
