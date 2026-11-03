export interface LegalLink { id: string; label: string }
export interface LegalSection { id: string; heading: string; paragraphs: string[] }
export interface LegalPage {
  title: string;
  toc_title: string;
  toc: LegalLink[];
  summary_items: LegalLink[];
  sections: LegalSection[];
}
export type ParagraphBlock = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] };

export function groupParagraphs(paragraphs: readonly string[]): ParagraphBlock[] {
  const blocks: ParagraphBlock[] = [];
  for (const text of paragraphs) {
    if (text.trim().startsWith('•')) {
      const previous = blocks.at(-1);
      const item = text.replace(/^\s*•\s*/, '');
      if (previous?.type === 'list') previous.items.push(item);
      else blocks.push({ type: 'list', items: [item] });
    } else blocks.push({ type: 'paragraph', text });
  }
  return blocks;
}

export function getDataChips(paragraphs: readonly string[]): string[] {
  for (const paragraph of paragraphs) {
    const match = paragraph.match(/:\s*([^\.]+)\.?/);
    if (match?.[1]) return match[1].split(',').map(item => item.trim().replace(/^(and|e)\s+/i, '').trim()).filter(Boolean);
  }
  return [];
}

export function validateLegalPage(page: LegalPage, locale: string, icons: Record<string, string>): void {
  const requireText = (value: string, field: string) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`[legal] ${locale}:${field} is required.`);
  };
  requireText(page.title, 'title');
  requireText(page.toc_title, 'toc_title');
  if (!Array.isArray(page.sections) || !page.sections.length) throw new Error(`[legal] ${locale}:sections must not be empty.`);
  const ids = new Set<string>();
  for (const section of page.sections) {
    requireText(section.id, 'section.id');
    if (ids.has(section.id)) throw new Error(`[legal] ${locale}:duplicate section ID ${section.id}.`);
    ids.add(section.id);
    requireText(section.heading, `${section.id}.heading`);
    if (!Array.isArray(section.paragraphs) || !section.paragraphs.length) throw new Error(`[legal] ${locale}:${section.id}.paragraphs must not be empty.`);
    section.paragraphs.forEach((text, index) => requireText(text, `${section.id}.paragraphs[${index}]`));
    if (!Object.hasOwn(icons, section.id) || !icons[section.id]) throw new Error(`[legal] ${locale}:${section.id} has no linked icon.`);
  }
  for (const [name, links] of [['toc', page.toc], ['summary_items', page.summary_items]] as const) {
    if (!Array.isArray(links)) throw new Error(`[legal] ${locale}:${name} is required.`);
    const linked = new Set<string>();
    for (const link of links) {
      requireText(link.label, `${name}.${link.id}.label`);
      if (!ids.has(link.id)) throw new Error(`[legal] ${locale}:${name} references unknown section ${link.id}.`);
      if (linked.has(link.id)) throw new Error(`[legal] ${locale}:${name} duplicates section ${link.id}.`);
      linked.add(link.id);
    }
    for (const id of ids) if (!linked.has(id)) throw new Error(`[legal] ${locale}:${name} is missing section ${id}.`);
  }
}

export function validateSectionIdentity(reference: LegalPage, candidate: LegalPage, locale: string): void {
  for (const key of ['sections', 'toc', 'summary_items'] as const) {
    if (reference[key].map(item => item.id).join('|') !== candidate[key].map(item => item.id).join('|')) {
      throw new Error(`[legal] ${locale}:${key} IDs or order do not match the default language.`);
    }
  }
}
