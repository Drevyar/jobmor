import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptySection, Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';
import { Button, Field, useEmployerText } from '@/features/employer/ui';
import { JobCard } from '@/features/student/job-card';
import { StudentLoadState } from '@/features/student/load-state';
import { getStudentJobs } from '@/features/student/student-service';
import { useStudentData } from '@/features/student/use-student-data';
import { filterJobs } from '@/features/student/validation';

const emptyFilters = { search: '', category: '', date: '', area: '', time: '', wage: '' };
const categoryMap: Record<string, string> = { all: '', food: 'food-beverage', retail: 'retail', event: 'events' };

export function JobDiscovery({ explore = false }: { explore?: boolean }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const e = useEmployerText();
  const state = useStudentData(getStudentJobs);
  const [filters, setFilters] = useState(emptyFilters);
  const [expanded, setExpanded] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const activeJobs = state.data?.filter(job => job.status === 'active') ?? [];
  const categories = [...new Set(activeJobs.map(job => job.category))];
  const jobs = filterJobs(activeJobs, filters);
  const chipKeys = explore ? ['date', 'category', 'area', 'time', 'wage'] : ['all', 'food', 'retail', 'event'];

  return (
    <Screen title={t(explore ? 'student.exploreTitle' : 'student.homeTitle')} subtitle={t('studentFlow.searchHint')}>
      <View style={[styles.searchPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.search, { backgroundColor: colors.background, borderColor: searchFocused ? colors.primary : colors.border }]}>
          <Ionicons name="search-outline" size={21} color={colors.primary} />
          <TextInput
            accessibilityLabel={t('studentFlow.search')} value={filters.search}
            onChangeText={search => setFilters(current => ({ ...current, search }))}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            placeholder={t('studentFlow.search')} placeholderTextColor={colors.textMuted}
            returnKeyType="search" style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <Text style={[styles.filterLabel, { color: colors.textMuted }]}>{t('studentFlow.filters')}</Text>
        <View style={styles.chips}>
          {chipKeys.map(chip => {
            const selected = explore ? expanded === chip : filters.category === categoryMap[chip];
            const active = explore && Boolean(filters[chip as keyof typeof filters]);
            return <Button key={chip} label={`${t(`student.filters.${chip}`)}${active ? ' •' : ''}`}
              selected={selected} variant={selected ? 'primary' : 'secondary'}
              onPress={() => explore
                ? setExpanded(expanded === chip ? '' : chip)
                : setFilters(current => ({ ...current, category: categoryMap[chip] }))} />;
          })}
        </View>
        {explore && expanded === 'category' && <View style={styles.chips}>
          {['', ...categories].map(category => <Button key={category} label={category || e('all')}
            selected={filters.category === category} onPress={() => setFilters(current => ({ ...current, category }))} />)}
        </View>}
        {explore && (['date', 'area', 'time', 'wage'] as const).map(key => expanded === key && <Field key={key}
          label={key === 'wage' ? t('studentFlow.minimumWage') : t(`student.filters.${key}`)}
          value={filters[key]} numeric={key === 'wage'} onChange={value => setFilters(current => ({ ...current, [key]: value }))} />)}
        {Object.values(filters).some(Boolean) && <Button variant="ghost" label={t('studentFlow.clearFilters')} onPress={() => setFilters(emptyFilters)} />}
      </View>
      <View style={styles.toolbar}>
        <View style={styles.sectionHeading}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{t(Object.values(filters).some(Boolean) ? 'studentFlow.results' : 'studentFlow.availableJobs')}</Text>
          {state.data && <Text style={[styles.count, { color: colors.textMuted }]}>{jobs.length}</Text>}
        </View>
        <Button variant="ghost" label={t('studentFlow.savedJobs')} onPress={() => router.push('/(student)/saved-jobs')} />
      </View>
      <StudentLoadState {...state} />
      {state.data && <>
        {!jobs.length && <EmptySection title={t('studentFlow.emptyJobs')} body={t('studentFlow.emptyJobsBody')} />}
        {jobs.map(job => <JobCard key={job.id} job={job}
          changed={updated => state.setData(current => current?.map(item => item.id === updated.id ? updated : item) ?? null)} />)}
        <Button variant="ghost" label={e('refresh')} onPress={state.reload} />
      </>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchPanel: { padding: 16, borderWidth: 1, borderRadius: 18, gap: 14 },
  search: { minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, minHeight: 50 },
  filterLabel: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 18, lineHeight: 26, fontWeight: '700' }, count: { fontSize: 14 },
});
