import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptySection, Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';
import { Button, Field, useEmployerText } from '@/features/employer/ui';
import { JobCard } from '@/features/student/job-card';
import { StudentLoadState } from '@/features/student/load-state';
import { getStudentJobs } from '@/features/student/student-service';
import { useStudentData } from '@/features/student/use-student-data';
import { filterJobs } from '@/features/student/validation';

export function JobDiscovery({ explore = false }: { explore?: boolean }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const e = useEmployerText();
  const state = useStudentData(getStudentJobs);
  const emptyFilters = { search: '', category: '', date: '', area: '', time: '', wage: '' };
  const [filters, setFilters] = useState(emptyFilters);
  const [expanded, setExpanded] = useState('');
  const categoryMap: Record<string, string> = { all: '', food: 'food-beverage', retail: 'retail', event: 'events' };
  const categories = [...new Set(state.data?.filter(job => job.status === 'active').map(job => job.category) ?? [])];
  const jobs = filterJobs(state.data?.filter(job => job.status === 'active') ?? [], filters);
  const chipKeys = explore ? ['date', 'category', 'area', 'time', 'wage'] : ['all', 'food', 'retail', 'event'];
  return (
    <Screen title={t(explore ? 'student.exploreTitle' : 'student.homeTitle')} subtitle={t('student.homeSubtitle')}>
      {!explore ? <View style={[styles.verifyCard, { backgroundColor: colors.primarySoft }]}><Ionicons name="school-outline" size={25} color={colors.primary} /><Text style={[styles.verifyText, { color: colors.text }]}>{t('student.verified')}</Text><Ionicons name="chevron-forward" size={18} color={colors.primary} /></View> : null}
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="search-outline" size={20} color={colors.textMuted} /><TextInput accessibilityLabel={t('studentFlow.search')} value={filters.search} onChangeText={search => setFilters(current => ({ ...current, search }))} placeholder={t('studentFlow.search')} placeholderTextColor={colors.textMuted} style={[styles.placeholder, { color: colors.text }]} /><Ionicons name="options-outline" size={20} color={colors.primary} /></View>
      <View style={styles.chips}>{chipKeys.map(chip => {
        const selected = explore ? expanded === chip : filters.category === categoryMap[chip];
        return <Pressable key={chip} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => explore ? setExpanded(expanded === chip ? '' : chip) : setFilters(current => ({ ...current, category: categoryMap[chip] }))} style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: colors.border }]}><Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>{t(`student.filters.${chip}`)}</Text></Pressable>;
      })}</View>
      {explore && expanded === 'category' && <View style={styles.chips}>{['', ...categories].map(category => <Button key={category} label={category || e('all')} onPress={() => setFilters(current => ({ ...current, category }))} />)}</View>}
      {explore && (['date', 'area', 'time', 'wage'] as const).map(key => expanded === key && <Field key={key} label={key === 'wage' ? t('studentFlow.minimumWage') : t(`student.filters.${key}`)} value={filters[key]} numeric={key === 'wage'} onChange={value => setFilters(current => ({ ...current, [key]: value }))} />)}
      {Object.values(filters).some(Boolean) && <Button label={t('studentFlow.clearFilters')} onPress={() => setFilters(emptyFilters)} />}
      <Button label={t('studentFlow.savedJobs')} onPress={() => router.push('/(student)/saved-jobs')} />
      <View style={styles.sectionTitleRow}><Text style={[styles.sectionTitle, { color: colors.text }]}>{t('student.nearby')}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/(student)/explore')}><Text style={[styles.seeAll, { color: colors.primary }]}>{t('common.seeAll')}</Text></Pressable></View>
      <StudentLoadState {...state} />
      {state.data && <><Button label={e('refresh')} onPress={state.reload} />
        {!jobs.length && <EmptySection title={t('studentFlow.emptyJobs')} body={t('studentFlow.emptyJobsBody')} />}
        {jobs.map(job => <JobCard key={job.id} job={job} changed={updated => state.setData(current => current?.map(item => item.id === updated.id ? updated : item) ?? null)} />)}
      </>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  verifyCard: { minHeight: 70, borderRadius: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, verifyText: { flex: 1, fontSize: 14, fontWeight: '700' },
  search: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, placeholder: { flex: 1, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1 }, chipText: { fontSize: 12, fontWeight: '600' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { fontSize: 17, fontWeight: '800' }, seeAll: { fontSize: 13, fontWeight: '700' },
});
