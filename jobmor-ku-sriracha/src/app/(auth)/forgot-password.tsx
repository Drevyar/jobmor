import { router } from 'expo-router';

import { ForgotPasswordForm } from '@/features/auth/forgot-password-form';

export default function ForgotPasswordScreen() {
  return <ForgotPasswordForm onBack={() => router.back()} />;
}
