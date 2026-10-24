import {describe, expect, it} from 'vitest';
import {nextLocaleState, parseAccountLocaleState, parseLocaleCommand, type AccountLocaleState, type LocaleCommand} from '../locale-preference.ts';

const requestId = '00000000-0000-4000-8000-000000000001';
const site: LocaleCommand = {requestId, expectedRevision: 0, kind: 'site', locale: 'en'};
const initial: AccountLocaleState = {siteLocale: 'it', revision: 0, email: {locale: 'it', source: 'follow_site'}};
describe('account language policy', () => {
  it('moves site and follow-site language together without mutating the input', () => {
    expect(nextLocaleState(initial, site)).toEqual({ok: true, value: {
      siteLocale: 'en', revision: 1, email: {locale: 'en', source: 'follow_site'}}});
    expect(initial.email?.locale).toBe('it');
  });
  it('preserves an explicit correspondence language while browsing another language', () => {
    const explicit: AccountLocaleState = {...initial, email: {locale: 'it', source: 'explicit'}};
    expect(nextLocaleState(explicit, site)).toEqual({ok: true, value: {...explicit, siteLocale: 'en', revision: 1}});
  });
  it('never creates consent or a preference from a site switch', () => {
    expect(nextLocaleState({...initial, email: null}, site)).toEqual({ok: true, value: {
      siteLocale: 'en', revision: 1, email: null}});
    expect(nextLocaleState({...initial, email: null}, {...site, kind: 'email_explicit'}))
      .toEqual({ok: false, reason: 'missing-preference'});
  });
  it('allows an explicit choice and returning to follow-site without changing site language', () => {
    const explicit = nextLocaleState(initial, {...site, kind: 'email_explicit'});
    expect(explicit).toEqual({ok: true, value: {...initial, revision: 1, email: {locale: 'en', source: 'explicit'}}});
    if (!explicit.ok) throw new Error('Expected explicit choice.');
    expect(nextLocaleState(explicit.value, {requestId, expectedRevision: 1, kind: 'email_follow_site'}))
      .toEqual({ok: true, value: {...initial, revision: 2}});
  });
  it('rejects a delayed old site request after a newer explicit correspondence choice', () => {
    const newer: AccountLocaleState = {...initial, revision: 1, email: {locale: 'en', source: 'explicit'}};
    expect(nextLocaleState(newer, site)).toEqual({ok: false, reason: 'conflict', state: newer});
  });
  it('rejects ownership, credentials, consent fields, unsupported languages and invalid revisions', () => {
    for (const extra of [{userId: requestId}, {enabled: true}, {token: 'fake'}, {updatedAt: 'fake'},
      {locale: 'es'}, {locale: 'IT'}, {expectedRevision: -1}, {expectedRevision: 1.5},
      {expectedRevision: Number.MAX_SAFE_INTEGER + 1}, {requestId: 'bad'}])
      expect(parseLocaleCommand({...site, ...extra})).toBeNull();
    expect(parseLocaleCommand({...site, kind: 'email_follow_site'})).toBeNull();
    expect(parseLocaleCommand({requestId, expectedRevision: 0, kind: 'email_follow_site'})).not.toBeNull();
  });
  it('rejects malformed and contradictory server confirmations', () => {
    expect(parseAccountLocaleState(initial)).toEqual(initial);
    for (const value of [null, [], {...initial, revision: '0'}, {...initial, email: undefined},
      {...initial, email: {locale: 'en', source: 'follow_site'}}, {...initial, email: {locale: 'it', source: 'unknown'}}])
      expect(parseAccountLocaleState(value)).toBeNull();
  });
});
