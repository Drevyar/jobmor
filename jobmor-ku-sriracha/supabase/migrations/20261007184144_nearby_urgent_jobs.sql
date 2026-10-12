-- Optional job coordinates; existing job/application flows retain their defaults.
alter table public.jobs
  add column latitude double precision,
  add column longitude double precision,
  add column is_urgent boolean not null default false,
  add column instant_accept boolean not null default false,
  add column urgent_radius_km double precision not null default 5,
  add constraint job_coordinates check ((latitude is null and longitude is null) or
    (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180)),
  add constraint urgent_job_fields check (urgent_radius_km between 1 and 20 and
    (not instant_accept or is_urgent) and
    (not is_urgent or (wage_type = 'hour' and latitude is not null and longitude is not null)));
grant insert(latitude,longitude,is_urgent,instant_accept,urgent_radius_km),
  update(latitude,longitude,is_urgent,instant_accept,urgent_radius_km) on public.jobs to authenticated;

-- Precise student coordinates never go into profiles (which employers can read).
create table public.student_job_locations (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_km double precision not null default 10 check (radius_km between 1 and 50),
  travel_mode text not null default 'walking' check (travel_mode in ('walking','motorbike','car')),
  urgent_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger location_updated before update on public.student_job_locations
  for each row execute function public.set_updated_at();
alter table public.student_job_locations enable row level security;
revoke all on public.student_job_locations from anon,authenticated;
grant select,delete on public.student_job_locations to authenticated;
grant insert(student_id,latitude,longitude,radius_km,travel_mode,urgent_enabled),
 update(student_id,latitude,longitude,radius_km,travel_mode,urgent_enabled) on public.student_job_locations to authenticated;
grant all on public.student_job_locations to service_role;
create policy "Student owns private job location" on public.student_job_locations for all to authenticated
 using(student_id=(select auth.uid()) and (select private.current_verified_role())='student')
 with check(student_id=(select auth.uid()) and (select private.current_verified_role())='student');

create table public.student_push_devices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique check (token ~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$'),
  created_at timestamptz not null default now()
);
alter table public.student_push_devices enable row level security;
revoke all on public.student_push_devices from anon,authenticated;
grant select,delete on public.student_push_devices to authenticated;
grant all on public.student_push_devices to service_role;
create policy "Student reads own push devices" on public.student_push_devices for select to authenticated using(student_id=(select auth.uid()));
create policy "Student deletes own push devices" on public.student_push_devices for delete to authenticated using(student_id=(select auth.uid()));
create index student_push_devices_student_idx on public.student_push_devices(student_id);
create function private.register_urgent_device(push_token text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if (select private.current_verified_role()) is distinct from 'student' then raise exception 'Verified student required' using errcode='42501'; end if;
  if push_token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$' or length(push_token)>255 then raise exception 'Invalid token' using errcode='22023'; end if;
  -- A device token belongs to its most recent signed-in student, not every past login.
  delete from public.student_push_devices where token=push_token and student_id<>auth.uid();
  insert into public.student_push_devices(student_id,token) values(auth.uid(),push_token) on conflict(token) do nothing;
end $$;
revoke all on function private.register_urgent_device(text) from public;
grant execute on function private.register_urgent_device(text) to authenticated;
create function public.register_urgent_device(push_token text) returns void language sql security invoker set search_path='' as $$
 select private.register_urgent_device(push_token);
$$;
revoke all on function public.register_urgent_device(text) from public;
grant execute on function public.register_urgent_device(text) to authenticated;

create table public.urgent_job_notifications (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
 job_id uuid not null references public.jobs(id) on delete cascade,
 created_at timestamptz not null default now(), read_at timestamptz,
 unique(student_id,job_id)
);
alter table public.urgent_job_notifications enable row level security;
revoke all on public.urgent_job_notifications from anon,authenticated;
grant select on public.urgent_job_notifications to authenticated;
grant update(read_at) on public.urgent_job_notifications to authenticated;
grant all on public.urgent_job_notifications to service_role;
create policy "Student reads own urgent notices" on public.urgent_job_notifications for select to authenticated using(student_id=(select auth.uid()) and (select private.current_verified_role())='student');
create policy "Student marks own urgent notices" on public.urgent_job_notifications for update to authenticated
 using(student_id=(select auth.uid()) and (select private.current_verified_role())='student')
 with check(student_id=(select auth.uid()) and (select private.current_verified_role())='student');
create index urgent_notices_student_idx on public.urgent_job_notifications(student_id,created_at desc);
create index urgent_notices_job_idx on public.urgent_job_notifications(job_id);
create table private.urgent_push_deliveries (
 id uuid primary key default gen_random_uuid(), notification_id uuid not null references public.urgent_job_notifications(id) on delete cascade,
 device_id uuid not null references public.student_push_devices(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','sending','submitted','delivered','failed','cancelled')),
 attempts integer not null default 0, lease_until timestamptz, ticket_id text, error_code text,
 updated_at timestamptz not null default now(), unique(notification_id,device_id)
);
alter table private.urgent_push_deliveries enable row level security;
revoke all on private.urgent_push_deliveries from public,anon,authenticated;
grant all on private.urgent_push_deliveries to service_role;
create index urgent_delivery_status_idx on private.urgent_push_deliveries(status,lease_until);
create index urgent_delivery_device_idx on private.urgent_push_deliveries(device_id);

create function private.distance_km(a double precision,b double precision,c double precision,d double precision)
 returns double precision language sql immutable strict set search_path='' as $$
 select 6371 * 2 * asin(sqrt(least(1::double precision,
 power(sin(radians(c-a)/2),2)+cos(radians(a))*cos(radians(c))*power(sin(radians(d-b)/2),2))));
$$;
create function private.job_shift_range(day date,shift_text text) returns tstzrange
language plpgsql immutable strict set search_path='' as $$
declare parts text[]; start_time timestamptz; end_time timestamptz;
begin
 parts:=regexp_match(trim(shift_text),'^([0-1][0-9]|2[0-3])[.:]([0-5][0-9])\s*[-–—]\s*([0-1][0-9]|2[0-3])[.:]([0-5][0-9])$');
 if parts is null or (parts[1]=parts[3] and parts[2]=parts[4]) then return null; end if;
 start_time:=(day::text||'T'||parts[1]||':'||parts[2]||':00+07:00')::timestamptz;
 end_time:=(day::text||'T'||parts[3]||':'||parts[4]||':00+07:00')::timestamptz;
 if end_time<start_time then end_time:=end_time+interval '1 day'; end if;
 return tstzrange(start_time,end_time,'[)');
end $$;
revoke all on function private.distance_km(double precision,double precision,double precision,double precision),private.job_shift_range(date,text) from public;
grant execute on function private.distance_km(double precision,double precision,double precision,double precision),private.job_shift_range(date,text) to service_role;

create function private.urgent_eligible(student uuid,target_job uuid,require_alerts boolean default true) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.jobs j join public.student_job_locations l on l.student_id=student
 join public.profiles p on p.id=l.student_id
 where j.id=target_job and j.status='active' and j.is_urgent and p.role='student' and p.verification_status='verified'
 and (not require_alerts or l.urgent_enabled) and l.updated_at>now()-interval '7 days'
 and lower(private.job_shift_range(j.working_date,j.shift))>now()
 and private.distance_km(l.latitude,l.longitude,j.latitude,j.longitude)<=least(l.radius_km,j.urgent_radius_km)
 and now()+(greatest(1,ceil(private.distance_km(l.latitude,l.longitude,j.latitude,j.longitude)*1.3/
   case l.travel_mode when 'walking' then 4.5 when 'motorbike' then 25 else 20 end*60+
   case l.travel_mode when 'walking' then 0 when 'motorbike' then 3 else 5 end))*interval '1 minute')<=lower(private.job_shift_range(j.working_date,j.shift))
 and coalesce((select range_agg(tstzrange(w.starts_at,w.ends_at,'[)')) @> private.job_shift_range(j.working_date,j.shift)
 from public.student_availability w where w.student_id=student),false)
 and not exists(select 1 from public.applications a where a.applicant_id=student and a.job_id=j.id)
 and (select count(*) from public.applications a where a.job_id=j.id and a.status='accepted')<j.workers_required
 and not exists(select 1 from public.applications a join public.jobs work on work.id=a.job_id
 where a.applicant_id=student and a.status='accepted' and coalesce(private.job_shift_range(work.working_date,work.shift),
 tstzrange(work.working_date::timestamp at time zone 'Asia/Bangkok',(work.working_date+2)::timestamp at time zone 'Asia/Bangkok','[)')) && private.job_shift_range(j.working_date,j.shift)));
$$;
revoke all on function private.urgent_eligible(uuid,uuid,boolean) from public;
grant execute on function private.urgent_eligible(uuid,uuid,boolean) to service_role;

create function private.validate_urgent_job() returns trigger language plpgsql set search_path='' as $$
declare shift_window tstzrange;
begin
 if new.is_urgent then
  shift_window:=private.job_shift_range(new.working_date,new.shift);
  if shift_window is null then raise exception 'Urgent jobs require HH:mm - HH:mm shift' using errcode='22023'; end if;
  if new.status='active' and (lower(shift_window)<=now() or lower(shift_window)>now()+interval '48 hours') then
   raise exception 'Urgent shift must start within the next 48 hours' using errcode='22023';
  end if;
 end if;
 return new;
end $$;
revoke all on function private.validate_urgent_job() from public;
-- Invoker trigger needs these pure helpers; they expose no private rows.
grant execute on function private.job_shift_range(date,text) to authenticated;
create trigger validate_urgent_job before insert or update on public.jobs for each row execute function private.validate_urgent_job();

create function private.enqueue_urgent_job() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not new.is_urgent or new.status<>'active' then return new; end if;
 insert into public.urgent_job_notifications(student_id,job_id)
 select l.student_id,new.id from public.student_job_locations l where private.urgent_eligible(l.student_id,new.id,true)
 on conflict(student_id,job_id) do nothing;
 insert into private.urgent_push_deliveries(notification_id,device_id)
 select n.id,d.id from public.urgent_job_notifications n join public.student_push_devices d on d.student_id=n.student_id
 where n.job_id=new.id and private.urgent_eligible(n.student_id,new.id,true)
 on conflict(notification_id,device_id) do nothing;
 return new;
end $$;
revoke all on function private.enqueue_urgent_job() from public;
create trigger enqueue_urgent_job after insert or update on public.jobs for each row execute function private.enqueue_urgent_job();

create function private.guard_urgent_acceptance() returns trigger language plpgsql security definer set search_path='' as $$
declare job public.jobs; target tstzrange;
begin
 if new.status<>'accepted' then return new; end if;
 if tg_op='UPDATE' and old.status='accepted' then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.applicant_id::text,0));
 select * into job from public.jobs where id=new.job_id for update;
 target:=private.job_shift_range(job.working_date,job.shift);
 if job.is_urgent and (job.status<>'active' or lower(target)<=now() or
 (select count(*) from public.applications where job_id=new.job_id and status='accepted')>=job.workers_required) then
  raise exception 'urgentFullOrExpired' using errcode='22023';
 end if;
 if exists(select 1 from public.applications a join public.jobs work on work.id=a.job_id where a.applicant_id=new.applicant_id
 and a.status='accepted' and a.id<>new.id and (job.is_urgent or work.is_urgent)
 and coalesce(private.job_shift_range(work.working_date,work.shift),tstzrange(work.working_date::timestamp at time zone 'Asia/Bangkok',(work.working_date+2)::timestamp at time zone 'Asia/Bangkok','[)')) &&
 coalesce(target,tstzrange(job.working_date::timestamp at time zone 'Asia/Bangkok',(job.working_date+2)::timestamp at time zone 'Asia/Bangkok','[)'))) then
  raise exception 'urgentScheduleConflict' using errcode='22023';
 end if;
 return new;
