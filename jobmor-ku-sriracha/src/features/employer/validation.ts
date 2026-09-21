import type { JobFormData, ProfileFormData } from './types';

export const emptyJob: JobFormData = {
  title: '', description: '', requirements: '', wage: '', wage_type: 'day',
  location: '', category: '', working_date: '', shift: '', workers_required: '1',
  contact_information: '', status: 'draft',
};

export function validateJob(form: JobFormData): string | null {
  const limits = { title: 160, description: 10000, location: 500, category: 100, shift: 200, contact_information: 500 } as const;
  for (const [key, limit] of Object.entries(limits)) {
    const value = form[key as keyof typeof limits].trim();
    if (!value || value.length > limit) return 'required';
  }
  if (form.requirements.length > 5000) return 'required';
  if (!/^\d+(\.\d{1,2})?$/.test(form.wage) || Number(form.wage) <= 0 || Number(form.wage) > 99999999.99) return 'invalidWage';
  if (!/^\d+$/.test(form.workers_required) || Number(form.workers_required) < 1 || Number(form.workers_required) > 10000) return 'invalidWorkers';
  const date = new Date(`${form.working_date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.working_date) || !Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1 || date.toISOString().slice(0, 10) !== form.working_date) return 'invalidDate';
  if (!['active', 'closed', 'draft'].includes(form.status) || !['hour', 'day', 'month', 'job'].includes(form.wage_type)) return 'required';
  return null;
}

export function validateProfile(form: ProfileFormData): string | null {
  if (!form.contact_name.trim() || form.contact_name.trim().length > 160 ||
      !form.company.trim() || form.company.trim().length > 160 ||
      !form.category.trim() || form.category.trim().length > 100 ||
      !form.company_address.trim() || form.company_address.trim().length > 1000) return 'required';
  if (!/^\+?[0-9 ()-]{8,20}$/.test(form.contact_phone.trim())) return 'invalidPhone';
  return null;
}
