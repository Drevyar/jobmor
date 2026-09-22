import Ionicons from '@expo/vector-icons/Ionicons';
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

import { requestPasswordReset } from '@/features/auth/auth-service';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resetRequestErrorKey(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const code = typeof error === 'object' && error && 'code' in error
    ? String(error.code)
    : '';

  if (message.includes('email address not authorized')) {
    return 'auth.resetEmailUnauthorized';
  }
  if (code === 'over_email_send_rate_limit' || message.includes('email rate limit')) {
    return 'auth.resetHourlyRateLimited';
  }
  if (code === 'over_request_rate_limit' || message.includes('after') && message.includes('seconds')) {
    return 'auth.resetCooldown';
  }
  if (message.includes('redirect')) {
    return 'auth.resetRedirectNotAllowed';
  }
  return 'auth.resetRequestFailed';
}

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const colors = useTheme();
  const { t, toggleLanguage } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await requestPasswordReset(normalizedEmail);
      setSent(true);
    } catch (requestError) {
      setError(t(resetRequestErrorKey(requestError)));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="mail-unread-outline" size={38} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.resetEmailSent')}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t('auth.resetEmailSentBody')}</Text>
          <Pressable onPress={onBack} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{t('auth.backToLogin')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centeredContent}>
          <View style={styles.topBar}>
            <Pressable onPress={onBack} accessibilityLabel={t('auth.back')} style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="arrow-back" size={21} color={colors.text} />
            </Pressable>
            <Pressable onPress={toggleLanguage} style={[styles.languageButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="language-outline" size={18} color={colors.primary} />
              <Text style={[styles.languageText, { color: colors.primary }]}>{t('common.language')}</Text>
            </Pressable>
          </View>

          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="key-outline" size={38} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.forgotPasswordTitle')}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t('auth.forgotPasswordHint')}</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>{t('auth.email')}</Text>
            <TextInput
              value={email}
              onChangeText={(value) => { setEmail(value); setError(''); }}
              onSubmitEditing={submit}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border }]}
            />
            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          </View>

          <Pressable disabled={submitting} onPress={submit} style={[styles.primaryButton, { backgroundColor: colors.primary }, submitting && styles.disabled]}>
            {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Ionicons name="send-outline" size={19} color={colors.onPrimary} />}
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{t(submitting ? 'auth.sendingResetEmail' : 'auth.sendResetEmail')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  centeredContent: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center', padding: 24 },
  topBar: { position: 'absolute', top: 20, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  languageButton: { height: 38, paddingHorizontal: 11, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  languageText: { fontSize: 12, fontWeight: '800' },
  heroIcon: { width: 76, height: 76, borderRadius: 25, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 20, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  hint: { marginTop: 7, marginBottom: 26, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 },
  error: { fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 52, marginTop: 22, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  disabled: { opacity: 0.65 },
});
