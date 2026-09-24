import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, Card, Copy, Field, Notice } from '@/features/employer/ui';
import { useTranslation } from '@/providers/localization-provider';
import { AiError, bangkokWindow } from '../../../supabase/functions/_shared/ai-contracts';
import { addAvailability, getWorkContext, removeAvailability, saveWorkContext } from './work-context-service';
type Data = Awaited<ReturnType<typeof getWorkContext>>;
export function WorkContextPanel() {
  const { t, language } = useTranslation(); const a = (key: string) => t('employerAi.' + key);
  const [data, setData] = useState<Data | null>(null); const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState(''); const [experience, setExperience] = useState('');
  const [date, setDate] = useState(''); const [start, setStart] = useState(''); const [end, setEnd] = useState('');
  const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false);
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
  const perform = async (action: () => Promise<void>) => {
    if (lock.current) return;
    const id = sequence.current; lock.current = true; setBusy(true); setError(''); setSaved(false);
    try {
      await action();
      const result = await getWorkContext();
      if (id === sequence.current) { setData(result); setSaved(true); }
    } catch (reason) {
      if (id === sequence.current) setError(reason instanceof AiError ? reason.code : 'unavailable');
    } finally { lock.current = false; setBusy(false); }
  };
  const add = () => {
    const window = bangkokWindow(date,start,end);
    if (!window || Date.parse(window.endsAt) <= Date.now()) { setError('invalidShift'); return; }
    void perform(() => addAvailability(window));
  };
  const format = (value: string) => new Date(value).toLocaleString(language === 'th' ? 'th-TH' : 'en-GB', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' });
  return <Card><Copy strong>{a('workContext')}</Copy><Copy>{a('workHelp')}</Copy>
    {loading && <ActivityIndicator accessibilityLabel={a('loadingData')} />}
    <Notice text={error ? a(error) : saved ? a('saved') : ''} error={!!error} />
    {!loading && !data && <Button label={t('employerFlow.retry')} onPress={() => setRevision(v => v + 1)} />}
    {data && <>
      <Field label={a('skills')} value={skills} maxLength={1000} multiline disabled={busy} onChange={setSkills} />
      <Field label={a('experience')} value={experience} maxLength={3000} multiline disabled={busy} onChange={setExperience} />
      <Button label={a('save')} disabled={busy} onPress={() => void perform(() => saveWorkContext(skills,experience))} />
      <Copy strong>{a('availability')}</Copy>{!data.windows.length && <Copy>{a('noWindows')}</Copy>}
      {data.windows.map(window => <Card key={window.id}><Copy>{format(window.starts_at)} — {format(window.ends_at)} (Bangkok)</Copy>
        <Button label={a('remove')} disabled={busy} onPress={() => void perform(() => removeAvailability(window.id))} /></Card>)}
      <Field label={a('date')} value={date} maxLength={10} disabled={busy} onChange={setDate} />
      <Field label={a('start')} value={start} maxLength={5} disabled={busy} onChange={setStart} />
      <Field label={a('end')} value={end} maxLength={5} disabled={busy} onChange={setEnd} />
      <Button label={a('addWindow')} disabled={busy} onPress={add} />
    </>}
  </Card>;
}
