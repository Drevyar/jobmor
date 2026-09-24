import { supabase } from '@/lib/supabase';
import { AiError, validWindow } from '../../../supabase/functions/_shared/ai-contracts';
import type { TimeWindow } from '../../../supabase/functions/_shared/ai-contracts';
async function studentId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AiError('unauthorized');
  const profile = await supabase.from('profiles').select('role,verification_status').eq('id', data.user.id).single();
  if (profile.error || profile.data.role !== 'student' || profile.data.verification_status !== 'verified') throw new AiError('forbidden');
  return data.user.id;
}
export async function getWorkContext() {
  const id = await studentId();
  const [profile, windows] = await Promise.all([
    supabase.from('profiles').select('work_skills,work_experience').eq('id', id).single(),
    supabase.from('student_availability').select('*').eq('student_id', id).gte('ends_at', new Date().toISOString()).order('starts_at').limit(100),
  ]);
  if (profile.error || windows.error) throw new AiError('unavailable');
  return { profile: profile.data, windows: windows.data };
}
export async function saveWorkContext(skills: string, experience: string) {
  if (skills.length > 1000 || experience.length > 3000) throw new AiError('invalidWork');
  const id = await studentId();
  const { error } = await supabase.from('profiles').update({ work_skills: skills.trim(), work_experience: experience.trim() }).eq('id', id).select('id').single();
  if (error) throw new AiError('unavailable');
}
export async function addAvailability(window: TimeWindow) {
  if (!validWindow(window) || Date.parse(window.endsAt) <= Date.now()) throw new AiError('invalidShift');
  const id = await studentId();
  const { error } = await supabase.from('student_availability').insert({ student_id: id, starts_at: window.startsAt, ends_at: window.endsAt });
  if (error && error.code !== '23505') throw new AiError('unavailable');
}
export async function removeAvailability(id: string) {
  const student = await studentId();
  const { error } = await supabase.from('student_availability').delete().eq('id', id).eq('student_id', student).select('id').single();
  if (error) throw new AiError('unavailable');
}
