import {describe,it,expect} from 'vitest';
import {convertPrice,formatPrice,resolveCurrency,currencyQuote} from '../currency';
import {currencyRates} from '../../data/settings';
import {calculateTotal,bookingMessage,type BookingState} from '../../../booking/domain/booking';
import {getSharedMessages} from '../../../../shared/i18n/shared';

describe('owner-approved fixed display currencies',()=>{
  it('converts the approved examples without floating point over-rounding',()=>{
    for(const [eur,usd,gbp] of [[25,28,22],[50,56,44],[100,112,88],[30,34,27]]) {
      expect(convertPrice(eur,'USD',currencyRates)).toBe(usd);
      expect(convertPrice(eur,'GBP',currencyRates)).toBe(gbp);
    }
  });
  it('preserves EUR fractions and free child/addon prices',()=>{
    expect(convertPrice(25.25,'EUR',currencyRates)).toBe(25.25);
    for(const code of ['EUR','USD','GBP'] as const)expect(convertPrice(0,code,currencyRates)).toBe(0);
  });
  it('validates amounts and rates and restores unknown saved preferences to EUR',()=>{
    for(const amount of [-1,NaN,Infinity])expect(()=>convertPrice(amount,'USD',currencyRates)).toThrow(/Invalid EUR/);
    for(const rate of [null,0,-1,Infinity])expect(()=>convertPrice(10,'USD',{...currencyRates,USD:rate})).toThrow(/USD/);
    expect(resolveCurrency('GBP',currencyRates)).toBe('GBP');
    for(const value of [null,'usd','AUD','<script>'])expect(resolveCurrency(value,currencyRates)).toBe('EUR');
  });
  it('formats using the active language',()=>{
    expect(formatPrice(30,'USD',currencyRates,'en')).toBe('$34');
    expect(formatPrice(30,'USD',currencyRates,'it')).toBe(new Intl.NumberFormat('it',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(34));
  });
  it('converts the exact EUR booking total once and preserves EUR in WhatsApp',()=>{
    const state:BookingState={id:'test',title:'Test',kind:'trip',adults:2,children:1,selectedAddons:['extra'],formData:{name:'Test',nation:'IT',date:'2026-12-01'}};
    const prices={adult:30,child:0,minPax:1},addons=[{id:'extra',price:2,labels:{en:'Extra'}}];
    const total=calculateTotal(state,prices,addons);
    expect(total).toBe(66);
    expect(convertPrice(total,'USD',currencyRates)).toBe(74);
    const copy=getSharedMessages('en');
    const original=bookingMessage(state,prices,addons,copy.global.whatsapp,'en');
    const quote=currencyQuote(total,'USD',currencyRates,'en',copy.currency.quote);
    expect(bookingMessage(state,prices,addons,copy.global.whatsapp,'en',quote)).toBe(`${original}\n\nIndicative total: $74 (USD)`);
    expect(original).toContain('€66');
    expect(currencyQuote(total,'EUR',currencyRates,'en',copy.currency.quote)).toBe('');
  });
});
