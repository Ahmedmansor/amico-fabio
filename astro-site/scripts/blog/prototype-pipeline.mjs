// Phase 1 experiment only. Not imported by the application or its routes.
import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'astro/loaders';

/** Reuse Astro's validated store; never parse Markdown frontmatter twice. */
export function prototypeLoader(snapshotFile) {
  const loader = glob({
    base: './src/content/blog', pattern: '**/index.md', deferRender: true,
    generateId: ({ data }) => data.id,
  });
  return {
    name: 'blog-pipeline-proof',
    async load(context) {
      let ready = false;
      let renderQueue = Promise.resolve();
      const publish = () => {
        const records = context.store.values().map(({ id, data, filePath }) => ({
          id, ...data, fileURL: new URL(filePath, context.config.root).href,
        })).sort((a, b) => a.id.localeCompare(b.id));
        const text = JSON.stringify(records);
        // Avoid watcher loops and needless invalidation when metadata is unchanged.
        let previous;
        try { previous = readFileSync(snapshotFile, 'utf8'); } catch { /* First load. */ }
        if (previous !== text) writeFileSync(snapshotFile, text);
      };
      const renderAll = async () => {
        publish();
        for (const entry of context.store.values()) {
          const rendered = await context.renderMarkdown(entry.body ?? '', {
            fileURL: new URL(entry.filePath, context.config.root),
          });
          // The metadata pass is deferred, then rendering uses the complete
          // validated index. Store final HTML so Astro owns its cache updates.
          const { deferredRender: _deferred, ...metadata } = entry;
          context.store.set({
            ...metadata, rendered, assetImports: rendered.metadata.imagePaths,
            // Astro deliberately skips set() when digest is unchanged. Include
            // derived HTML so a target edit can update an unchanged source body.
            digest: context.generateDigest({ body: entry.body, html: rendered.html }),
          });
        }
      };
      const store = new Proxy(context.store, {
        get(target, key) {
          const value = Reflect.get(target, key);
          if (typeof value !== 'function') return value;
          return (...args) => {
            const result = value.apply(target, args);
            if (ready && ['set', 'delete', 'clear'].includes(key)) {
              renderQueue = renderQueue.then(renderAll).catch(error => {
                context.logger.error(`[blog-proof] ${error.message}`);
                throw error;
              });
            }
            return result;
          };
        },
      });
      await loader.load({ ...context, store });
      await renderAll();
      ready = true;
    },
  };
}

const text = (value) => ({ type: 'text', value });
const element = (tagName, children, properties = {}) => ({ type: 'element', tagName, properties, children });

/** Minimal proof, deliberately not the complete production autolinker/CTA. */
export function prototypePlugins(snapshotFile) {
  return [
    () => ({
      name: 'blog-proof-figures',
      element: { filter: ['p'], visit(node) {
        const children = node.children.filter(child => child.type !== 'text' || child.value.trim());
        if (children.length !== 1 || children[0].type !== 'element' || children[0].tagName !== 'img') return;
        const image = children[0];
        const { title, ...properties } = image.properties;
        return element('figure', [
          { ...image, properties },
          ...(title ? [element('figcaption', [text(String(title))])] : []),
        ]);
      } },
    }),
    ({ fileURL }) => {
      const records = JSON.parse(readFileSync(snapshotFile, 'utf8'));
      const current = records.find(record => record.fileURL === fileURL?.href);
      if (!current) throw new Error('[blog-proof] Rendering started without validated metadata.');
      const targets = records.filter(record => record.lang === current.lang && record.id !== current.id && !record.draft);
      let linked = false;
      return {
        name: 'blog-proof-link',
        text(node, ctx) {
          if (linked || ctx.parent(node)?.tagName !== 'p') return;
          const target = targets.find(record => record.linkKeywords.some(keyword => node.value.includes(keyword)));
          if (!target) return;
          const keyword = target.linkKeywords.find(value => node.value.includes(value));
          const index = node.value.indexOf(keyword);
          ctx.replaceNode(node, [
            text(node.value.slice(0, index)),
            element('a', [text(keyword)], { href: `/${current.lang}/blog/${target.routeSlug}/` }),
            text(node.value.slice(index + keyword.length)),
          ]);
          linked = true;
        },
      };
    },
    () => ({
      name: 'blog-proof-cta',
      after(root, ctx) {
        const first = root.children.find(child => child.type === 'element' && child.tagName === 'figure');
        if (first) ctx.insertAfter(first, element('aside', [text('[FIXTURE] CTA placement proof')], { 'data-proof-cta': true }));
      },
    }),
  ];
}
