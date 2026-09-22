import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Screen } from '@/components/screen';
import { logoutAccount } from '@/features/auth/auth-service';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';
import { getEmployerProfile, updateEmployerProfile } from './employer-service';
import type { BusinessProfile, ProfileFormData } from './types';
import { validateProfile } from './validation';
import { errorKey, useEmployerData } from './use-employer-data';
import { Button, Card, Copy, Field, LoadState, Notice, useEmployerText } from './ui';

function ProfileForm({ profile, saved, cancel }: { profile: BusinessProfile; saved: () => void; cancel: () => void }) {
  const t = useEmployerText();
  const [form, setForm] = useState<ProfileFormData>({ company: profile.company_name, category: profile.business_category,
    company_address: profile.address, contact_name: profile.profiles.display_name, contact_phone: profile.profiles.phone });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const submit = async () => {
    if (busy) return;
    const validation = validateProfile(form); if (validation) { setError(validation); return; }
    setBusy(true); setError('');
    try { await updateEmployerProfile(form); saved(); }
    catch (reason) { setError(errorKey(reason)); setBusy(false); }
  };
  const limits = { company: 160, contact_name: 160, contact_phone: 20, category: 100, company_address: 1000 };
  return <Card>{Object.entries(limits).map(([field, limit]) => {
    const key = field as keyof ProfileFormData;
    return <Field key={key} label={t(key === 'category' ? 'businessCategory' : key)} value={form[key]} maxLength={limit} disabled={busy}
      multiline={key === 'company_address'} onChange={value => setForm(current => ({ ...current, [key]: value }))} />;
  })}<Notice text={error ? t(error) : ''} error /><Button label={t(busy ? 'saving' : 'save')} disabled={busy} onPress={() => void submit()} />
    <Button label={t('cancel')} onPress={cancel} disabled={busy} /></Card>;
}
export default function EmployerProfileScreen() {
  const t = useEmployerText(); const { t: translate } = useTranslation(); const colors = useTheme();
  const state = useEmployerData(getEmployerProfile);
  const [editing, setEditing] = useState(false); const [saved, setSaved] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false); const [logoutError, setLogoutError] = useState('');
  const logout = async () => {
    setLogoutBusy(true); setLogoutError('');
    try { await logoutAccount(); router.replace('/'); }
    catch { setLogoutError(translate('auth.logoutFailed')); setLogoutBusy(false); }
  };
  const profile = state.data;
  return <Screen title={t('profile')}><Notice text={saved ? t('saved') : ''} /><LoadState {...state} retry={state.reload} />
    {profile && (editing ? <ProfileForm profile={profile} cancel={() => setEditing(false)} saved={() => { setSaved(true); setEditing(false); state.reload(); }} />
      : <Card><Ionicons name="business-outline" size={42} color={colors.primary} /><Copy strong>{profile.company_name}</Copy>
        <Copy>{t('contact_name')}: {profile.profiles.display_name}</Copy><Copy>{t('contact_phone')}: {profile.profiles.phone}</Copy>
        <Copy>{t('email')}: {profile.profiles.email}</Copy><Copy>{t('businessCategory')}: {profile.business_category}</Copy>
        <Copy>{t('company_address')}: {profile.address}</Copy><Copy>{t('verification')}: {t(profile.profiles.verification_status)}</Copy>
        <Button label={t('editProfile')} onPress={() => { setSaved(false); setEditing(true); }} />
      </Card>)}
    {!editing && <><Notice text={logoutError} error /><Button label={translate(logoutBusy ? 'auth.loggingOut' : 'auth.logout')} disabled={logoutBusy} danger onPress={() => void logout()} /></>}
  </Screen>;
}
