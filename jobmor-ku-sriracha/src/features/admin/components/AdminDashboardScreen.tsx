import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';

import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

import { loadAdminDashboardMetrics, type AdminDashboardMetrics } from '../admin-service';

export function AdminDashboardScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [error, setError] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadAdminDashboardMetrics()
      .then((result) => {
        if (active) { setMetrics(result); setError(false); }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, []));

  const cards = [
    { label: t('admin.students'), value: metrics?.students, icon: 'school-outline' as const },
    { label: t('admin.employers'), value: metrics?.employers, icon: 'business-outline' as const },
    { label: t('admin.activeJobs'), value: metrics?.activeJobs, icon: 'briefcase-outline' as const },
    { label: t('admin.pendingEmails'), value: metrics?.pendingEmailConfirmations, icon: 'mail-unread-outline' as const },
    { label: t('admin.pendingReports'), value: metrics?.pendingReports, icon: 'flag-outline' as const },
  ];

  return (
    <Screen title={t('admin.dashboard')} subtitle={t('admin.dashboardSubtitle')}>
      {error ? (
        <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.noticeText, { color: colors.textMuted }]}>{t('admin.dataLoadError')}</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.label} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name={card.icon} size={22} color={colors.primary} />
            <Text style={[styles.value, { color: colors.text }]}>{error ? '—' : card.value ?? '…'}</Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>{card.label}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.quickActions')}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(admin)/users')}
          style={({ pressed }) => [styles.action, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
        >
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>{t('admin.manageUsers')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(admin)/jobs')}
          style={({ pressed }) => [styles.action, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
        >
          <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>{t('admin.jobs')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(admin)/reports')}
          style={({ pressed }) => [styles.action, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
        >
          <Ionicons name="flag-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>{t('admin.reports')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', minHeight: 132, flexGrow: 1, borderWidth: 1, borderRadius: 18, padding: 18, justifyContent: 'center', gap: 6 },
  value: { fontSize: 28, fontWeight: '800' },
  label: { fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { minHeight: 58, flexGrow: 1, flexBasis: 150, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionText: { fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderWidth: 1, borderRadius: 14 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
