import { supabase } from '@/lib/supabase';
import type { RegistrationForm } from '@/features/auth/types';
import type { UserRole } from '@/types/user';

const EMAIL_REDIRECT_URL = 'jobmorkusriracha://auth/callback';

export async function registerAccount(form: RegistrationForm) {
  const commonMetadata = {
    role: form.role,
    display_name: form.displayName.trim(),
    phone: form.phone.trim(),
  };

  const employerMetadata = form.role === 'employer'
    ? {
        company_name: form.companyName.trim(),
        business_category: form.businessCategory === 'other'
          ? form.customCategory.trim()
          : form.businessCategory,
        address: form.address.trim(),
      }
    : {};

  const { data, error } = await supabase.auth.signUp({
    email: form.email.trim().toLowerCase(),
    password: form.password,
    options: {
      emailRedirectTo: EMAIL_REDIRECT_URL,
      data: { ...commonMetadata, ...employerMetadata },
    },
  });

  if (error) throw error;
  return data;
}

export async function loginAccount(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw profileError ?? new Error('User profile was not found.');
  }

  return profile.role as UserRole;
}

export async function logoutAccount() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
