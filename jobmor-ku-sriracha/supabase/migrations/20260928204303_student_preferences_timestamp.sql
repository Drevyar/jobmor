create trigger student_job_preferences_set_updated_at
  before update on public.student_job_preferences
  for each row execute function public.set_updated_at();
