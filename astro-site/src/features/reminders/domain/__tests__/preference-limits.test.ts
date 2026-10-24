import {it,expect} from 'vitest';
import {assertPreferenceRatePolicy} from '../preference-limits';
it('requires explicit independent positive integer read/write policies without quota defaults',()=>{
  const policy={read:{limit:2,windowSeconds:60},write:{limit:1,windowSeconds:120}};
  expect(()=>assertPreferenceRatePolicy(policy)).not.toThrow();
  for(const invalid of [0,-1,1.5,NaN,Infinity,2147483648])for(const operation of ['read','write'] as const)
    expect(()=>assertPreferenceRatePolicy({...policy,[operation]:{...policy[operation],limit:invalid}})).toThrow();
  expect(()=>assertPreferenceRatePolicy({...policy,write:{limit:1,windowSeconds:0}})).toThrow();
});
