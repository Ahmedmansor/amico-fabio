import {describe,it,expect} from 'vitest';
import {parseGuestWishlistRecord as parse} from '../guest-record';
const prefixes={trip:'fabio:wishlist:v1:trip:',package:'fabio:wishlist:v1:package:'};
const revision='v2:00000000-0000-4000-8000-000000000001';
describe('shared local favorite record parser',()=>{
  it('retains legacy tours, packages and unacknowledged guest revisions',()=>{
    expect(parse(prefixes.trip+'tour','1',false,prefixes)).toEqual({id:'tour',revision:'1'});
    expect(parse(prefixes.package+'family',revision,false,prefixes)).toEqual({id:'package:family',revision});
    expect(parse(prefixes.trip+'tour',revision,true,prefixes)).toBeNull();
    expect(parse(prefixes.trip+'tour','1',true,prefixes)).not.toBeNull();
  });
  it('rejects malformed/noncanonical records and ignores removed/unrelated entries',()=>{
    for(const [key,value]of [[prefixes.trip+'','1'],[prefixes.trip+'%74our','1'],[prefixes.trip+'package%3Ax','1'],[prefixes.trip+'tour','bad']])expect(()=>parse(key,value,false,prefixes)).toThrow();
    expect(parse(prefixes.trip+'tour',null,false,prefixes)).toBeNull();
    expect(parse('unrelated','bad',false,prefixes)).toBeNull();
  });
});
