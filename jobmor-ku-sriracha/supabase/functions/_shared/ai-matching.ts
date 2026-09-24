import { bangkokWindow } from './ai-contracts.ts';
import type { AvailabilityStatus, TimeWindow } from './ai-contracts.ts';
export type JobContext = { id: string; title: string; description: string; requirements: string; working_date: string; shift: string; status: string };
export type CandidateContext = {
  id: string; applicationId: string; name: string; verified: boolean; status: string;
  skills: string; experience: string; availability: TimeWindow[];
  commitments: { jobId: string; workingDate: string; shift: string }[];
};
export function jobWindow(job: { working_date: string; shift: string }): TimeWindow | null {
  const times = job.shift.trim().match(/^(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})$/);
  return times ? bangkokWindow(job.working_date, times[1], times[2]) : null;
}
export function overlaps(a: TimeWindow, b: TimeWindow) {
  return Date.parse(a.startsAt) < Date.parse(b.endsAt) && Date.parse(b.startsAt) < Date.parse(a.endsAt);
}
export function covers(windows: TimeWindow[], shift: TimeWindow) {
  // Adjacent availability windows may together cover a whole shift.
  let coveredUntil = Date.parse(shift.startsAt);
  for (const window of [...windows].sort((a,b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))) {
    if (Date.parse(window.startsAt) > coveredUntil) break;
    coveredUntil = Math.max(coveredUntil, Date.parse(window.endsAt));
    if (coveredUntil >= Date.parse(shift.endsAt)) return true;
  }
  return false;
}
export function commitmentStatus(candidate: CandidateContext, shift: TimeWindow, jobId: string): 'clear' | 'overlapping' | 'unknownCommitment' {
  let unknown = false;
  for (const commitment of candidate.commitments) {
    if (commitment.jobId === jobId) continue;
    const window = jobWindow({ working_date: commitment.workingDate, shift: commitment.shift });
    if (window && overlaps(window, shift)) return 'overlapping';
    if (!window) {
      // Unknown shift on an adjacent Bangkok day could be overnight: exclude safely.
      const day = Date.parse(commitment.workingDate + 'T00:00:00+07:00');
      if (!Number.isFinite(day) || (day < Date.parse(shift.endsAt) && day + 2 * 86400000 > Date.parse(shift.startsAt))) unknown = true;
    }
  }
  return unknown ? 'unknownCommitment' : 'clear';
}
export function availabilityStatus(candidate: CandidateContext, shift: TimeWindow | null, jobId: string): AvailabilityStatus {
  if (!shift) return 'unknown';
  const commitments = commitmentStatus(candidate, shift, jobId);
  if (commitments === 'overlapping') return 'conflict';
  if (commitments === 'unknownCommitment' || candidate.availability.length === 0) return 'unknown';
  return covers(candidate.availability, shift) ? 'available' : 'conflict';
}
export function eligibleReplacements(candidates: CandidateContext[], shift: TimeWindow, jobId: string) {
  const excluded = { missingAvailability: 0, unavailable: 0, overlapping: 0, unknownCommitment: 0 };
  const eligible = candidates.filter(candidate => {
    if (!candidate.verified || candidate.status !== 'pending') return false;
    if (!candidate.availability.length) { excluded.missingAvailability++; return false; }
    if (!covers(candidate.availability, shift)) { excluded.unavailable++; return false; }
    const status = commitmentStatus(candidate, shift, jobId);
    if (status !== 'clear') { excluded[status]++; return false; }
    return true;
  });
  return { eligible, excluded };
}
/** Allowlist provider data. Never include identity, contact, university, or other employers' schedules. */
export function providerContext(job: JobContext, candidate: CandidateContext, availability: AvailabilityStatus, alias: string) {
  return {
    candidateId: alias,
    skills: candidate.skills.slice(0,1000), experience: candidate.experience.slice(0,3000),
    availability,
    job: { title: job.title.slice(0,160), description: job.description.slice(0,10000), requirements: job.requirements.slice(0,5000) },
  };
}
