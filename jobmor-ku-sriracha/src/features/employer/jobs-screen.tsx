import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { EmptySection, Screen } from '@/components/screen';
import { deleteJob, getEmployerJobs } from './employer-service';
import type { Job } from './types';
import { errorKey, useEmployerData } from './use-employer-data';
import { Button, Card, Copy, DeleteDialog, LoadState, Notice, styles, useEmployerText } from './ui';

export function JobActions({ job, onDeleted }: { job: Job; onDeleted: () => void }) {
  const t = useEmployerText();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const remove = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await deleteJob(job.id); setConfirm(false); onDeleted(); }
    catch (reason) { setError(errorKey(reason)); }
    finally { setBusy(false); }
  };
  return <><View style={styles.row}>
    <Button label={t('edit')} onPress={() => router.push({ pathname: '/(employer)/edit-job', params: { jobId: job.id } })} />
    <Button label={t('applicants')} onPress={() => router.push({ pathname: '/(employer)/applicants', params: { jobId: job.id } })} />
    <Button label={t('delete')} danger onPress={() => { setError(''); setConfirm(true); }} />
  </View><DeleteDialog visible={confirm} busy={busy} error={error} cancel={() => setConfirm(false)} confirm={() => void remove()} /></>;
}
export function JobSummary({ job }: { job: Job }) {
  const t = useEmployerText();
  return <><Copy strong>{job.title}</Copy><Copy>{job.wage.toLocaleString()} THB / {t(job.wage_type)} · {t(job.status)}</Copy>
    <Copy>{job.location}</Copy><Copy>{job.working_date} · {job.shift}</Copy></>;
}
export default function JobsScreen() {
  const t = useEmployerText(); const state = useEmployerData(getEmployerJobs);
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const [deleted, setDeleted] = useState(false);
  return <Screen title={t('jobs')}>
    <Button label={t('create')} onPress={() => router.push('/(employer)/create-job')} />
    <Notice text={deleted ? t('deleted') : notice === 'saved' || notice === 'deleted' ? t(notice) : ''} />
    <LoadState {...state} retry={state.reload} />
    {state.data && <><Button label={t('refresh')} onPress={state.reload} />
      {!state.data.length && <EmptySection title={t('emptyJobs')} body={t('emptyJobsBody')} />}
      {state.data.map(job => <Card key={job.id}><JobSummary job={job} /><Copy>{t('count')}: {job.applications[0]?.count ?? 0}</Copy>
        <Button label={t('view')} onPress={() => router.push({ pathname: '/(employer)/job-detail', params: { jobId: job.id } })} />
        <JobActions job={job} onDeleted={() => { state.setData(current => current?.filter(item => item.id !== job.id) ?? null); setDeleted(true); }} />
      </Card>)}
    </>}
  </Screen>;
}
