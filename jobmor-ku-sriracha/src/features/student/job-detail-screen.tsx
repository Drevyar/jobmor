import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Screen } from '@/components/screen';
import { Button, useEmployerText } from '@/features/employer/ui';
import { JobCard } from './job-card';
import { StudentLoadState } from './load-state';
import { getStudentJob, StudentError } from './student-service';
import { useStudentData } from './use-student-data';

export default function StudentJobDetailScreen() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const e = useEmployerText();
  const state = useStudentData(useCallback(() => jobId ? getStudentJob(jobId) : Promise.reject(new StudentError('jobNotFound')), [jobId]));
  return <Screen title={e('view')}>
    <Button label={e('back')} onPress={() => router.canGoBack() ? router.back() : router.replace('/(student)/home')} />
    <StudentLoadState {...state} />
    {state.data && <><Button label={e('refresh')} onPress={state.reload} /><JobCard key={state.data.id} job={state.data} detail changed={state.setData} /></>}
  </Screen>;
}
