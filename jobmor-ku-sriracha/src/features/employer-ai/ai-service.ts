import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AiError, isRecord, isUuid, parseInsight, textList, validWindow } from '../../../supabase/functions/_shared/ai-contracts';
import type { AiRequest, AiResponse, ReplacementCandidate } from '../../../supabase/functions/_shared/ai-contracts';

const errorCodes = ['unauthorized','forbidden','notFound','notConfigured','invalidShift','invalidRequest','rateLimited','tooManyCandidates','providerUnavailable','invalidOutput','refused','unavailable'];
export async function requestEmployerAi(input: AiRequest, signal?: AbortSignal): Promise<AiResponse> {
  if (!isUuid(input.jobId) || (input.applicationId && !isUuid(input.applicationId))) throw new AiError('realAccountRequired');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new AiError('unauthorized');
  const { data, error } = await supabase.functions.invoke('employer-ai', { body: input, signal });
  if (error) {
    let code = 'unavailable';
    if (error instanceof FunctionsHttpError) {
      try {
        const body: unknown = await error.context.json();
        if (isRecord(body) && typeof body.error === 'string' && errorCodes.includes(body.error)) code = body.error;
      } catch { /* A gateway failure may not contain JSON. */ }
    }
    if (__DEV__) console.warn('Employer AI request failed:', code);
    throw new AiError(code);
  }
  if (!isRecord(data) || data.kind !== input.action) throw new AiError('invalidOutput');
  if (data.kind === 'candidate-insight') {
    if (!['available','conflict','unknown'].includes(String(data.availability))) throw new AiError('invalidOutput');
    return { kind: data.kind, insight: parseInsight(data.insight), availability: data.availability as 'available' | 'conflict' | 'unknown' };
  }
  if (!validWindow(data.shift) || !Array.isArray(data.candidates) || data.candidates.length > 20 || !isRecord(data.excluded)) throw new AiError('invalidOutput');
  const candidates: ReplacementCandidate[] = data.candidates.map((candidate: unknown) => {
    if (!isRecord(candidate) || !isUuid(candidate.candidateId) || !isUuid(candidate.applicationId) || typeof candidate.name !== 'string' ||
        !textList(candidate.reasons) || !textList(candidate.warnings)) throw new AiError('invalidOutput');
    return { candidateId: candidate.candidateId, applicationId: candidate.applicationId, name: candidate.name, reasons: candidate.reasons, warnings: candidate.warnings };
  });
  const excluded = { missingAvailability: 0, unavailable: 0, overlapping: 0, unknownCommitment: 0 };
  for (const key of Object.keys(excluded) as (keyof typeof excluded)[]) {
    const count = data.excluded[key];
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) throw new AiError('invalidOutput');
    excluded[key] = count;
  }
  return { kind: 'emergency-replacement', shift: data.shift, candidates, excluded };
}
