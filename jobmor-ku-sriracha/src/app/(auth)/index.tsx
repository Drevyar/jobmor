import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALL_ROLES, ROLE_CONFIGS } from '@/constants/roles';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

export default function RolePreviewScreen() {
  const colors = useTheme();
  const { t, toggleLanguage } = useTranslation();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={toggleLanguage} style={[styles.language, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="language-outline" size={18} color={colors.primary} /><Text style={[styles.languageText, { color: colors.primary }]}>{t('common.language')}</Text>
        </Pressable>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={[styles.brand, { color: colors.text }]}>JobMor</Text>
        <Text style={[styles.title, { color: colors.text }]}>{t('role.choose')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('role.preview')}</Text>
        <View style={styles.roles}>
          {ALL_ROLES.map((role) => {
            const config = ROLE_CONFIGS[role];
            return (
              <Pressable key={role} onPress={() => router.replace(config.entryHref as never)} style={[styles.roleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.roleIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name={config.icon} size={27} color={colors.primary} /></View>
                <View style={styles.roleCopy}><Text style={[styles.roleTitle, { color: colors.text }]}>{t(config.labelKey)}</Text><Text style={[styles.roleBody, { color: colors.textMuted }]}>{t(config.descriptionKey)}</Text></View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'center', padding: 24, paddingVertical: 40 },
  language: { position: 'absolute', top: 20, right: 24, height: 38, borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }, languageText: { fontSize: 12, fontWeight: '800' },
  logo: { width: 88, height: 88, borderRadius: 22, alignSelf: 'center' }, brand: { marginTop: 12, fontSize: 31, fontWeight: '900', textAlign: 'center' },
  title: { marginTop: 28, fontSize: 24, fontWeight: '800', textAlign: 'center' }, subtitle: { marginTop: 7, marginBottom: 22, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  roles: { gap: 12 }, roleCard: { minHeight: 88, borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 }, roleIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, roleCopy: { flex: 1, gap: 3 }, roleTitle: { fontSize: 16, fontWeight: '800' }, roleBody: { fontSize: 12, lineHeight: 17 },
});
