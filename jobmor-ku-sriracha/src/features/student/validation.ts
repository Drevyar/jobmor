export function validateStudentProfile(form: { display_name: string; phone: string }) {
  // Match profiles CHECK constraints; do not invent additional student fields/limits.
  return form.display_name.trim() && form.phone.trim() ? null : 'required';
}

export function canWithdraw(status: string | undefined) {
  return status === 'pending';
}

export function filterJobs<T extends { title: string; description: string; category: string; location: string; shift: string; working_date: string; wage: number }>(
  jobs: T[], filters: { search: string; category: string; date: string; area: string; time: string; wage: string },
) {
  const includes = (value: string, query: string) => value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  return jobs.filter(job => includes(`${job.title} ${job.description} ${job.category} ${job.location}`, filters.search)
    && (!filters.category || job.category === filters.category)
    && includes(job.working_date, filters.date) && includes(job.location, filters.area)
    && includes(job.shift, filters.time) && (!filters.wage || job.wage >= Number(filters.wage)));
}
