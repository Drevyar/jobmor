import { router } from 'expo-router';
import { Dashboard } from '@/components/dashboard';
import { useTranslation } from '@/providers/localization-provider';
export default function EmployerDashboard() {
  const { t } = useTranslation();
  return <Dashboard title={t('employer.dashboard')} subtitle={t('employer.dashboardSubtitle')} actionLabel={t('employer.createJob')} onAction={() => router.push('/(employer)/create-job' as never)} sectionTitle={t('employer.recent')} metrics={[{ label: t('employer.activeJobs'), icon: 'briefcase-outline' }, { label: t('employer.applications'), icon: 'people-outline' }, { label: t('employer.accepted'), icon: 'checkmark-circle-outline' }, { label: t('employer.completed'), icon: 'stats-chart-outline' }]} />;
}
