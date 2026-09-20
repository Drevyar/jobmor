import { Dashboard } from '@/components/dashboard';
import { useTranslation } from '@/providers/localization-provider';
export default function AdminDashboard() {
  const { t } = useTranslation();
  return <Dashboard title={t('admin.dashboard')} subtitle={t('admin.dashboardSubtitle')} sectionTitle={t('admin.recent')} metrics={[{ label: t('admin.students'), icon: 'school-outline' }, { label: t('admin.employers'), icon: 'business-outline' }, { label: t('admin.activeJobs'), icon: 'briefcase-outline' }, { label: t('admin.reports'), icon: 'flag-outline' }, { label: t('admin.verifications'), icon: 'document-text-outline' }, { label: t('admin.health'), icon: 'pulse-outline' }]} />;
}
