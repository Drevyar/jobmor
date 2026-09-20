import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { LocalizationProvider } from '@/providers/localization-provider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const scheme = useColorScheme();
  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);
  if (!fontsLoaded && !fontError) return null;

  return (
    <LocalizationProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack initialRouteName="(auth)" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(employer)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </LocalizationProvider>
  );
}
