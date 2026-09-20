import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { EmptySection, Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

export function JobDiscovery({ explore = false }: { explore?: boolean }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const chipKeys = explore ? ['date', 'category', 'area', 'time', 'wage'] : ['all', 'food', 'retail', 'event'];
  return (
    <Screen title={t(explore ? 'student.exploreTitle' : 'student.homeTitle')} subtitle={t('student.homeSubtitle')}>
      {!explore ? <View style={[styles.verifyCard, { backgroundColor: colors.primarySoft }]}><Ionicons name="school-outline" size={25} color={colors.primary} /><Text style={[styles.verifyText, { color: colors.text }]}>{t('student.verified')}</Text><Ionicons name="chevron-forward" size={18} color={colors.primary} /></View> : null}
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="search-outline" size={20} color={colors.textMuted} /><Text style={[styles.placeholder, { color: colors.textMuted }]}>{t('student.searchPlaceholder')}</Text><Ionicons name="options-outline" size={20} color={colors.primary} /></View>
      <View style={styles.chips}>{chipKeys.map((chip, index) => <View key={chip} style={[styles.chip, { backgroundColor: index === 0 && !explore ? colors.primary : colors.surface, borderColor: colors.border }]}><Text style={[styles.chipText, { color: index === 0 && !explore ? '#FFFFFF' : colors.text }]}>{t(`student.filters.${chip}`)}</Text></View>)}</View>
      <View style={styles.sectionTitleRow}><Text style={[styles.sectionTitle, { color: colors.text }]}>{t('student.nearby')}</Text><Text style={[styles.seeAll, { color: colors.primary }]}>{t('common.seeAll')}</Text></View>
      <EmptySection />
    </Screen>
  );
}

const styles = StyleSheet.create({
  verifyCard: { minHeight: 70, borderRadius: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, verifyText: { flex: 1, fontSize: 14, fontWeight: '700' },
  search: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, placeholder: { flex: 1, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1 }, chipText: { fontSize: 12, fontWeight: '600' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { fontSize: 17, fontWeight: '800' }, seeAll: { fontSize: 13, fontWeight: '700' },
});
