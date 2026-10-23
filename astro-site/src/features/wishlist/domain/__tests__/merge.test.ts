import { describe, expect, it } from 'vitest';
import { confirmedGuestCleanup, planGuestMerge } from '../merge';
const identity = { userId: 'account-a', generation: 1 };
const snapshot = [{ id: 'a', revision: 'r1' }, { id: 'b', revision: 'r2' }];
describe('lossless account wishlist merge', () => {
  it('adds only published missing IDs without replacing existing account entries', () => {
    expect(planGuestMerge([...snapshot, snapshot[0], {id:'old',revision:'r3'}], ['a', 'remote'], ['a', 'b']))
      .toEqual({insert:['b'], retained:['old']});
    expect(snapshot).toHaveLength(2);
  });
  it('does not discard an already-synced inactive tour', () => {
    expect(planGuestMerge([{id:'old',revision:'r'}], ['old'], [])).toEqual({insert:[],retained:[]});
  });
  it('cleans only confirmed snapshot revisions, retaining failures and new additions', () => {
    expect(confirmedGuestCleanup(snapshot, [...snapshot, {id:'new',revision:'r3'}], ['a'], identity, identity))
      .toEqual([snapshot[0]]);
  });
  it('preserves a tour removed and re-added while the request was in flight', () => {
    expect(confirmedGuestCleanup(snapshot, [{id:'a',revision:'new-save'}, snapshot[1]], ['a','b'], identity, identity))
      .toEqual([snapshot[1]]);
  });
  it('does not clear another account, a stale generation, a removed item or ambiguous legacy data', () => {
    for (const active of [null, {...identity,userId:'account-b'}, {...identity,generation:2}]) {
      expect(confirmedGuestCleanup(snapshot, snapshot, ['a','b'], identity, active)).toEqual([]);
    }
    expect(confirmedGuestCleanup(snapshot, [], ['a','b'], identity, identity)).toEqual([]);
    expect(confirmedGuestCleanup([{id:'a',revision:'1'}], [{id:'a',revision:'1'}], ['a'], identity, identity)).toEqual([]);
  });
});
