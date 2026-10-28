import type { PublicationPolicy } from './models';
import { isPublished } from './publication';
import { articleUrl } from './translations';
import { normalizeLinkKeyword, type BlogIndexRecord } from './validation';

export const autoLinkLimit = 5;
export interface InternalLinkTarget { id: string; keyword: string; url: string }
export interface LinkedTextPart { text: string; url?: string; targetId?: string }
const compareTargets = (a: InternalLinkTarget, b: InternalLinkTarget) => b.keyword.length - a.keyword.length ||
  (a.keyword < b.keyword ? -1 : a.keyword > b.keyword ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function getInternalLinkTargets(records: readonly BlogIndexRecord[], current: BlogIndexRecord, policy: PublicationPolicy): InternalLinkTarget[] {
  return records.filter(record => record.id !== current.id && record.lang === current.lang && isPublished(record, policy))
    .flatMap(record => record.linkKeywords.map(keyword => ({ id: record.id, keyword: normalizeLinkKeyword(keyword), url: articleUrl(record) })))
    .sort(compareTargets);
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Normalize matching text while mapping every match back to original spelling. */
function normalizedText(source: string) {
  let text = '';
  const starts: number[] = [], ends: number[] = [];
  for (const { segment, index } of new Intl.Segmenter('und', { granularity: 'grapheme' }).segment(source)) {
    const normalized = segment.normalize('NFC');
    for (let offset = 0; offset < normalized.length; offset++) { starts.push(index); ends.push(index + segment.length); }
    text += normalized;
  }
  return { text, starts, ends };
}

/** Pure text-node matching; callers own AST exclusions and per-article state. */
export function linkText(source: string, targets: readonly InternalLinkTarget[], excluded: ReadonlySet<string> = new Set(), limit = autoLinkLimit) {
  if (!Number.isInteger(limit) || limit < 0) throw new Error('[blog] Automatic-link limit must be a nonnegative integer.');
  const normalized = normalizedText(source);
  const matches: { start: number; end: number; target: InternalLinkTarget }[] = [];
  const used = new Set(excluded);
  for (const target of [...targets].sort(compareTargets)) {
    if (matches.length >= limit || used.has(target.id)) continue;
    const phrase = normalizeLinkKeyword(target.keyword).split(' ').map(escapeRegex).join('\\s+');
    const regex = new RegExp(`(?<![\\p{L}\\p{N}])${phrase}(?![\\p{L}\\p{N}])`, 'giu');
    for (const match of normalized.text.matchAll(regex)) {
      const start = normalized.starts[match.index!], end = normalized.ends[match.index! + match[0].length - 1];
      if (matches.some(other => start < other.end && end > other.start)) continue;
      matches.push({ start, end, target }); used.add(target.id); break;
    }
  }
  const parts: LinkedTextPart[] = [];
  let cursor = 0;
  for (const match of matches.sort((a, b) => a.start - b.start)) {
    if (match.start > cursor) parts.push({ text: source.slice(cursor, match.start) });
    parts.push({ text: source.slice(match.start, match.end), url: match.target.url, targetId: match.target.id });
    cursor = match.end;
  }
  if (cursor < source.length || !parts.length) parts.push({ text: source.slice(cursor) });
  return { parts, targetIds: matches.map(match => match.target.id) };
}
