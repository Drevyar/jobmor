import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Copy, DeleteDialog, Notice, styles, useEmployerText } from '@/features/employer/ui';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';
import { applyForJob, setJobSaved, withdrawApplication, type StudentJob } from './student-service';
import { studentErrorKey } from './use-student-data';
import { canWithdraw } from './validation';

export function JobCard({ job, detail = false, changed }: { job: StudentJob; detail?: boolean; changed: (job: StudentJob) => void }) {
  const e = useEmployerText();
  const colors = useTheme();
  const { t } = useTranslation();
  const categoryKey = job.category === 'food-beverage' ? 'food' : job.category;
  const categoryLabel = ['food', 'retail', 'hospitality', 'education', 'events', 'office', 'technology', 'logistics'].includes(categoryKey)
    ? t(`auth.categories.${categoryKey}`) : job.category;
  return <Card>
    <View style={cardStyles.heading}>
      <View style={[cardStyles.icon, { backgroundColor: colors.primarySoft }]}><Ionicons name="briefcase-outline" size={24} color={colors.primary} /></View>
      <View style={cardStyles.titleGroup}><Text style={[cardStyles.category, { color: colors.textMuted }]}>{categoryLabel}</Text><Text style={[cardStyles.title, { color: colors.text }]}>{job.title}</Text></View>
    </View>
    <View style={cardStyles.wageRow}>
      <Text style={[cardStyles.wage, { color: colors.primary }]}>{job.wage.toLocaleString()} <Text style={cardStyles.unit}>THB / {e(job.wage_type)}</Text></Text>
      <View style={[cardStyles.badge, { backgroundColor: colors.primarySoft }]}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{e(job.status)}</Text></View>
    </View>
    <View style={cardStyles.meta}><Ionicons name="location-outline" size={17} color={colors.textMuted} /><Text style={[cardStyles.metaText, { color: colors.textMuted }]}>{job.location}</Text></View>
    <View style={cardStyles.meta}><Ionicons name="time-outline" size={17} color={colors.textMuted} /><Text style={[cardStyles.metaText, { color: colors.textMuted }]}>{job.working_date} · {job.shift}</Text></View>
    {detail && (['description', 'requirements', 'category', 'workers_required', 'contact_information'] as const).map(key =>
      <Copy key={key}>{e(key)}: {job[key] || e('unavailable')}</Copy>)}
    {!detail && <Button variant="ghost" label={e('view')} onPress={() => router.push({ pathname: '/(student)/job-detail', params: { jobId: job.id } })} />}
    <StudentJobActions job={job} changed={updated => changed({ ...job, application: updated.application, saved: updated.saved })} />
  </Card>;
}

type JobState = Pick<StudentJob, 'id' | 'application' | 'saved'> & { status: string | null };
export function StudentJobActions({ job, changed }: { job: JobState; changed: (job: JobState) => void }) {
  const { t } = useTranslation(); const e = useEmployerText();
  const s = (key: string) => t(`studentFlow.${key}`);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const run = async (action: 'apply' | 'withdraw' | 'save') => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (action === 'apply') {
        const application = await applyForJob(job.id);
        changed({ ...job, application }); setNotice('applied');
      } else if (action === 'withdraw' && job.application) {
        await withdrawApplication(job.application.id);
        changed({ ...job, application: null }); setConfirm(false); setNotice('withdrawn');
      } else if (action === 'save') {
        await setJobSaved(job.id, !job.saved);
        changed({ ...job, saved: !job.saved });
      }
    } catch (reason) { setError(studentErrorKey(reason)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <>
    <Copy>{job.application ? e(job.application.status) : s('notApplied')}{job.saved ? ` · ${s('saved')}` : ''}</Copy>
    {job.application && <Copy>{e('applied')}: {new Date(job.application.created_at).toLocaleDateString()}</Copy>}
    <Notice text={error ? s(error) : ''} error /><Notice text={notice ? s(notice) : ''} />
    <View style={styles.row}>
      <Button label={busy ? e('saving') : s(job.saved ? 'unsave' : 'saveJob')} disabled={busy || (!job.saved && job.status !== 'active')} onPress={() => void run('save')} />
      {!job.application && job.status === 'active' && <Button variant="primary" label={s('apply')} disabled={busy} onPress={() => void run('apply')} />}
      {canWithdraw(job.application?.status) && <Button label={s('withdraw')} danger disabled={busy} onPress={() => { setError(''); setConfirm(true); }} />}
    </View>
    <DeleteDialog visible={confirm} busy={busy} error="" errorText={error ? s(error) : ''} title={s('withdrawTitle')} body={s('withdrawBody')}
      confirmLabel={s('withdraw')} cancel={() => setConfirm(false)} confirm={() => void run('withdraw')} />
  </>;
}

const cardStyles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titleGroup: { flex: 1, gap: 3 }, category: { fontSize: 12, lineHeight: 18 },
  title: { fontSize: 18, lineHeight: 26, fontWeight: '700' },
  wageRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  wage: { fontSize: 23, lineHeight: 32, fontWeight: '800' }, unit: { fontSize: 13, fontWeight: '500' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  meta: { flexDirection: 'row', gap: 8, alignItems: 'center' }, metaText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
