create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('job', 'user')),
  target_id uuid not null,
  reason text not null check (length(trim(reason)) between 10 and 2000),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_status_created_idx on public.reports(status, created_at desc);
create index reports_reporter_created_idx on public.reports(reporter_id, created_at desc);
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

create function private.validate_report_target() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.target_type = 'job' and not exists (select 1 from public.jobs where id = new.target_id) then
    raise exception 'Job target not found' using errcode = '23503';
  end if;
  if new.target_type = 'user' and not exists (select 1 from public.profiles where id = new.target_id) then
    raise exception 'User target not found' using errcode = '23503';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_report_target() from public, anon, authenticated;
create trigger reports_validate_target
  before insert on public.reports
  for each row execute function private.validate_report_target();

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant select, insert on public.reports to authenticated;
grant all on public.reports to service_role;

create policy "Users can submit reports for valid targets"
  on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid()) and
    (target_type <> 'user' or reporter_id <> target_id) and
    status = 'pending' and
    resolved_by is null and
    resolved_at is null and
    (select private.current_verified_role()) is not null
  );

create policy "Users can read their own reports"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()));

create policy "Admins can read all reports"
  on public.reports for select to authenticated
  using ((select public.is_admin()));

create function public.admin_set_user_suspended(target_profile uuid, should_suspend boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if target_profile = (select auth.uid()) then
    raise exception 'Admins cannot suspend their own account' using errcode = '22023';
  end if;

  update public.profiles as profile
  set verification_status = case
        when should_suspend then 'suspended'::public.verification_status
        when exists (
          select 1 from auth.users as auth_user
          where auth_user.id = profile.id and auth_user.email_confirmed_at is not null
        ) then 'verified'::public.verification_status
        else 'pending_email'::public.verification_status
      end
  where profile.id = target_profile and profile.role in ('student', 'employer');

  if not found then
    raise exception 'Student or employer profile not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.admin_set_user_suspended(uuid, boolean) from public;
grant execute on function public.admin_set_user_suspended(uuid, boolean) to authenticated;

create function public.admin_update_report(target_report uuid, new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if new_status not in ('resolved', 'dismissed') then
    raise exception 'Invalid report status' using errcode = '22023';
  end if;

  update public.reports
  set status = new_status,
      resolved_by = (select auth.uid()),
      resolved_at = now()
  where id = target_report and status = 'pending';

  if not found then
    raise exception 'Pending report not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.admin_update_report(uuid, text) from public;
grant execute on function public.admin_update_report(uuid, text) to authenticated;
