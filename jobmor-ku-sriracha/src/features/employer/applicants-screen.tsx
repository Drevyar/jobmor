import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { EmptySection, Screen } from '@/components/screen';
import { getApplicantsByJob, getEmployerJobs, getJobById } from './employer-service';
import { useEmployerData } from './use-employer-data';
import { Button, Card, Choices, Copy, LoadState, useEmployerText } from './ui';

function JobPicker() {
  const t = useEmployerText(); const state = useEmployerData(getEmployerJobs);
  return <><Copy>{t('chooseJob')}</Copy><LoadState {...state} retry={state.reload} />
    {state.data?.length === 0 && <EmptySection title={t('emptyJobs')} body={t('emptyJobsBody')} />}
    {state.data?.map(job => <Card key={job.id}><Copy strong>{job.title}</Copy><Copy>{t('count')}: {job.applications[0]?.count ?? 0}</Copy>
      <Button label={t('applicants')} onPress={() => router.setParams({ jobId: job.id })} /></Card>)}
  </>;
}
function JobApplicants({ jobId }: { jobId: string }) {
  const t = useEmployerText(); const [filter, setFilter] = useState('all');
  const state = useEmployerData(useCallback(async () => ({ job: await getJobById(jobId), applications: await getApplicantsByJob(jobId) }), [jobId]));
  const applications = state.data?.applications.filter(item => filter === 'all' || item.status === filter);
  return <><Button label={t('jobs')} onPress={() => router.replace('/(employer)/jobs')} /><LoadState {...state} retry={state.reload} />
    {state.data && <><Copy strong>{state.data.job.title}</Copy><Button label={t('refresh')} onPress={state.reload} />
      <Choices values={['all', 'pending', 'accepted', 'rejected']} value={filter} onChange={setFilter} />
      {!applications?.length && <EmptySection title={t('emptyApplications')} body={t('emptyApplicationsBody')} />}
      {applications?.map(application => <Card key={application.id}>
        <Copy strong>{application.profiles?.display_name || t('unavailable')}</Copy>
        <Copy>{t('applied')}: {new Date(application.created_at).toLocaleDateString()}</Copy><Copy>{t('status')}: {t(application.status)}</Copy>
        <Button label={t('application')} onPress={() => router.push({ pathname: '/(employer)/applicant-detail', params: { jobId, applicationId: application.id } })} />
      </Card>)}
    </>}
  </>;
}
export default function ApplicantsScreen() {
  const t = useEmployerText(); const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  return <Screen title={t('applicants')}>{jobId ? <JobApplicants key={jobId} jobId={jobId} /> : <JobPicker />}</Screen>;
}
