import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
import { createAiHandler } from '../_shared/ai-handler.ts';
import { AiError } from '../_shared/ai-contracts.ts';
import type { CandidateContext, JobContext } from '../_shared/ai-matching.ts';
import { callAiProvider } from '../_shared/ai-provider.ts';

const env = (name: string) => Deno.env.get(name);
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
function adminClient() {
  const url = env('SUPABASE_URL'); const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new AiError('notConfigured', 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
type ApplicationRow = { id: string; applicant_id: string; status: string };
type WorkProfile = { id: string; display_name: string; role: string; verification_status: string; work_skills: string; work_experience: string };
type AvailabilityRow = { student_id: string; starts_at: string; ends_at: string };
type CommitmentRow = { applicant_id: string; job_id: string; jobs: { working_date: string; shift: string } | null };

/** Reject truncated reads rather than falsely claiming no overlapping commitments. */
function rows<T>(result: { data: T[] | null; error: unknown; count: number | null }): T[] {
  if (result.error || !result.data || result.count === null) throw new AiError('unavailable', 503);
  if (result.count > result.data.length) throw new AiError('tooManyCandidates', 422);
  return result.data;
}
const handler = createAiHandler({
  configured: !!GEMINI_API_KEY?.trim() && !!GEMINI_MODEL.trim(),
  async authorize(token, jobId) {
    const admin = adminClient();
    const { data, error } = await admin.auth.getUser(token.slice(7));
    if (error || !data.user) throw new AiError('unauthorized', 401);
    const userId = data.user.id;
    const profile = await admin.from('profiles').select('role,verification_status').eq('id', userId).single();
    if (profile.error || profile.data.role !== 'employer' || profile.data.verification_status !== 'verified') throw new AiError('forbidden', 403);
    // Explicit ownership predicates are mandatory for every privileged lookup.
    const job = await admin.from('jobs').select('id,title,description,requirements,working_date,shift,status')
      .eq('id', jobId).eq('employer_id', userId).maybeSingle<JobContext>();
    if (job.error) throw new AiError('unavailable', 503);
    if (!job.data) throw new AiError('notFound', 404);
    return { employerId: userId, job: job.data };
  },
  async candidates(jobId, applicationId): Promise<CandidateContext[]> {
    const admin = adminClient();
    let query = admin.from('applications').select('id,applicant_id,status', { count: 'exact' }).eq('job_id', jobId)
      .order('created_at').order('id').limit(200);
    query = applicationId ? query.eq('id', applicationId) : query.eq('status', 'pending');
    const applications = rows(await query.returns<ApplicationRow[]>());
    if (!applications.length) return [];
    const ids = applications.map(app => app.applicant_id);
    const [profiles, availability, commitments] = await Promise.all([
      admin.from('profiles').select('id,display_name,role,verification_status,work_skills,work_experience', { count: 'exact' }).in('id', ids).limit(200).returns<WorkProfile[]>(),
      admin.from('student_availability').select('student_id,starts_at,ends_at', { count: 'exact' }).in('student_id', ids).limit(1000).returns<AvailabilityRow[]>(),
      admin.from('applications').select('applicant_id,job_id,jobs!inner(working_date,shift)', { count: 'exact' })
        .in('applicant_id', ids).eq('status', 'accepted').limit(1000).returns<CommitmentRow[]>(),
    ]);
    const profileRows = rows(profiles); const windows = rows(availability); const commitmentsRows = rows(commitments);
    return applications.map(app => {
      const profile = profileRows.find(p => p.id === app.applicant_id);
      return {
        id: app.applicant_id, applicationId: app.id, name: profile?.display_name ?? '', status: app.status,
        verified: profile?.role === 'student' && profile.verification_status === 'verified',
        skills: profile?.work_skills ?? '', experience: profile?.work_experience ?? '',
        availability: windows.filter(w => w.student_id === app.applicant_id).map(w => ({ startsAt: w.starts_at, endsAt: w.ends_at })),
        commitments: commitmentsRows.filter(c => c.applicant_id === app.applicant_id).map(c => ({ jobId: c.job_id, workingDate: c.jobs?.working_date ?? '', shift: c.jobs?.shift ?? '' })),
      };
    });
  },
  async consumeBudget(employerId) {
    const { data, error } = await adminClient().rpc('consume_employer_ai_budget', { target_employer: employerId });
    if (error) throw new AiError('unavailable', 503);
    return data === true;
  },
  generate: (request, data) => callAiProvider({ key: GEMINI_API_KEY, model: GEMINI_MODEL, action: request.action, language: request.language, data }),
});
Deno.serve(handler);
