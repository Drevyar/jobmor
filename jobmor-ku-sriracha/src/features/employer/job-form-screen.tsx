import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Screen } from '@/components/screen';
import { EmployerError, getJobById, saveJob } from './employer-service';
import type { JobFormData } from './types';
import { emptyJob, validateJob } from './validation';
import { errorKey, useEmployerData } from './use-employer-data';
import { Button, Choices, Copy, Field, LoadState, Notice, useEmployerText } from './ui';

function JobForm({ initial, jobId }: { initial: JobFormData; jobId?: string }) {
  const t = useEmployerText();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (key: keyof JobFormData, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async () => {
    if (busy) return;
    const validation = validateJob(form);
    if (validation) { setError(validation); return; }
    setBusy(true); setError('');
    try {
      const job = await saveJob(form, jobId);
      router.replace(jobId ? { pathname: '/(employer)/job-detail', params: { jobId: job.id, notice: 'saved' } }
        : { pathname: '/(employer)/jobs', params: { notice: 'saved' } });
    } catch (reason) { setError(errorKey(reason)); setBusy(false); }
  };
  const limits = { title: 160, description: 10000, requirements: 5000, wage: 11, location: 500, category: 100, working_date: 10, shift: 200, workers_required: 5, contact_information: 500 };
  return <><Copy>{t('formHint')}</Copy>
    {Object.entries(limits).map(([field, limit]) => {
      const key = field as keyof typeof limits;
      return <Field key={key} label={t(key)} value={form[key]} onChange={value => change(key, value)} maxLength={limit}
        disabled={busy} multiline={key === 'description' || key === 'requirements'} numeric={key === 'wage' || key === 'workers_required'} />;
    })}
    <Copy>{t('wage_type')}</Copy><Choices values={['hour','day','month','job']} value={form.wage_type} onChange={value => change('wage_type', value)} disabled={busy} />
    <Copy>{t('status')}</Copy><Choices values={['draft','active','closed']} value={form.status} onChange={value => change('status', value)} disabled={busy} />
    <Notice text={error ? t(error) : ''} error /><Button label={t(busy ? 'saving' : 'save')} disabled={busy} onPress={() => void submit()} />
    <Button label={t('cancel')} disabled={busy} onPress={() => router.replace('/(employer)/jobs')} />
  </>;
}
export default function JobFormScreen({ editing = false }: { editing?: boolean }) {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>(); const t = useEmployerText();
  const state = useEmployerData(useCallback(async (): Promise<JobFormData> => {
    if (!editing) return { ...emptyJob };
    if (!jobId) throw new EmployerError('jobNotFound');
    const job = await getJobById(jobId);
    return { ...job, wage: String(job.wage), workers_required: String(job.workers_required) };
  }, [editing, jobId]));
  return <Screen title={t(editing ? 'edit' : 'create')}><LoadState {...state} retry={state.reload} />
    {state.data && <JobForm initial={state.data} jobId={editing ? jobId : undefined} />}
  </Screen>;
}
