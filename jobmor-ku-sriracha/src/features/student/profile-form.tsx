import { useRef, useState } from 'react';
import { Button, Field, Notice, useEmployerText } from '@/features/employer/ui';
import { useTranslation } from '@/providers/localization-provider';
import { getStudentProfile, updateStudentProfile } from './student-service';
import { StudentLoadState } from './load-state';
import { studentErrorKey, useStudentData } from './use-student-data';

export function StudentProfileForm() {
  const { t } = useTranslation(); const e = useEmployerText();
  const state = useStudentData(getStudentProfile);
  const [form, setForm] = useState<{ display_name: string; phone: string } | null>(null);
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState(false);
  const save = async () => {
    if (!form || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setSuccess(false);
    try { const profile = await updateStudentProfile(form); state.setData(profile); setForm(null); setSuccess(true); }
    catch (reason) { setError(studentErrorKey(reason)); }
    finally { lock.current = false; setBusy(false); }
  };
  const profile = state.data;
  return <>
    <StudentLoadState {...state} />
    {profile && <>
      <Field label={t('auth.name')} value={form?.display_name ?? profile.display_name} disabled={!form || busy} onChange={display_name => setForm(current => current ? { ...current, display_name } : null)} />
      <Field label={t('auth.phone')} value={form?.phone ?? profile.phone} disabled={!form || busy} onChange={phone => setForm(current => current ? { ...current, phone } : null)} />
      <Field label={t('auth.email')} value={profile.email} disabled onChange={() => {}} />
      <Notice text={`${e('verification')}: ${e(profile.verification_status)}`} />
      <Notice text={error ? t(`studentFlow.${error}`) : ''} error /><Notice text={success ? t('studentFlow.profileSaved') : ''} />
      {form ? <><Button label={e(busy ? 'saving' : 'save')} disabled={busy} onPress={() => void save()} /><Button label={e('cancel')} disabled={busy} onPress={() => { setForm(null); setError(''); }} /></>
        : <Button label={e('editProfile')} onPress={() => { setForm({ display_name: profile.display_name, phone: profile.phone }); setSuccess(false); setError(''); }} />}
    </>}
  </>;
}
