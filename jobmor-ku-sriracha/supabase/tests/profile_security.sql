-- Run as database owner against a disposable database; all fixtures roll back.
begin;
create function pg_temp.check_profile(value boolean, message text) returns void
language plpgsql as $$ begin if value is distinct from true then raise exception 'FAIL: %', message; end if; end $$;
insert into auth.users(id,email,raw_user_meta_data) values
('30000000-0000-4000-8000-000000000001','profile-security@ku.th','{"role":"student","display_name":"Student","phone":"0800000001"}'),
('30000000-0000-4000-8000-000000000002','profile-security@example.invalid','{"role":"employer","display_name":"Employer","phone":"0800000002","company_name":"Company","business_category":"technology","address":"Sriracha"}');
update public.profiles set verification_status='verified' where id in ('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002');
do $$ begin
  begin
    update auth.users set email='external@example.invalid' where id='30000000-0000-4000-8000-000000000001';
    raise exception 'Non-KU student email allowed';
  exception when check_violation then null; end;
end $$;
update auth.users set email='new-profile-security@ku.th' where id='30000000-0000-4000-8000-000000000001';
select pg_temp.check_profile((select email='new-profile-security@ku.th' from public.profiles where id='30000000-0000-4000-8000-000000000001'),'KU email synchronized');
update auth.users set email='new-employer@example.invalid' where id='30000000-0000-4000-8000-000000000002';
select pg_temp.check_profile((select email='new-employer@example.invalid' from public.profiles where id='30000000-0000-4000-8000-000000000002'),'employer email synchronized');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
  begin update public.profiles set phone='not-a-phone' where id=auth.uid(); raise exception 'Invalid direct phone update allowed'; exception when check_violation then null; end;
  begin update public.profiles set display_name=repeat('x',161) where id=auth.uid(); raise exception 'Oversized name allowed'; exception when check_violation then null; end;
  begin update public.employer_profiles set company_name=repeat('x',161) where id=auth.uid(); raise exception 'Oversized company allowed'; exception when check_violation then null; end;
  begin update public.employer_profiles set address=repeat('x',1001) where id=auth.uid(); raise exception 'Oversized address allowed'; exception when check_violation then null; end;
end $$;
update public.profiles set phone='+66 (81) 234-5678' where id=auth.uid();
reset role;
update public.profiles set verification_status='suspended' where id='30000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
  update public.profiles set display_name='Blocked' where id=auth.uid(); if found then raise exception 'Suspended contact update allowed'; end if;
  update public.employer_profiles set company_name='Blocked' where id=auth.uid(); if found then raise exception 'Suspended business update allowed'; end if;
end $$;
select pg_temp.check_profile((select count(*)=1 from public.profiles where id=auth.uid()),'suspended self-read retained');
reset role;
update public.profiles set verification_status='suspended' where id='30000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
  update public.profiles set display_name='Blocked' where id=auth.uid(); if found then raise exception 'Suspended student update allowed'; end if;
end $$;
reset role;
rollback;
