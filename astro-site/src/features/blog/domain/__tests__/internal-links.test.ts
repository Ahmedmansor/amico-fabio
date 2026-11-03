import { describe, expect, it } from 'vitest';
import { getInternalLinkTargets, linkText } from '../internal-links';
import type { BlogIndexRecord } from '../validation';

const target = (id: string, keyword: string) => ({ id, keyword, url: `/en/blog/${id}/` });
const linked = (text: string, targets = [target('sea', 'Red Sea diving')], excluded = new Set<string>(), limit = 5) => linkText(text, targets, excluded, limit);

describe('automatic internal-link selection', () => {
  it('links the first eligible occurrence only and preserves exact displayed casing', () => {
    const result = linked('RED SEA diving, Red Sea diving, Red Sea diving.');
    expect(result.parts.filter(part => part.url).map(part => part.text)).toEqual(['RED SEA diving']);
    expect(result.parts.map(part => part.text).join('')).toBe('RED SEA diving, Red Sea diving, Red Sea diving.');
  });
  it('prefers longer overlapping phrases and allows a separate shorter target later', () => {
    const result = linked('Red Sea diving and Red Sea.', [target('short', 'Red Sea'), target('long', 'Red Sea diving')]);
    expect(result.parts.filter(part => part.url).map(part => part.targetId)).toEqual(['long', 'short']);
  });
  it('caps matches, excludes manual/previous targets and allows one match per target', () => {
    const targets = [target('same', 'first keyword'), target('same', 'second keyword'), target('third', 'third keyword'), target('fourth', 'fourth keyword')];
    const result = linked('first keyword, second keyword, third keyword, fourth keyword', targets, new Set(['third']), 2);
    expect(result.targetIds).toHaveLength(2);
    expect(new Set(result.targetIds).size).toBe(2);
    expect(result.targetIds).not.toContain('third');
    expect(linked('Red Sea diving', undefined, new Set(), 0).targetIds).toEqual([]);
  });
  it('uses Unicode word boundaries, accents and Italian elisions', () => {
    expect(linked("dell'Egitto, EgittoX, preEgitto", [target('egypt', 'Egitto')]).parts.filter(part => part.url).map(part => part.text)).toEqual(['Egitto']);
    expect(linked('citta città', [target('city', 'città')]).parts.filter(part => part.url).map(part => part.text)).toEqual(['città']);
    expect(linked('citta\u0300', [target('city', 'città')]).parts.filter(part => part.url).map(part => part.text)).toEqual(['citta\u0300']);
  });
  it('handles literal regex characters and original whitespace without rewriting prose', () => {
    const text = 'A (special) trip, sea   diving.';
    const result = linked(text, [target('special', '(special) trip'), target('sea', 'sea diving')]);
    expect(result.parts.filter(part => part.url).map(part => part.text)).toEqual(['(special) trip', 'sea   diving']);
    expect(result.parts.map(part => part.text).join('')).toBe(text);
  });
  it('creates maps only from same-language published non-self records', () => {
    const record = (id: string, changes: Partial<BlogIndexRecord> = {}): BlogIndexRecord => ({ id, title: `Title for ${id}`, lang: 'en', slug: id,
      pubDate: '2026-01-01', sourcePath: `en/${id}/index.md`, linkKeywords: ['some keyword'], relatedTripIds: [], draft: false, fixture: false, ...changes });
    const current = record('current');
    const map = getInternalLinkTargets([current, record('visible'), record('it', { lang: 'it' }), record('draft', { draft: true }),
      record('future', { pubDate: '2099-01-01' }), record('fixture', { fixture: true })], current,
      { evaluatedAt: Date.parse('2026-10-28'), includeFixtures: false });
    expect([...new Set(map.map(target => target.id))]).toEqual(['visible']);
    expect(map.map(target => target.keyword)).toContain('title for visible');
  });
  it('uses a title without keywords and deduplicates a matching keyword alias', () => {
    const post = {id:'target',title:'A Cairo travel guide',slug:'target',lang:'en',pubDate:'2026-01-01',sourcePath:'en/target/index.md',linkKeywords:[],relatedTripIds:[],draft:false,fixture:false} as BlogIndexRecord;
    const current = {...post,id:'current'};
    const policy={evaluatedAt:Date.parse('2026-10-28'),includeFixtures:false};
    const targets=getInternalLinkTargets([post,current],current,policy);
    expect(linkText('Read A Cairo travel guide.',targets).parts.find(part=>part.url)?.url).toBe('/en/blog/target/');
    expect(getInternalLinkTargets([{...post,linkKeywords:[' A  Cairo travel guide ']}],current,policy)).toHaveLength(1);
  });
});
