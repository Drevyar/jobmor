import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';

import { EmptySection, Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

import { AdminServiceError, loadAdminReports, updateAdminReport, type AdminReportRecord } from '../admin-service';

type ReportFilter = 'all' | 'pending' | 'resolved' | 'dismissed';

export function AdminReportsScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const [reports, setReports] = useState<AdminReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState(false);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReportFilter>('all');
  const [search, setSearch] = useState('');

  const refresh = useCallback(() => {
    return loadAdminReports()
      .then((result) => {
        setReports(result);
        setLoadError('');
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof AdminServiceError ? error.key : 'dataLoadError');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (filter !== 'all' && report.status !== filter) return false;
      return !query || report.reporter_name.toLowerCase().includes(query) ||
        report.reporter_email.toLowerCase().includes(query) ||
        report.target_name.toLowerCase().includes(query) || report.reason.toLowerCase().includes(query);
    });
  }, [filter, reports, search]);

  const filters: { id: ReportFilter; label: string }[] = [
    { id: 'all', label: t('admin.reportsFilterAll') },
    { id: 'pending', label: t('admin.reportsFilterPending') },
    { id: 'resolved', label: t('admin.reportsFilterResolved') },
    { id: 'dismissed', label: t('admin.reportsFilterDismissed') },
  ];

  const updateStatus = async (report: AdminReportRecord, status: 'resolved' | 'dismissed') => {
    setBusyReportId(report.id);
    setActionError(false);
    try {
      await updateAdminReport(report.id, status);
      await refresh();
    } catch {
      setActionError(true);
    } finally {
      setBusyReportId(null);
    }
  };

  return (
    <Screen title={t('admin.reports')} subtitle={t('admin.reportsSubtitle')}>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          accessibilityLabel={t('admin.searchReportsPlaceholder')}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('admin.searchReportsPlaceholder')}
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

      {loadError ? (
        <EmptySection title={t('admin.dataLoadErrorTitle')} body={t(`admin.${loadError}`)} />
      ) : loading ? (
        <EmptySection title={t('common.loading')} />
      ) : filteredReports.length === 0 ? (
        <EmptySection title={t('admin.noReportsFound')} body={t('admin.noReportsBody')} />
      ) : (
        filteredReports.map((report) => (
          <View key={report.id} style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.header}>
              <View style={styles.targetBadge}>
                <Ionicons name={report.target_type === 'job' ? 'briefcase-outline' : 'person-outline'} size={16} color={colors.primary} />
                <Text style={[styles.targetType, { color: colors.primary }]}>{t(report.target_type === 'job' ? 'admin.reportTargetJob' : 'admin.reportTargetUser')}</Text>
              </View>
              <Text style={[styles.status, { color: colors.textMuted }]}>
                {t(report.status === 'pending' ? 'admin.reportStatusPending' : report.status === 'resolved' ? 'admin.reportStatusResolved' : 'admin.reportStatusDismissed')}
              </Text>
            </View>
            <Text style={[styles.target, { color: colors.text }]}>{report.target_name}</Text>
            <Text style={[styles.reason, { color: colors.textMuted }]}>{report.reason}</Text>
            <View style={[styles.reporter, { borderTopColor: colors.border }]}>
              <View style={styles.reporterInfo}>
                <Text style={[styles.reporterName, { color: colors.text }]}>{report.reporter_name}</Text>
                <Text style={[styles.reporterEmail, { color: colors.textMuted }]}>{report.reporter_email}</Text>
              </View>
              <Text style={[styles.date, { color: colors.textMuted }]}>{new Date(report.created_at).toLocaleDateString()}</Text>
            </View>
            {report.status === 'pending' ? (
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={busyReportId === report.id}
                  onPress={() => void updateStatus(report, 'resolved')}
                  style={[styles.action, { backgroundColor: colors.primary, opacity: busyReportId === report.id ? 0.65 : 1 }]}
                >
                  {busyReportId === report.id ? <ActivityIndicator color="#FFFFFF" /> : null}
                  <Text style={styles.primaryActionText}>{t('admin.resolveReport')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busyReportId === report.id}
                  onPress={() => void updateStatus(report, 'dismissed')}
                  style={[styles.action, { borderColor: colors.border, opacity: busyReportId === report.id ? 0.65 : 1 }]}
                >
                  <Text style={[styles.secondaryActionText, { color: colors.textMuted }]}>{t('admin.dismissReport')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))
      )}
      {actionError ? <Text style={[styles.actionError, { color: colors.danger }]}>{t('admin.actionError')}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filters: { gap: 8 },
  filter: { paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderRadius: 20 },
  reportCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targetBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  targetType: { fontSize: 12, fontWeight: '700' },
  status: { fontSize: 12, fontWeight: '700' },
  target: { fontSize: 16, fontWeight: '800' },
  reason: { fontSize: 13, lineHeight: 19 },
  reporter: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  reporterInfo: { flex: 1, gap: 2 },
  reporterName: { fontSize: 12, fontWeight: '700' },
  reporterEmail: { fontSize: 11 },
  date: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { minHeight: 42, flex: 1, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 10 },
  primaryActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  secondaryActionText: { fontSize: 13, fontWeight: '700' },
  actionError: { fontSize: 13 },
});
