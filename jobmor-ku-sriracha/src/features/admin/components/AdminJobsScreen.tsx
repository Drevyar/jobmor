import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';

import { EmptySection, Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

import { loadAdminJobs, type AdminJobRecord } from '../admin-service';

type JobFilter = 'all' | 'active' | 'closed' | 'draft';

export function AdminJobsScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<AdminJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<JobFilter>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadAdminJobs()
      .then((result) => {
        if (active) { setJobs(result); setError(false); }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []));

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filter !== 'all' && job.status !== filter) return false;
      return !query || job.title.toLowerCase().includes(query) || job.company_name.toLowerCase().includes(query) || job.location.toLowerCase().includes(query);
    });
  }, [filter, jobs, search]);

  const filters: { id: JobFilter; label: string }[] = [
    { id: 'all', label: t('admin.jobsFilterAll') },
    { id: 'active', label: t('admin.jobsFilterActive') },
    { id: 'closed', label: t('admin.jobStatusClosed') },
    { id: 'draft', label: t('admin.jobStatusDraft') },
  ];

  return (
    <Screen title={t('admin.jobs')} subtitle={t('admin.jobsSubtitle')}>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          accessibilityLabel={t('admin.searchJobsPlaceholder')}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('admin.searchJobsPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => {
          const selected = filter === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => setFilter(item.id)}
              style={[styles.filter, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Text style={{ color: selected ? '#FFFFFF' : colors.text, fontWeight: '700' }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? (
        <EmptySection title={t('admin.dataLoadErrorTitle')} body={t('admin.dataLoadError')} />
      ) : loading ? (
        <EmptySection title={t('common.loading')} />
      ) : filteredJobs.length === 0 ? (
        <EmptySection title={t('admin.noJobsFound')} />
      ) : (
        filteredJobs.map((job) => {
          const statusLabel = job.status === 'active'
            ? t('admin.jobStatusActive')
            : job.status === 'closed'
              ? t('admin.jobStatusClosed')
              : t('admin.jobStatusDraft');
          return (
            <View key={job.id} style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.jobHeading}>
                <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.jobInfo}>
                  <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
                  <Text style={[styles.company, { color: colors.primary }]}>{job.company_name}</Text>
                </View>
                <Text style={[styles.status, { color: colors.textMuted }]}>{statusLabel}</Text>
              </View>
              <Text style={[styles.detail, { color: colors.textMuted }]}>{job.location}</Text>
              <Text style={[styles.detail, { color: colors.textMuted }]}>
                {job.wage.toLocaleString()} {t('employer.wage')} / {job.wage_type}
              </Text>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filters: { gap: 8 },
  filter: { paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderRadius: 20 },
  jobCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  jobHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  jobInfo: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '700' },
  company: { fontSize: 12, fontWeight: '600' },
  status: { fontSize: 11, fontWeight: '700' },
  detail: { fontSize: 12 },
});
