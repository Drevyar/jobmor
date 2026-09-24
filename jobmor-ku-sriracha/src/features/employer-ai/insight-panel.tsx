import { ActivityIndicator } from 'react-native';
import { Button, Card, Copy, Notice } from '@/features/employer/ui';
import { useTranslation } from '@/providers/localization-provider';
import { isUuid } from '../../../supabase/functions/_shared/ai-contracts';
import { useAiAction } from './use-ai-action';
export function InsightPanel({ jobId, applicationId }: { jobId: string; applicationId: string }) {
  const { t, language } = useTranslation(); const a = (key: string) => t('employerAi.' + key);
  const state = useAiAction(); const result = state.result?.kind === 'candidate-insight' ? state.result : null;
  const real = isUuid(jobId) && isUuid(applicationId);
  return <Card><Copy strong>{a('insight')}</Copy><Copy>{a('privacy')}</Copy><Copy>{a('note')}</Copy>
    {!state.result && !state.busy && !state.error && <Copy>{a('emptyInsight')}</Copy>}
    {!real && <Notice text={a('realAccountRequired')} />}
    <Button label={a(state.busy ? 'loading' : result ? 'regenerate' : 'analyze')} disabled={state.busy || !real}
      onPress={() => void state.run({ action: 'candidate-insight', jobId, applicationId, language })} />
    {state.busy && <ActivityIndicator accessibilityLabel={a('loading')} />}
    <Notice text={state.error ? a(state.error) : result ? a('success') : ''} error={!!state.error} />
    {result && <><Notice text={a(result.availability)} error={result.availability === 'conflict'} />
      <Copy strong>{a('summary')}</Copy><Copy>{result.insight.summary}</Copy>
      {(['strengths','gaps','interviewQuestions'] as const).map(key => <Card key={key}>
        <Copy strong>{a(key === 'interviewQuestions' ? 'questions' : key)}</Copy>
        {result.insight[key].length ? result.insight[key].map((line,i) => <Copy key={i}>{i + 1}. {line}</Copy>) : <Copy>{a('noEvidence')}</Copy>}
      </Card>)}
    </>}
  </Card>;
}
