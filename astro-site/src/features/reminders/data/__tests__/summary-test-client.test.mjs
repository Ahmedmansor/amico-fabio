import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSummaryTestClient,readSummaryTestEndpoint} from '../summary-test-client.ts';
const endpoint='https://project.example.test/functions/v1/wishlist-email-test';
const options={endpoint,timeoutMs:100,maxResponseBytes:4096,service:{bearerFor:async()=>({ok:true,value:'synthetic-token'})}};
test('QA stays off by default and endpoint must match the configured backend',()=>{
 const auth={url:'https://project.example.test'};assert.equal(readSummaryTestEndpoint({},auth),null);
 assert.equal(readSummaryTestEndpoint({PUBLIC_WISHLIST_EMAIL_TEST_ENABLED:'1',PUBLIC_WISHLIST_EMAIL_TEST_ENDPOINT:endpoint},auth),endpoint);
 assert.throws(()=>readSummaryTestEndpoint({PUBLIC_WISHLIST_EMAIL_TEST_ENABLED:'1',PUBLIC_WISHLIST_EMAIL_TEST_ENDPOINT:endpoint+'?locale=en'},auth));
});
test('client sends no page language and accepts only the server-resolved saved language',async()=>{
 let sent;const client=createSummaryTestClient({...options,fetcher:async(_url,init)=>{sent=init;return Response.json({status:'accepted',messageId:'synthetic',locale:'it'});}});
 assert.deepEqual(await client.send('owner'),{status:'accepted',locale:'it'});assert.equal(sent.body,undefined);assert.deepEqual(Object.keys(sent.headers),['Authorization']);
});
test('cached acceptance clearly differs from a new email',async()=>{
 const client=createSummaryTestClient({...options,fetcher:async()=>Response.json({status:'already-sent',locale:'en'})});assert.deepEqual(await client.send('owner'),{status:'alreadySent',locale:'en'});
});
test('disabled reminders, expired test and uncertain outcome remain distinct',async()=>{
 for(const [status,body,expected] of [[409,{error:'reminder-disabled'},'reminderDisabled'],[410,{},'expired'],[503,{status:'unknown'},'unknown'],[503,{status:'blocked'},'failed'],[200,{status:'accepted',messageId:'synthetic'},'unknown']]){
 const client=createSummaryTestClient({...options,fetcher:async()=>Response.json(body,{status})});assert.equal((await client.send('owner')).status,expected);}
});
test('failed session never sends a request',async()=>{
 let calls=0;const client=createSummaryTestClient({...options,service:{bearerFor:async()=>({ok:false,reason:'failed'})},fetcher:async()=>{calls++;return Response.json({});}});assert.equal((await client.send('owner')).status,'failed');assert.equal(calls,0);
});
