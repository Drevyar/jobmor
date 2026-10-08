begin;
create function pg_temp.assert_demo(value boolean,message text) returns void language plpgsql as $$begin if value is distinct from true then raise exception 'FAIL: %',message;end if;end$$;
insert into auth.users(id,email,raw_user_meta_data) values
('60000000-0000-4000-8000-000000000001','demo-a@ku.th','{"role":"student","display_name":"A","phone":"0812345678"}'),
('60000000-0000-4000-8000-000000000002','demo-b@ku.th','{"role":"student","display_name":"B","phone":"0812345678"}'),
('60000000-0000-4000-8000-000000000010','demo-owner@example.invalid','{"role":"employer","display_name":"Owner","phone":"0812345678","company_name":"Demo shop","business_category":"retail","address":"Sriracha"}'),
('60000000-0000-4000-8000-000000000011','demo-other@example.invalid','{"role":"employer","display_name":"Other","phone":"0812345678","company_name":"Other shop","business_category":"retail","address":"Sriracha"}');
update public.profiles set verification_status='verified' where id::text like '60000000-%';
insert into public.jobs(id,employer_id,title,description,wage,wage_type,location,category,working_date,shift,workers_required,contact_information,status)
values('60000000-0000-4000-8000-000000000020','60000000-0000-4000-8000-000000000010','[URGENT] Urgent demo','Part time',70,'hour','Sriracha','retail',(now() at time zone 'Asia/Bangkok')::date+7,'18.00 - 22.00',1,'0812345678','draft');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"60000000-0000-4000-8000-000000000010"}',true);
update public.jobs set status='active' where id='60000000-0000-4000-8000-000000000020';
select pg_temp.assert_demo((select title like '[URGENT] %' and not is_urgent and latitude is null from public.jobs where id='60000000-0000-4000-8000-000000000020'),'demo tag publishes without GPS/EAS/new fields');
select set_config('request.jwt.claims','{"sub":"60000000-0000-4000-8000-000000000001"}',true);
select pg_temp.assert_demo((select count(*)=1 from public.jobs where id='60000000-0000-4000-8000-000000000020'),'student can view active urgent job');
insert into public.applications(job_id,applicant_id)values('60000000-0000-4000-8000-000000000020',auth.uid());
select pg_temp.assert_demo((select status='pending' from public.applications where job_id='60000000-0000-4000-8000-000000000020'),'urgent uses normal pending application');
do $$begin
 begin insert into public.applications(job_id,applicant_id)values('60000000-0000-4000-8000-000000000020',auth.uid());raise exception 'Duplicate application allowed';exception when unique_violation then null;end;
 begin insert into public.applications(job_id,applicant_id,status)values('60000000-0000-4000-8000-000000000020',auth.uid(),'accepted');raise exception 'Student forced accepted status';exception when insufficient_privilege then null;end;
 begin perform public.accept_urgent_job('60000000-0000-4000-8000-000000000020');raise exception 'Demo job allowed instant acceptance';exception when invalid_parameter_value then null;end;
end$$;
delete from public.applications where job_id='60000000-0000-4000-8000-000000000020' and applicant_id=auth.uid() and status='pending';
select pg_temp.assert_demo((select count(*)=0 from public.applications where job_id='60000000-0000-4000-8000-000000000020'),'own pending urgent application can withdraw');
insert into public.applications(job_id,applicant_id)values('60000000-0000-4000-8000-000000000020',auth.uid());
select set_config('request.jwt.claims','{"sub":"60000000-0000-4000-8000-000000000002"}',true);
select pg_temp.assert_demo((select count(*)=0 from public.applications where job_id='60000000-0000-4000-8000-000000000020'),'other student applications hidden');
select set_config('request.jwt.claims','{"sub":"60000000-0000-4000-8000-000000000011"}',true);
update public.jobs set title='Tampered' where id='60000000-0000-4000-8000-000000000020';
update public.applications set status='rejected' where job_id='60000000-0000-4000-8000-000000000020';
select pg_temp.assert_demo((select count(*)=0 from public.jobs where id='60000000-0000-4000-8000-000000000020'),'other employer cannot manage job');
select set_config('request.jwt.claims','{"sub":"60000000-0000-4000-8000-000000000010"}',true);
update public.applications set status='accepted' where job_id='60000000-0000-4000-8000-000000000020';
select pg_temp.assert_demo((select status='accepted' from public.applications where job_id='60000000-0000-4000-8000-000000000020'),'employer uses existing accept flow');
select pg_temp.assert_demo((select title='[URGENT] Urgent demo' from public.jobs where id='60000000-0000-4000-8000-000000000020'),'ownership protected title');
reset role;
select pg_temp.assert_demo((select count(*)=0 from public.urgent_job_notifications where job_id='60000000-0000-4000-8000-000000000020'),'demo job creates no native notification');
set local role anon;
do $$begin begin perform count(*) from public.jobs;raise exception 'Anonymous jobs allowed';exception when insufficient_privilege then null;end;end$$;
reset role;
rollback;
