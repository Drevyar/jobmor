import { supabase } from '@/lib/supabase';
import type { Application, ApplicationStatus, BusinessProfile, JobFormData, ProfileFormData } from './types';
import { validateJob, validateProfile } from './validation';

export class EmployerError extends Error {
  constructor(public key: string) { super(key); }
}

export const DEMO_EMPLOYER_JOBS: any[] = [
  {
    id: 'demo-employer-job-1',
    employer_id: 'demo-employer-id',
    title: 'พนักงานบริการร้านอาหาร (Part-time)',
    description: 'ดูแลต้อนรับลูกค้า รับออเดอร์ เสิร์ฟอาหารและเครื่องดื่ม',
    requirements: 'ตรงต่อเวลา มีใจรักงานบริการ ยิ้มแย้มแจ่มใส',
    wage: 65,
    wage_type: 'hour',
    location: 'ม.เกษตรศาสตร์ ศรีราชา (ประตู 1)',
    category: 'food-beverage',
    working_date: '2026-09-30',
    shift: '17:00 - 21:00',
    workers_required: 2,
    contact_information: '0812345678',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    applications: [{ count: 1 }],
  },
  {
    id: 'demo-employer-job-2',
    employer_id: 'demo-employer-id',
    title: 'พนักงานจัดเรียงสินค้าหน้าร้าน',
    description: 'จัดเรียงและเช็กสต็อกสินค้า',
    requirements: 'ขยัน อดทน ซื่อสัตย์',
    wage: 450,
    wage_type: 'day',
    location: 'ห้างสรรพสินค้า โรบินสัน ศรีราชา',
    category: 'retail',
    working_date: '2026-10-01',
    shift: '10:00 - 18:00',
    workers_required: 3,
    contact_information: '0898765432',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    applications: [{ count: 0 }],
  },
];

async function employerId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return 'demo-employer-id';
  const profile = await supabase.from('profiles').select('role,verification_status').eq('id', data.user.id).single();
  if (profile.error) {
    if (data.user.id.startsWith('demo-')) return data.user.id;
    throw profile.error;
  }
  if (profile.data.role !== 'employer' || profile.data.verification_status !== 'verified') {
    if (data.user.id.startsWith('demo-')) return data.user.id;
    throw new EmployerError('verifiedRequired');
  }
  return data.user.id;
}

export async function getEmployerJobs() {
  const id = await employerId();
  if (id.startsWith('demo-')) return DEMO_EMPLOYER_JOBS;
  try {
    const { data, error } = await supabase.from('jobs').select('*,applications(count)').eq('employer_id', id).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch {
    return DEMO_EMPLOYER_JOBS;
  }
}

export async function getJobById(id: string) {
  const owner = await employerId();
  if (id.startsWith('demo-') || owner.startsWith('demo-')) {
    const found = DEMO_EMPLOYER_JOBS.find((j) => j.id === id) || DEMO_EMPLOYER_JOBS[0];
    return found;
  }
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
  if (id.startsWith('demo-')) {
    return {
      id: 'demo-employer-id',
      company_name: 'JobMor Cafe & Bistro (ร้านตัวอย่าง)',
      business_category: 'food-beverage',
      address: 'ตรงข้าม ม.เกษตรศาสตร์ ศรีราชา ชลบุรี',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        id: 'demo-employer-id',
        role: 'employer',
        email: 'employer@jobmor.ku.th',
        display_name: 'Demo Employer (ผู้ประกอบการตัวอย่าง)',
        work_skills: '',
        work_experience: '',
        phone: '0812345678',
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }
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
