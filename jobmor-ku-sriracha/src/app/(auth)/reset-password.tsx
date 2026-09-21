import { router } from 'expo-router';

import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export default function ResetPasswordScreen() {
  return <ResetPasswordForm onBackToLogin={() => router.replace('/(auth)/login')} />;
}
