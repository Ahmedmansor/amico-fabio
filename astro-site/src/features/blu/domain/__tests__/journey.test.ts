import {describe,it,expect} from 'vitest';
import {programAdventures} from '../journey';
describe('catalog-backed adventure choices',()=>{
  const trips=[{id:'reef',category:'sea'},{id:'quad',category:'desert'},{id:'city',category:'culture'}];
  it('requires actual included trips for each match',()=>{
    expect(programAdventures(['reef'],trips)).toEqual(['sea']);
    expect(programAdventures(['quad'],trips)).toEqual(['desert']);
    expect(programAdventures(['reef','quad'],trips)).toEqual(['sea','desert','both']);
    expect(programAdventures(['city'],trips)).toEqual([]);
  });
  it('fails unknown trip references',()=>expect(()=>programAdventures(['missing'],trips)).toThrow('missing'));
});
