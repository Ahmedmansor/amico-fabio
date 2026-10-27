-- User-confirmed disposable provider; preserve this manual block across list refreshes.
begin;
insert into public.disposable_email_domains(domain,reason)
values('playfine.com','User-confirmed disposable provider, 2026-10-27')
on conflict(domain) do update set reason=excluded.reason;
commit;
select public.validate_auth_email_domain('probe@playfine.com') as blocked,
  public.validate_auth_email_domain('probe@libero.it') as italian_provider,
  public.validate_auth_email_domain('probe@fabioegypt.com') as private_domain;
