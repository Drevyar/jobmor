import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
  throw new Error(
    'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, and ADMIN_PASSWORD in the terminal before running this script.',
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingAdmins, error: adminLookupError } = await supabase
  .from('profiles')
  .select('id, email')
  .eq('role', 'admin');

if (adminLookupError) throw adminLookupError;
if (existingAdmins.length > 0) {
  throw new Error(`An admin already exists: ${existingAdmins[0].email}`);
}

const { data, error: createError } = await supabase.auth.admin.createUser({
  email: adminEmail,
  password: adminPassword,
  email_confirm: true,
  user_metadata: {
    role: 'employer',
    display_name: 'JobMor Admin',
    phone: '-',
    company_name: 'JobMor',
    business_category: 'Platform Administration',
    address: 'KU Sriracha',
  },
});

if (createError) throw createError;

const { error: promoteError } = await supabase
  .from('profiles')
  .update({
    role: 'admin',
    verification_status: 'verified',
    verified_at: new Date().toISOString(),
  })
  .eq('id', data.user.id);

if (promoteError) throw promoteError;

const { error: cleanupError } = await supabase
  .from('employer_profiles')
  .delete()
  .eq('id', data.user.id);

if (cleanupError) throw cleanupError;

console.log(`Admin created: ${adminEmail}`);
