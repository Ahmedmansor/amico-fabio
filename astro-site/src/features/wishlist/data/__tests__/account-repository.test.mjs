import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountRepository} from '../account-repository.ts';
const userId='00000000-0000-4000-8000-000000000001';
function fixture(responses=[]) {
  const calls=[];
  const client={from(table){
    const call={table,filters:[]}; calls.push(call);
    const query={
      select(columns){call.columns=columns;return query;},
      eq(column,value){call.filters.push([column,value]);return query;},
      order(column){call.order=column;return query;},
      range(start,end){call.range=[start,end];return Promise.resolve(responses.shift()??{data:[],error:null});},
      upsert(rows,options){call.rows=rows;call.options=options;return Promise.resolve(responses.shift()??{error:null});},
      delete(){call.delete=true;return query;},
      then(resolve,reject){return Promise.resolve(responses.shift()??{error:null}).then(resolve,reject);},
    };return query;
  }};
  return {repository:createAccountRepository(client),calls};
}
test('reads every page with an ownership filter and stable order, including over 200 rows',async()=>{
  const first=Array.from({length:200},(_,i)=>({trip_id:`trip_${String(i).padStart(3,'0')}`}));
  const {repository,calls}=fixture([{data:first,error:null},{data:[{trip_id:'last'}],error:null}]);
  const result=await repository.list(userId);
  assert.equal(result.ok,true);assert.equal(result.value.length,201);
  assert.deepEqual(calls.map(call=>call.range),[[0,199],[200,399]]);
  for(const call of calls){assert.deepEqual(call.filters,[['user_id',userId]]);assert.equal(call.order,'trip_id');}
});
test('does not return partial data as success when a later page fails',async()=>{
  const {repository}=fixture([{data:Array.from({length:200},(_,i)=>({trip_id:`t${i}`})),error:null},{data:null,error:{message:'private diagnostic'}}]);
  assert.deepEqual(await repository.list(userId),{ok:false,reason:'failed'});
});
test('duplicate-safe inserts are bounded and never write dates, profile data or update rows',async()=>{
  const {repository,calls}=fixture();
  assert.equal((await repository.add(userId,Array.from({length:205},(_,i)=>`t${i}`))).ok,true);
  assert.deepEqual(calls.map(call=>call.rows.length),[100,100,5]);
  for(const call of calls){
    assert.deepEqual(call.options,{onConflict:'user_id,trip_id',ignoreDuplicates:true});
    for(const row of call.rows)assert.deepEqual(Object.keys(row).sort(),['trip_id','user_id']);
  }
});
test('partial inserts report failure and duplicate inputs are not sent twice',async()=>{
  const {repository,calls}=fixture([{error:{message:'not exposed'}}]);
  assert.deepEqual(await repository.add(userId,['a','a','b']),{ok:false,reason:'failed'});
  assert.equal(calls[0].rows.length,2);
});
test('removal filters both identity and tour; profile creation preserves existing locale',async()=>{
  const {repository,calls}=fixture();
  assert.equal((await repository.remove(userId,'trip_a')).ok,true);
  assert.deepEqual(calls[0].filters,[['user_id',userId],['trip_id','trip_a']]);
  assert.equal((await repository.ensureProfile(userId,'it')).ok,true);
  assert.deepEqual(calls[1].rows,{user_id:userId,locale:'it'});
  assert.equal(calls[1].options.ignoreDuplicates,true);
});
test('rejects invalid identity/locale and corrupt required IDs; no raw provider errors escape',async()=>{
  const {repository,calls}=fixture([{data:[{trip_id:null}],error:null}]);
  assert.deepEqual(await repository.add('not-a-user',['a']),{ok:false,reason:'invalid-data'});
  assert.deepEqual(await repository.ensureProfile(userId,'xx'),{ok:false,reason:'invalid-data'});
  assert.equal(calls.length,0);
  assert.deepEqual(await repository.list(userId),{ok:false,reason:'failed'});
});
