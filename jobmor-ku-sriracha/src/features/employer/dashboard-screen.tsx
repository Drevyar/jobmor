import { router } from 'expo-router';
import { Dashboard } from '@/components/dashboard';
import { useTranslation } from '@/providers/localization-provider';
import { getEmployerJobs } from './employer-service';
import { useEmployerData } from './use-employer-data';
import { Button, LoadState, useEmployerText } from './ui';

export default function EmployerDashboard() {
  const t = useEmployerText(); const state = useEmployerData(getEmployerJobs);
  const { t: translate } = useTranslation();
  return <Dashboard title={t('overview')} subtitle={translate('employer.dashboardSubtitle')} sectionTitle={t('jobs')}
    actionLabel={t('create')} onAction={() => router.push('/(employer)/create-job')}
    metrics={[
      { label: t('totalJobs'), icon: 'briefcase-outline', value: state.data?.length },
      { label: t('activeJobs'), icon: 'checkmark-circle-outline', value: state.data?.filter(job => job.status === 'active').length },
      { label: t('count'), icon: 'people-outline', value: state.data?.reduce((sum, job) => sum + (job.applications[0]?.count ?? 0), 0) },
    ]}>
    <LoadState {...state} retry={state.reload} />
    <Button label={t('jobs')} onPress={() => router.push('/(employer)/jobs')} />
    <Button label={t('applicants')} onPress={() => router.push({ pathname: '/(employer)/applicants', params: { jobId: '' } })} />
    <Button label={t('profile')} onPress={() => router.push('/(employer)/profile')} />
  </Dashboard>;
}
