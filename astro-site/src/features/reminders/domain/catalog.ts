import { supportedLocales, type Locale } from '../../../shared/config/languages.ts';

export interface EmailCatalogItem {
  kind: 'trip' | 'package';
  id: string;
  slug: string;
  adult_price: number;
  localized: Record<Locale, { title: string; url: string }>;
  image: { url: string; width: number; height: number };
}
export interface EmailCatalog {
  schema_version: 1;
  environment: 'test' | 'production';
  origin: string;
  generated_at: string;
  currency: 'EUR';
  items: EmailCatalogItem[];
}

function required(value: unknown, context: string): asserts value is string {
  if(typeof value !== 'string' || !value.trim()) throw new Error(`[email-catalog] Missing ${context}.`);
}
export function emailOrigin(value: string): string {
  const url=new URL(value);
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.username || url.password || url.pathname!=='/' || url.search || url.hash
    || (url.protocol!=='https:' && !(local && url.protocol==='http:')))
    throw new Error('[email-catalog] A bare HTTPS or local loopback origin is required.');
  return url.origin;
}

/** Both building and future sender input validation use this same pure contract. */
export function validateEmailCatalog(input: unknown): EmailCatalog {
  if(!input || typeof input!=='object') throw new Error('[email-catalog] Invalid manifest.');
  const manifest=input as EmailCatalog;
  if(manifest.schema_version!==1 || manifest.currency!=='EUR'
    || !['test','production'].includes(manifest.environment) || !Array.isArray(manifest.items))
    throw new Error('[email-catalog] Unsupported manifest contract.');
  required(manifest.origin,'origin');
  if(emailOrigin(manifest.origin)!==manifest.origin) throw new Error('[email-catalog] Noncanonical origin.');
  required(manifest.generated_at,'generated_at');
  if(!Number.isFinite(Date.parse(manifest.generated_at))) throw new Error('[email-catalog] Invalid generated_at.');
  const ids=new Set<string>(),slugs=new Set<string>();
  for(const item of manifest.items){
    if(!item || !['trip','package'].includes(item.kind)) throw new Error('[email-catalog] Invalid item kind.');
    const context=`${item.kind}:${item.id}`;
    required(item.id,`${context} id`);required(item.slug,`${context} slug`);
    if(!/^[a-z0-9_-]+$/.test(item.id) || !/^[a-z0-9_-]+$/.test(item.slug))
      throw new Error(`[email-catalog:${context}] Invalid stable ID or slug.`);
    if(ids.has(`${item.kind}:${item.id}`) || slugs.has(`${item.kind}:${item.slug}`))
      throw new Error(`[email-catalog:${context}] Duplicate ID or slug.`);
    ids.add(`${item.kind}:${item.id}`);slugs.add(`${item.kind}:${item.slug}`);
    if(typeof item.adult_price!=='number' || !Number.isFinite(item.adult_price) || item.adult_price<0)
      throw new Error(`[email-catalog:${context}] Invalid adult_price.`);
    for(const locale of supportedLocales){
      const text=item.localized?.[locale];
      required(text?.title,`${context} ${locale} title`);
      const path=`/${locale}/${item.kind==='trip'?'tours':'packages'}/${item.slug}/`;
      if(text?.url!==new URL(path,manifest.origin).href)
        throw new Error(`[email-catalog:${context}] Invalid ${locale} page URL.`);
    }
    if(!item.image || !Number.isSafeInteger(item.image.width) || !Number.isSafeInteger(item.image.height)
      || item.image.width<1 || item.image.height<1) throw new Error(`[email-catalog:${context}] Invalid image dimensions.`);
    const image=new URL(item.image.url);
    if(image.origin!==manifest.origin || image.username || image.password || image.hash)
      throw new Error(`[email-catalog:${context}] Image must belong to the manifest origin.`);
  }
  return manifest;
}

export function buildEmailCatalog(items: EmailCatalogItem[],origin: string,generatedAt: string,environment: EmailCatalog['environment']): EmailCatalog {
  return validateEmailCatalog({schema_version:1,environment,origin:emailOrigin(origin),generated_at:generatedAt,currency:'EUR',items});
}
