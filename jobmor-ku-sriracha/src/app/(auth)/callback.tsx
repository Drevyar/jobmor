import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmEmailFromUrl } from '@/features/auth/auth-service';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/providers/localization-provider';

type ConfirmationStatus = 'checking' | 'success' | 'error';

export default function AuthCallbackScreen() {
  const colors = useTheme();
  const { t } = useTranslation();
  const linkingUrl = Linking.useLinkingURL();
  const processedUrls = useRef(new Set<string>());
  const [status, setStatus] = useState<ConfirmationStatus>('checking');
  const [errorDetail, setErrorDetail] = useState('');

  const processUrl = useCallback(async (url: string | null) => {
    if (!url || processedUrls.current.has(url)) return;
    processedUrls.current.add(url);
    setStatus('checking');

    try {
      await confirmEmailFromUrl(url);
      setStatus('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[AuthCallback] Email confirmation failed:', message);
      setErrorDetail(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void processUrl(url);
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      void Promise.resolve().then(() => processUrl(window.location.href));
    } else {
      void Linking.getInitialURL().then(processUrl);
    }

    return () => subscription.remove();
  }, [processUrl]);

  useEffect(() => {
    if (linkingUrl) void Promise.resolve().then(() => processUrl(linkingUrl));
  }, [linkingUrl, processUrl]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (processedUrls.current.size === 0) {
        setErrorDetail('No confirmation code or token was received by the app.');
        setStatus('error');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const isChecking = status === 'checking';
  const isSuccess = status === 'success';
  const title = isChecking
    ? t('auth.verifyingEmail')
    : isSuccess
      ? t('auth.verifiedTitle')
      : t('auth.emailVerificationFailed');
  const body = isChecking
    ? t('auth.verifyingEmailBody')
    : isSuccess
      ? t('auth.verifiedBody')
      : t('auth.emailVerificationFailedBody');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: isSuccess ? colors.primarySoft : colors.surface }]}>
          {isChecking ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Ionicons
              name={isSuccess ? 'checkmark-circle' : 'alert-circle'}
              size={56}
              color={isSuccess ? colors.primary : colors.danger}
            />
          )}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>{body}</Text>
        {status === 'error' && errorDetail ? (
          <Text selectable style={[styles.errorDetail, { color: colors.danger }]}>{errorDetail}</Text>
        ) : null}
        {!isChecking && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace(isSuccess ? '/' : '/login')}
            style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              {isSuccess ? t('auth.continueToApp') : t('auth.backToLogin')}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 24, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  body: { marginTop: 10, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  errorDetail: { marginTop: 12, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  button: {
    width: '100%',
    minHeight: 52,
    marginTop: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
