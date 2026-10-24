import {it,expect} from 'vitest';
import {validWishlistDelivery,validatedMailAddress} from '../delivery';
const valid={deliveryId:'00000000-0000-4000-8000-000000000001',recipient:'person@example.test',content:{subject:'Favorites',htmlContent:'<p>Saved</p>',textContent:'Saved'}};
it('requires a real request identity, explicit normalized recipient and all local content without header injection',()=>{
  expect(validWishlistDelivery(valid)).toBe(true);
  for(const value of [null,{}, {...valid,recipient:undefined},{...valid,recipient:' bad@example.test'},
    {...valid,deliveryId:'not-uuid'},{...valid,content:{...valid.content,subject:'bad\r\nBcc: person@example.test'}},
    {...valid,content:{...valid.content,textContent:''}}])expect(validWishlistDelivery(value as typeof valid)).toBe(false);
  expect(validatedMailAddress('person@example.test')).toBe('person@example.test');
  expect(()=>validatedMailAddress('person@example.test\r\n')).toThrow();
});
