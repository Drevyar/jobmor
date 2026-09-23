import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, Link, router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROLE_CONFIGS } from '@/constants/roles';
import type { RegistrationRole } from '@/features/auth/types';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

export default function CreateAccountScreen() {
  const colors = useTheme();
  const { t, toggleLanguage } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.brandLockup}>
              <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
              <Text style={[styles.brand, { color: colors.text }]}>JobMor</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={toggleLanguage}
              style={({ pressed }) => [
                styles.language,
                { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.75 : 1 },
              ]}>
              <Ionicons name="language-outline" size={18} color={colors.primary} />
              <Text style={[styles.languageText, { color: colors.primary }]}>{t('common.language')}</Text>
            </Pressable>
          </View>

          <View style={[styles.intro, isWide && styles.introWide]}>
            <View style={[styles.eyebrow, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="location-outline" size={15} color={colors.primary} />
              <Text style={[styles.eyebrowText, { color: colors.primary }]}>{t('auth.welcomeEyebrow')}</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('auth.createAccount')}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('auth.chooseAccount')}</Text>
          </View>

          <View style={[styles.roles, isWide && styles.rolesWide]}>
            {(['student', 'employer'] as RegistrationRole[]).map((role) => {
              const config = ROLE_CONFIGS[role];
              return (
                <Pressable
                  key={role}
                  accessibilityRole="button"
                  accessibilityHint={t(config.descriptionKey)}
                  onPress={() => router.push(`/(auth)/register?role=${role}` as Href)}
                  style={({ pressed }) => [
                    styles.roleCard,
                    isWide && styles.roleCardWide,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
                  ]}>
                  <View style={[styles.roleIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name={config.icon} size={26} color={colors.primary} />
                  </View>
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleTitle, { color: colors.text }]}>{t(config.labelKey)}</Text>
                    <Text style={[styles.roleBody, { color: colors.textMuted }]}>{t(config.descriptionKey)}</Text>
                  </View>
                  <View style={[styles.arrowCircle, { backgroundColor: colors.surfaceMuted }]}>
                    <Ionicons name="arrow-forward" size={17} color={colors.primary} />
                  </View>
                </Pressable>
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
            <Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} />
            <Text style={[styles.trustText, { color: colors.textMuted }]}>{t('auth.secureAccountNote')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  content: { width: '100%', maxWidth: 920, alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 42, height: 42, borderRadius: 13 },
  brand: { fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  language: { height: 42, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  languageText: { fontSize: 13, fontWeight: '800' },
  intro: { alignItems: 'center', marginTop: 52, marginBottom: 30 },
  introWide: { marginTop: 64, marginBottom: 38 },
  eyebrow: { minHeight: 30, paddingHorizontal: 11, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrowText: { fontSize: 12, fontWeight: '700' },
  title: { marginTop: 14, fontSize: 32, lineHeight: 40, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' },
  subtitle: { marginTop: 7, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  roles: { gap: 12 },
  rolesWide: { flexDirection: 'row', gap: 18 },
  roleCard: { minHeight: 116, borderRadius: 20, borderWidth: 1, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 15 },
  roleCardWide: { flex: 1, minHeight: 182, alignItems: 'flex-start', padding: 22, gap: 13 },
  roleIcon: { width: 56, height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  roleCopy: { flex: 1, gap: 5 },
  roleTitle: { fontSize: 18, fontWeight: '800' },
  roleBody: { fontSize: 14, lineHeight: 20 },
  arrowCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  signInRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 },
  signInPrompt: { fontSize: 14 },
  signInLink: { fontSize: 14, fontWeight: '800' },
  trustNote: { maxWidth: 680, minHeight: 62, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 27, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 16 },
  trustText: { flexShrink: 1, fontSize: 13, lineHeight: 19 },
});
