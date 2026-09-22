import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { EmptySection, Screen } from '@/components/screen';
import type { IconName } from '@/constants/roles';
import { useTheme } from '@/hooks/use-theme';

type Metric = { label: string; icon: IconName; value?: number };
export function Dashboard({ title, subtitle, metrics, sectionTitle, actionLabel, onAction, children }: { title: string; subtitle: string; metrics: Metric[]; sectionTitle: string; actionLabel?: string; onAction?: () => void; children?: ReactNode }) {
  const colors = useTheme();
  return (
    <Screen title={title} subtitle={subtitle}>
      <View style={styles.grid}>{metrics.map((metric) => <View key={metric.label} style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.metricIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name={metric.icon} size={20} color={colors.primary} /></View><View><Text style={[styles.metricValue, { color: colors.text }]}>{metric.value ?? '—'}</Text><Text style={[styles.metricLabel, { color: colors.textMuted }]}>{metric.label}</Text></View></View>)}</View>
      {actionLabel ? <Pressable onPress={onAction} style={[styles.action, { backgroundColor: colors.primary }]}><Ionicons name="add" size={22} color={colors.onPrimary} /><Text style={[styles.actionText, { color: colors.onPrimary }]}>{actionLabel}</Text></Pressable> : null}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{sectionTitle}</Text>{children ?? <EmptySection />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, metric: { width: '48%', minHeight: 92, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, flexGrow: 1 },
  metricIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, metricValue: { fontSize: 19, fontWeight: '800' }, metricLabel: { fontSize: 11, marginTop: 2 },
  action: { height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' }, sectionTitle: { fontSize: 17, fontWeight: '800' },
});
