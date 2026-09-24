import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Screen } from '@/components/screen';
import { InsightPanel } from '@/features/employer-ai/insight-panel';
import { EmployerError, getApplicationById, getJobById, updateApplicationStatus } from './employer-service';
import { errorKey, useEmployerData } from './use-employer-data';
import { Button, Card, Copy, LoadState, Notice, useEmployerText } from './ui';

export default function ApplicantDetailScreen() {
  const t = useEmployerText(); const { jobId, applicationId } = useLocalSearchParams<{ jobId?: string; applicationId?: string }>();
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
  const state = useEmployerData(useCallback(async () => {
    if (!jobId || !applicationId) throw new EmployerError('applicationNotFound');
    return { job: await getJobById(jobId), application: await getApplicationById(jobId, applicationId) };
  }, [jobId, applicationId]));
  const decide = async (status: 'accepted' | 'rejected') => {
    if (!jobId || !applicationId || busy) return;
    setBusy(true); setError(''); setSaved(false);
    try {
      const updated = await updateApplicationStatus(jobId, applicationId, status);
      state.setData(current => current ? { ...current, application: { ...current.application, status: updated.status } } : null);
      setSaved(true);
    } catch (reason) { setError(errorKey(reason)); }
    finally { setBusy(false); }
  };
  const application = state.data?.application;
  return <Screen title={t('application')}><Button label={t('applicants')} disabled={busy} onPress={() => router.replace({ pathname: '/(employer)/applicants', params: { jobId } })} />
    <LoadState {...state} retry={state.reload} />
    {application && <Card><Copy strong>{application.profiles?.display_name || t('unavailable')}</Copy>
      <Copy>{t('email')}: {application.profiles?.email || t('unavailable')}</Copy><Copy>{t('contact_phone')}: {application.profiles?.phone || t('unavailable')}</Copy>
      <Copy>{t('title')}: {state.data?.job.title}</Copy><Copy>{t('applied')}: {new Date(application.created_at).toLocaleString()}</Copy>
      <Copy>{t('message')}: {application.message || t('unavailable')}</Copy><Copy>{t('status')}: {t(application.status)}</Copy>
      <Notice text={error ? t(error) : saved ? t('updated') : ''} error={!!error} />
      <Button label={t('accept')} disabled={busy || application.status === 'accepted'} onPress={() => void decide('accepted')} />
      <Button label={t('reject')} danger disabled={busy || application.status === 'rejected'} onPress={() => void decide('rejected')} />
    </Card>}
    {application && jobId && <InsightPanel key={application.id} jobId={jobId} applicationId={application.id} />}
  </Screen>;
}
