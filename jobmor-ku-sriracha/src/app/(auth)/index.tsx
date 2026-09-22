import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href, router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROLE_CONFIGS } from '@/constants/roles';
import type { RegistrationRole } from '@/features/auth/types';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';
import { useTranslation } from '@/providers/localization-provider';

export default function RolePreviewScreen() {
  const colors = useTheme();
  const { t, toggleLanguage } = useTranslation();
  const { setDemoRole } = useAuth();

  const handlePreview = (role: 'admin' | 'student' | 'employer', href: string) => {
    setDemoRole(role);
    router.replace(href as Href);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={toggleLanguage} style={[styles.language, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="language-outline" size={18} color={colors.primary} />
          <Text style={[styles.languageText, { color: colors.primary }]}>{t('common.language')}</Text>
        </Pressable>

        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={[styles.brand, { color: colors.text }]}>JobMor</Text>

        {/* Sign In Button */}
        <Link href="/login" asChild>
          <Pressable style={[styles.loginButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="log-in-outline" size={20} color={colors.onPrimary} />
            <Text style={[styles.loginButtonText, { color: colors.onPrimary }]}>{t('auth.login')}</Text>
          </Pressable>
        </Link>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t('auth.orRegister')}</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Create Account Options */}
        <Text style={[styles.title, { color: colors.text }]}>{t('auth.createAccount')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('auth.chooseAccount')}</Text>

        <View style={styles.roles}>
          {(['student', 'employer'] as RegistrationRole[]).map((role) => {
            const config = ROLE_CONFIGS[role];
            return (
              <Link key={role} href={`/register?role=${role}` as Href} asChild>
                <Pressable
                  style={[
                    styles.roleCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <View style={[styles.roleIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name={config.icon} size={27} color={colors.primary} />
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

        {/* Development Quick Role Preview */}
        <View style={[styles.devBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.devTitle, { color: colors.textMuted }]}>
            🛠️ Dev Preview (สำหรับดูหน้าจอระหว่างพัฒนา)
          </Text>
          <View style={styles.devRow}>
            <Pressable
              onPress={() => handlePreview('admin', '/(admin)/dashboard')}
              style={[styles.devBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
              <Ionicons name="shield-checkmark" size={15} color={colors.primary} />
              <Text style={[styles.devBtnText, { color: colors.primary }]}>Admin Workspace</Text>
            </Pressable>
            <Pressable
              onPress={() => handlePreview('student', '/(student)/home')}
              style={[styles.devBtn, { borderColor: colors.border }]}>
              <Ionicons name="school-outline" size={15} color={colors.text} />
              <Text style={[styles.devBtnText, { color: colors.text }]}>Student</Text>
            </Pressable>
            <Pressable
              onPress={() => handlePreview('employer', '/(employer)/dashboard')}
              style={[styles.devBtn, { borderColor: colors.border }]}>
              <Ionicons name="business-outline" size={15} color={colors.text} />
              <Text style={[styles.devBtnText, { color: colors.text }]}>Employer</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'center', padding: 24, paddingVertical: 40 },
  language: { position: 'absolute', top: 20, right: 24, height: 38, borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  languageText: { fontSize: 12, fontWeight: '800' },
  logo: { width: 88, height: 88, borderRadius: 22, alignSelf: 'center' },
  brand: { marginTop: 12, fontSize: 31, fontWeight: '900', textAlign: 'center' },
  loginButton: { minHeight: 52, marginTop: 28, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  loginButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  dividerRow: { marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '700' },
  title: { marginTop: 20, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { marginTop: 7, marginBottom: 22, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  roles: { gap: 12 },
  roleCard: { minHeight: 88, borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  roleIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  roleCopy: { flex: 1, gap: 3 },
  roleTitle: { fontSize: 16, fontWeight: '800' },
  roleBody: { fontSize: 12, lineHeight: 17 },
  devBox: { marginTop: 32, padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  devTitle: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  devRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  devBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  devBtnText: { fontSize: 13, fontWeight: '700' },
});
