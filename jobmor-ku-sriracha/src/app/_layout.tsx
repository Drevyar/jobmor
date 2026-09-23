import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { LocalizationProvider } from '@/providers/localization-provider';

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
  const { session, role, isLoading } = useAuth();
  const segments = useSegments() as string[];
  const isRecoveryRoute = segments[0] === '(auth)' && segments[1] === 'reset-password';

  useEffect(() => {
    if (fontsReady && (!isLoading || isRecoveryRoute)) void SplashScreen.hideAsync();
  }, [fontsReady, isLoading, isRecoveryRoute]);

  // Recovery establishes a session itself. Keep its form mounted while the
  // auth provider loads the profile, otherwise it consumes the link again.
  if (!fontsReady || (isLoading && !isRecoveryRoute)) return null;

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
