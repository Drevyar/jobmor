import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const adminKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.EMPLOYER_EMAIL?.trim().toLowerCase();

if (!supabaseUrl || !adminKey || !email) {
  throw new Error(
    'Set SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY and EMPLOYER_EMAIL in .employer-admin.env.',
  );
}

const supabase = createClient(supabaseUrl, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, role')
  .eq('email', email)
  .maybeSingle();

if (profileError) throw profileError;
if (!profile || profile.role !== 'employer') {
  throw new Error('No existing employer profile matches EMPLOYER_EMAIL. No account was changed.');
}

let authUser;
let page = 1;

while (!authUser) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;

  authUser = data.users.find(user => user.email?.trim().toLowerCase() === email);
  if (authUser || data.nextPage === null) break;
  page = data.nextPage;
}

if (!authUser || authUser.id !== profile.id) {
  throw new Error('The Auth user does not match the existing employer profile. No account was changed.');
}

if (authUser.email_confirmed_at) {
  console.log('This employer account email is already confirmed.');
} else {
  const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
    email_confirm: true,
  });

  if (error) throw error;
  if (!data.user.email_confirmed_at) {
    throw new Error('Supabase did not return a confirmed email timestamp.');
  }

  console.log('Confirmed the existing employer account email.');
}
