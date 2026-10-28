import {expect,it} from 'vitest';
import {validateTripRequest,budgetAmount,plannerMessage,type TripRequest,type PlannerMessageCopy} from '../planner';
const valid:TripRequest={name:'Demo visitor',email:'demo@example.com',nationality:'Italian',phone:'+39 320 123 4567',arrival:'2027-04-10',departure:'2027-04-18',adults:2,children:0,infants:0,budget:'1800,50',currency:'EUR',startCity:'Cairo',finishCity:'Aswan',places:['cairo','luxor'],details:'Cairo → Luxor → Aswan, Nile cruise & a quiet day.'};
const countries=new Set(['Italian']);
it('accepts a complete country-wide request and a same-day departure without inventing a tour policy',()=>{
  expect(validateTripRequest(valid,'2026-10-29',countries)).toEqual({});
  expect(validateTripRequest({...valid,departure:valid.arrival,startCity:'',finishCity:'',places:[]},'2026-10-29',countries)).toEqual({});
});
it('requires all starred inputs, valid international phone/email and sensible date order',()=>{
  const errors=validateTripRequest({...valid,name:' ',email:'bad',nationality:'bad',phone:'123',arrival:'2026-10-28',departure:'2026-10-27',budget:'',details:''},'2026-10-29',countries);
  expect(errors).toMatchObject({name:'required',email:'invalid',nationality:'invalid',phone:'invalid',arrival:'past',departure:'beforeArrival',budget:'required',details:'required'});
  expect(validateTripRequest({...valid,arrival:'2027-02-30'},'2026-10-29',countries).arrival).toBe('invalid');
});
it('rejects fractional/negative/nonfinite travellers and malformed preference values',()=>{
  expect(validateTripRequest({...valid,adults:0,children:0.5,infants:-1,places:['unknown'],currency:'GBP' as 'EUR'},'2026-10-29',countries)).toMatchObject({adults:'invalid',children:'invalid',infants:'invalid',places:'invalid',currency:'invalid'});
  for(const value of ['0','-20','Infinity','1e3','1,200.50'])expect(budgetAmount(value)).toBeUndefined();
  expect(budgetAmount('1800,50')).toBe(1800.5);
});
it('formats a transparent review message preserving Unicode and special characters',()=>{
  const copy={greeting:'Egypt trip request',country:'Country: Egypt',name:'Name',email:'Email',nationality:'Nationality',phone:'Phone',arrival:'Arrival',departure:'Departure',adults:'Adults',children:'Children',infants:'Infants',budget:'Budget',startCity:'Start',finishCity:'Finish',places:'Places',details:'Details',undecided:'Open to suggestions',budgetNote:'Indicative budget per person; flights excluded.',placeLabels:{cairo:'Cairo',luxor:'Luxor',aswan:'Aswan',sharm:'Sharm', 'red-sea':'Red Sea',desert:'Desert'}} satisfies PlannerMessageCopy;
  const message=plannerMessage({...valid,details:"A & B, 50%, #sunset\nCairo → Luxor"},copy);
  expect(message).toContain('Country: Egypt');expect(message).toContain('Budget: 1800.5 EUR');expect(message).toContain('Phone: +393201234567');expect(message).toContain('A & B, 50%, #sunset\nCairo → Luxor');
});
