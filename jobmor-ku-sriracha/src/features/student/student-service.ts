import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.generated';
import { validateStudentProfile } from './validation';

export class StudentError extends Error {
  constructor(public key: string) { super(key); }
}
export type StudentJob = Tables<'jobs'> & { application: Tables<'applications'> | null; saved: boolean };

async function studentId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new StudentError('signInRequired');
  const profile = await supabase.from('profiles').select('role,verification_status').eq('id', data.user.id).single();
  if (profile.error) throw profile.error;
  if (profile.data.role !== 'student' || profile.data.verification_status !== 'verified') {
    throw new StudentError('verifiedRequired');
  }
  return data.user.id;
}

export async function getStudentCollection() {
  const id = await studentId();
  const [jobs, applications, saved] = await Promise.all([
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    supabase.from('applications').select('*').eq('applicant_id', id),
    supabase.from('saved_jobs').select('job_id').eq('student_id', id),
  ]);
  if (jobs.error) throw jobs.error;
  if (applications.error) throw applications.error;
  if (saved.error) throw saved.error;
  const byJob = new Map((applications.data ?? []).map((item) => [item.job_id, item]));
  const savedIds = new Set(saved.data.map((item) => item.job_id));
  const visibleIds = new Set((jobs.data ?? []).map((job) => job.id));
  return {
    jobs: (jobs.data ?? []).map((job) => ({ ...job, application: byJob.get(job.id) ?? null, saved: savedIds.has(job.id) })),
    unavailable: [...new Set([...byJob.keys(), ...savedIds])].filter((targetId) => !visibleIds.has(targetId)).map((targetId) => ({
      id: targetId, status: null, application: byJob.get(targetId) ?? null, saved: savedIds.has(targetId),
    })),
  };
}

export async function getStudentJobs(): Promise<StudentJob[]> {
  return (await getStudentCollection()).jobs;
}

export async function getStudentJob(id: string) {
  const owner = await studentId();
  const { data: job, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!job) throw new StudentError('jobNotFound');
  const [application, saved] = await Promise.all([
    supabase.from('applications').select('*').eq('job_id', id).eq('applicant_id', owner).maybeSingle(),
    supabase.from('saved_jobs').select('job_id').eq('job_id', id).eq('student_id', owner).maybeSingle(),
  ]);
  if (application.error) throw application.error;
  if (saved.error) throw saved.error;
  return { ...job, application: application.data, saved: !!saved.data };
}

export async function applyForJob(jobId: string) {
  const id = await studentId();
  const { data, error } = await supabase.from('applications').insert({ job_id: jobId, applicant_id: id }).select().single();
  if (error?.code === '23505') throw new StudentError('duplicate');
  if (error) throw error;
  return data;
}

export async function withdrawApplication(applicationId: string) {
  const id = await studentId();
  const { data, error } = await supabase.from('applications').delete().eq('id', applicationId)
    .eq('applicant_id', id).eq('status', 'pending').select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new StudentError('cannotWithdraw');
}

export async function setJobSaved(jobId: string, saved: boolean) {
  const id = await studentId();
  const { error } = saved
    ? await supabase.from('saved_jobs').insert({ student_id: id, job_id: jobId })
    : await supabase.from('saved_jobs').delete().eq('student_id', id).eq('job_id', jobId);
  // Saving an already saved job is idempotent; the primary key enforces uniqueness.
  if (error && !(saved && error.code === '23505')) throw error;
}

export async function getStudentProfile() {
  const id = await studentId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateStudentProfile(form: { display_name: string; phone: string }) {
  const validation = validateStudentProfile(form);
  if (validation) throw new StudentError(validation);
  const id = await studentId();
  const { data, error } = await supabase.from('profiles').update({ display_name: form.display_name.trim(), phone: form.phone.trim() })
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function submitJobReport(jobId: string, reason: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new StudentError('session');
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: 'job',
    target_id: jobId,
    reason: reason.trim(),
  });
  if (error) throw error;
}
