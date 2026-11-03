import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BlogIndexRecord } from '../domain/validation';
import type { PublicationPolicy } from '../domain/models';
import type {EditorialTarget} from '../../../shared/domain/editorial-targets';

export interface MarkdownContext { current: BlogIndexRecord; records: BlogIndexRecord[]; policy: PublicationPolicy; targets?:EditorialTarget[]; kind?:'post'|'place'; placeId?:string }

/** The renderer consumes the validated metadata pass; no frontmatter rescan. */
export function getMarkdownContext(fileURL?: URL): MarkdownContext | undefined {
  const source=fileURL&&decodeURIComponent(fileURL.pathname);
  const kind=source?.includes('/src/content/places/')?'place':'post';
  const sourcePath = source?.split(`/src/content/${kind==='place'?'places':'blog'}/`)[1];
  if (!sourcePath) return undefined;
  const editorial=resolve(process.cwd(),'.astro/editorial/index.json');
  if(existsSync(editorial)){
    const snapshot=JSON.parse(readFileSync(editorial,'utf8'));
    const records=snapshot[kind==='place'?'places':'blog'];
    const current=records.find((record:BlogIndexRecord)=>record.sourcePath===sourcePath);
    if(!current)throw new Error(`[editorial:${sourcePath}] Rendering started without validated metadata.`);
    return {current,records:snapshot.blog,policy:snapshot.policy,targets:snapshot.targets,kind,placeId:current.placeId};
  }
  const snapshot = JSON.parse(readFileSync(resolve(process.cwd(), '.astro/blog/index.json'), 'utf8')) as {
    records: BlogIndexRecord[]; policy: PublicationPolicy;
  };
  const current = snapshot.records.find(record => record.sourcePath === sourcePath);
  if (!current) throw new Error(`[blog:${sourcePath}] Rendering started without validated article metadata.`);
  return { ...snapshot, current };
}
