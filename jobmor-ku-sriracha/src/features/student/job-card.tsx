import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Copy, DeleteDialog, Notice, styles, useEmployerText } from '@/features/employer/ui';
import { JobSummary } from '@/features/employer/jobs-screen';
import { useTranslation } from '@/providers/localization-provider';
import { applyForJob, setJobSaved, withdrawApplication, type StudentJob } from './student-service';
import { studentErrorKey } from './use-student-data';
import { canWithdraw } from './validation';

export function JobCard({ job, detail = false, changed }: { job: StudentJob; detail?: boolean; changed: (job: StudentJob) => void }) {
  const e = useEmployerText();
  return <Card><JobSummary job={job} />
    {detail && (['description', 'requirements', 'category', 'workers_required', 'contact_information'] as const).map(key =>
      <Copy key={key}>{e(key)}: {job[key] || e('unavailable')}</Copy>)}
    {!detail && <Button label={e('view')} onPress={() => router.push({ pathname: '/(student)/job-detail', params: { jobId: job.id } })} />}
    <StudentJobActions job={job} changed={updated => changed({ ...job, application: updated.application, saved: updated.saved })} />
  </Card>;
}

type JobState = Pick<StudentJob, 'id' | 'application' | 'saved'> & { status: string | null };
export function StudentJobActions({ job, changed }: { job: JobState; changed: (job: JobState) => void }) {
  const { t } = useTranslation(); const e = useEmployerText();
  const s = (key: string) => t(`studentFlow.${key}`);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const run = async (action: 'apply' | 'withdraw' | 'save') => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (action === 'apply') {
        const application = await applyForJob(job.id);
        changed({ ...job, application }); setNotice('applied');
      } else if (action === 'withdraw' && job.application) {
        await withdrawApplication(job.application.id);
        changed({ ...job, application: null }); setConfirm(false); setNotice('withdrawn');
      } else if (action === 'save') {
        await setJobSaved(job.id, !job.saved);
        changed({ ...job, saved: !job.saved });
      }
    } catch (reason) { setError(studentErrorKey(reason)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <>
    <Copy>{job.application ? e(job.application.status) : s('notApplied')}{job.saved ? ` · ${s('saved')}` : ''}</Copy>
    {job.application && <Copy>{e('applied')}: {new Date(job.application.created_at).toLocaleDateString()}</Copy>}
    <Notice text={error ? s(error) : ''} error /><Notice text={notice ? s(notice) : ''} />
    <View style={styles.row}>
      <Button label={busy ? e('saving') : s(job.saved ? 'unsave' : 'saveJob')} disabled={busy || (!job.saved && job.status !== 'active')} onPress={() => void run('save')} />
      {!job.application && job.status === 'active' && <Button label={s('apply')} disabled={busy} onPress={() => void run('apply')} />}
      {canWithdraw(job.application?.status) && <Button label={s('withdraw')} danger disabled={busy} onPress={() => { setError(''); setConfirm(true); }} />}
    </View>
    <DeleteDialog visible={confirm} busy={busy} error="" errorText={error ? s(error) : ''} title={s('withdrawTitle')} body={s('withdrawBody')}
      confirmLabel={s('withdraw')} cancel={() => setConfirm(false)} confirm={() => void run('withdraw')} />
  </>;
}
