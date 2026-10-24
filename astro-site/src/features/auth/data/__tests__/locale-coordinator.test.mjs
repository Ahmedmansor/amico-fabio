import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLocaleCoordinator} from '../locale-coordinator.ts';
import {createLocalePendingStore} from '../locale-pending-store.ts';
import {nextLocaleState} from '../../domain/locale-preference.ts';

const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
const initial=()=>({siteLocale:'en',revision:0,email:{locale:'en',source:'follow_site'}});
function fixture(){
  let remote=initial(),serial=10;
  const records=new Map(),calls=[],reads=[];
  const ledger=new Map();
  /** @type {{hold: Promise<void> | null, lose: boolean, readFails: boolean}} */
  const f={hold:null,lose:false,readFails:false};
  const store={read:id=>structuredClone(records.get(id)??null),write(id,value){records.set(id,structuredClone(value));return true;},remove(id){records.delete(id);}};
  const repository={
    async read(id){reads.push(id);return f.readFails?{ok:false,reason:'failed'}:{ok:true,value:structuredClone(remote)};},
    async change(id,command){
      calls.push({id,command:structuredClone(command)});
      if(f.hold){const held=f.hold;f.hold=null;await held;}
      if(ledger.has(command.requestId))return {ok:true,value:{outcome:'duplicate',state:structuredClone(remote)}};
      const result=nextLocaleState(remote,command);
      if(!result.ok)return result;
      remote=result.value;ledger.set(command.requestId,true);
      if(f.lose){f.lose=false;return {ok:false,reason:'failed'};}
      return {ok:true,value:{outcome:'applied',state:structuredClone(remote)}};
    },
  };
  const create=()=>createLocaleCoordinator({repository,store,requestId:()=>`00000000-0000-4000-8000-${String(serial++).padStart(12,'0')}`});
  return Object.assign(f,{records,calls,reads,create,remote(value){remote=value;}});
}
test('guest choices and ordinary account notifications produce no language writes',async()=>{
  const f=fixture(),c=f.create();
  await c.choose({kind:'site',locale:'it'});
  assert.equal(f.calls.length,0);assert.equal(f.records.size,0);
  await c.setAccount(a);await c.setAccount(a);
  await c.choose({kind:'site',locale:'en'});
  assert.equal(f.reads.length,1);assert.equal(f.calls.length,0);
  assert.equal(c.snapshot().pending,false);
});
test('rapid en -> it -> en retains the last choice despite the initial cached en value',async()=>{
  const f=fixture(),c=f.create();await c.setAccount(a);
  let release;f.hold=new Promise(resolve=>release=resolve);
  const first=c.choose({kind:'site',locale:'it'});
  const second=c.choose({kind:'site',locale:'en'});
  assert.equal(f.calls.length,1);release();await Promise.all([first,second]);
  assert.deepEqual(f.calls.map(call=>[call.command.locale,call.command.expectedRevision]),[['it',0],['en',1]]);
  assert.equal(c.snapshot().confirmed.siteLocale,'en');assert.equal(c.snapshot().status,'ready');
  assert.equal(f.records.size,0);
});
test('lost acknowledgement preserves request identity; a queued newer choice waits for explicit retry',async()=>{
  const f=fixture(),c=f.create();await c.setAccount(a);f.lose=true;
  await c.choose({kind:'site',locale:'it'});
  assert.equal(c.snapshot().status,'uncertain');
  await c.choose({kind:'site',locale:'en'});assert.equal(f.calls.length,1);
  await c.retry();
  assert.equal(f.calls[0].command.requestId,f.calls[1].command.requestId);
  assert.equal(f.calls[2].command.locale,'en');
  assert.equal(c.snapshot().confirmed.siteLocale,'en');assert.equal(c.snapshot().pending,false);
});
test('navigation recovers an explicit pending command once with the same identity',async()=>{
  const f=fixture(),first=f.create();await first.setAccount(a);f.lose=true;
  await first.choose({kind:'site',locale:'it'});
  const next=f.create();await next.setAccount(a);
  assert.equal(f.calls.length,2);
  assert.equal(f.calls[0].command.requestId,f.calls[1].command.requestId);
  assert.equal(next.snapshot().status,'ready');
});
test('automatic recovery cannot repeat on every page load, and intent without a captured revision never auto-writes',async()=>{
  const f=fixture(),first=f.create();await first.setAccount(a);f.lose=true;
  await first.choose({kind:'site',locale:'it'});
  const saved=f.records.get(a);saved.recoveryAttempted=true;
  const next=f.create();await next.setAccount(a);
  assert.equal(f.calls.length,1);assert.equal(next.snapshot().status,'uncertain');
  await next.retry();assert.equal(f.calls.length,2);assert.equal(next.snapshot().status,'ready');
  f.records.set(a,{intent:{kind:'site',locale:'en'},command:null,recoveryAttempted:false});
  await f.create().setAccount(a);assert.equal(f.calls.length,2);
});
test('automatic recovery requires its one-attempt budget to be stored durably',async()=>{
  let writes=0;
  const command={requestId:b,expectedRevision:0,kind:'site',locale:'it'};
  const coordinator=createLocaleCoordinator({repository:{read:async()=>({ok:true,value:initial()}),
    change:async()=>{writes++;return {ok:false,reason:'failed'};}},
    store:{read:()=>({intent:{kind:'site',locale:'it'},command,recoveryAttempted:false}),write:()=>false,remove(){}},requestId:()=>a});
  await coordinator.setAccount(a);
  assert.equal(writes,0);assert.equal(coordinator.snapshot().status,'uncertain');
  assert.equal(coordinator.snapshot().durable,false);
  await coordinator.retry();assert.equal(writes,1);
});
test('a stale conflict is exposed without automatically overwriting another device',async()=>{
  const f=fixture(),c=f.create();await c.setAccount(a);
  f.remote({siteLocale:'en',revision:2,email:{locale:'it',source:'explicit'}});
  await c.choose({kind:'site',locale:'it'});
  assert.equal(c.snapshot().status,'conflict');assert.equal(f.calls.length,1);
  assert.equal(c.snapshot().confirmed.email.source,'explicit');
  await c.retry();
  assert.equal(f.calls[1].command.expectedRevision,2);
  assert.notEqual(f.calls[0].command.requestId,f.calls[1].command.requestId);
  assert.equal(c.snapshot().confirmed.email.source,'explicit');
});
test('late replies cannot clear another account intent or replace its state',async()=>{
  const f=fixture(),c=f.create();await c.setAccount(a);
  let release;f.hold=new Promise(resolve=>release=resolve);
  const first=c.choose({kind:'site',locale:'it'});
  await c.setAccount(b);await c.choose({kind:'email_explicit',locale:'it'});
  const before=c.snapshot();release();await first;
  assert.deepEqual(c.snapshot(),before);assert.ok(f.records.has(a));
  assert.equal(f.records.has(b),false);
});
test('a failed initial read can recover only on explicit retry, with no anonymous replay',async()=>{
  const f=fixture(),c=f.create();f.readFails=true;await c.setAccount(a);
  await c.choose({kind:'site',locale:'it'});assert.equal(f.calls.length,0);
  f.readFails=false;await c.retry();assert.equal(f.calls.length,1);
  await c.setAccount(null);await c.retry();assert.equal(f.calls.length,1);
});
test('a duplicate acknowledgement of a much newer remote revision requires reconciliation',async()=>{
  const f=fixture(),c=f.create();await c.setAccount(a);f.lose=true;
  await c.choose({kind:'site',locale:'it'});
  f.remote({siteLocale:'en',revision:4,email:{locale:'it',source:'explicit'}});
  await c.retry();
  assert.equal(c.snapshot().status,'conflict');assert.equal(f.calls.length,2);
  assert.equal(c.snapshot().confirmed.revision,4);
});
test('pending storage is account-scoped, bounded and rejects secrets or malformed recovery data',()=>{
  const items=new Map();let now=1000;
  const storage={getItem:key=>items.get(key)??null,setItem:(key,value)=>items.set(key,value),removeItem:key=>items.delete(key)};
  const store=createLocalePendingStore({storage,now:()=>now,maxAgeMs:100});
  const pending={intent:{kind:'site',locale:'it'},command:null,recoveryAttempted:false};
  assert.equal(store.write(a,pending),true);assert.deepEqual(store.read(a),pending);assert.equal(store.read(b),null);
  assert.equal(store.write(a,{...pending,token:'synthetic'}),false);
  assert.equal(store.write(a,{...pending,intent:{...pending.intent,enabled:true}}),false);
  now=1101;assert.equal(store.read(a),null);assert.equal(items.size,0);
  assert.throws(()=>store.read('guest'));
  items.set(`fabio:locale-pending:v1:${a}`,'x'.repeat(2049));
  assert.equal(store.read(a),null);assert.equal(items.size,0);
});
test('blocked browser storage does not claim a durable save',async()=>{
  const store=createLocalePendingStore({storage:{getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');},removeItem(){}},now:()=>1000,maxAgeMs:100});
  assert.equal(store.write(a,{intent:{kind:'site',locale:'it'},command:null}),false);
  assert.equal(store.read(a),null);
  const c=createLocaleCoordinator({repository:{read:async()=>({ok:true,value:initial()}),change:async()=>({ok:false,reason:'failed'})},store,
    requestId:()=>a});
  await c.setAccount(a);await c.choose({kind:'site',locale:'it'});
  assert.equal(c.snapshot().durable,false);assert.equal(c.snapshot().status,'uncertain');
});
