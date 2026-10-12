import { supabase } from '@/lib/supabase';
import type { Application, ApplicationStatus, BusinessProfile, JobFormData, ProfileFormData } from './types';
import { validateJob, validateProfile } from './validation';
import {taggedJobTitle} from '../../../supabase/functions/_shared/urgent-job-tag';

export class EmployerError extends Error {
  constructor(public key: string) { super(key); }
}

async function employerId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new EmployerError('verifiedRequired');
  const profile = await supabase.from('profiles').select('role,verification_status').eq('id', data.user.id).single();
  if (profile.error) throw profile.error;
  if (profile.data.role !== 'employer' || profile.data.verification_status !== 'verified') {
    throw new EmployerError('verifiedRequired');
  }
  return data.user.id;
}

// อ่าน jobs ที่ employer_id ตรงกับบัญชีปัจจุบัน พร้อมจำนวน applications ของแต่ละงาน
export async function getEmployerJobs() {
  const id = await employerId();
  const { data, error } = await supabase.from('jobs').select('*,applications(count)').eq('employer_id', id).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// รับ jobId → อ่าน jobs โดยตรวจทั้ง id งานและ employer_id เพื่อจำกัดเป็นงานของตนเอง
export async function getJobById(id: string) {
  const owner = await employerId();
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).eq('employer_id', owner).maybeSingle();
  if (error) throw error;
  if (!data) throw new EmployerError('jobNotFound');
  return data;
}

// job-form-screen.tsx ส่ง form มาที่นี่ → validate → แปลงตัวเลข/ตัดช่องว่าง
// มี id = UPDATE jobs ของเจ้าของงาน; ไม่มี id = INSERT jobs พร้อม employer_id จาก Auth
// .select().single() คืนแถวที่บันทึก เพื่อให้หน้าฟอร์มใช้ job.id เปิดหน้าถัดไป
export async function saveJob(form: JobFormData, id?: string) {
  const validation = validateJob(form);
  if (validation) throw new EmployerError(validation);
  const owner = await employerId();
  // Explicit allowlist: never allow form data to change ownership or timestamps.
  // Demo urgency is a title tag; do not enable the historical native Push/instant DB fields.
  const values = {
    title: taggedJobTitle(form.title,!!form.is_urgent), description: form.description.trim(), requirements: form.requirements.trim(),
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

// รับ id จากหน้ารายการ → DELETE jobs โดยจำกัด employer_id เป็นเจ้าของปัจจุบัน
export async function deleteJob(id: string) {
  const owner = await employerId();
  const { data, error } = await supabase.from('jobs').delete().eq('id', id).eq('employer_id', owner).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new EmployerError('jobNotFound');
}

// ตรวจเจ้าของงาน → อ่าน applications และ JOIN profiles ผ่าน foreign key ของ applicant_id
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

// นายจ้างกดรับ/ปฏิเสธ → UPDATE applications.status โดยจำกัด id ใบสมัครและ job_id ที่เป็นเจ้าของ
export async function updateApplicationStatus(jobId: string, id: string, status: Exclude<ApplicationStatus, 'pending'>) {
  await getJobById(jobId);
  const { data, error } = await supabase.from('applications').update({ status })
    .eq('id', id).eq('job_id', jobId).select('id,status').maybeSingle();
  if (error) throw error;
  if (!data) throw new EmployerError('applicationNotFound');
  return data;
}

// อ่าน employer_profiles JOIN profiles เพื่อรวมข้อมูลบริษัทกับข้อมูลติดต่อในฟอร์มเดียว
export async function getEmployerProfile(): Promise<BusinessProfile> {
  const id = await employerId();
  const { data, error } = await supabase.from('employer_profiles').select('*,profiles!inner(*)').eq('id', id).single();
  if (error) throw error;
  return data;
}

// ส่ง form ให้ SQL RPC update_employer_profile ใน 20260921030908_employer_management.sql
// ฟังก์ชัน SQL อัปเดต profiles และ employer_profiles ใน transaction เดียวกัน
export async function updateEmployerProfile(form: ProfileFormData) {
  const validation = validateProfile(form);
  if (validation) throw new EmployerError(validation);
  await employerId();
  const { error } = await supabase.rpc('update_employer_profile', form);
  if (error) throw error;
}
