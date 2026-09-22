import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, modules) {
  const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, URLSearchParams, require(name) {
    assert.ok(name in modules, `Unexpected import: ${name}`);
    return modules[name];
  } });
  return exports;
}

function recoveryService() {
  const calls = [];
  const auth = Object.fromEntries(['setSession', 'exchangeCodeForSession', 'resetPasswordForEmail'].map(name =>
    [name, async (...args) => { calls.push([name, ...args]); return { error: null }; }]));
  const api = load('../src/features/auth/auth-service.ts', {
    'expo-linking': { createURL: path => `exp://192.168.1.10:8081/--/${path}` },
    '@/lib/supabase': { supabase: { auth } },
  });
  return { api, calls };
}

test('Expo Go reset requests use an app callback, never localhost:3000', async () => {
  const { api, calls } = recoveryService();
  await api.requestPasswordReset(' Test@example.com ');
  assert.equal(calls[0][1], 'test@example.com');
  assert.equal(calls[0][2].redirectTo, 'exp://192.168.1.10:8081/--/reset-password');
});

test('recovery accepts native token fragments and web PKCE codes', async () => {
  const { api, calls } = recoveryService();
  await api.createRecoverySessionFromUrl('exp://192.168.1.10:8081/--/reset-password#access_token=test-access&refresh_token=test-refresh&type=recovery');
  assert.equal(calls[0][0], 'setSession');
  assert.equal(calls[0][1].access_token, 'test-access');
  await api.createRecoverySessionFromUrl('http://localhost:8081/reset-password?code=test-code');
  assert.equal(calls[1][0], 'exchangeCodeForSession');
  assert.equal(calls[1][1], 'test-code');
});

test('invalid or expired links never establish a session', async () => {
  const { api, calls } = recoveryService();
  await assert.rejects(api.createRecoverySessionFromUrl('exp://host/--/reset-password'), /missing or expired/);
  await assert.rejects(api.createRecoverySessionFromUrl('exp://host/--/reset-password#access_token=partial'), /missing or expired/);
  await assert.rejects(api.createRecoverySessionFromUrl('exp://host/--/reset-password#error_description=Link+expired'), /Link expired/);
  assert.equal(calls.length, 0);
});

const jsx = (type, props) => ({ type, props });
const ui = { jsx, jsxs: jsx };

test('recovery navigator remains mounted through session loading and profile errors', () => {
  let auth = { session: null, role: null, isLoading: false, error: null };
  let segments = ['(auth)', 'reset-password'];
  const Stack = Object.assign(() => null, { Protected: 'Protected', Screen: 'Screen' });
  const { default: RootLayout } = load('../src/app/_layout.tsx', {
    'react/jsx-runtime': ui,
    '@expo/vector-icons/Ionicons': { default: { font: {} } },
    'expo-font': { useFonts: () => [true, null] },
    'expo-router': { Stack, useSegments: () => segments },
    'expo-splash-screen': { preventAutoHideAsync: async () => {}, hideAsync: async () => {} },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    react: { useEffect: () => {} },
    'react-native': { StyleSheet: { create: value => value }, useColorScheme: () => 'light' },
    '@/hooks/use-theme': { useTheme: () => ({}) },
    '@/providers/auth-provider': { AuthProvider: 'AuthProvider', useAuth: () => auth },
    '@/providers/localization-provider': { LocalizationProvider: 'LocalizationProvider', useTranslation: () => ({ t: key => key }) },
  });
  const navigator = RootLayout().props.children.props.children[1];
  const render = () => navigator.type(navigator.props);
  for (const state of [
    { session: null, isLoading: true, error: null },
    { session: { user: {} }, isLoading: true, error: null },
    { session: { user: {} }, isLoading: false, error: 'profile unavailable' },
    { session: null, isLoading: false, error: null },
  ]) {
    auth = { ...auth, ...state };
    assert.equal(render()?.type, Stack);
    assert.equal(render().props.children[0].props.guard, true);
  }
  segments = ['(student)', 'home'];
  auth = { ...auth, isLoading: true };
  assert.equal(render(), null, 'normal routes still wait for auth');
});

test('reset form accepts PKCE and does not exchange a single-use code twice on effect replay', async () => {
  const effects = [];
  const states = [];
  let exchanges = 0;
  const { ResetPasswordForm } = load('../src/features/auth/reset-password-form.tsx', {
    'react/jsx-runtime': ui,
    '@expo/vector-icons/Ionicons': {},
    'expo-linking': { useLinkingURL: () => 'exp://host/--/reset-password?code=test-code' },
    react: {
      useState: initial => [initial, value => states.push(value)],
      useRef: initial => ({ current: initial }),
      useEffect: effect => effects.push(effect),
    },
    'react-native': { StyleSheet: { create: value => value }, Platform: { OS: 'android' } },
    'react-native-safe-area-context': {},
    '@/features/auth/auth-service': { createRecoverySessionFromUrl: async () => { exchanges++; } },
    '@/features/auth/validation': {},
    '@/hooks/use-theme': { useTheme: () => ({}) },
    '@/providers/localization-provider': { useTranslation: () => ({ t: key => key }) },
  });
  ResetPasswordForm({ onBackToLogin() {} });
  const cleanup = effects[0]();
  cleanup();
  effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(exchanges, 1);
  assert.equal(states.at(-1), 'ready');
});
