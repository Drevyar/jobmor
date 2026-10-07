import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import type { Database } from '@/types/database.generated';
import { createSessionStorage } from './session-storage';

// จุดเชื่อม backend: อ่าน URL และ publishable key จาก .env (ดูชื่อใน .env.example)
// แอปส่งคำขอผ่าน Supabase API; ไม่ได้เปิดการเชื่อมต่อ PostgreSQL โดยตรง
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env and add the project URL and publishable key.',
  );
}

const webStorage = {
  getItem: (key: string) =>
    typeof window === 'undefined' ? null : window.localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
};

const nativeStorage = createSessionStorage({
  getItem: key => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  removeItem: key => SecureStore.deleteItemAsync(key),
}, AsyncStorage);

// client กลางที่ service ทุกส่วน import ไปใช้: .from() ติดต่อข้อมูล, .auth ติดต่อ Auth,
// .rpc() เรียกฟังก์ชัน SQL และ .functions.invoke() เรียก Edge Function
// สิทธิ์ข้อมูลฝั่งแอปยังถูกตรวจด้วย RLS ในฐานข้อมูล; publishable key ไม่ใช่ service role key
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : nativeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Keeps token refresh active only while the native app is in the foreground.
 * Called from AuthProvider; the returned cleanup function stops refresh on unmount.
 */
export function startSupabaseAutoRefresh() {
  if (Platform.OS === 'web') return () => undefined;

  const handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  };

  handleAppStateChange(AppState.currentState);
  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
  };
}
