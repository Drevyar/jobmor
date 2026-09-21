import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Screen } from '@/components/screen';
import { EmployerError, getJobById } from './employer-service';
import { JobActions, JobSummary } from './jobs-screen';
import { useEmployerData } from './use-employer-data';
import { Button, Card, Copy, LoadState, Notice, useEmployerText } from './ui';

export default function JobDetailScreen() {
  const { jobId, notice } = useLocalSearchParams<{ jobId?: string; notice?: string }>();
  const t = useEmployerText();
  const state = useEmployerData(useCallback(() => {
    if (!jobId) return Promise.reject(new EmployerError('jobNotFound'));
    return getJobById(jobId);
  }, [jobId]));
  return <Screen title={t('view')}><Button label={t('jobs')} onPress={() => router.replace('/(employer)/jobs')} />
    <Notice text={notice === 'saved' ? t('saved') : ''} /><LoadState {...state} retry={state.reload} />
    {state.data && <Card><JobSummary job={state.data} />
      {(['description', 'requirements', 'category', 'workers_required', 'contact_information'] as const).map(key =>
        <Copy key={key}>{t(key)}: {state.data?.[key] || t('unavailable')}</Copy>)}
      <JobActions job={state.data} onDeleted={() => router.replace({ pathname: '/(employer)/jobs', params: { notice: 'deleted' } })} />
    </Card>}
  </Screen>;
}
