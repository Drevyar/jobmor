-- Supabase default privileges may grant anon EXECUTE explicitly.
revoke all on function public.update_employer_profile(text,text,text,text,text) from public, anon;
grant execute on function public.update_employer_profile(text,text,text,text,text) to authenticated;

-- Verify the new ownership contract under real authenticated/anon roles.
-- Test fixtures live in a subtransaction and are ALWAYS rolled back on success;
-- unexpected failures abort this migration. No test account or job is retained.
create function pg_temp.assert_true(value boolean, message text) returns void
language plpgsql as $$ begin if value is distinct from true then raise exception 'FAIL: %', message; end if; end $$;

do $verify$
begin
insert into auth.users(id,email,raw_user_meta_data) values
('10000000-0000-4000-8000-000000000001','employer-a-employer-test@example.invalid','{"role":"employer","display_name":"Employer A","phone":"0800000001","company_name":"Company A","business_category":"technology","address":"Sriracha"}'),
('10000000-0000-4000-8000-000000000002','employer-b-employer-test@example.invalid','{"role":"employer","display_name":"Employer B","phone":"0800000002","company_name":"Company B","business_category":"technology","address":"Sriracha"}'),
('10000000-0000-4000-8000-000000000003','student-employer-test@ku.th','{"role":"student","display_name":"Student A","phone":"0800000003"}'),
('10000000-0000-4000-8000-000000000004','unrelated-employer-test@ku.th','{"role":"student","display_name":"Student B","phone":"0800000004"}');
update public.profiles set verification_status='verified' where id::text like '10000000-0000-4000-8000-00000000000%';
set local role authenticated;
perform set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.jobs(employer_id,title,description,wage,wage_type,location,category,working_date,shift,workers_required,contact_information,status)
values ('10000000-0000-4000-8000-000000000001','Employer test job','Description',500,'day','Sriracha','events','2026-12-01','09:00-17:00',2,'0800000001','active');
perform pg_temp.assert_true((select count(*)=1 from public.jobs where title='Employer test job'),'owner creates and reads job');
update public.jobs set title='Edited employer test job' where title='Employer test job';
perform pg_temp.assert_true((select count(*)=1 from public.jobs where title='Edited employer test job'),'owner edits job');

perform set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
insert into public.applications(job_id,applicant_id,message)
select id,'10000000-0000-4000-8000-000000000003','Please consider my application' from public.jobs where title='Edited employer test job';
perform pg_temp.assert_true((select count(*)=1 from public.applications where applicant_id=auth.uid()),'student applies');
do $$ begin
  begin
    update public.applications set status='accepted' where applicant_id=auth.uid();
    if found then raise exception 'Student changed own decision'; end if;
  end;
  begin
    insert into public.applications(job_id,applicant_id,message)
    select id,'10000000-0000-4000-8000-000000000004','Forged' from public.jobs where title='Edited employer test job';
    raise exception 'Forged application allowed';
  exception when insufficient_privilege then null; end;
end $$;

perform set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
perform pg_temp.assert_true((select count(*)=0 from public.jobs where title='Edited employer test job'),'other employer cannot read');
perform pg_temp.assert_true((select count(*)=0 from public.applications where applicant_id='10000000-0000-4000-8000-000000000003'),'other employer cannot read applications');
perform pg_temp.assert_true((select count(*)=0 from public.profiles where id='10000000-0000-4000-8000-000000000003'),'other employer cannot read applicant contact');
do $$ begin
  update public.jobs set title='Hijacked' where employer_id='10000000-0000-4000-8000-000000000001';
  if found then raise exception 'Other employer updated job'; end if;
  delete from public.jobs where employer_id='10000000-0000-4000-8000-000000000001';
  if found then raise exception 'Other employer deleted job'; end if;
  update public.applications set status='rejected' where applicant_id='10000000-0000-4000-8000-000000000003';
  if found then raise exception 'Other employer changed decision'; end if;
  update public.employer_profiles set company_name='Hijacked' where id='10000000-0000-4000-8000-000000000001';
  if found then raise exception 'Other employer updated profile'; end if;
end $$;

perform set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
perform pg_temp.assert_true((select count(*)=1 from public.profiles where id='10000000-0000-4000-8000-000000000003'),'owner reads applicant contact');
perform pg_temp.assert_true((select count(*)=0 from public.profiles where id='10000000-0000-4000-8000-000000000004'),'owner cannot read unrelated student');
update public.applications set status='accepted' where job_id in (select id from public.jobs where title='Edited employer test job');
perform pg_temp.assert_true((select status='accepted' from public.applications where applicant_id='10000000-0000-4000-8000-000000000003'),'accept works');
update public.applications set status='rejected' where job_id in (select id from public.jobs where title='Edited employer test job');
perform pg_temp.assert_true((select status='rejected' from public.applications where applicant_id='10000000-0000-4000-8000-000000000003'),'reject works');
do $$ begin
  begin update public.jobs set employer_id='10000000-0000-4000-8000-000000000002'; raise exception 'Ownership transfer allowed';
  exception when insufficient_privilege then null; end;
  begin update public.applications set applicant_id='10000000-0000-4000-8000-000000000004'; raise exception 'Applicant transfer allowed';
  exception when insufficient_privilege then null; end;
  begin update public.profiles set role='admin' where id=auth.uid(); raise exception 'Role escalation allowed';
  exception when insufficient_privilege then null; end;
end $$;
perform public.update_employer_profile('New contact','0812345678','Updated company','events','New address');
perform pg_temp.assert_true((select display_name='New contact' from public.profiles where id=auth.uid()),'contact saved');
perform pg_temp.assert_true((select company_name='Updated company' from public.employer_profiles where id=auth.uid()),'company saved');
do $$ begin
  begin
    perform public.update_employer_profile('Should rollback','0812345678','','events','New address');
    raise exception 'Invalid company accepted';
  exception when invalid_parameter_value then null; end;
end $$;
perform pg_temp.assert_true((select display_name='New contact' from public.profiles where id=auth.uid()),'invalid profile leaves no partial change');
delete from public.jobs where title='Edited employer test job';
perform pg_temp.assert_true((select count(*)=0 from public.applications where applicant_id='10000000-0000-4000-8000-000000000003'),'job delete cascades applications');
set local role anon;
do $$ begin
  begin perform count(*) from public.jobs; raise exception 'Anonymous access allowed';
  exception when insufficient_privilege then null; end;
end $$;

raise exception 'Rollback successful test fixtures' using errcode = 'PT001';
exception when sqlstate 'PT001' then
  raise notice 'Employer ownership and CRUD checks passed; fixtures rolled back';
end;
$verify$;
drop function pg_temp.assert_true(boolean,text);