end $$;
revoke all on function private.guard_urgent_acceptance() from public;
create trigger guard_urgent_acceptance before insert or update on public.applications for each row execute function private.guard_urgent_acceptance();
create function private.accept_urgent_job(target_job uuid) returns public.applications language plpgsql security definer set search_path='' as $$
declare job public.jobs; result public.applications;
begin
 if (select private.current_verified_role()) is distinct from 'student' then raise exception 'Verified student required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into job from public.jobs where id=target_job for update;
 if not found or not job.instant_accept or not private.urgent_eligible(auth.uid(),target_job,false) then
  raise exception 'urgentNotEligible' using errcode='22023';
 end if;
 insert into public.applications(job_id,applicant_id,status) values(target_job,auth.uid(),'accepted') returning * into result;
 return result;
end $$;
revoke all on function private.accept_urgent_job(uuid) from public;
grant execute on function private.accept_urgent_job(uuid) to authenticated;
create function public.accept_urgent_job(target_job uuid) returns public.applications language sql security invoker set search_path='' as $$
 select private.accept_urgent_job(target_job);
$$;
revoke all on function public.accept_urgent_job(uuid) from public;
grant execute on function public.accept_urgent_job(uuid) to authenticated;

-- Atomic leases prevent concurrent dispatchers sending the same pending delivery.
create function public.claim_urgent_push(target_job uuid default null) returns table(delivery_id uuid,token text,job_id uuid,title text)
language sql security invoker set search_path='' as $$
 with picked as (select d.id from private.urgent_push_deliveries d join public.urgent_job_notifications n on n.id=d.notification_id
 where (target_job is null or n.job_id=target_job) and d.attempts<3
 and (d.status='pending' or (d.status='sending' and d.lease_until<now()))
 and private.urgent_eligible(n.student_id,n.job_id,true)
 order by n.created_at limit 100 for update of d skip locked),
 claimed as (update private.urgent_push_deliveries d set status='sending',attempts=attempts+1,lease_until=now()+interval '2 minutes',updated_at=now()
 from picked where d.id=picked.id returning d.*)
 select c.id,device.token,n.job_id,j.title from claimed c join public.urgent_job_notifications n on n.id=c.notification_id
 join public.student_push_devices device on device.id=c.device_id join public.jobs j on j.id=n.job_id;
