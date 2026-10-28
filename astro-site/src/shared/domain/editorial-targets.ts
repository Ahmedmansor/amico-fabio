import type { Locale } from '../config/languages';

export type EditorialKind = 'post' | 'place' | 'tour' | 'package';
export interface EditorialTarget {
  kind: EditorialKind; id: string; lang: Locale; title: string; url: string;
  aliases: readonly string[]; source: string;
}
export const targetKey = (target: Pick<EditorialTarget, 'kind' | 'id'>) => `${target.kind}:${target.id}`;
export const normalizePhrase = (text: string) => text.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en');

/** Only published, localized records enter this registry. No provider access. */
export function validateTargets(targets: readonly EditorialTarget[]) {
  const identities = new Set<string>(), urls = new Map<string,string>(), claims = new Map<string,EditorialTarget>();
  for (const target of targets) {
    const identity = `${target.lang}/${targetKey(target)}`;
    if (identities.has(identity)) throw new Error(`[editorial:${target.source}] Duplicate target ${identity}.`);
    identities.add(identity);
    const previous = urls.get(target.url);
    if (previous) throw new Error(`[editorial:${target.source}] Duplicate route ${target.url}; already owned by ${previous}.`);
    urls.set(target.url,target.source);
    for (const phrase of new Set(target.aliases.map(normalizePhrase))) {
      if (!phrase) throw new Error(`[editorial:${target.source}] Empty automatic alias.`);
      const key = `${target.lang}/${phrase}`, owner = claims.get(key);
      if (owner && targetKey(owner) !== targetKey(target)) throw new Error(`[editorial:${target.source}] Ambiguous phrase "${phrase}" (${target.lang}); already owned by ${owner.source}. Use an explicit reference or distinct alias.`);
      claims.set(key,target);
    }
  }
  return targets;
}

export function resolveEditorialReference(href: string, targets: readonly EditorialTarget[], lang: Locale): string {
  const match = href.match(/^(post|place|tour|package):([^#?]+)(#[^?]*)?$/);
  if (!match) {
    if (/^(post|place|tour|package):/.test(href)) throw new Error(`[editorial] Invalid content reference: ${href}.`);
    return href;
  }
  const target = targets.find(target => target.kind === match[1] && target.id === match[2] && target.lang === lang);
  if (!target) throw new Error(`[editorial] Unknown, unpublished or untranslated reference ${href} for ${lang}.`);
  return target.url + (match[3] ?? '');
}

export function automaticTargets(targets: readonly EditorialTarget[], current: {kind:EditorialKind;id:string;lang:Locale}) {
  return targets.filter(target => target.lang === current.lang && targetKey(target) !== targetKey(current))
    .flatMap(target => [...new Set(target.aliases.map(normalizePhrase))].map(keyword => ({id:targetKey(target),keyword,url:target.url})));
}
