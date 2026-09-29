begin;
create function pg_temp.assert_student_ai(value boolean, message text) returns void
language plpgsql as $$ begin if value is distinct from true then raise exception 'FAIL: %', message; end if; end $$;
insert into auth.users(id,email,raw_user_meta_data) values
('30000000-0000-4000-8000-000000000010','ai-student-a@ku.th','{"role":"student","display_name":"Student A","phone":"0812345678"}'),
('30000000-0000-4000-8000-000000000011','ai-student-b@ku.th','{"role":"student","display_name":"Student B","phone":"0812345678"}'),
('30000000-0000-4000-8000-000000000012','ai-employer@example.invalid','{"role":"employer","display_name":"Employer","phone":"0812345678","company_name":"Shop","business_category":"retail","address":"Sriracha"}');
update public.profiles set verification_status='verified' where id::text like '30000000-0000-4000-8000-00000000001%';
insert into public.jobs(id,employer_id,title,description,wage,wage_type,location,category,working_date,shift,workers_required,contact_information,status)
values('30000000-0000-4000-8000-000000000020','30000000-0000-4000-8000-000000000012','AI test job','Part time',70,'hour','Sriracha','retail','2026-12-01','18:00 - 22:00',1,'0812345678','active');
insert into public.student_job_interactions(student_id,job_id,interaction_type) values('30000000-0000-4000-8000-000000000010','30000000-0000-4000-8000-000000000020','skipped');
insert into public.job_radar_recommendations(student_id,job_id,reasons) values('30000000-0000-4000-8000-000000000010','30000000-0000-4000-8000-000000000020','["Relevant"]');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000010","role":"authenticated"}',true);
insert into public.student_job_preferences(student_id,preferred_area,minimum_wage) values(auth.uid(),'Sriracha',60);
update public.student_job_preferences set preferred_area='Laem Chabang' where student_id=auth.uid();
update public.job_radar_recommendations set status='dismissed' where student_id=auth.uid();
select pg_temp.assert_student_ai((select preferred_area='Laem Chabang' from public.student_job_preferences where student_id=auth.uid()),'own preference persists');
select pg_temp.assert_student_ai((select status='dismissed' from public.job_radar_recommendations where student_id=auth.uid()),'own dismissal persists');
do $$ begin
  begin insert into public.student_job_preferences(student_id) values('30000000-0000-4000-8000-000000000011'); raise exception 'Forged preference allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.student_job_interactions(student_id,job_id,interaction_type) values(auth.uid(),'30000000-0000-4000-8000-000000000020','interested'); raise exception 'Direct interaction write allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.job_radar_recommendations(student_id,job_id,reasons) values(auth.uid(),'30000000-0000-4000-8000-000000000020','[]'); raise exception 'Direct radar insert allowed'; exception when insufficient_privilege then null; end;
  begin perform public.consume_student_ai_budget(auth.uid()); raise exception 'Budget RPC public'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000011","role":"authenticated"}',true);
select pg_temp.assert_student_ai((select count(*)=0 from public.student_job_preferences),'other student preferences hidden');
select pg_temp.assert_student_ai((select count(*)=0 from public.student_job_interactions),'other student interactions hidden');
select pg_temp.assert_student_ai((select count(*)=0 from public.job_radar_recommendations),'other student radar hidden');
update public.job_radar_recommendations set status='seen' where student_id='30000000-0000-4000-8000-000000000010';
select pg_temp.assert_student_ai((select count(*)=0 from public.job_radar_recommendations),'other student cannot change radar');
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000012","role":"authenticated"}',true);
select pg_temp.assert_student_ai((select count(*)=0 from public.student_job_preferences),'employer cannot read student preferences');
do $$ begin begin insert into public.student_job_preferences(student_id) values(auth.uid()); raise exception 'Employer preference allowed'; exception when insufficient_privilege then null; end; end $$;
reset role;
update public.profiles set verification_status='suspended' where id='30000000-0000-4000-8000-000000000010';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000010","role":"authenticated"}',true);
select pg_temp.assert_student_ai((select count(*)=0 from public.student_job_preferences),'suspended student cannot read preferences');
set local role anon;
do $$ begin begin perform count(*) from public.student_job_preferences; raise exception 'Anonymous preferences access'; exception when insufficient_privilege then null; end; end $$;
reset role;
rollback;
