import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
import { AiError } from '../_shared/ai-contracts.ts';
import { callAiProvider } from '../_shared/ai-provider.ts';
import { createStudentHandler, studentAiInstructions } from '../_shared/student-handler.ts';
import type { RadarRecord } from '../_shared/student-handler.ts';
import { discoverySchema, recommendationsSchema } from '../_shared/student-recommendations.ts';
import type { Preferences, StudentContext, StudentJob } from '../_shared/student-recommendations.ts';

const key = Deno.env.get('GEMINI_API_KEY');
const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
// client ฝั่ง server ใช้ service role; authorize ตรวจผู้ใช้ และ context จำกัดข้อมูลส่วนตัวด้วย id นิสิต
function admin() {
  const url = Deno.env.get('SUPABASE_URL'); const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !secret) throw new AiError('notConfigured',503);
  return createClient(url,secret,{ auth: { persistSession:false, autoRefreshToken:false } });
}
function rows<T>(result: { data: T[] | null; error: unknown; count: number | null }): T[] {
  if (result.error || !result.data || result.count === null) throw new AiError('unavailable',503);
  if (result.count > result.data.length) throw new AiError('tooManyRecords',422);
  return result.data;
}
type Application = { job_id: string; applicant_id: string; status: string; jobs?: { working_date: string; shift: string } | null };
type Window = { starts_at: string; ends_at: string };
const handler = createStudentHandler({
  async authorize(token) {
    const client = admin();
    const auth = await client.auth.getUser(token.slice(7));
    if (auth.error || !auth.data.user) throw new AiError('unauthorized',401);
    const id = auth.data.user.id;
    const profile = await client.from('profiles').select('role,verification_status').eq('id',id).single();
    if (profile.error || profile.data.role !== 'student' || profile.data.verification_status !== 'verified') throw new AiError('forbidden',403);
    return id;
  },
  async context(id): Promise<{ student: StudentContext; jobs: StudentJob[] }> {
    const client = admin();
    const [profile,prefs,availability,jobs,ownApps,accepted,skipped] = await Promise.all([
      client.from('profiles').select('work_skills,work_experience').eq('id',id).single(),
      client.from('student_job_preferences').select('preferred_category,preferred_area,minimum_wage,wage_type').eq('student_id',id).maybeSingle<Preferences>(),
      client.from('student_availability').select('starts_at,ends_at',{count:'exact'}).eq('student_id',id).gte('ends_at',new Date().toISOString()).limit(1000).returns<Window[]>(),
      client.from('jobs').select('id,title,description,requirements,category,location,wage,wage_type,working_date,shift,workers_required,status,created_at,is_urgent',{count:'exact'}).eq('status','active').limit(500).returns<StudentJob[]>(),
      client.from('applications').select('job_id,applicant_id,status,jobs!inner(working_date,shift)',{count:'exact'}).eq('applicant_id',id).limit(1000).returns<Application[]>(),
      client.from('applications').select('job_id,applicant_id,status',{count:'exact'}).eq('status','accepted').limit(5000).returns<Application[]>(),
      client.from('student_job_interactions').select('job_id,interaction_type',{count:'exact'}).eq('student_id',id).limit(1000).returns<{job_id:string;interaction_type:string}[]>(),
    ]);
    if (profile.error || prefs.error || !profile.data) throw new AiError('unavailable',503);
    const windows=rows(availability), jobRows=rows(jobs), own=rows(ownApps), allAccepted=rows(accepted), history=rows(skipped);
    const counts = new Map<string,number>();
    for (const item of allAccepted) counts.set(item.job_id,(counts.get(item.job_id)??0)+1);
    return { jobs:jobRows,student: {
      skills:profile.data.work_skills, experience:profile.data.work_experience,
      windows:windows.map(w => ({startsAt:w.starts_at,endsAt:w.ends_at})),
      preferences:prefs.data ?? { preferred_category:'',preferred_area:'',minimum_wage:0,wage_type:'hour' },
      applied:new Set(own.map(a=>a.job_id)),
      skipped:new Set(history.filter(h=>h.interaction_type==='skipped').map(h=>h.job_id)),
      accepted:own.filter(a=>a.status==='accepted').map(a=>({jobId:a.job_id,working_date:a.jobs?.working_date??'',shift:a.jobs?.shift??''})),
      acceptedCount:counts,
    }};
  },
  async budget(id) {
    const {data,error}=await admin().rpc('consume_student_ai_budget',{target_student:id});
    if(error) throw new AiError('unavailable',503);
    return data===true;
  },
  async generate(action,language,data) {
    if(!key?.trim() || !model.trim()) throw new AiError('notConfigured',503);
    return callAiProvider({key,model,action,language,data,
      schema:action==='discover'?discoverySchema:recommendationsSchema,
      instructions:studentAiInstructions});
  },
  async skip(id,jobId) {
    const result=await admin().from('student_job_interactions').upsert({student_id:id,job_id:jobId,interaction_type:'skipped'},{onConflict:'student_id,job_id'});
    if(result.error) throw new AiError('unavailable',503);
  },
  async radarRead(id): Promise<RadarRecord[]> {
    const result=await admin().from('job_radar_recommendations').select('job_id,reasons,status',{count:'exact'}).eq('student_id',id).order('created_at',{ascending:false}).limit(200).returns<RadarRecord[]>();
    return rows(result);
  },
  async radarSave(id,items) {
    if(!items.length) return;
    const result=await admin().from('job_radar_recommendations').upsert(items.map(item=>({...item,student_id:id})),{onConflict:'student_id,job_id',ignoreDuplicates:true});
    if(result.error) throw new AiError('unavailable',503);
  },
});
// เปิด endpoint student-ai ให้คำขอจากแอปเข้าสู่ handler
Deno.serve(handler);
