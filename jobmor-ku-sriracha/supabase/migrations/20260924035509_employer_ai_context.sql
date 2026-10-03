-- Optional work context on the existing profile, never demographic attributes.
alter table public.profiles
  add column work_skills text not null default '' check (length(work_skills) <= 1000),
  add column work_experience text not null default '' check (length(work_experience) <= 3000);
grant update (work_skills, work_experience) on public.profiles to authenticated;

create table public.student_availability (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at <= starts_at + interval '24 hours'),
  unique(student_id, starts_at, ends_at)
);
create index student_availability_window_idx on public.student_availability(student_id, starts_at, ends_at);
alter table public.student_availability enable row level security;
revoke all on public.student_availability from anon, authenticated;
grant select, delete on public.student_availability to authenticated;
grant insert (student_id, starts_at, ends_at) on public.student_availability to authenticated;
grant all on public.student_availability to service_role;
create policy "Students read own availability" on public.student_availability for select to authenticated
  using (student_id = (select auth.uid()));
create policy "Verified students add own availability" on public.student_availability for insert to authenticated
  with check (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');
create policy "Verified students remove own availability" on public.student_availability for delete to authenticated
  using (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');
-- Employers do not browse everyone's schedule. The authenticated Edge Function
-- checks job ownership before reading only that job's applicants via service_role.

-- One bounded counter per employer, atomic across Edge Function instances.
create table private.employer_ai_usage (
  employer_id uuid primary key references public.employer_profiles(id) on delete cascade,
  window_started_at timestamptz not null,
  calls integer not null
);
alter table private.employer_ai_usage enable row level security;
revoke all on private.employer_ai_usage from public, anon, authenticated;
grant usage on schema private to service_role;
grant all on private.employer_ai_usage to service_role;
create function public.consume_employer_ai_budget(target_employer uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare consumed uuid;
begin
  insert into private.employer_ai_usage as usage (employer_id, window_started_at, calls)
    values (target_employer, now(), 1)
  on conflict (employer_id) do update set
    window_started_at = case when usage.window_started_at <= now() - interval '1 hour' then now() else usage.window_started_at end,
    calls = case when usage.window_started_at <= now() - interval '1 hour' then 1 else usage.calls + 1 end
  where usage.window_started_at <= now() - interval '1 hour' or usage.calls < 20
  returning employer_id into consumed;
  return consumed is not null;
end;
$$;
revoke all on function public.consume_employer_ai_budget(uuid) from public, anon, authenticated;
grant execute on function public.consume_employer_ai_budget(uuid) to service_role;
