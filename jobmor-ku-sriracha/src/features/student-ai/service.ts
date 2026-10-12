import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AiError, isRecord, isUuid, textList } from '../../../supabase/functions/_shared/ai-contracts';
import type { StudentJob as RecommendedJob } from '../../../supabase/functions/_shared/student-recommendations';

export type Recommendation = { job: RecommendedJob; reasons: string[]; availability?: 'available'|'unknown'; status?: string };
export type QuickResult = { kind:'quickmatch'; job:RecommendedJob|null; reasons:string[]; availability:'available'|'unknown'; needsProfile:boolean; missing:{availability:boolean;skills:boolean} };
export type RadarResult = { kind:'radar'; items:Recommendation[]; missing:{availability:boolean;skills:boolean} };
export type DiscoveryResult = { kind:'discover'; needsExperience:boolean; inferredSkills:{skill:string;evidence:string}[]; jobCategories:{category:string;reasons:string[]}[] };
type Result = QuickResult|RadarResult|DiscoveryResult|{kind:'skip'};
const codes = ['unauthorized','forbidden','invalidRequest','notConfigured','rateLimited','providerUnavailable','invalidOutput','unavailable','tooManyRecords','refused'];
function validJob(v: unknown): v is RecommendedJob {
  return isRecord(v) && isUuid(v.id) && typeof v.title==='string' && typeof v.category==='string' && typeof v.location==='string' && typeof v.wage==='number' && typeof v.wage_type==='string' && typeof v.working_date==='string' && typeof v.shift==='string';
}
function missing(v: unknown): v is {availability:boolean;skills:boolean} { return isRecord(v) && typeof v.availability==='boolean' && typeof v.skills==='boolean'; }
// ส่ง action/language/jobId ไป Edge Function student-ai; backend อ่านข้อมูลและเรียก Gemini ตาม action
// ตรวจรูปแบบ response ก่อนคืนให้ panels.tsx; action skip บันทึกการข้ามงานโดยไม่เรียก AI
export async function studentAi(action: 'quickmatch'|'radar'|'discover'|'skip', language:'en'|'th', jobId?:string, signal?:AbortSignal): Promise<Result> {
  const auth=await supabase.auth.getUser(); if(auth.error || !auth.data.user) throw new AiError('unauthorized');
  const {data,error}=await supabase.functions.invoke('student-ai',{body:{action,language,...(jobId?{jobId}:{})},signal});
  if(error) {
    let code='unavailable';
    if(error instanceof FunctionsHttpError) try { const body:unknown=await error.context.json(); if(isRecord(body) && typeof body.error==='string' && codes.includes(body.error)) code=body.error; } catch { /* gateway response */ }
    throw new AiError(code);
  }
  if(!isRecord(data) || data.kind!==action) throw new AiError('invalidOutput');
  if(action==='skip') return {kind:'skip'};
  if(action==='quickmatch') {
    if(data.kind!=='quickmatch' || (data.job!==null && !validJob(data.job)) || !textList(data.reasons) || !['available','unknown'].includes(String(data.availability)) || typeof data.needsProfile!=='boolean' || !missing(data.missing)) throw new AiError('invalidOutput');
    return {kind:'quickmatch',job:data.job as RecommendedJob|null,reasons:data.reasons,availability:data.availability as 'available'|'unknown',needsProfile:data.needsProfile,missing:data.missing};
  }
  if(action==='radar') {
    if(data.kind!=='radar' || !missing(data.missing) || !Array.isArray(data.items) || data.items.length>5) throw new AiError('invalidOutput');
    const items=data.items.map((item:unknown) => { if(!isRecord(item)||!validJob(item.job)||!textList(item.reasons)||typeof item.status!=='string') throw new AiError('invalidOutput'); return {job:item.job,reasons:item.reasons,status:item.status}; });
    return {kind:'radar',items,missing:data.missing};
  }
  if(data.kind!=='discover'||typeof data.needsExperience!=='boolean'||!Array.isArray(data.inferredSkills)||!Array.isArray(data.jobCategories)||data.inferredSkills.length>6||data.jobCategories.length>6) throw new AiError('invalidOutput');
  const inferredSkills=data.inferredSkills.map((item:unknown)=>{ if(!isRecord(item)||typeof item.skill!=='string'||typeof item.evidence!=='string') throw new AiError('invalidOutput'); return {skill:item.skill,evidence:item.evidence}; });
  const jobCategories=data.jobCategories.map((item:unknown)=>{ if(!isRecord(item)||typeof item.category!=='string'||!textList(item.reasons)) throw new AiError('invalidOutput'); return {category:item.category,reasons:item.reasons}; });
  return {kind:'discover',needsExperience:data.needsExperience,inferredSkills,jobCategories};
}

export type PreferenceForm={preferred_category:string;preferred_area:string;minimum_wage:string;wage_type:string};
async function studentId() { const auth=await supabase.auth.getUser(); if(auth.error||!auth.data.user) throw new AiError('unauthorized'); const profile=await supabase.from('profiles').select('role,verification_status').eq('id',auth.data.user.id).single(); if(profile.error||profile.data.role!=='student'||profile.data.verification_status!=='verified') throw new AiError('forbidden'); return auth.data.user.id; }
// อ่าน student_job_preferences → คืนค่าเติมฟอร์มความสนใจงาน
export async function getPreferences():Promise<PreferenceForm> {
  const id=await studentId(); const result=await supabase.from('student_job_preferences').select('preferred_category,preferred_area,minimum_wage,wage_type').eq('student_id',id).maybeSingle();
  if(result.error) throw new AiError('unavailable');
  return {preferred_category:result.data?.preferred_category??'',preferred_area:result.data?.preferred_area??'',minimum_wage:String(result.data?.minimum_wage??0),wage_type:result.data?.wage_type??'hour'};
}
// รับความสนใจงาน → ตรวจค่า/แปลงค่าจ้าง → INSERT หรือ UPDATE student_job_preferences ของนิสิต
export async function savePreferences(form:PreferenceForm) {
  const id=await studentId(); const wage=Number(form.minimum_wage);
  if(form.preferred_category.length>100||form.preferred_area.length>100||!Number.isFinite(wage)||wage<0||wage>1000000||!['hour','day','month','job'].includes(form.wage_type)) throw new AiError('invalidRequest');
  const values={preferred_category:form.preferred_category.trim(),preferred_area:form.preferred_area.trim(),minimum_wage:wage,wage_type:form.wage_type};
  const current=await supabase.from('student_job_preferences').select('student_id').eq('student_id',id).maybeSingle();
  if(current.error) throw new AiError('unavailable');
  const result=current.data
    ? await supabase.from('student_job_preferences').update(values).eq('student_id',id)
    : await supabase.from('student_job_preferences').insert({student_id:id,...values});
  if(result.error) throw new AiError('unavailable');
}
// ส่งสถานะอ่านแล้ว/ซ่อน → UPDATE job_radar_recommendations ของนิสิตและงานนั้น
export async function updateRadarStatus(jobId:string,status:'seen'|'dismissed') {
  if(!isUuid(jobId)) throw new AiError('invalidRequest');
  const id=await studentId(); const result=await supabase.from('job_radar_recommendations').update({status}).eq('student_id',id).eq('job_id',jobId).select('job_id').maybeSingle();
  if(result.error||!result.data) throw new AiError('unavailable');
}
