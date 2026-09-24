import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, Card, Copy, Field, Notice } from '@/features/employer/ui';
import { useTranslation } from '@/providers/localization-provider';
import { bangkokWindow, isUuid } from '../../../supabase/functions/_shared/ai-contracts';
import { useAiAction } from './use-ai-action';
export function ReplacementPanel({ jobId, workingDate, shift }: { jobId: string; workingDate: string; shift: string }) {
  const { t, language } = useTranslation(); const a = (key: string) => t('employerAi.' + key);
  const times = shift.match(/^(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})$/);
  const [date, setDate] = useState(workingDate); const [start, setStart] = useState(times?.[1] ?? '');
  const [end, setEnd] = useState(times?.[2] ?? ''); const [validation, setValidation] = useState('');
  const state = useAiAction(); const result = state.result?.kind === 'emergency-replacement' ? state.result : null;
  const change = (set: (v: string) => void, value: string) => { set(value); setValidation(''); state.clear(); };
  const run = () => {
    const window = bangkokWindow(date, start, end);
    if (!window || Date.parse(window.endsAt) <= Date.now() || Date.parse(window.startsAt) > Date.now() + 31 * 86400000) { setValidation('invalidShift'); return; }
    setValidation(''); void state.run({ action: 'emergency-replacement', jobId, shift: window, language });
  };
  return <Card><Copy strong>{a('replacement')}</Copy><Copy>{a('pool')}</Copy><Copy>{a('note')}</Copy><Copy>{a('privacy')}</Copy>
    <Field label={a('date')} value={date} maxLength={10} disabled={state.busy} onChange={v => change(setDate,v)} />
    <Field label={a('start')} value={start} maxLength={5} disabled={state.busy} onChange={v => change(setStart,v)} />
    <Field label={a('end')} value={end} maxLength={5} disabled={state.busy} onChange={v => change(setEnd,v)} />
    <Button label={a(state.busy ? 'loading' : 'find')} disabled={state.busy || !isUuid(jobId)} onPress={run} />
    {!isUuid(jobId) && <Notice text={a('realAccountRequired')} />}
    {state.busy && <ActivityIndicator accessibilityLabel={a('loading')} />}
    <Notice text={validation || state.error ? a(validation || state.error) : result ? a('success') : ''} error={!!(validation || state.error)} />
    {result && <><Copy>{a('confirmShift')}</Copy>
      {!result.candidates.length && <Copy>{a('noCandidates')}</Copy>}
      {Object.entries(result.excluded).filter(([,count]) => count > 0).map(([key,count]) => <Copy key={key}>{a(key === 'unavailable' ? 'unavailableCount' : key)}: {count}</Copy>)}
      {result.candidates.map(candidate => <Card key={candidate.candidateId}><Copy strong>{candidate.name}</Copy><Notice text={a('available')} />
        <Copy strong>{a('reasons')}</Copy>{candidate.reasons.map((reason,i) => <Copy key={i}>• {reason}</Copy>)}
        {!!candidate.warnings.length && <Copy strong>{a('warnings')}</Copy>}{candidate.warnings.map((warning,i) => <Copy key={i}>• {warning}</Copy>)}
        <Button label={a('view')} onPress={() => router.push({ pathname: '/(employer)/applicant-detail', params: { jobId, applicationId: candidate.applicationId } })} />
      </Card>)}
    </>}
  </Card>;
}
