import {describe, expect, it} from 'vitest';
import {parseReminderActivity} from '../activity';
import {reminderActivitySchedule, reminderDelayMs as day} from '../schedule';
const eligible={enabled:true,consentGrantedAt:200,favoriteCount:2,lastAdditionAt:100,firstAcceptedAt:null};
describe('durable activity contract and count-based eligibility',()=>{
  it('validates empty and nonempty committed summaries without manufacturing timestamps',()=>{
    expect(parseReminderActivity({favoriteCount:0,lastAdditionAt:null,revision:0})).not.toBeNull();
    expect(parseReminderActivity({favoriteCount:2,lastAdditionAt:100,revision:4})).not.toBeNull();
    for(const row of [{favoriteCount:0,lastAdditionAt:100,revision:0},{favoriteCount:1,lastAdditionAt:null,revision:0},
      {favoriteCount:-1,lastAdditionAt:null,revision:0},{favoriteCount:'1',lastAdditionAt:100,revision:0},
      {favoriteCount:1,lastAdditionAt:NaN,revision:0},{favoriteCount:1,lastAdditionAt:100,revision:-1},
      {favoriteCount:1,lastAdditionAt:100,revision:0,userId:'untrusted'}])expect(parseReminderActivity(row)).toBeNull();
  });
  it('uses the later server addition/consent and the exact 24-hour boundary',()=>{
    expect(reminderActivitySchedule(eligible,200+day-1)).toEqual({status:'waiting',dueAt:200+day});
    expect(reminderActivitySchedule(eligible,200+day)).toEqual({status:'due',dueAt:200+day});
    expect(reminderActivitySchedule({...eligible,lastAdditionAt:500},500).dueAt).toBe(500+day);
  });
  it('removing a newer saved item never rewinds the surviving last-addition history',()=>{
    expect(reminderActivitySchedule({...eligible,favoriteCount:1,lastAdditionAt:500},600).dueAt).toBe(500+day);
  });
  it('emptying cancels and refill restarts before first acceptance',()=>{
    expect(reminderActivitySchedule({...eligible,favoriteCount:0,lastAdditionAt:null},day).status).toBe('empty');
    expect(reminderActivitySchedule({...eligible,favoriteCount:1,lastAdditionAt:day*2},day*2).dueAt).toBe(day*3);
  });
  it('withdrawal and first acceptance override activity without resubscribing or consuming twice',()=>{
    expect(reminderActivitySchedule({...eligible,enabled:false,consentGrantedAt:null},day*5).status).toBe('disabled');
    expect(reminderActivitySchedule({...eligible,firstAcceptedAt:500,lastAdditionAt:day*4},day*5).status).toBe('consumed');
  });
  it('rejects untrusted count or missing eligibility history instead of guessing from current time',()=>{
    expect(()=>reminderActivitySchedule({...eligible,favoriteCount:-1},500)).toThrow(/count/);
    expect(()=>reminderActivitySchedule({...eligible,lastAdditionAt:null},500)).toThrow(/history/);
  });
});
