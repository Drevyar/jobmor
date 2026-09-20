import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginAccount } from '@/features/auth/auth-service';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';
import type { UserRole } from '@/types/user';

const HOME_BY_ROLE: Record<UserRole, Href> = {
  student: '/(student)/home',
  employer: '/(employer)/dashboard',
  admin: '/(admin)/dashboard',
};

export function LoginForm({ onBack }: { onBack: () => void }) {
  const colors = useTheme();
  const { t, toggleLanguage } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.loginRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const role = await loginAccount(email, password);
      router.replace(HOME_BY_ROLE[role]);
    } catch (submitError) {
      const detail = submitError instanceof Error ? submitError.message : '';
      setError(`${t('auth.loginFailed')}${detail ? ` (${detail})` : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Pressable onPress={onBack} accessibilityLabel={t('auth.back')} style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="arrow-back" size={21} color={colors.text} />
            </Pressable>
            <Pressable onPress={toggleLanguage} style={[styles.languageButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="language-outline" size={18} color={colors.primary} />
              <Text style={[styles.languageText, { color: colors.primary }]}>{t('common.language')}</Text>
            </Pressable>
          </View>

          <View style={[styles.loginIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="log-in-outline" size={38} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.loginTitle')}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t('auth.loginHint')}</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth.email')}</Text>
              <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth.password')}</Text>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} onSubmitEditing={submit} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} />
            </View>
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger, backgroundColor: colors.surface }]}>{error}</Text> : null}

          <Pressable disabled={submitting} onPress={submit} style={[styles.primaryButton, { backgroundColor: colors.primary }, submitting && styles.disabled]}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />}
            <Text style={styles.primaryButtonText}>{t(submitting ? 'auth.loggingIn' : 'auth.login')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center', padding: 24 },
  topBar: { position: 'absolute', top: 20, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  languageButton: { height: 38, paddingHorizontal: 11, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  languageText: { fontSize: 12, fontWeight: '800' },
  loginIcon: { width: 76, height: 76, borderRadius: 25, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 20, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  hint: { marginTop: 7, marginBottom: 26, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  form: { gap: 15 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 },
  error: { marginTop: 16, padding: 13, borderRadius: 13, fontSize: 12, lineHeight: 18 },
  primaryButton: { minHeight: 52, marginTop: 22, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.65 },
});
