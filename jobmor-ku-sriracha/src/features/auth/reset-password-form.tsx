import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
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

import { createRecoverySessionFromUrl, updatePassword } from '@/features/auth/auth-service';
import { validatePassword } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

type RecoveryState = 'checking' | 'ready' | 'invalid' | 'complete';

export function ResetPasswordForm({ onBackToLogin }: { onBackToLogin: () => void }) {
  const colors = useTheme();
  const { t } = useTranslation();
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const incomingUrl = Linking.useLinkingURL();

  useEffect(() => {
    let active = true;

    const handleUrl = async (url: string | null) => {
      if (!url) {
        if (active) setRecoveryState('invalid');
        return;
      }

      try {
        await createRecoverySessionFromUrl(url);
        if (active) setRecoveryState('ready');
      } catch {
        if (active) setRecoveryState('invalid');
      }
    };

    if (incomingUrl) {
      void handleUrl(incomingUrl);
    } else {
      void Linking.getInitialURL().then(handleUrl);
    }

    return () => {
      active = false;
    };
  }, [incomingUrl]);

  const submit = async () => {
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(t(`auth.${passwordError}`));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await updatePassword(password);
      setRecoveryState('complete');
    } catch {
      setError(t('auth.passwordUpdateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (recoveryState === 'checking') {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statusText, { color: colors.textMuted }]}>{t('auth.checkingResetLink')}</Text>
      </SafeAreaView>
    );
  }

  if (recoveryState === 'invalid' || recoveryState === 'complete') {
    const complete = recoveryState === 'complete';
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={complete ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={42} color={complete ? colors.primary : colors.danger} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t(complete ? 'auth.passwordUpdated' : 'auth.invalidResetLink')}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t(complete ? 'auth.passwordUpdatedBody' : 'auth.invalidResetLinkBody')}</Text>
          <Pressable onPress={onBackToLogin} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
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
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="lock-closed-outline" size={38} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.newPasswordTitle')}</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t('auth.newPasswordHint')}</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth.newPassword')}</Text>
              <TextInput value={password} onChangeText={(value) => { setPassword(value); setError(''); }} secureTextEntry autoCapitalize="none" autoCorrect={false} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border }]} />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth.confirmPassword')}</Text>
              <TextInput value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setError(''); }} onSubmitEditing={submit} secureTextEntry autoCapitalize="none" autoCorrect={false} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border }]} />
            </View>
            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          </View>

          <Pressable disabled={submitting} onPress={submit} style={[styles.primaryButton, { backgroundColor: colors.primary }, submitting && styles.disabled]}>
            {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Ionicons name="shield-checkmark-outline" size={19} color={colors.onPrimary} />}
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{t(submitting ? 'auth.updatingPassword' : 'auth.updatePassword')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  statusText: { fontSize: 13 },
  centeredContent: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center', padding: 24 },
  heroIcon: { width: 76, height: 76, borderRadius: 25, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 20, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  hint: { marginTop: 7, marginBottom: 26, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  form: { gap: 15 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 },
  error: { fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 52, marginTop: 22, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  disabled: { opacity: 0.65 },
});
