-- Run as database owner against a disposable database; all fixtures roll back.
begin;
create function pg_temp.assert_admin_workflow(value boolean, message text) returns void
language plpgsql as $$ begin if value is distinct from true then raise exception 'FAIL: %', message; end if; end $$;

insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values
('40000000-0000-4000-8000-000000000001','admin-workflow@ku.th','{"role":"student","display_name":"Admin","phone":"0800000001"}',now()),
('40000000-0000-4000-8000-000000000002','admin-workflow-student@ku.th','{"role":"student","display_name":"Reporter","phone":"0800000002"}',now()),
('40000000-0000-4000-8000-000000000003','admin-workflow-employer@example.invalid','{"role":"employer","display_name":"Employer","phone":"0800000003","company_name":"Workflow Cafe","business_category":"food-beverage","address":"Sriracha"}',now());
update public.profiles set role='admin',verification_status='verified' where id='40000000-0000-4000-8000-000000000001';
update public.profiles set verification_status='verified' where id in (
  '40000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000003'
);
insert into public.jobs(id,employer_id,title,description,wage,wage_type,location,category,working_date,shift,workers_required,contact_information,status)
values ('40000000-0000-4000-8000-000000000010','40000000-0000-4000-8000-000000000003','Reported job','Description',500,'day','Sriracha','food-beverage','2026-12-01','09:00',1,'0800000003','active');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"40000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
insert into public.reports(reporter_id,target_type,target_id,reason)
values (auth.uid(),'job','40000000-0000-4000-8000-000000000010','The job details are misleading');
select pg_temp.assert_admin_workflow((select count(*)=1 from public.reports where reporter_id=auth.uid()),'reporter can read own report');
do $$ begin
  begin
    insert into public.reports(reporter_id,target_type,target_id,reason) values (auth.uid(),'user',auth.uid(),'Report myself here');
    raise exception 'Self-report allowed';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select pg_temp.assert_admin_workflow((select count(*)=1 from public.jobs where id='40000000-0000-4000-8000-000000000010'),'admin can read the employer job list');
select pg_temp.assert_admin_workflow((select count(*)=1 from public.reports),'admin can read submitted reports');
select public.admin_update_report((select id from public.reports limit 1),'resolved');
select pg_temp.assert_admin_workflow((select status='resolved' and resolved_by=auth.uid() and resolved_at is not null from public.reports limit 1),'admin can resolve report with audit fields');
select public.admin_set_user_suspended('40000000-0000-4000-8000-000000000003',true);
select pg_temp.assert_admin_workflow((select verification_status='suspended' from public.profiles where id='40000000-0000-4000-8000-000000000003'),'admin can suspend employer');
select public.admin_set_user_suspended('40000000-0000-4000-8000-000000000003',false);
select pg_temp.assert_admin_workflow((select verification_status='verified' from public.profiles where id='40000000-0000-4000-8000-000000000003'),'restore status follows confirmed Auth email');

select set_config('request.jwt.claims','{"sub":"40000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
  begin perform public.admin_update_report((select id from public.reports limit 1),'dismissed'); raise exception 'Non-admin moderated report'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Admin report and account-management authorization checks passed.' as result;
