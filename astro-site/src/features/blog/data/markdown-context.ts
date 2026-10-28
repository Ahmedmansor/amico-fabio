import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BlogIndexRecord } from '../domain/validation';
import type { PublicationPolicy } from '../domain/models';

export interface MarkdownContext { current: BlogIndexRecord; records: BlogIndexRecord[]; policy: PublicationPolicy }

/** The renderer consumes the validated metadata pass; no frontmatter rescan. */
export function getMarkdownContext(fileURL?: URL): MarkdownContext | undefined {
  const sourcePath = fileURL && decodeURIComponent(fileURL.pathname).split('/src/content/blog/')[1];
  if (!sourcePath) return undefined;
  const snapshot = JSON.parse(readFileSync(resolve(process.cwd(), '.astro/blog/index.json'), 'utf8')) as {
    records: BlogIndexRecord[]; policy: PublicationPolicy;
  };
  const current = snapshot.records.find(record => record.sourcePath === sourcePath);
  if (!current) throw new Error(`[blog:${sourcePath}] Rendering started without validated article metadata.`);
  return { ...snapshot, current };
}
