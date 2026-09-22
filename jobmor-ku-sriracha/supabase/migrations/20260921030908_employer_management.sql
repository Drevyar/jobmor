-- Extend the existing identity model; no duplicate employer or student entities.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- RLS role lookup must not recurse through profiles -> applications -> jobs.
-- No caller-supplied identity; this only exposes the current account's verified role.
create function private.current_verified_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles
  where id = (select auth.uid()) and verification_status = 'verified';
$$;
revoke all on function private.current_verified_role() from public;
grant execute on function private.current_verified_role() to authenticated;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null check (length(trim(description)) between 1 and 10000),
  requirements text not null default '' check (length(requirements) <= 5000),
  wage numeric(10,2) not null check (wage > 0),
  wage_type text not null check (wage_type in ('hour','day','month','job')),
  location text not null check (length(trim(location)) between 1 and 500),
  category text not null check (length(trim(category)) between 1 and 100),
  working_date date not null,
  shift text not null check (length(trim(shift)) between 1 and 200),
  workers_required integer not null check (workers_required between 1 and 10000),
  contact_information text not null check (length(trim(contact_information)) between 1 and 500),
  status text not null default 'draft' check (status in ('active','closed','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_employer_created_idx on public.jobs(employer_id, created_at desc);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '' check (length(message) <= 5000),
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, applicant_id)
);
create index applications_applicant_idx on public.applications(applicant_id);
create index applications_job_status_idx on public.applications(job_id,status);
create trigger jobs_set_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;
alter table public.applications enable row level security;
revoke all on public.jobs, public.applications from anon, authenticated;
grant select, delete on public.jobs to authenticated;
grant insert (employer_id,title,description,requirements,wage,wage_type,location,category,working_date,shift,workers_required,contact_information,status),
  update (title,description,requirements,wage,wage_type,location,category,working_date,shift,workers_required,contact_information,status)
  on public.jobs to authenticated;
grant select on public.applications to authenticated;
grant insert (job_id,applicant_id,message), update(status) on public.applications to authenticated;
grant all on public.jobs, public.applications to service_role;

create policy "Employers read own jobs" on public.jobs for select to authenticated
  using (employer_id = (select auth.uid()) and (select private.current_verified_role()) = 'employer');
create policy "Students read active jobs" on public.jobs for select to authenticated
  using (status = 'active' and (select private.current_verified_role()) = 'student');
create policy "Employers create own jobs" on public.jobs for insert to authenticated
  with check (employer_id = (select auth.uid()) and (select private.current_verified_role()) = 'employer');
create policy "Employers update own jobs" on public.jobs for update to authenticated
  using (employer_id = (select auth.uid()) and (select private.current_verified_role()) = 'employer')
  with check (employer_id = (select auth.uid()) and (select private.current_verified_role()) = 'employer');
create policy "Employers delete own jobs" on public.jobs for delete to authenticated
  using (employer_id = (select auth.uid()) and (select private.current_verified_role()) = 'employer');

create policy "Students read own applications" on public.applications for select to authenticated
  using (applicant_id = (select auth.uid()));
create policy "Students apply to active jobs" on public.applications for insert to authenticated
  with check (applicant_id = (select auth.uid()) and (select private.current_verified_role()) = 'student'
    and status = 'pending' and exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active'));
create policy "Employers read job applications" on public.applications for select to authenticated
  using ((select private.current_verified_role()) = 'employer' and exists
    (select 1 from public.jobs j where j.id = job_id and j.employer_id = (select auth.uid())));
create policy "Employers decide job applications" on public.applications for update to authenticated
  using ((select private.current_verified_role()) = 'employer' and exists
    (select 1 from public.jobs j where j.id = job_id and j.employer_id = (select auth.uid())))
  with check ((select private.current_verified_role()) = 'employer' and exists
    (select 1 from public.jobs j where j.id = job_id and j.employer_id = (select auth.uid())));
create policy "Employers read their applicants profiles" on public.profiles for select to authenticated
  using ((select private.current_verified_role()) = 'employer' and exists
    (select 1 from public.applications a join public.jobs j on j.id = a.job_id
     where a.applicant_id = profiles.id and j.employer_id = (select auth.uid())));

-- Save both existing profile rows atomically using caller permissions and RLS.
create function public.update_employer_profile(
  contact_name text, contact_phone text, company text, category text, company_address text
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if (select private.current_verified_role()) is distinct from 'employer'::public.app_role then
    raise exception 'Verified employer account required' using errcode = '42501';
  end if;
  if length(trim(contact_name)) not between 1 and 160 or
     contact_phone !~ '^\+?[0-9 ()-]{8,20}$' or
     length(trim(company)) not between 1 and 160 or
     length(trim(category)) not between 1 and 100 or
     length(trim(company_address)) not between 1 and 1000 then
    raise exception 'Invalid profile fields' using errcode = '22023';
  end if;
  update public.profiles set display_name = trim(contact_name), phone = trim(contact_phone)
    where id = (select auth.uid());
  if not found then raise exception 'Profile not found'; end if;
  update public.employer_profiles set company_name = trim(company), business_category = trim(category), address = trim(company_address)
    where id = (select auth.uid());
  if not found then raise exception 'Business profile not found'; end if;
end;
$$;
revoke all on function public.update_employer_profile(text,text,text,text,text) from public;
grant execute on function public.update_employer_profile(text,text,text,text,text) to authenticated;
