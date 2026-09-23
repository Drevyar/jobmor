import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, Link } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROLE_CONFIGS } from '@/constants/roles';
import type { RegistrationRole } from '@/features/auth/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

export default function AuthLandingScreen() {
  const colors = useTheme();
  const { t, toggleLanguage } = useTranslation();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <View style={styles.brandLockup}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
            <Text style={[styles.brand, { color: colors.text }]}>JobMor</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={toggleLanguage}
            style={[styles.language, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="language-outline" size={17} color={colors.primary} />
            <Text style={[styles.languageText, { color: colors.primary }]}>{t('common.language')}</Text>
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{t('auth.welcomeEyebrow')}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.createAccount')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('auth.chooseAccount')}</Text>
        </View>

        <View style={styles.roles}>
          {(['student', 'employer'] as RegistrationRole[]).map((role) => {
            const config = ROLE_CONFIGS[role];
            return (
              <Link href={`/(auth)/register?role=${role}` as Href} asChild key={role}>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.roleCard,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.84 : 1 },
                  ]}>
                  <View style={[styles.roleIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name={config.icon} size={25} color={colors.primary} />
                  </View>
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleTitle, { color: colors.text }]}>{t(config.labelKey)}</Text>
                    <Text style={[styles.roleBody, { color: colors.textMuted }]}>{t(config.descriptionKey)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </Pressable>
              </Link>
            );
          })}
        </View>

        <View style={styles.signInRow}>
          <Text style={[styles.signInPrompt, { color: colors.textMuted }]}>{t('auth.haveAccount')}</Text>
          <Link href={'/(auth)/login' as Href} asChild>
            <Pressable accessibilityRole="link" hitSlop={8}>
              <Text style={[styles.signInLink, { color: colors.primary }]}>{t('auth.login')}</Text>
            </Pressable>
          </Link>
        </View>

        <View style={[styles.trustNote, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={[styles.trustText, { color: colors.textMuted }]}>{t('auth.secureAccountNote')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 36 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 36, height: 36, borderRadius: 11 },
  brand: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  language: { height: 38, borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  languageText: { fontSize: 12, fontWeight: '800' },
  intro: { marginTop: 56, marginBottom: 26 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { marginTop: 9, fontSize: 30, lineHeight: 38, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22 },
  roles: { gap: 12 },
  roleCard: { minHeight: 92, borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  roleIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  roleCopy: { flex: 1, gap: 4 },
  roleTitle: { fontSize: 16, fontWeight: '700' },
  roleBody: { fontSize: 13, lineHeight: 18 },
  signInRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 28 },
  signInPrompt: { fontSize: 14 },
  signInLink: { fontSize: 14, fontWeight: '800' },
  trustNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, padding: 13, borderRadius: 14 },
  trustText: { fontSize: 12, lineHeight: 17, flexShrink: 1 },
});
