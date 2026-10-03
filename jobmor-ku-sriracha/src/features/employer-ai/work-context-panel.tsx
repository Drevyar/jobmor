import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, Card, Copy, Field, Notice, SuccessDialog } from '@/features/employer/ui';
import { useTranslation } from '@/providers/localization-provider';
import { AiError, bangkokWindow } from '../../../supabase/functions/_shared/ai-contracts';
import { getWorkContext, removeAvailability, saveAvailability, saveWorkContext } from './work-context-service';
type Data = Awaited<ReturnType<typeof getWorkContext>>;
function windowHasEnded(endsAt: string) { return Date.parse(endsAt) <= Date.now(); }
export function WorkContextPanel() {
  const { t, language } = useTranslation(); const a = (key: string) => t('employerAi.' + key);
  const [data, setData] = useState<Data | null>(null); const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState(''); const [experience, setExperience] = useState('');
  const [date, setDate] = useState(''); const [start, setStart] = useState(''); const [end, setEnd] = useState('');
  const [error, setError] = useState(''); const [success, setSuccess] = useState<'saved' | 'savedWorkOnly' | 'removed' | null>(null); const [busy, setBusy] = useState(false);
  const lock = useRef(false); const sequence = useRef(0); const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    void revision;
    const id = ++sequence.current; setLoading(true); setData(null); setError('');
    void getWorkContext().then(result => {
      if (id !== sequence.current) return;
      setData(result); setSkills(result.profile.work_skills); setExperience(result.profile.work_experience);
    }).catch((reason: unknown) => {
      if (id === sequence.current) setError(reason instanceof AiError ? reason.code : 'unavailable');
    }).finally(() => { if (id === sequence.current) setLoading(false); });
    return () => { sequence.current++; };
  }, [revision]));
  const perform = async (action: () => Promise<void>, expectedWindow?: { startsAt: string; endsAt: string }, successKey: 'saved' | 'savedWorkOnly' | 'removed' = 'saved') => {
    if (lock.current) return;
    const id = sequence.current; lock.current = true; setBusy(true); setError(''); setSuccess(null);
    try {
      await action();
      const result = await getWorkContext();
      if (expectedWindow && !result.windows.some(window =>
        Date.parse(window.starts_at) === Date.parse(expectedWindow.startsAt) &&
        Date.parse(window.ends_at) === Date.parse(expectedWindow.endsAt)))
        throw new AiError('availabilitySaveFailed');
      if (id === sequence.current) { setData(result); setSuccess(successKey); }
    } catch (reason) {
      if (id === sequence.current) setError(reason instanceof AiError ? reason.code : 'unavailable');
    } finally { lock.current = false; setBusy(false); }
  };
  const save = () => {
    const hasWindowInput = Boolean(date.trim() || start.trim() || end.trim());
    if (!hasWindowInput) {
      void perform(() => saveWorkContext(skills, experience), undefined, data?.windows.length ? 'saved' : 'savedWorkOnly');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError('invalidDate'); return; }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(end)) { setError('invalidTime'); return; }
    const window = bangkokWindow(date,start,end);
    if (!window) { setError('invalidShift'); return; }
    if (windowHasEnded(window.endsAt)) { setError('pastWindow'); return; }
    void perform(async () => {
      await saveWorkContext(skills, experience);
      await saveAvailability(window);
    }, window);
  };
  const format = (value: string) => new Date(value).toLocaleString(language === 'th' ? 'th-TH' : 'en-GB', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' });
  return <Card><Copy strong>{a('workContext')}</Copy><Copy>{a('workHelp')}</Copy>
    {loading && <ActivityIndicator accessibilityLabel={a('loadingData')} />}
    <Notice text={error ? a(error) : success ? a(success) : ''} error={!!error} />
    <SuccessDialog visible={!!success} message={success ? a(success) : ''} close={() => setSuccess(null)} />
    {!loading && !data && <Button label={t('employerFlow.retry')} onPress={() => setRevision(v => v + 1)} />}
    {data && <>
      <Field label={a('skills')} value={skills} maxLength={1000} multiline disabled={busy} onChange={setSkills} />
      <Field label={a('experience')} value={experience} maxLength={3000} multiline disabled={busy} onChange={setExperience} />
      <Copy strong>{a('availability')}</Copy>{!data.windows.length && <Copy>{a('noWindows')}</Copy>}
      {data.windows.map(window => <Card key={window.id}><Copy>{format(window.starts_at)} — {format(window.ends_at)} (Bangkok)</Copy>
        <Button label={a('remove')} disabled={busy} onPress={() => void perform(() => removeAvailability(window.id), undefined, 'removed')} /></Card>)}
      <Field label={a('date')} value={date} maxLength={10} disabled={busy} onChange={setDate} />
      <Field label={a('start')} value={start} maxLength={5} disabled={busy} onChange={setStart} />
      <Field label={a('end')} value={end} maxLength={5} disabled={busy} onChange={setEnd} />
      <Copy>{a('windowExample')}</Copy>
      <Button label={a('save')} disabled={busy} onPress={save} />
      <Notice text={error ? a(error) : ''} error />
    </>}
  </Card>;
}
