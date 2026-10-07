import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import type { EmailOtpType } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { RegistrationForm } from '@/features/auth/types';

function getEmailRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/callback`;
  }
  return Linking.createURL('callback');
}

function getAuthParams(url: string) {
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
  const fragment = url.includes('#') ? url.split('#')[1] : '';
  const params = new URLSearchParams(query);
  new URLSearchParams(fragment).forEach((value, key) => params.set(key, value));
  return params;
}

// รับ form จาก register-form.tsx → จัดรูปแบบข้อมูล → ส่งให้ Supabase Auth
// signUp สร้าง auth.users; trigger handle_new_user ใน 202609200001_auth_foundation.sql
// นำ metadata ไปสร้าง profiles และ employer_profiles (เฉพาะนายจ้าง) ในฐานข้อมูล
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
      emailRedirectTo: getEmailRedirectUrl(),
      data: { ...commonMetadata, ...employerMetadata },
    },
  });

  if (error) throw error;
  return data;
}

export async function resendSignupConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: getEmailRedirectUrl() },
  });

  if (error) throw error;
}

// รับ email/password จาก login-form.tsx → Auth ตรวจบัญชีและคืน session
// AuthProvider ฟังการเปลี่ยน session แล้วอ่าน role จาก profiles เพื่อให้ RootNavigator เลือกหน้าตามบทบาท
export async function loginAccount(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function logoutAccount() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

// รับลิงก์ยืนยันจากหน้า callback → อ่าน code/token → ส่งให้ Auth เพื่อสร้าง session
export async function confirmEmailFromUrl(url: string) {
  const params = getAuthParams(url);
  const errorDescription = params.get('error_description') ?? params.get('error');

  if (errorDescription) throw new Error(errorDescription);

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (error) throw error;
    return;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return;
  }

  throw new Error('The confirmation link is missing or expired. Check the email link and the Supabase redirect settings.');
}

// ส่งอีเมลให้ Auth ออกลิงก์กู้รหัสผ่าน; ลิงก์กลับไปหน้า reset-password
export async function requestPasswordReset(email: string) {
  const redirectTo = Linking.createURL('reset-password');
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo },
  );

  if (error) throw error;
}

export async function createRecoverySessionFromUrl(url: string) {
  const params = getAuthParams(url);
  const errorDescription = params.get('error_description');

  if (errorDescription) throw new Error(errorDescription);

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    throw new Error('Password recovery tokens are missing or expired.');
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
}

// ส่งรหัสผ่านใหม่ให้ Auth ภายใต้ recovery session แล้วให้ออกจากระบบเพื่อเข้าสู่ระบบใหม่
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;

  // Require a fresh login after changing a password.
  await logoutAccount();
}
