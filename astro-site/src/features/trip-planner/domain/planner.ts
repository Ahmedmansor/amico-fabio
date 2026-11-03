export const plannerPlaces=['cairo','luxor','aswan','sharm','red-sea','desert'] as const;
export const budgetCurrencies=['EUR','USD'] as const;
export interface TripRequest {
  name:string;email:string;nationality:string;phone:string;arrival:string;departure:string;
  adults:number;children:number;infants:number;budget:string;currency:typeof budgetCurrencies[number];
  startCity:string;finishCity:string;places:readonly string[];details:string;
}
export type PlannerField=keyof TripRequest;
export type PlannerErrors=Partial<Record<PlannerField,'required'|'invalid'|'past'|'beforeArrival'|'tooLong'>>;
export function calendarDate(value:string):boolean {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const parsed=Date.parse(value+'T00:00:00Z');return Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,10)===value;
}
export function normalizedPhone(value:string):string{return value.trim().replace(/[\s().-]/g,'');}
export function budgetAmount(value:string):number|undefined {
  const cleaned=value.trim();if(!/^\d{1,9}(?:[.,]\d{1,2})?$/.test(cleaned))return;
  const amount=Number(cleaned.replace(',','.'));return amount>0&&Number.isFinite(amount)?amount:undefined;
}
/** Intake only: no availability, pricing, flight booking or backend submission. */
export function validateTripRequest(input:TripRequest,today:string,nationalities:ReadonlySet<string>):PlannerErrors {
  if(!calendarDate(today))throw new Error('[trip-planner] A valid captured local date is required.');
  const errors:PlannerErrors={};
  for(const field of ['name','email','nationality','phone','arrival','departure','budget','details'] as const)if(!input[field].trim())errors[field]='required';
  if(input.name.trim().length>120)errors.name='tooLong';
  if(input.email.trim()&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())||input.email.trim().length>254))errors.email='invalid';
  if(input.nationality&&!nationalities.has(input.nationality))errors.nationality='invalid';
  if(input.phone.trim()&&!/^\+[1-9]\d{6,14}$/.test(normalizedPhone(input.phone)))errors.phone='invalid';
  if(input.arrival){if(!calendarDate(input.arrival))errors.arrival='invalid';else if(input.arrival<today)errors.arrival='past';}
  if(input.departure){if(!calendarDate(input.departure))errors.departure='invalid';else if(calendarDate(input.arrival)&&input.departure<input.arrival)errors.departure='beforeArrival';}
  for(const field of ['adults','children','infants'] as const)if(!Number.isSafeInteger(input[field])||input[field]<(field==='adults'?1:0)||input[field]>99)errors[field]='invalid';
  if(input.budget.trim()&&budgetAmount(input.budget)===undefined)errors.budget='invalid';
  if(!budgetCurrencies.includes(input.currency))errors.currency='invalid';
  if(input.startCity.trim().length>100)errors.startCity='tooLong';if(input.finishCity.trim().length>100)errors.finishCity='tooLong';
  if(input.details.trim()&&input.details.trim().length<10)errors.details='invalid';if(input.details.trim().length>4000)errors.details='tooLong';
  if(input.places.some(place=>!plannerPlaces.includes(place as typeof plannerPlaces[number]))||new Set(input.places).size!==input.places.length)errors.places='invalid';
  return errors;
}
export interface PlannerMessageCopy {
  greeting:string;country:string;name:string;email:string;nationality:string;phone:string;arrival:string;departure:string;adults:string;children:string;infants:string;budget:string;startCity:string;finishCity:string;places:string;details:string;undecided:string;budgetNote:string;placeLabels:Record<typeof plannerPlaces[number],string>;
}
export function plannerMessage(input:TripRequest,copy:PlannerMessageCopy):string {
  return [copy.greeting,'',copy.country,
    `${copy.name}: ${input.name.trim()}`,`${copy.email}: ${input.email.trim()}`,`${copy.nationality}: ${input.nationality}`,`${copy.phone}: ${normalizedPhone(input.phone)}`,
    `${copy.arrival}: ${input.arrival}`,`${copy.departure}: ${input.departure}`,
    `${copy.adults}: ${input.adults}`,`${copy.children}: ${input.children}`,`${copy.infants}: ${input.infants}`,
    `${copy.budget}: ${budgetAmount(input.budget)} ${input.currency}`,copy.budgetNote,
    `${copy.startCity}: ${input.startCity.trim()||copy.undecided}`,`${copy.finishCity}: ${input.finishCity.trim()||copy.undecided}`,
    `${copy.places}: ${input.places.length?input.places.map(place=>copy.placeLabels[place as typeof plannerPlaces[number]]).join(', '):copy.undecided}`,
    '',`${copy.details}:`,input.details.trim(),
  ].join('\n');
}
