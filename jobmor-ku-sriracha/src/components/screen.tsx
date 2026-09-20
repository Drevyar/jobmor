import Ionicons from '@expo/vector-icons/Ionicons';
import { type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

export function Screen({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  const colors = useTheme();
  const { t, toggleLanguage } = useTranslation();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Switch language" onPress={toggleLanguage} style={[styles.languageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="language-outline" size={18} color={colors.primary} />
            <Text style={[styles.languageText, { color: colors.primary }]}>{t('common.language')}</Text>
          </Pressable>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function EmptySection({ title, body }: { title?: string; body?: string }) {
  const colors = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="file-tray-outline" size={26} color={colors.primary} /></View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title ?? t('common.emptyTitle')}</Text>
      <Text style={[styles.emptyBody, { color: colors.textMuted }]}>{body ?? t('common.emptyBody')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, content: { padding: 20, paddingBottom: 100, gap: 20, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, heading: { flex: 1, gap: 4 },
  title: { fontSize: 27, lineHeight: 34, fontWeight: '800' }, subtitle: { fontSize: 14, lineHeight: 20 },
  languageButton: { minWidth: 60, height: 38, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, languageText: { fontSize: 12, fontWeight: '800' },
  empty: { minHeight: 210, padding: 24, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }, emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' }, emptyBody: { maxWidth: 320, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
