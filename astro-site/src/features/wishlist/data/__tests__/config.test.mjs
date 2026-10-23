import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readAccountSyncFlag} from '../config.ts';
test('account sync is explicitly opt-in and requires separately configured Auth',()=>{
  for(const value of [undefined,'','0'])assert.equal(readAccountSyncFlag(value,false),false);
  for(const value of ['true',true,1,'yes'])assert.throws(()=>readAccountSyncFlag(value,true),/must be 0 or 1/);
  assert.throws(()=>readAccountSyncFlag('1',false),/configured Auth/);
  assert.equal(readAccountSyncFlag('1',true),true);
});
