import type { RegistrationErrors, RegistrationForm } from '@/features/auth/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KU_EMAIL_PATTERN = /^[a-z0-9._%+\-]+@ku\.th$/i;
const PHONE_PATTERN = /^[0-9+\-\s]{9,20}$/;

export function validatePassword(password: string) {
  if (password.length < 8) return 'passwordLength' as const;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'passwordFormat' as const;
  }
  return undefined;
}

export function validateRegistration(form: RegistrationForm): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const email = form.email.trim().toLowerCase();

  if (!form.displayName.trim()) errors.displayName = 'required';
  if (!EMAIL_PATTERN.test(email)) errors.email = 'invalidEmail';
  if (form.role === 'student' && !KU_EMAIL_PATTERN.test(email)) errors.email = 'kuEmailOnly';
  if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'invalidPhone';

  errors.password = validatePassword(form.password);

  if (form.confirmPassword !== form.password) errors.confirmPassword = 'passwordMismatch';

  if (form.role === 'employer') {
    if (!form.companyName.trim()) errors.companyName = 'required';
    if (!form.businessCategory) errors.businessCategory = 'required';
    if (form.businessCategory === 'other' && !form.customCategory.trim()) errors.customCategory = 'required';
    if (!form.address.trim()) errors.address = 'required';
  }

  return errors;
}
