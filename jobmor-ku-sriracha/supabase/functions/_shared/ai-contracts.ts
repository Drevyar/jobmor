export type TimeWindow = { startsAt: string; endsAt: string };
export type AiRequest = {
  action: 'candidate-insight';
  jobId: string;
  applicationId?: string;
  language: 'en' | 'th';
};
export type CandidateInsight = {
  summary: string;
  strengths: string[];
  gaps: string[];
  interviewQuestions: string[];
};
export type AvailabilityStatus = 'available' | 'conflict' | 'unknown';
export type InsightResponse = {
  kind: 'candidate-insight';
  insight: CandidateInsight;
  availability: AvailabilityStatus;
};
export type AiResponse = InsightResponse;
export class AiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status = 400) { super(code); this.code = code; this.status = status; }
}
export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function validWindow(v: unknown): v is TimeWindow {
  if (!isRecord(v) || typeof v.startsAt !== 'string' || typeof v.endsAt !== 'string') return false;
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
  const start = Date.parse(v.startsAt); const end = Date.parse(v.endsAt);
  return iso.test(v.startsAt) && iso.test(v.endsAt) && Number.isFinite(start) && Number.isFinite(end) && end > start && end - start <= 86400000;
}
/** Strict local Bangkok date/time entry, including overnight shifts. */
export function bangkokWindow(date: string, start: string, end: string): TimeWindow | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end)) return null;
  const day = new Date(date + 'T00:00:00Z');
  if (!Number.isFinite(day.getTime()) || day.getUTCFullYear() < 1 || day.toISOString().slice(0,10) !== date || start === end) return null;
  const startsAt = new Date(date + 'T' + start + ':00+07:00');
  let endsAt = new Date(date + 'T' + end + ':00+07:00');
  if (end < start) endsAt = new Date(endsAt.getTime() + 86400000);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}
export function parseAiRequest(value: unknown, now = Date.now()): AiRequest {
  if (!isRecord(value) || !isUuid(value.jobId) || !['en','th'].includes(String(value.language))) throw new AiError('invalidRequest');
  if (value.action !== 'candidate-insight' || !isUuid(value.applicationId)) throw new AiError('invalidRequest');
  return { action: value.action, jobId: value.jobId, language: value.language as 'en' | 'th', applicationId: value.applicationId };
}
function safeText(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= 1200 && !/\d\s*[%％]|\b(score|ranking|ranked)\b/i.test(v);
}
export function textList(v: unknown): v is string[] {
  return Array.isArray(v) && v.length <= 8 && v.every(safeText);
}
export function parseInsight(v: unknown): CandidateInsight {
  if (!isRecord(v) || Object.keys(v).sort().join(',') !== 'gaps,interviewQuestions,strengths,summary' ||
      !safeText(v.summary) || !textList(v.strengths) || !textList(v.gaps) || !textList(v.interviewQuestions)) throw new AiError('invalidOutput', 502);
  return { summary: v.summary, strengths: v.strengths, gaps: v.gaps, interviewQuestions: v.interviewQuestions };
}
