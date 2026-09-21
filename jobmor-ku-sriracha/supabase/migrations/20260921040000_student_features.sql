-- Reuse the existing application lifecycle: only pending applications can be withdrawn.
grant delete on public.applications to authenticated;
create policy "Students withdraw own pending applications" on public.applications
  for delete to authenticated using (
    applicant_id = (select auth.uid()) and status = 'pending'
    and (select private.current_verified_role()) = 'student'
  );

create table public.saved_jobs (
  student_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, job_id)
);
create index saved_jobs_job_idx on public.saved_jobs(job_id);
alter table public.saved_jobs enable row level security;
revoke all on public.saved_jobs from anon, authenticated;
grant select, delete on public.saved_jobs to authenticated;
grant insert (student_id, job_id) on public.saved_jobs to authenticated;
grant all on public.saved_jobs to service_role;
create policy "Students read own saved jobs" on public.saved_jobs for select to authenticated
  using (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');
create policy "Students save active jobs" on public.saved_jobs for insert to authenticated
  with check (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student'
    and exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active'));
create policy "Students unsave own jobs" on public.saved_jobs for delete to authenticated
  using (student_id = (select auth.uid()) and (select private.current_verified_role()) = 'student');

-- Avoid jobs -> applications -> jobs RLS recursion. Identity is always auth.uid().
create function private.student_has_job(target_job uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.applications where job_id = target_job and applicant_id = (select auth.uid()))
    or exists (select 1 from public.saved_jobs where job_id = target_job and student_id = (select auth.uid()));
$$;
revoke all on function private.student_has_job(uuid) from public, anon;
grant execute on function private.student_has_job(uuid) to authenticated;
create policy "Students read their closed jobs" on public.jobs for select to authenticated
  using (status = 'closed' and (select private.current_verified_role()) = 'student'
    and private.student_has_job(id));
