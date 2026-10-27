import {normalizeEmail} from '../domain/auth.ts';

/** Parse upstream data, never executable SQL. Fail rather than import malformed rows. */
export function parseDisposableCatalog(text: string, protectedDomains: readonly string[]): string[] {
  if (text.length > 2_000_000) throw new Error('Disposable catalog exceeds size limit');
  const domains = new Set<string>();
  for (const [index, value] of text.split(/\r?\n/).entries()) {
    const raw = value.trim();
    if (!raw || raw.startsWith('#')) continue;
    const normalized = normalizeEmail(`probe@${raw}`);
    if (!normalized) throw new Error(`Invalid disposable catalog row ${index + 1}`);
    const domain = normalized.slice('probe@'.length);
    if (protectedDomains.some(allowed => allowed === domain || allowed.endsWith(`.${domain}`) || domain.endsWith(`.${allowed}`))) continue;
    domains.add(domain);
  }
  if (!domains.size) throw new Error('Empty disposable catalog');
  return [...domains].sort();
}

/** Only source-owned rows are reconciled; manual blocks remain independent. */
export function disposableCatalogSql(domains: readonly string[], revision: string): string {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('An immutable upstream revision is required');
  const checked = parseDisposableCatalog(domains.join('\n'), []);
  const json = JSON.stringify(checked).replaceAll("'", "''");
  return `-- Generated from reviewed public data; no user accounts or grants are modified.
begin;
with incoming as materialized (select jsonb_array_elements_text('${json}'::jsonb) as domain),
removed as (
  delete from public.disposable_email_domains d
  where d.reason like 'Maintained disposable list %'
    and not exists(select 1 from incoming i where i.domain=d.domain)
  returning domain
), imported as (
  insert into public.disposable_email_domains(domain,reason)
    select domain,'Maintained disposable list ${revision}' from incoming
  on conflict(domain) do update set reason=excluded.reason
    where disposable_email_domains.reason like 'Maintained disposable list %'
  returning domain
)
select (select count(*) from imported) as imported,(select count(*) from removed) as removed;
commit;
select count(*) as blocked_domains from public.disposable_email_domains;
`;
}
