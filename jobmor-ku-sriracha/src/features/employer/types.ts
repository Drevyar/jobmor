import type { Tables } from '@/types/database.generated';

export type Job = Tables<'jobs'>;
export type JobStatus = 'active' | 'closed' | 'draft';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type JobFormData = Omit<Job, 'id' | 'employer_id' | 'created_at' | 'updated_at' | 'wage' | 'workers_required'> & {
  wage: string;
  workers_required: string;
};
export type JobSummary = Job & { applications: { count: number }[] };
export type Application = Tables<'applications'> & {
  profiles: Pick<Tables<'profiles'>, 'id' | 'display_name' | 'email' | 'phone'> | null;
};
export type BusinessProfile = Tables<'employer_profiles'> & { profiles: Tables<'profiles'> };
export type ProfileFormData = {
  contact_name: string;
  contact_phone: string;
  company: string;
  category: string;
  company_address: string;
};
