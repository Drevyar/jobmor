import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.generated';

export class AdminServiceError extends Error {
  constructor(public key: string) { super(key); }
}

async function requireAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  if (!data) throw new AdminServiceError('accessRequired');
}

export type AdminDashboardMetrics = {
  students: number;
  employers: number;
  activeJobs: number;
  pendingEmailConfirmations: number;
  pendingReports: number;
};

export type AdminUserRecord = Pick<
  Tables<'profiles'>,
  'id' | 'email' | 'display_name' | 'role' | 'verification_status' | 'created_at'
>;

export type AdminJobRecord = {
  id: string;
  title: string;
  status: string;
  location: string;
  wage: number;
  wage_type: string;
  created_at: string;
  company_name: string;
};

export type AdminReportRecord = {
  id: string;
  reporter_name: string;
  reporter_email: string;
  target_type: 'job' | 'user';
  target_name: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
};

export async function loadAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  await requireAdmin();
  const [students, employers, activeJobs, pendingEmailConfirmations, pendingReports] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'employer'),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending_email'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  for (const result of [students, employers, activeJobs, pendingEmailConfirmations, pendingReports]) {
    if (result.error) throw result.error;
  }

  return {
    students: students.count ?? 0,
    employers: employers.count ?? 0,
    activeJobs: activeJobs.count ?? 0,
    pendingEmailConfirmations: pendingEmailConfirmations.count ?? 0,
    pendingReports: pendingReports.count ?? 0,
  };
}

export async function loadAdminUsers(): Promise<AdminUserRecord[]> {
  await requireAdmin();
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name,role,verification_status,created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function loadAdminJobs(): Promise<AdminJobRecord[]> {
  await requireAdmin();
  const [jobsResult, employersResult] = await Promise.all([
    supabase
      .from('jobs')
      .select('id,title,status,location,wage,wage_type,created_at,employer_id')
      .order('created_at', { ascending: false }),
    supabase.from('employer_profiles').select('id,company_name'),
  ]);

  if (jobsResult.error) throw jobsResult.error;
  if (employersResult.error) throw employersResult.error;

  const companyNames = new Map(employersResult.data.map((employer) => [employer.id, employer.company_name]));
  return jobsResult.data.map((job) => ({
    id: job.id,
    title: job.title,
    status: job.status,
    location: job.location,
    wage: job.wage,
    wage_type: job.wage_type,
    created_at: job.created_at,
    company_name: companyNames.get(job.employer_id) ?? '',
  }));
}

export async function setAdminUserSuspended(userId: string, suspended: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_suspended', {
    target_profile: userId,
    should_suspend: suspended,
  });
  if (error) throw error;
}

export async function loadAdminReports(): Promise<AdminReportRecord[]> {
  await requireAdmin();
  const [reportsResult, profilesResult, jobsResult] = await Promise.all([
    supabase
      .from('reports')
      .select('id,reporter_id,target_type,target_id,reason,status,created_at')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id,display_name,email'),
    supabase.from('jobs').select('id,title'),
  ]);

  if (reportsResult.error) {
    const code = 'code' in reportsResult.error ? reportsResult.error.code : undefined;
    if (code === '42P01' || code === 'PGRST205' || code === 'PGRST204') {
      throw new AdminServiceError('reportsSetupRequired');
    }
    throw reportsResult.error;
  }
  if (profilesResult.error) throw profilesResult.error;
  if (jobsResult.error) throw jobsResult.error;

  const profilesById = new Map(profilesResult.data.map((profile) => [profile.id, profile]));
  const jobTitles = new Map(jobsResult.data.map((job) => [job.id, job.title]));
  return reportsResult.data.map((report) => {
    const reporter = profilesById.get(report.reporter_id);
    const targetType = report.target_type === 'user' ? 'user' : 'job';
    const status = report.status === 'resolved' || report.status === 'dismissed' ? report.status : 'pending';
    return {
      id: report.id,
      reporter_name: reporter?.display_name ?? '',
      reporter_email: reporter?.email ?? '',
      target_type: targetType,
      target_name: targetType === 'job'
        ? jobTitles.get(report.target_id) ?? ''
        : profilesById.get(report.target_id)?.display_name ?? '',
      reason: report.reason,
      status,
      created_at: report.created_at,
    };
  });
}

export async function updateAdminReport(reportId: string, status: 'resolved' | 'dismissed'): Promise<void> {
  const { error } = await supabase.rpc('admin_update_report', {
    target_report: reportId,
    new_status: status,
  });
  if (error) throw error;
}
