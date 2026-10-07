import { AiError, parseAiRequest, parseInsight } from './ai-contracts.ts';
import type { AiRequest, AiResponse } from './ai-contracts.ts';
import { availabilityStatus, jobWindow, providerContext } from './ai-matching.ts';
import type { CandidateContext, JobContext } from './ai-matching.ts';
export type AiDependencies = {
  authorize: (token: string, jobId: string) => Promise<{ employerId: string; job: JobContext }>;
  candidates: (jobId: string, applicationId?: string) => Promise<CandidateContext[]>;
  consumeBudget: (employerId: string) => Promise<boolean>;
  generate: (request: AiRequest, data: unknown) => Promise<unknown>;
  configured: boolean;
  now?: () => number;
};
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
// รับ HTTP จาก functions.invoke('employer-ai'): อ่าน body → ตรวจคำขอ/สิทธิ์/เจ้าของงาน
// อ่านผู้สมัคร → คำนวณเวลาว่าง → เรียก generate → ตรวจคำตอบ → คืน JSON ให้แอป
export function createAiHandler(deps: AiDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const respond = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: cors });
    try {
      if (request.method !== 'POST') throw new AiError('invalidRequest', 405);
      const token = request.headers.get('Authorization');
      if (!token?.startsWith('Bearer ') || token.length < 20) throw new AiError('unauthorized', 401);
      const body = await request.text();
      if (body.length > 4096) throw new AiError('invalidRequest', 413);
      let raw: unknown;
      try { raw = JSON.parse(body); } catch { throw new AiError('invalidRequest'); }
      const input = parseAiRequest(raw, deps.now?.() ?? Date.now());
      // Authorization always precedes privileged reads, config checks, or provider calls.
      const { employerId, job } = await deps.authorize(token, input.jobId);
      const candidates = await deps.candidates(job.id, input.applicationId);
      const candidate = candidates.find(c => c.applicationId === input.applicationId);
      if (!candidate || !candidate.verified) throw new AiError('notFound', 404);
      if (!deps.configured) throw new AiError('notConfigured', 503);
      if (!await deps.consumeBudget(employerId)) throw new AiError('rateLimited', 429);
      const shift = jobWindow(job);
      const availability = availabilityStatus(candidate, shift, job.id);
      const generated = await deps.generate(input, { mode: input.action, shift,
        candidate: providerContext(job, candidate, availability, 'candidate-1') });
      const result: AiResponse = { kind: input.action, insight: parseInsight(generated), availability };
      return respond(result);
    } catch (error) {
      const safe = error instanceof AiError ? error : new AiError('unavailable', 503);
      // Log codes only: never tokens, prompts, personal details, or provider payloads.
      console.warn('employer-ai', safe.code);
      return respond({ error: safe.code }, safe.status);
    }
  };
}