$$;
revoke all on function public.claim_urgent_push(uuid) from public;
grant execute on function public.claim_urgent_push(uuid) to service_role;

create function public.finish_urgent_push(delivery uuid,next_status text,ticket text default null,code text default null) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if next_status not in ('pending','submitted','delivered','failed') then raise exception 'Invalid delivery status'; end if;
 update private.urgent_push_deliveries set status=case when next_status='pending' and attempts>=3 then 'failed' else next_status end,
 ticket_id=coalesce(ticket,ticket_id),error_code=left(code,80),updated_at=now()
 where id=delivery and status in ('sending','submitted');
 if code='DeviceNotRegistered' then delete from public.student_push_devices where id=(select device_id from private.urgent_push_deliveries where id=delivery); end if;
end $$;
revoke all on function public.finish_urgent_push(uuid,text,text,text) from public;
grant execute on function public.finish_urgent_push(uuid,text,text,text) to service_role;
create function public.urgent_push_receipts() returns table(delivery_id uuid,ticket_id text)
language plpgsql security invoker set search_path='' as $$
begin
 update private.urgent_push_deliveries d set status='failed',error_code='receiptExpired' where d.status='submitted' and d.updated_at<now()-interval '24 hours';
 return query select d.id,d.ticket_id from private.urgent_push_deliveries d where d.status='submitted' and d.ticket_id is not null and d.updated_at<now()-interval '1 minute' order by d.updated_at limit 100;
