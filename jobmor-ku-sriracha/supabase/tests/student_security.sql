-- Execute as database owner. All fixtures and changes are rolled back.
begin;
create function pg_temp.assert_student(value boolean, message text) returns void
language plpgsql as $$ begin if value is distinct from true then raise exception 'FAIL: %', message; end if; end $$;
insert into auth.users(id,email,raw_user_meta_data) values
('20000000-0000-4000-8000-000000000001','student-test-employer@example.invalid','{"role":"employer","display_name":"Employer","phone":"0812345678","company_name":"Company","business_category":"events","address":"Sriracha"}'),
('20000000-0000-4000-8000-000000000002','student-test-a@ku.th','{"role":"student","display_name":"Student A","phone":"0812345678"}'),
('20000000-0000-4000-8000-000000000003','student-test-b@ku.th','{"role":"student","display_name":"Student B","phone":"0812345678"}');
update public.profiles set verification_status='verified' where id::text like '20000000-0000-4000-8000-00000000000%';
insert into public.jobs(id,employer_id,title,description,wage,wage_type,location,category,working_date,shift,workers_required,contact_information,status) values
('20000000-0000-4000-8000-000000000010','20000000-0000-4000-8000-000000000001','Student test active','Description',500,'day','Sriracha','events','2026-12-01','09:00',2,'0812345678','active'),
('20000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000001','Student test draft','Description',500,'day','Sriracha','events','2026-12-01','09:00',2,'0812345678','draft');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select pg_temp.assert_student((select count(*)=1 from public.jobs where id::text like '20000000%'),'list and detail hide draft jobs');
insert into public.applications(job_id,applicant_id) values ('20000000-0000-4000-8000-000000000010',auth.uid());
insert into public.saved_jobs(job_id,student_id) values ('20000000-0000-4000-8000-000000000010',auth.uid());
select pg_temp.assert_student((select status='pending' from public.applications where applicant_id=auth.uid()),'apply starts pending');
select pg_temp.assert_student((select count(*)=1 from public.saved_jobs where student_id=auth.uid()),'saved persists on a fresh query');
do $$ begin
  begin insert into public.applications(job_id,applicant_id) values ('20000000-0000-4000-8000-000000000010',auth.uid()); raise exception 'Duplicate application allowed'; exception when unique_violation then null; end;
  begin insert into public.saved_jobs(job_id,student_id) values ('20000000-0000-4000-8000-000000000010',auth.uid()); raise exception 'Duplicate save allowed'; exception when unique_violation then null; end;
  begin insert into public.applications(job_id,applicant_id) values ('20000000-0000-4000-8000-000000000011',auth.uid()); raise exception 'Draft application allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.saved_jobs(job_id,student_id) values ('20000000-0000-4000-8000-000000000011',auth.uid()); raise exception 'Draft save allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.applications(job_id,applicant_id) values ('20000000-0000-4000-8000-000000000010','20000000-0000-4000-8000-000000000003'); raise exception 'Forged applicant allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.saved_jobs(job_id,student_id) values ('20000000-0000-4000-8000-000000000010','20000000-0000-4000-8000-000000000003'); raise exception 'Forged save allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select pg_temp.assert_student((select count(*)=0 from public.saved_jobs),'other student cannot read saved jobs');
do $$ begin
  delete from public.applications where applicant_id='20000000-0000-4000-8000-000000000002';
  if found then raise exception 'Withdrew another student application'; end if;
  delete from public.saved_jobs where student_id='20000000-0000-4000-8000-000000000002';
  if found then raise exception 'Unsaved another student job'; end if;
  update public.profiles set display_name='Hijacked' where id='20000000-0000-4000-8000-000000000002';
  if found then raise exception 'Edited another student profile'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
update public.jobs set status='closed' where id='20000000-0000-4000-8000-000000000010';
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select pg_temp.assert_student((select count(*)=0 from public.jobs where id='20000000-0000-4000-8000-000000000010'),'unrelated student cannot see closed job');
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select pg_temp.assert_student((select count(*)=1 from public.jobs where id='20000000-0000-4000-8000-000000000010'),'saved/applied closed job remains visible');
delete from public.applications where applicant_id=auth.uid();
select pg_temp.assert_student((select count(*)=0 from public.applications where applicant_id=auth.uid()),'withdraw pending succeeds');
do $$ begin
  begin insert into public.applications(job_id,applicant_id) values ('20000000-0000-4000-8000-000000000010',auth.uid()); raise exception 'Closed application allowed'; exception when insufficient_privilege then null; end;
end $$;
delete from public.saved_jobs where student_id=auth.uid();
select pg_temp.assert_student((select count(*)=0 from public.saved_jobs),'unsave succeeds');
select pg_temp.assert_student((select count(*)=0 from public.jobs where id='20000000-0000-4000-8000-000000000010'),'closed job hidden after removing associations');
update public.profiles set display_name='Updated Student',phone='0899999999' where id=auth.uid();
select pg_temp.assert_student((select display_name='Updated Student' and phone='0899999999' from public.profiles where id=auth.uid()),'profile saved');
do $$ begin
  begin update public.profiles set display_name=' ' where id=auth.uid(); raise exception 'Blank profile allowed'; exception when check_violation then null; end;
  begin update public.profiles set role='admin' where id=auth.uid(); raise exception 'Role escalation allowed'; exception when insufficient_privilege then null; end;
end $$;
select pg_temp.assert_student((select display_name='Updated Student' from public.profiles where id=auth.uid()),'invalid profile rolled back');
reset role;
update public.jobs set status='active' where id='20000000-0000-4000-8000-000000000010';
set local role authenticated;
insert into public.applications(job_id,applicant_id) values ('20000000-0000-4000-8000-000000000010',auth.uid());
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
update public.applications set status='accepted' where job_id='20000000-0000-4000-8000-000000000010';
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin delete from public.applications where applicant_id=auth.uid(); if found then raise exception 'Accepted application withdrawn'; end if; end $$;
reset role;
update public.applications set status='rejected' where job_id='20000000-0000-4000-8000-000000000010';
set local role authenticated;
do $$ begin delete from public.applications where applicant_id=auth.uid(); if found then raise exception 'Rejected application withdrawn'; end if; end $$;
reset role;
update public.profiles set verification_status='suspended' where id='20000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
  begin insert into public.saved_jobs(job_id,student_id) values ('20000000-0000-4000-8000-000000000010',auth.uid()); raise exception 'Suspended save allowed'; exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
  begin perform count(*) from public.saved_jobs; raise exception 'Anonymous saved access allowed'; exception when insufficient_privilege then null; end;
  begin delete from public.applications; raise exception 'Anonymous withdrawal allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Student browsing, application, saved jobs, profile and authorization checks passed.' as result;
