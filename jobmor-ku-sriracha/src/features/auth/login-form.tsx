import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginAccount, resendSignupConfirmation } from '@/features/auth/auth-service';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';
import { useTranslation } from '@/providers/localization-provider';

export function LoginForm({ onBack }: { onBack: () => void }) {
  const colors = useTheme();
  const { t, toggleLanguage } = useTranslation();
  const { error: sessionError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.loginRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    setCanResendConfirmation(false);
    setResendMessage('');
    try {
      await loginAccount(email, password);
    } catch (submitError) {
      const detail = submitError instanceof Error ? submitError.message : '';
      const normalizedDetail = detail.toLowerCase();
      setCanResendConfirmation(normalizedDetail.includes('email not confirmed') || normalizedDetail.includes('email_not_confirmed'));
      setError(`${t('auth.loginFailed')}${detail ? ` (${detail})` : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resendConfirmation = async () => {
    setResendingConfirmation(true);
    setResendMessage('');
    try {
      await resendSignupConfirmation(email);
      setResendMessage(t('auth.confirmationResent'));
    } catch (resendError) {
      const detail = resendError instanceof Error ? resendError.message : '';
      setResendMessage(detail || t('auth.confirmationResendFailed'));
    } finally {
      setResendingConfirmation(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('auth.back')}
                onPress={onBack}
                style={({ pressed }) => [styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.75 : 1 }]}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={toggleLanguage}
                style={({ pressed }) => [styles.languageButton, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.75 : 1 }]}>
                <Ionicons name="language-outline" size={17} color={colors.primary} />
                <Text style={[styles.languageText, { color: colors.primary }]}>{t('common.language')}</Text>
              </Pressable>
            </View>

            <View style={styles.heading}>
              <View style={[styles.loginIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="lock-closed-outline" size={27} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{t('auth.loginTitle')}</Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>{t('auth.loginHint')}</Text>
            </View>

            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>{t('auth.email')}</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    accessibilityLabel={t('auth.email')}
                    value={email}
                    onChangeText={(value) => { setEmail(value); if (error) setError(''); setCanResendConfirmation(false); setResendMessage(''); }}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="next"
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>{t('auth.password')}</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="key-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    accessibilityLabel={t('auth.password')}
                    value={password}
                    onChangeText={(value) => { setPassword(value); if (error) setError(''); }}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    textContentType="password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="go"
                    onSubmitEditing={() => void submit()}
                    style={[styles.input, styles.passwordInput, { color: colors.text }]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}
                    hitSlop={8}
                    onPress={() => setShowPassword((value) => !value)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>

              <Link href={'/(auth)/forgot-password' as Href} asChild>
                <Pressable accessibilityRole="link" style={styles.forgotButton}>
                  <Text style={[styles.forgotText, { color: colors.primary }]}>{t('auth.forgotPassword')}</Text>
                </Pressable>
              </Link>

              {error ? (
                <View accessibilityLiveRegion="polite" style={[styles.errorBox, { backgroundColor: colors.danger + '12' }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                  <View style={styles.errorContent}>
                    <Text style={[styles.error, { color: colors.danger }]}>{error || t('auth.sessionLoadFailed')}</Text>
                    {canResendConfirmation ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={resendingConfirmation || !email.trim()}
                        onPress={() => void resendConfirmation()}
                        style={styles.resendAction}>
                        <Text style={[styles.resendActionText, { color: colors.primary }]}>
                          {t(resendingConfirmation ? 'auth.sendingEmail' : 'auth.resendConfirmation')}
                        </Text>
                      </Pressable>
                    ) : null}
                    {resendMessage ? <Text style={[styles.error, { color: colors.primary }]}>{resendMessage}</Text> : null}
                  </View>
                </View>
              ) : null}

              {!error && sessionError ? (
                <View accessibilityLiveRegion="polite" style={[styles.errorBox, { backgroundColor: colors.danger + '12' }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                  <Text style={[styles.error, { color: colors.danger }]}>{t('auth.sessionLoadFailed')}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() => void submit()}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : pressed ? 0.86 : 1 }]}>
                {submitting ? <ActivityIndicator color={colors.onPrimary} /> : null}
                <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{t(submitting ? 'auth.loggingIn' : 'auth.login')}</Text>
                {!submitting ? <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} /> : null}
              </Pressable>
            </View>

            <View style={styles.registerRow}>
              <Text style={[styles.registerPrompt, { color: colors.textMuted }]}>{t('auth.noAccount')}</Text>
              <Link href={'/(auth)/create-account' as Href} asChild>
                <Pressable accessibilityRole="link" hitSlop={8}>
                  <Text style={[styles.registerLink, { color: colors.primary }]}>{t('auth.createAccount')}</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 26 },
  container: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  languageButton: { height: 38, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  languageText: { fontSize: 12, fontWeight: '800' },
  heading: { alignItems: 'center', marginTop: 34, marginBottom: 24 },
  loginIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 17, fontSize: 28, lineHeight: 35, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  hint: { marginTop: 7, maxWidth: 330, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  formCard: { padding: 20, borderWidth: 1, borderRadius: 20, gap: 18, shadowColor: '#10231D', shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700' },
  inputWrap: { minHeight: 52, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, minWidth: 0, minHeight: 50, paddingVertical: 0, fontSize: 15 },
  passwordInput: { paddingRight: 2 },
  forgotButton: { alignSelf: 'flex-end', marginTop: -7, paddingVertical: 3 },
  forgotText: { fontSize: 13, fontWeight: '700' },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 11, borderRadius: 12 },
  error: { flex: 1, fontSize: 12, lineHeight: 18 },
  errorContent: { flex: 1, gap: 6 },
  resendAction: { alignSelf: 'flex-start', paddingVertical: 3 },
  resendActionText: { fontSize: 12, fontWeight: '800' },
  primaryButton: { minHeight: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 16 },
  primaryButtonText: { fontSize: 15, fontWeight: '800' },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 22 },
  registerPrompt: { fontSize: 13 },
  registerLink: { fontSize: 13, fontWeight: '800' },
});
