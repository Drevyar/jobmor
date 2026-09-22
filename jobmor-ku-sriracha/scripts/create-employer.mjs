import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.EMPLOYER_EMAIL?.trim().toLowerCase();
const password = process.env.EMPLOYER_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !email || !password) {
  throw new Error(
    'Set SUPABASE_SERVICE_ROLE_KEY, EMPLOYER_EMAIL, and EMPLOYER_PASSWORD in the terminal. The Supabase URL may come from .env or SUPABASE_URL.',
  );
}

if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
  throw new Error('EMPLOYER_PASSWORD must contain at least 8 characters, uppercase, lowercase, and a number.');
}

const employer = {
  displayName: process.env.EMPLOYER_NAME?.trim() || 'Test Employer',
  phone: process.env.EMPLOYER_PHONE?.trim() || '0000000000',
  companyName: process.env.EMPLOYER_COMPANY?.trim() || 'JobMor Test Company',
  businessCategory: process.env.EMPLOYER_CATEGORY?.trim() || 'technology',
  address: process.env.EMPLOYER_ADDRESS?.trim() || 'KU Sriracha',
};

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    role: 'employer',
    display_name: employer.displayName,
    phone: employer.phone,
    company_name: employer.companyName,
    business_category: employer.businessCategory,
    address: employer.address,
  },
});

if (createError) throw createError;

const { error: verificationError } = await supabase
  .from('profiles')
  .update({
    verification_status: 'verified',
    verified_at: new Date().toISOString(),
  })
  .eq('id', data.user.id)
  .eq('role', 'employer')
  .select('id')
  .single();

if (verificationError) {
  const { error: cleanupError } = await supabase.auth.admin.deleteUser(data.user.id);
  const cleanupMessage = cleanupError ? ` Cleanup also failed: ${cleanupError.message}` : '';
  throw new Error(`Employer profile verification failed: ${verificationError.message}.${cleanupMessage}`);
}

console.log(`Verified employer created: ${email}`);
