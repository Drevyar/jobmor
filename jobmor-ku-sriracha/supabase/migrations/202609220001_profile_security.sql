-- NOT VALID preserves legacy records while enforcing constraints on new writes.
-- Review existing violations before VALIDATE CONSTRAINT; never truncate user data.
alter table public.profiles
  add constraint profiles_display_name_length check (length(trim(display_name)) <= 160) not valid,
  add constraint profiles_phone_length check (length(trim(phone)) <= 20) not valid,
  add constraint employer_phone_format check (role <> 'employer' or trim(phone) ~ '^\+?[0-9 ()-]{8,20}$') not valid;
alter table public.employer_profiles
  add constraint company_name_length check (length(trim(company_name)) <= 160) not valid,
  add constraint business_category_length check (length(trim(business_category)) <= 100) not valid,
  add constraint company_address_length check (length(trim(address)) <= 1000) not valid;

-- Auth email changes must preserve the student identity rule and public contact data.
create function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email then
    if exists (select 1 from public.profiles where id = new.id and role = 'student')
       and (new.email is null or lower(new.email) !~ '^[a-z0-9._%+\-]+@ku\.th$') then
      raise exception 'Student accounts require a ku.th email address' using errcode = '23514';
    end if;
    update public.profiles set email = lower(new.email) where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- Suspended/pending accounts retain their own read access, but cannot edit profiles.
alter policy "Users can update their own safe profile fields" on public.profiles
  using ((select auth.uid()) = id and (select private.current_verified_role()) is not null)
  with check ((select auth.uid()) = id and (select private.current_verified_role()) is not null);
alter policy "Employers can update their own business profile" on public.employer_profiles
  using ((select auth.uid()) = id and (select private.current_verified_role()) = 'employer')
  with check ((select auth.uid()) = id and (select private.current_verified_role()) = 'employer');
