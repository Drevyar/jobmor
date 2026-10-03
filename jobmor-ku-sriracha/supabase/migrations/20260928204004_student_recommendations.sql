-- Preferences are voluntary; never derive them from sensitive attributes.
create table public.student_job_preferences (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_category text not null default '' check (length(preferred_category) <= 100),
  preferred_area text not null default '' check (length(preferred_area) <= 100),
  minimum_wage numeric not null default 0 check (minimum_wage >= 0 and minimum_wage <= 1000000),
  wage_type text not null default 'hour' check (wage_type in ('hour','day','month','job')),
  updated_at timestamptz not null default now()
);
alter table public.student_job_preferences enable row level security;
revoke all on public.student_job_preferences from anon, authenticated;
grant select on public.student_job_preferences to authenticated;
grant insert (student_id,preferred_category,preferred_area,minimum_wage,wage_type) on public.student_job_preferences to authenticated;
grant update (preferred_category,preferred_area,minimum_wage,wage_type) on public.student_job_preferences to authenticated;
grant all on public.student_job_preferences to service_role;
create policy "Student reads own preferences" on public.student_job_preferences for select to authenticated
  using (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');
create policy "Student creates own preferences" on public.student_job_preferences for insert to authenticated
  with check (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');
create policy "Student edits own preferences" on public.student_job_preferences for update to authenticated
  using (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student')
  with check (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');

create table public.student_job_interactions (
  student_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('skipped','interested')),
  created_at timestamptz not null default now(),
  primary key (student_id,job_id)
);
create index student_job_interactions_job_idx on public.student_job_interactions(job_id);
alter table public.student_job_interactions enable row level security;
revoke all on public.student_job_interactions from anon, authenticated;
grant select on public.student_job_interactions to authenticated;
grant all on public.student_job_interactions to service_role;
create policy "Student reads own interactions" on public.student_job_interactions for select to authenticated
  using (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');

create table public.job_radar_recommendations (
  student_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  reasons jsonb not null check (jsonb_typeof(reasons) = 'array'),
  status text not null default 'new' check (status in ('new','seen','dismissed')),
  created_at timestamptz not null default now(),
  primary key (student_id,job_id)
);
create index job_radar_student_status_idx on public.job_radar_recommendations(student_id,status,created_at desc);
alter table public.job_radar_recommendations enable row level security;
revoke all on public.job_radar_recommendations from anon, authenticated;
grant select on public.job_radar_recommendations to authenticated;
grant update (status) on public.job_radar_recommendations to authenticated;
grant all on public.job_radar_recommendations to service_role;
create policy "Student reads own radar" on public.job_radar_recommendations for select to authenticated
  using (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');
create policy "Student dismisses own radar" on public.job_radar_recommendations for update to authenticated
  using (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student')
  with check (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');

create table private.student_ai_usage (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null,
  calls integer not null
);
alter table private.student_ai_usage enable row level security;
revoke all on private.student_ai_usage from public, anon, authenticated;
grant usage on schema private to service_role;
grant all on private.student_ai_usage to service_role;
create function public.consume_student_ai_budget(target_student uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare consumed uuid;
begin
  insert into private.student_ai_usage as usage (student_id, window_started_at, calls)
    values (target_student, now(), 1)
  on conflict (student_id) do update set
    window_started_at = case when usage.window_started_at <= now() - interval '1 hour' then now() else usage.window_started_at end,
    calls = case when usage.window_started_at <= now() - interval '1 hour' then 1 else usage.calls + 1 end
  where usage.window_started_at <= now() - interval '1 hour' or usage.calls < 20
  returning student_id into consumed;
  return consumed is not null;
end;
$$;
revoke all on function public.consume_student_ai_budget(uuid) from public, anon, authenticated;
grant execute on function public.consume_student_ai_budget(uuid) to service_role;
