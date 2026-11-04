import {describe,it,expect} from 'vitest';
import {bluProgramIds,mapBluPrograms} from '../programs';
const sources=()=>bluProgramIds.map(id=>({id,location:'sharm',poster:`/${id}.webp`,prices:{adult:999,child:500},source:{private:'not for the page'},text:Object.fromEntries(['it','en'].map(locale=>[locale,{title:`${locale} ${id}`,short_desc:`${locale} overview`,duration:'5 days',program:[{time:'Day 1',activity:`${locale} White Island`,details:`${locale} approved place description`}]}]))}));
describe('Blu program previews',()=>{
 it('preserves approved program/stop order and locale without exposing prices or source',()=>{
  const records=sources();for(const locale of ['it','en'] as const){
   const programs=mapBluPrograms(records,locale);
   expect(programs.map(p=>p.id)).toEqual([...bluProgramIds]);
   expect(programs[0].stops[0].description).toBe(`${locale} approved place description`);
   expect(JSON.stringify(programs)).not.toMatch(/prices|adult|child|private|999|500/);
  }
 });
 it('fails missing and duplicate published program IDs',()=>{
  expect(()=>mapBluPrograms(sources().slice(1),'it')).toThrow('sharm_confidential');
  const records=sources();expect(()=>mapBluPrograms([...records,records[0]],'en')).toThrow('duplicate');
 });
 it('fails missing itinerary, stop text and translation with record/field context',()=>{
  const records=sources();records[0].text.en.program[0].details='';
  expect(()=>mapBluPrograms(records,'en')).toThrow('sharm_confidential:en:program.0.details');
  records[0].text.en.program=[];expect(()=>mapBluPrograms(records,'en')).toThrow('Missing itinerary');
  delete (records[0].text as Record<string,unknown>).en;expect(()=>mapBluPrograms(records,'en')).toThrow('translation');
 });
 it('rejects monetary amounts and a wrong destination instead of leaking them',()=>{
  const records=sources();records[0].text.it.short_desc='Special €100';
  expect(()=>mapBluPrograms(records,'it')).toThrow('Monetary amounts');
  records[0].text.it.short_desc='Overview';records[0].location='cairo';
  expect(()=>mapBluPrograms(records,'it')).toThrow('location');
 });
});
