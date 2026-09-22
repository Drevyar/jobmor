import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { LocalizationProvider, useTranslation } from '@/providers/localization-provider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const scheme = useColorScheme();

  return (
    <LocalizationProvider>
      <AuthProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <RootNavigator fontsReady={fontsLoaded || !!fontError} />
      </AuthProvider>
    </LocalizationProvider>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { session, role, isLoading, error, retry } = useAuth();
  const colors = useTheme();
  const { t } = useTranslation();
  const segments = useSegments() as string[];
  const isRecoveryRoute = segments[0] === '(auth)' && segments[1] === 'reset-password';

  useEffect(() => {
    if (fontsReady && (!isLoading || isRecoveryRoute)) void SplashScreen.hideAsync();
  }, [fontsReady, isLoading, isRecoveryRoute]);

  // Recovery establishes a session itself. Keep its form mounted while the
  // auth provider loads the profile, otherwise it consumes the link again.
  if (!fontsReady || (isLoading && !isRecoveryRoute)) return null;

  if (error && !isRecoveryRoute) {
    return (
      <View style={[styles.errorScreen, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={42} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{t('auth.sessionLoadFailed')}</Text>
        <Text style={[styles.errorBody, { color: colors.textMuted }]}>{error}</Text>
        <Pressable onPress={retry} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.retryText, { color: colors.onPrimary }]}>{t('auth.tryAgain')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session || isRecoveryRoute}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && role === 'student'}>
        <Stack.Screen name="(student)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && role === 'employer'}>
        <Stack.Screen name="(employer)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && role === 'admin'}>
        <Stack.Screen name="(admin)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorBody: {
    marginTop: 8,
    maxWidth: 460,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 46,
    marginTop: 20,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
