-- Admins can inspect real job records. Moderation writes remain unavailable
-- until a trusted moderation workflow is implemented.
create policy "Admins can read all jobs"
  on public.jobs
  for select
  to authenticated
  using ((select public.is_admin()));
