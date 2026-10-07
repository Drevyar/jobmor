import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AiError, isRecord, isUuid, parseInsight } from '../../../supabase/functions/_shared/ai-contracts';
import type { AiRequest, AiResponse } from '../../../supabase/functions/_shared/ai-contracts';

const errorCodes = ['unauthorized','forbidden','notFound','notConfigured','invalidShift','invalidRequest','rateLimited','tooManyCandidates','providerUnavailable','invalidOutput','refused','unavailable'];
// รับคำขอวิเคราะห์ผู้สมัคร → ส่ง body ไป Edge Function employer-ai → ตรวจ response ก่อนคืนให้ UI
// คีย์ Gemini อยู่ที่ backend; จุดส่ง HTTP ไป Gemini อยู่ใน _shared/ai-provider.ts
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
  if (!['available','conflict','unknown'].includes(String(data.availability))) throw new AiError('invalidOutput');
  return { kind: 'candidate-insight', insight: parseInsight(data.insight), availability: data.availability as 'available' | 'conflict' | 'unknown' };
}
