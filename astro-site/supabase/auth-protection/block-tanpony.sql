-- User-confirmed disposable provider and present in the reviewed offline snapshot.
begin;
insert into public.disposable_email_domains(domain,reason)
values('tanpony.com','User-confirmed disposable provider, 2026-10-28')
on conflict(domain) do update set reason=excluded.reason;
commit;
select public.validate_auth_email_domain('probe@tanpony.com') as blocked,
  public.validate_auth_email_domain('probe@sub.tanpony.com') as subdomain_blocked,
  public.validate_auth_email_domain('probe@libero.it') as italian_provider,
  public.validate_auth_email_domain('probe@fabioegypt.com') as private_domain;
