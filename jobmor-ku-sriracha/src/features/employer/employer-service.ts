import { supabase } from '@/lib/supabase';
import type { Application, ApplicationStatus, BusinessProfile, JobFormData, ProfileFormData } from './types';
import { validateJob, validateProfile } from './validation';

export class EmployerError extends Error {
  constructor(public key: string) { super(key); }
}

async function employerId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new EmployerError('signInRequired');
  const profile = await supabase.from('profiles').select('role,verification_status').eq('id', data.user.id).single();
  if (profile.error) throw profile.error;
  if (profile.data.role !== 'employer' || profile.data.verification_status !== 'verified') throw new EmployerError('verifiedRequired');
  return data.user.id;
}

export async function getEmployerJobs() {
  const id = await employerId();
  const { data, error } = await supabase.from('jobs').select('*,applications(count)').eq('employer_id', id).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getJobById(id: string) {
  const owner = await employerId();
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).eq('employer_id', owner).maybeSingle();
  if (error) throw error;
  if (!data) throw new EmployerError('jobNotFound');
  return data;
}

export async function saveJob(form: JobFormData, id?: string) {
  const validation = validateJob(form);
  if (validation) throw new EmployerError(validation);
  const owner = await employerId();
  // Explicit allowlist: never allow form data to change ownership or timestamps.
  const values = {
    title: form.title.trim(), description: form.description.trim(), requirements: form.requirements.trim(),
    wage: Number(form.wage), wage_type: form.wage_type, location: form.location.trim(),
    category: form.category.trim(), working_date: form.working_date, shift: form.shift.trim(),
    workers_required: Number(form.workers_required), contact_information: form.contact_information.trim(), status: form.status,
  };
  const query = id
    ? supabase.from('jobs').update(values).eq('id', id).eq('employer_id', owner)
    : supabase.from('jobs').insert({ ...values, employer_id: owner });
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteJob(id: string) {
  const owner = await employerId();
  const { data, error } = await supabase.from('jobs').delete().eq('id', id).eq('employer_id', owner).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new EmployerError('jobNotFound');
}

export async function getApplicantsByJob(jobId: string): Promise<Application[]> {
  await getJobById(jobId);
  const { data, error } = await supabase.from('applications')
    .select('*,profiles!applications_applicant_id_fkey(id,display_name,email,phone)')
    .eq('job_id', jobId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getApplicationById(jobId: string, id: string): Promise<Application> {
  await getJobById(jobId);
  const { data, error } = await supabase.from('applications')
    .select('*,profiles!applications_applicant_id_fkey(id,display_name,email,phone)')
    .eq('job_id', jobId).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new EmployerError('applicationNotFound');
  return data;
}

export async function updateApplicationStatus(jobId: string, id: string, status: Exclude<ApplicationStatus, 'pending'>) {
  await getJobById(jobId);
  const { data, error } = await supabase.from('applications').update({ status })
    .eq('id', id).eq('job_id', jobId).select('id,status').maybeSingle();
  if (error) throw error;
  if (!data) throw new EmployerError('applicationNotFound');
  return data;
}

export async function getEmployerProfile(): Promise<BusinessProfile> {
  const id = await employerId();
  const { data, error } = await supabase.from('employer_profiles').select('*,profiles!inner(*)').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateEmployerProfile(form: ProfileFormData) {
  const validation = validateProfile(form);
  if (validation) throw new EmployerError(validation);
  await employerId();
  const { error } = await supabase.rpc('update_employer_profile', form);
  if (error) throw error;
}
