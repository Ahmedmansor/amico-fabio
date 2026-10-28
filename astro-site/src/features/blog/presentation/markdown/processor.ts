import { satteri, type SatteriProcessorOptions } from '@astrojs/markdown-satteri';
import { getMarkdownContext } from '../../data/markdown-context';
import { ctaCardTree } from './cta';
import { autoLinkPlugin } from './auto-links';
import {referencePlugin} from './references';

export function blogMarkdownPlugins(readContext = getMarkdownContext): NonNullable<SatteriProcessorOptions['hastPlugins']> {
  return [
    ({ fileURL }) => {
      const context = readContext(fileURL);
      if (!context) return null;
      return {
        name: 'fabio-blog-figures',
        element: [
          { filter: ['img'], visit(node, ctx) {
            if (typeof node.properties.alt !== 'string' || !node.properties.alt.trim()) {
              throw new Error(`[blog:${context.current.sourcePath}] Body image alt must be nonempty.`);
            }
            const parent = ctx.parent(node);
            if (parent?.type === 'element' && parent.tagName === 'li') {
              const { title, ...properties } = node.properties;
              return { type: 'element', tagName: 'figure', properties: {}, children: [
                { ...node, properties },
                ...(title ? [{ type: 'element' as const, tagName: 'figcaption', properties: {}, children: [{ type: 'text' as const, value: String(title) }] }] : []),
              ] };
            }
          } },
          { filter: ['p'], visit(node) {
            const children = node.children.filter(child => child.type !== 'text' || child.value.trim());
            if (children.length !== 1 || children[0].type !== 'element' || children[0].tagName !== 'img') return;
            const image = children[0], { title, ...properties } = image.properties;
            if (typeof properties.alt !== 'string' || !properties.alt.trim()) throw new Error(`[blog:${context.current.sourcePath}] Body image alt must be nonempty.`);
            return { type: 'element', tagName: 'figure', properties: {}, children: [
              { ...image, properties },
              ...(title ? [{ type: 'element' as const, tagName: 'figcaption', properties: {}, children: [{ type: 'text' as const, value: String(title) }] }] : []),
            ] };
          } },
        ],
      };
    },
    referencePlugin(readContext),autoLinkPlugin(readContext),
    ({ fileURL }) => {
      const context = readContext(fileURL);
      if (!context) return null;
      let inserted = false;
      return {
        name: 'fabio-blog-inline-cta',
        element: { filter: ['figure'], visit(node, ctx) {
          if (inserted) return;
          let anchor: Parameters<typeof ctx.insertAfter>[0] = node;
          let parent: ReturnType<typeof ctx.parent> = ctx.parent(anchor);
          while (parent && parent.type !== 'root') { anchor = parent; parent = ctx.parent(anchor); }
          ctx.insertAfter(anchor, ctaCardTree(context.current.lang, true));
          inserted = true;
        } },
        after(root, ctx) {
          if (inserted) return;
          const headings = root.children.filter(child => child.type === 'element' && child.tagName === 'h2');
          if (headings[1]) ctx.insertBefore(headings[1], ctaCardTree(context.current.lang, true));
        },
      };
    },
  ];
}

export function createBlogMarkdownProcessor() { return satteri({ hastPlugins: blogMarkdownPlugins() }); }
