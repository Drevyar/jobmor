import { router, useLocalSearchParams } from 'expo-router';

import { RegisterForm } from '@/features/auth/register-form';
import type { RegistrationRole } from '@/features/auth/types';

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const initialRole: RegistrationRole = role === 'employer' ? 'employer' : 'student';

  return <RegisterForm initialRole={initialRole} onBack={() => router.back()} />;
}
