import {describe,it,expect} from 'vitest';
import {initialReminderState,updateReminderState as apply,reminderSchedule as schedule,reminderDelayMs as day} from '../schedule';
const ready=()=>apply(apply(initialReminderState(),{type:'added',key:'tour',at:100}),{type:'consent',enabled:true,at:200});
describe('approved one reminder after the latest real addition/consent',()=>{
  it('waits 24h from the later consent and honors the exact due boundary',()=>{
    const state=ready();expect(schedule(state,200+day-1).status).toBe('waiting');
    expect(schedule(state,200+day)).toEqual({status:'due',dueAt:200+day});
  });
  it('a new package addition postpones while duplicate saves and consent repeats do not',()=>{
    let state=apply(ready(),{type:'added',key:'package:pack',at:500});
    state=apply(state,{type:'added',key:'package:pack',at:900});
    state=apply(state,{type:'consent',enabled:true,at:1000});
    expect(schedule(state,1000).dueAt).toBe(500+day);
  });
  it('removing the latest item does not move the clock backward',()=>{
    const state=apply(apply(ready(),{type:'added',key:'package:pack',at:500}),{type:'removed',key:'package:pack',at:600});
    expect(schedule(state,600).dueAt).toBe(500+day);
  });
  it('emptying cancels waiting and a later refill restarts before the first send',()=>{
    let state=apply(ready(),{type:'removed',key:'tour',at:500});
    expect(schedule(state,500+day).status).toBe('empty');
    state=apply(state,{type:'added',key:'package:pack',at:day*2});
    expect(schedule(state,day*2).dueAt).toBe(day*3);
  });
  it('withdrawal prevents sending and renewed consent starts a new waiting period before any send',()=>{
    let state=apply(ready(),{type:'consent',enabled:false,at:300});
    expect(schedule(state,day*3).status).toBe('disabled');
    state=apply(state,{type:'consent',enabled:true,at:day*4});
    expect(schedule(state,day*4).dueAt).toBe(day*5);
  });
  it('provider acceptance consumes the single reminder, including late responses after opt-out',()=>{
    let state=apply(ready(),{type:'consent',enabled:false,at:day});
    state=apply(state,{type:'provider-accepted',at:day+1});
    state=apply(state,{type:'consent',enabled:true,at:day*2});
    state=apply(state,{type:'added',key:'new',at:day*3});
    expect(schedule(state,day*9).status).toBe('consumed');
  });
  it('does not mutate input or derive missing timestamps from the current browser time',()=>{
    const state=ready(),before=structuredClone(state);apply(state,{type:'added',key:'new',at:500});expect(state).toEqual(before);
    expect(()=>schedule({...state,lastAdditionAt:null},500)).toThrow(/history/);
    expect(()=>schedule(state,NaN)).toThrow(/timestamp/);
  });
});
