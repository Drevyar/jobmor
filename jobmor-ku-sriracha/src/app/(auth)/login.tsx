import { router } from 'expo-router';

import { LoginForm } from '@/features/auth/login-form';

export default function LoginScreen() {
  return <LoginForm onBack={() => (router.canGoBack() ? router.back() : router.replace('/(auth)'))} />;
}
