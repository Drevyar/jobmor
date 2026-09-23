import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.generated';
import { validateStudentProfile } from './validation';

export class StudentError extends Error {
  constructor(public key: string) { super(key); }
}
export type StudentJob = Tables<'jobs'> & { application: Tables<'applications'> | null; saved: boolean };

export const DEMO_STUDENT_JOBS: StudentJob[] = [
  {
    id: 'demo-job-1',
    employer_id: 'demo-employer-id',
    title: 'พนักงานบริการร้านอาหาร (Part-time)',
    description: 'ดูแลต้อนรับลูกค้า รับออเดอร์ เสิร์ฟอาหารและเครื่องดื่ม ทำงานเป็นกะตามเวลาที่ตกลงกันได้',
    requirements: 'ตรงต่อเวลา มีใจรักงานบริการ ยิ้มแย้มแจ่มใส',
    wage: 65,
    wage_type: 'hour',
    location: 'ม.เกษตรศาสตร์ ศรีราชา (ประตู 1)',
    category: 'food-beverage',
    working_date: '2026-09-30',
    shift: '17:00 - 21:00',
    workers_required: 2,
    contact_information: 'Line: @demo_food / 0812345678',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    application: null,
    saved: false,
  },
  {
    id: 'demo-job-2',
    employer_id: 'demo-employer-id',
    title: 'พนักงานจัดเรียงสินค้าหน้าร้าน',
    description: 'จัดเรียงและเช็กสต็อกสินค้า ดูแลความเรียบร้อยของชั้นวางสินค้า',
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
    application: null,
    saved: true,
  },
  {
    id: 'demo-job-3',
    employer_id: 'demo-employer-id',
    title: 'Staff งานวิ่ง KU Sriracha Fun Run',
    description: 'ช่วยลงทะเบียนแจกเสื้อและเหรียญรางวัล ประจำจุดบริการน้ำดื่มตามเส้นทาง',
    requirements: 'มีความกระตือรือร้น ชอบกิจกรรมกลางแจ้ง',
    wage: 600,
    wage_type: 'job',
    location: 'สนามกีฬา ม.เกษตรศาสตร์ ศรีราชา',
    category: 'events',
    working_date: '2026-10-15',
    shift: '05:00 - 11:00',
    workers_required: 5,
    contact_information: 'kusriracha.events@gmail.com',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    application: null,
    saved: false,
  },
];

async function studentId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return 'demo-student-id';
  }
  const profile = await supabase.from('profiles').select('role,verification_status').eq('id', data.user.id).single();
  if (profile.error) {
    if (data.user.id.startsWith('demo-')) return data.user.id;
    throw profile.error;
  }
  if (profile.data.role !== 'student' || profile.data.verification_status !== 'verified') {
    if (data.user.id.startsWith('demo-')) return data.user.id;
    throw new StudentError('verifiedRequired');
  }
  return data.user.id;
}

export async function getStudentCollection() {
  const id = await studentId();
  if (id.startsWith('demo-')) {
    return {
      jobs: DEMO_STUDENT_JOBS,
      unavailable: [],
    };
  }
  try {
    const [jobs, applications, saved] = await Promise.all([
      supabase.from('jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('*').eq('applicant_id', id),
      supabase.from('saved_jobs').select('job_id').eq('student_id', id),
    ]);
    if (jobs.error) throw jobs.error;
    if (applications.error) throw applications.error;
    const savedData = saved.error ? [] : (saved.data ?? []);
    const byJob = new Map((applications.data ?? []).map((item) => [item.job_id, item]));
    const savedIds = new Set(savedData.map((item) => item.job_id));
    const visibleIds = new Set((jobs.data ?? []).map((job) => job.id));
    return {
      jobs: (jobs.data ?? []).map((job) => ({ ...job, application: byJob.get(job.id) ?? null, saved: savedIds.has(job.id) })),
      unavailable: [...new Set([...byJob.keys(), ...savedIds])].filter((targetId) => !visibleIds.has(targetId)).map((targetId) => ({
        id: targetId, status: null, application: byJob.get(targetId) ?? null, saved: savedIds.has(targetId),
      })),
    };
  } catch (_err) {
    return {
      jobs: DEMO_STUDENT_JOBS,
      unavailable: [],
    };
  }
}

export async function getStudentJobs(): Promise<StudentJob[]> {
  return (await getStudentCollection()).jobs;
}

export async function getStudentJob(id: string) {
  const owner = await studentId();
  if (id.startsWith('demo-') || owner.startsWith('demo-')) {
    const demoJob = DEMO_STUDENT_JOBS.find((j) => j.id === id) || DEMO_STUDENT_JOBS[0];
    return demoJob;
  }
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
  if (id.startsWith('demo-')) {
    return {
      id: 'demo-app-1',
      job_id: jobId,
      applicant_id: id,
      message: '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  const { data, error } = await supabase.from('applications').insert({ job_id: jobId, applicant_id: id }).select().single();
  if (error?.code === '23505') throw new StudentError('duplicate');
  if (error) throw error;
  return data;
}

export async function withdrawApplication(applicationId: string) {
  const id = await studentId();
  if (id.startsWith('demo-')) return;
  const { data, error } = await supabase.from('applications').delete().eq('id', applicationId)
    .eq('applicant_id', id).eq('status', 'pending').select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new StudentError('cannotWithdraw');
}

export async function setJobSaved(jobId: string, saved: boolean) {
  const id = await studentId();
  if (id.startsWith('demo-')) return;
  const { error } = saved
    ? await supabase.from('saved_jobs').insert({ student_id: id, job_id: jobId })
    : await supabase.from('saved_jobs').delete().eq('student_id', id).eq('job_id', jobId);
  // Saving an already saved job is idempotent; the primary key enforces uniqueness.
  if (error && !(saved && error.code === '23505')) throw error;
}

export async function getStudentProfile() {
  const id = await studentId();
  if (id.startsWith('demo-')) {
    return {
      id: 'demo-student-id',
      role: 'student' as const,
      email: 'student@jobmor.ku.th',
      display_name: 'Demo Student (นิสิตตัวอย่าง)',
      phone: '0812345678',
      verification_status: 'verified' as const,
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
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