end;
$$;
revoke all on function public.urgent_push_receipts() from public;
grant execute on function public.urgent_push_receipts() to service_role;
create table private.urgent_worker_auth (singleton boolean primary key default true check(singleton),token_hash bytea not null);
alter table private.urgent_worker_auth enable row level security;
revoke all on private.urgent_worker_auth from public,anon,authenticated;
grant select on private.urgent_worker_auth to service_role;
create function public.urgent_worker_authorized(worker_token text) returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from private.urgent_worker_auth where token_hash=sha256(convert_to(worker_token,'UTF8')));
$$;
revoke all on function public.urgent_worker_authorized(text) from public;
grant execute on function public.urgent_worker_authorized(text) to service_role;

-- Hosted Supabase supports these; in-memory/local environments without them skip setup.
do $$ begin
 if exists(select 1 from pg_available_extensions where name='pg_net') then create extension if not exists pg_net; end if;
 if exists(select 1 from pg_available_extensions where name='pg_cron') then create extension if not exists pg_cron; end if;
end $$;
-- Run as database owner once deployment is ready. Raw worker secret stays inside Vault.
create function private.configure_urgent_worker(project_url text) returns void language plpgsql security invoker set search_path='' as $$
declare worker_token text; secret_id uuid; schedule_sql text; job bigint;
begin
 if project_url !~ '^https://[a-z0-9]+\.supabase\.co$' then raise exception 'Invalid project URL'; end if;
 if to_regclass('vault.secrets') is null or to_regclass('cron.job') is null or to_regnamespace('net') is null then raise exception 'Vault, pg_cron and pg_net required'; end if;
 execute 'select decrypted_secret from vault.decrypted_secrets where name=$1 limit 1' into worker_token using 'jobmor_urgent_worker';
 if worker_token is null then
  worker_token:=gen_random_uuid()::text||gen_random_uuid()::text;
  execute 'select vault.create_secret($1,$2)' using worker_token,'jobmor_urgent_worker';
 end if;
 insert into private.urgent_worker_auth(singleton,token_hash) values(true,sha256(convert_to(worker_token,'UTF8')))
 on conflict(singleton) do update set token_hash=excluded.token_hash;
 execute 'select id from vault.secrets where name=$1 limit 1' into secret_id using 'jobmor_project_url';
 if secret_id is null then execute 'select vault.create_secret($1,$2)' using project_url,'jobmor_project_url';
 else execute 'select vault.update_secret($1,$2)' using secret_id,project_url; end if;
 execute 'select jobid from cron.job where jobname=$1' into job using 'jobmor-urgent-push';
 if job is not null then execute 'select cron.unschedule($1)' using job; end if;
 schedule_sql:=$schedule$select net.http_post(url:=(select decrypted_secret from vault.decrypted_secrets where name='jobmor_project_url')||'/functions/v1/urgent-jobs',
 headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='jobmor_urgent_worker')),
 body:='{}'::jsonb,timeout_milliseconds:=20000);$schedule$;
 execute 'select cron.schedule($1,$2,$3)' using 'jobmor-urgent-push','* * * * *',schedule_sql;
end $$;
revoke all on function private.configure_urgent_worker(text) from public,anon,authenticated,service_role;
