import type { Locale } from '../../../../shared/config/languages';
import { getSharedMessages } from '../../../../shared/i18n/shared';
import { siteConfig } from '../../../../shared/config/site';

interface TextNode { type: 'text'; value: string }
export interface ElementNode { type: 'element'; tagName: string; properties: Record<string, string | boolean | string[]>; children: (ElementNode | TextNode)[] }
const text = (value: string): TextNode => ({ type: 'text', value });
const element = (tagName: string, children: ElementNode['children'], properties: ElementNode['properties'] = {}): ElementNode => ({ type: 'element', tagName, properties, children });

/** One markup definition for the Astro component and Markdown insertion. */
export function ctaCardTree(locale: Locale, compact = false): ElementNode {
  const m = getSharedMessages(locale).blog;
  return element('section', [
    element('div', [element('p', [text('Fabio Egypt')], { className: ['blog-kicker'] }),
      element('h2', [text(m.ctaTitle)]), element('p', [text(m.ctaText)])]),
    element('a', [text(m.ctaButton), element('span', [text('↗')], { 'aria-hidden': 'true' })], {
      className: ['blog-button'], href: `https://wa.me/${siteConfig.whatsapp.number}`,
      'data-open-lead': true, target: '_blank', rel: 'noopener noreferrer',
    }),
  ], { className: compact ? ['blog-cta', 'blog-cta-compact'] : ['blog-cta'], 'data-no-autolink': true });
}

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
function serialize(node: ElementNode | TextNode): string {
  if (node.type === 'text') return escape(node.value);
  const attributes = Object.entries(node.properties).map(([key, value]) => {
    const name = key === 'className' ? 'class' : key;
    return value === true ? name : `${name}="${escape(Array.isArray(value) ? value.join(' ') : String(value))}"`;
  }).join(' ');
  return `<${node.tagName}${attributes ? ` ${attributes}` : ''}>${node.children.map(serialize).join('')}</${node.tagName}>`;
}
export function ctaCardHtml(locale: Locale, compact = false) { return serialize(ctaCardTree(locale, compact)); }
