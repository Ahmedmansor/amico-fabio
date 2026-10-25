import {describe,it,expect} from 'vitest';
import {settleDispatch,providerMessageId} from '../dispatch';
import {parseReminderProviderEvent} from '../provider-event';
describe('one-reminder settlement and provider correlation',()=>{
  it('quarantines uncertainty, including malformed acceptance, instead of inventing another send',()=>{
    expect(settleDispatch({status:'unknown'},60)).toEqual({status:'unknown'});
    expect(settleDispatch({status:'accepted',messageId:'bad\r\nheader'},60)).toEqual({status:'unknown'});
    expect(settleDispatch({status:'accepted',messageId:'<message@example.test>'},60)).toEqual({status:'accepted',messageId:'message@example.test'});
  });
  it('only schedules definitive throttling, honoring the longer provider delay',()=>{
    expect(settleDispatch({status:'deferred',retryAfterSeconds:600},60)).toEqual({status:'retry',seconds:600});
    expect(settleDispatch({status:'deferred',retryAfterSeconds:null},60)).toEqual({status:'retry',seconds:60});
    expect(settleDispatch({status:'rejected',reason:'provider-rejected'},60)).toEqual({status:'failed'});
  });
  it('ignores email/user claims and only correlates an authenticated event to a job',()=>{
    const deliveryId='00000000-0000-4000-8000-000000000001';
    const input={event:'unsubscribed','message-id':'<message@example.test>','X-Mailin-custom':JSON.stringify({deliveryId}),email:'forged@example.test',userId:'forged'};
    expect(parseReminderProviderEvent(input)).toEqual({event:'unsubscribed',messageId:'message@example.test',deliveryId});
    expect(parseReminderProviderEvent({...input,'X-Mailin-custom':'{"deliveryId":"forged"}'})).toBeNull();
    expect(parseReminderProviderEvent({...input,event:'opened'})).toBeNull();
    expect(providerMessageId('header\nvalue')).toBeNull();
  });
});
