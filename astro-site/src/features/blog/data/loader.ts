import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob, type Loader } from 'astro/loaders';
import { articlePathParts, validatePostIndex, type BlogIndexRecord } from '../domain/validation';
import type { PublicationPolicy } from '../domain/models';
import { isPublished } from '../domain/publication';
import { authors } from './authors';

/** Metadata is validated before rendering, using Astro's own parser/schema. */
export function blogLoader(policy: PublicationPolicy): Loader {
  return {
    name: 'fabio-blog',
    async load(context) {
      const base = new URL('./src/content/blog/', context.config.root);
      const snapshot = new URL('./.astro/blog/index.json', context.config.root);
      mkdirSync(dirname(fileURLToPath(snapshot)), { recursive: true });
      const identity = new Map<string, string>();
      const native = glob({ base, pattern: '**/index.md', deferRender: true,
        generateId({ entry, data }) {
          const path = articlePathParts(entry);
          if (data.lang !== path.lang) throw new Error(`[blog:${entry}] lang must match directory ${path.lang}.`);
          if (typeof data.id !== 'string' || !data.id) throw new Error(`[blog:${entry}] Missing required id.`);
          const previous = identity.get(data.id);
          if (previous && previous !== entry) throw new Error(`[blog:${entry}] Duplicate id "${data.id}"; already claimed by ${previous}.`);
          identity.set(data.id, entry);
          return data.id;
        },
      });
      let queued = Promise.resolve();
      const refresh = async () => {
        identity.clear();
        const files = existsSync(base) ? await readdir(base, { recursive: true }) : [];
        if (!files.some(file => file.endsWith('index.md'))) {
          context.store.clear();
          writeFileSync(snapshot, JSON.stringify({ policy, records: [] }));
          return;
        }
        // Own the watcher so each refresh has a complete metadata pass before
        // any derived HTML is stored. Do not publish a partially updated index.
        await native.load({ ...context, watcher: undefined, async parseData(options) {
          try { return await context.parseData(options); }
          catch (error) { throw new Error(`[blog:${options.filePath}] ${(error as Error).message}`, { cause: error }); }
        } });
        const records: BlogIndexRecord[] = context.store.values().map(entry => {
          const source = new URL(entry.filePath!, context.config.root);
          const path = articlePathParts(decodeURIComponent(source.pathname.slice(base.pathname.length)));
          return { ...entry.data, id: entry.id, ...path, sourcePath: `${path.lang}/${path.slug}/index.md` } as BlogIndexRecord;
        }).sort((a, b) => a.sourcePath < b.sourcePath ? -1 : a.sourcePath > b.sourcePath ? 1 : 0);
        const tripIds = new Set<string>();
        if (records.some(record => record.relatedTripIds.length)) {
          const { getTrips } = await import('../../tours/data/trips.mjs');
          for (const trip of await getTrips()) tripIds.add(trip.id);
        }
        validatePostIndex(records, policy, { authorIds: new Set(Object.keys(authors)), tripIds });
        const serialized = JSON.stringify({ policy, records });
        let previous = '';
        try { previous = readFileSync(snapshot, 'utf8'); } catch { /* First sync. */ }
        if (serialized !== previous) writeFileSync(snapshot, serialized);
        for (const entry of context.store.values()) {
          const record = records.find(record => record.id === entry.id)!;
          if (!isPublished(record, policy)) { context.store.delete(entry.id); continue; }
          const rendered = await context.renderMarkdown(entry.body ?? '', { fileURL: new URL(entry.filePath!, context.config.root) });
          const { deferredRender: _deferred, ...metadata } = entry;
          context.store.set({ ...metadata, rendered,
            assetImports: [...new Set([...(entry.assetImports ?? []), ...(rendered.metadata?.imagePaths ?? [])])],
            digest: context.generateDigest({ body: entry.body, html: rendered.html }) });
        }
      };
      await refresh();
      if (context.watcher) {
        context.watcher.add(fileURLToPath(base));
        const changed = (path: string) => {
          const normalized = path.replaceAll('\\', '/');
          if (!normalized.startsWith(fileURLToPath(base).replaceAll('\\', '/')) || !normalized.endsWith('/index.md')) return;
          queued = queued.then(refresh).catch(error => {
            context.logger.error(`[blog] ${error.message}`);
            // Invalid source stays a reported development error; a fresh build
            // still rejects it. Preserve the queue so fixing the file recovers.
          });
        };
        for (const event of ['add', 'change', 'unlink']) context.watcher.on(event, changed);
      }
    },
  };
}
