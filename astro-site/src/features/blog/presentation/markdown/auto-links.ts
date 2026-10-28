import { htmlToHast, type HastPluginEntry } from 'satteri';
import { getMarkdownContext } from '../../data/markdown-context';
import { autoLinkLimit, getInternalLinkTargets, linkText } from '../../domain/internal-links';
import { articleUrl } from '../../domain/translations';
import { siteConfig } from '../../../../shared/config/site';
import {automaticTargets,resolveEditorialReference} from '../../../../shared/domain/editorial-targets';

interface ReadableNode { type: string; tagName?: string; properties?: Record<string, unknown>; value?: unknown; children?: readonly ReadableNode[] }
function walk(node: ReadableNode, visit: (node: ReadableNode) => void) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}
const blockedTags = new Set(['h1','h2','h3','h4','h5','h6','a','code','pre','figcaption','button','script','style']);
const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const noLink = (properties: Record<string, unknown> = {}) => Object.hasOwn(properties, 'data-no-autolink') || Object.hasOwn(properties, 'dataNoAutolink');

/** AST mutation stays in presentation; matching and publication stay pure. */
export function autoLinkPlugin(readContext = getMarkdownContext): HastPluginEntry {
  return ({ fileURL }) => {
    const context = readContext(fileURL);
    if (!context) return null;
    const targets = context.targets?automaticTargets(context.targets,{kind:context.kind??'post',id:context.placeId??context.current.id,lang:context.current.lang}):getInternalLinkTargets(context.records, context.current, context.policy);
    const used = new Set<string>();
    const rawStack: { tag: string; skip: boolean }[] = [];
    let count = 0;
    const manual = (node: ReadableNode) => {
      if (node.type === 'raw' && typeof node.value === 'string') { walk(htmlToHast(node.value, { fragment: true }), manual); return; }
      const href = node.properties?.href;
      if (node.tagName !== 'a' || typeof href !== 'string') return;
      const resolved=context.targets?resolveEditorialReference(href,context.targets,context.current.lang):href;
      const url = new URL(resolved, new URL(articleUrl(context.current), siteConfig.url));
      if (url.origin !== new URL(siteConfig.url).origin) return;
      const target = targets.find(target => target.url === url.pathname.replace(/\/?$/, '/'));
      if (target) used.add(target.id);
    };
    return {
      name: 'fabio-blog-auto-links',
      before(root) { walk(root, manual); },
      raw(node) {
        // Inline raw HTML can be represented as sibling open/text/close nodes.
        // Track its boundaries too, rather than relying only on HAST parents.
        for (const match of node.value.matchAll(/<!--[\s\S]*?-->|<\/?[A-Za-z](?:[^>"']|"[^"]*"|'[^']*')*>/g)) {
          const token = match[0];
          if (token.startsWith('<!--')) continue;
          const tag = token.match(/^<\/?([\w:-]+)/)?.[1].toLowerCase();
          if (!tag) continue;
          if (token.startsWith('</')) {
            const index = rawStack.map(entry => entry.tag).lastIndexOf(tag);
            if (index >= 0) rawStack.splice(index);
          } else if (!voidTags.has(tag) && !token.endsWith('/>')) {
            let excluded = blockedTags.has(tag) || !!rawStack.at(-1)?.skip;
            walk(htmlToHast(token, { fragment: true }), element => { if (element.tagName === tag && noLink(element.properties)) excluded = true; });
            rawStack.push({ tag, skip: excluded });
          }
        }
      },
      text(node, ctx) {
        if (count >= autoLinkLimit || rawStack.some(entry => entry.skip)) return;
        let parent: ReturnType<typeof ctx.parent> = ctx.parent(node);
        while (parent) {
          if (parent.type === 'element' && (blockedTags.has(parent.tagName) || noLink(parent.properties))) return;
          parent = ctx.parent(parent);
        }
        const result = linkText(node.value, targets, used, autoLinkLimit - count);
        if (!result.targetIds.length) return;
        ctx.replaceNode(node, result.parts.map(part => part.url ? {
          type: 'element' as const, tagName: 'a', properties: { href: part.url }, children: [{ type: 'text' as const, value: part.text }],
        } : { type: 'text' as const, value: part.text }));
        for (const id of result.targetIds) used.add(id);
        count += result.targetIds.length;
      },
    };
  };
}
