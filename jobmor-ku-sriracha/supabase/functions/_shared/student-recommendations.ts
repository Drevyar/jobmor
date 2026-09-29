import { AiError, isRecord, textList } from './ai-contracts.ts';
import type { TimeWindow } from './ai-contracts.ts';
import { covers, jobWindow, overlaps } from './ai-matching.ts';

export type StudentJob = {
  id: string; title: string; description: string; requirements: string; category: string;
  location: string; wage: number; wage_type: string; working_date: string; shift: string;
  workers_required: number; status: string; created_at: string;
};
export type Preferences = { preferred_category: string; preferred_area: string; minimum_wage: number; wage_type: string };
export type StudentContext = { skills: string; experience: string; windows: TimeWindow[]; preferences: Preferences;
  applied: Set<string>; skipped: Set<string>; accepted: { jobId: string; working_date: string; shift: string }[];
  acceptedCount: Map<string, number> };
export type EligibleJob = { job: StudentJob; availability: 'available' | 'unknown'; reasons: string[] };

/** All factual eligibility is decided before data reaches Gemini. */
export function getEligibleJobs(jobs: StudentJob[], student: StudentContext, now: number): EligibleJob[] {
  const eligible: EligibleJob[] = [];
  for (const job of jobs) {
    if (job.status !== 'active' || student.applied.has(job.id) || student.skipped.has(job.id)) continue;
    if ((student.acceptedCount.get(job.id) ?? 0) >= job.workers_required) continue;
    const shift = jobWindow(job);
    if (!shift || Date.parse(shift.endsAt) <= now) continue;
    if (student.preferences.preferred_category && job.category !== student.preferences.preferred_category) continue;
    if (student.preferences.preferred_area && !job.location.toLocaleLowerCase().includes(student.preferences.preferred_area.toLocaleLowerCase())) continue;
    if (student.preferences.minimum_wage > 0 && job.wage_type === student.preferences.wage_type && job.wage < student.preferences.minimum_wage) continue;
    let conflict = false;
    for (const accepted of student.accepted) {
      const window = jobWindow(accepted);
      if (window && overlaps(window, shift)) { conflict = true; break; }
      if (!window) {
        const day = Date.parse(accepted.working_date + 'T00:00:00+07:00');
        if (!Number.isFinite(day) || (day < Date.parse(shift.endsAt) && day + 2 * 86400000 > Date.parse(shift.startsAt))) { conflict = true; break; }
      }
    }
    if (conflict) continue;
    const availability = student.windows.length ? (covers(student.windows, shift) ? 'available' : 'conflict') : 'unknown';
    if (availability === 'conflict') continue;
    const reasons = [availability === 'available' ? 'Declared availability covers this shift.' : 'Availability has not been provided; confirm this shift before applying.'];
    if (student.preferences.preferred_category) reasons.push('This job is in your preferred category.');
    if (student.preferences.preferred_area) reasons.push('This job is in your preferred area.');
    if (student.preferences.minimum_wage > 0 && job.wage_type === student.preferences.wage_type) reasons.push('The listed wage meets your minimum.');
    eligible.push({ job, availability, reasons });
  }
  return eligible.sort((a,b) => b.job.created_at.localeCompare(a.job.created_at) || a.job.id.localeCompare(b.job.id));
}

const stringArray = { type: 'array', items: { type: 'string' } };
export const recommendationsSchema = { type: 'object', properties: {
  recommendations: { type: 'array', items: { type: 'object', properties: { jobId: { type: 'string' }, reasons: stringArray }, required: ['jobId','reasons'], additionalProperties: false } },
}, required: ['recommendations'], additionalProperties: false };
export const discoverySchema = { type: 'object', properties: {
  inferredSkills: { type: 'array', items: { type: 'object', properties: { skill: { type: 'string' }, evidence: { type: 'string' } }, required: ['skill','evidence'], additionalProperties: false } },
  jobCategories: { type: 'array', items: { type: 'object', properties: { category: { type: 'string' }, reasons: stringArray }, required: ['category','reasons'], additionalProperties: false } },
}, required: ['inferredSkills','jobCategories'], additionalProperties: false };

export function parseRecommendations(raw: unknown, ids: string[]) {
  if (!isRecord(raw) || Object.keys(raw).join(',') !== 'recommendations' || !Array.isArray(raw.recommendations) || raw.recommendations.length > ids.length) throw new AiError('invalidOutput',502);
  const seen = new Set<string>(); const result: { jobId: string; reasons: string[] }[] = [];
  for (const item of raw.recommendations) {
    if (!isRecord(item) || Object.keys(item).sort().join(',') !== 'jobId,reasons' || typeof item.jobId !== 'string' || !ids.includes(item.jobId) || seen.has(item.jobId) || !textList(item.reasons) || !item.reasons.length) throw new AiError('invalidOutput',502);
    seen.add(item.jobId); result.push({ jobId: item.jobId, reasons: item.reasons });
  }
  return result;
}
export function parseDiscovery(raw: unknown, categories: string[]) {
  if (!isRecord(raw) || Object.keys(raw).sort().join(',') !== 'inferredSkills,jobCategories' || !Array.isArray(raw.inferredSkills) || !Array.isArray(raw.jobCategories) || raw.inferredSkills.length > 6 || raw.jobCategories.length > 6) throw new AiError('invalidOutput',502);
  const inferredSkills: { skill: string; evidence: string }[] = [];
  const jobCategories: { category: string; reasons: string[] }[] = [];
  const safe = (s: unknown) => typeof s === 'string' && s.trim().length > 0 && s.length <= 1200 && !/\d\s*[%％]/.test(s);
  for (const item of raw.inferredSkills) {
    if (!isRecord(item) || Object.keys(item).sort().join(',') !== 'evidence,skill' || !safe(item.skill) || !safe(item.evidence)) throw new AiError('invalidOutput',502);
    inferredSkills.push({ skill: item.skill as string, evidence: item.evidence as string });
  }
  for (const item of raw.jobCategories) {
    if (!isRecord(item) || Object.keys(item).sort().join(',') !== 'category,reasons' || typeof item.category !== 'string' || !categories.includes(item.category) || !textList(item.reasons) || !item.reasons.length) throw new AiError('invalidOutput',502);
    jobCategories.push({ category: item.category, reasons: item.reasons });
  }
  return { inferredSkills, jobCategories };
}
