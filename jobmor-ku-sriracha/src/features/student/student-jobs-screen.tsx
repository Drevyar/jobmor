import { router } from 'expo-router';
import { EmptySection, Screen } from '@/components/screen';
import { Button, Card, Copy, useEmployerText } from '@/features/employer/ui';
import { useTranslation } from '@/providers/localization-provider';
import { JobCard, StudentJobActions } from './job-card';
import { StudentLoadState } from './load-state';
import { getStudentCollection } from './student-service';
import { useStudentData } from './use-student-data';

export function StudentJobsScreen({ saved = false }: { saved?: boolean }) {
  const { t } = useTranslation(); const e = useEmployerText();
  const state = useStudentData(getStudentCollection);
  const jobs = state.data?.jobs.filter(job => saved ? job.saved : job.application);
  const unavailable = state.data?.unavailable.filter(job => saved ? job.saved : job.application) ?? [];
  return <Screen title={t(saved ? 'studentFlow.savedJobs' : 'student.applications')}>
    {saved && <Button label={e('back')} onPress={() => router.canGoBack() ? router.back() : router.replace('/(student)/home')} />}
    <StudentLoadState {...state} />
    {jobs && <><Button label={e('refresh')} onPress={state.reload} />
      {!jobs.length && !unavailable.length && <EmptySection title={t(saved ? 'studentFlow.emptySaved' : 'studentFlow.emptyApplications')} body={t(saved ? 'studentFlow.emptySavedBody' : 'studentFlow.emptyApplicationsBody')} />}
      {jobs.map(job => <JobCard key={job.id} job={job} changed={updated => state.setData(current => current ? { ...current, jobs: current.jobs.map(item => item.id === updated.id ? updated : item) } : null)} />)}
      {unavailable.map(job => <Card key={job.id}><Copy>{t('studentFlow.unavailable')}</Copy>
        <StudentJobActions job={job} changed={updated => state.setData(current => current ? { ...current, unavailable: current.unavailable.map(item => item.id === updated.id ? { ...item, application: updated.application, saved: updated.saved } : item) } : null)} />
      </Card>)}
    </>}
  </Screen>;
}
