// Demo urgency uses the existing title field and normal pending application flow.
const prefix = '[URGENT] ';
export function stripUrgentTitle(title: string) { return title.replace(/^\[URGENT\]\s*/i,'').trim(); }
export function isUrgentJob(job: {title:string}) { return /^\[URGENT\]\s/i.test(job.title); }
export function taggedJobTitle(title:string,urgent:boolean) {
  const plain=stripUrgentTitle(title);
  return urgent?prefix+plain:plain;
}
