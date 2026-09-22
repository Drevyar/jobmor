import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Real PostgreSQL execution in memory. The minimal Auth schema models the
// columns used by our triggers; hosted GoTrue/email delivery still needs staging QA.
test('all migrations and SQL authorization suites pass against PostgreSQL', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      grant usage on schema public, auth to anon, authenticated, service_role;
      create table auth.users (
        id uuid primary key, email text, raw_user_meta_data jsonb,
        email_confirmed_at timestamptz
      );
      create function auth.uid() returns uuid language sql stable as $$
        select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
      $$;
    `);
    for (const directory of ['migrations', 'tests']) {
      const root = new URL(`../supabase/${directory}/`, import.meta.url);
      for (const file of (await readdir(root)).filter(name => name.endsWith('.sql')).sort()) {
        try { await db.exec(await readFile(new URL(file, root), 'utf8')); }
        catch (error) { throw new Error(`${directory}/${file}: ${error.message}`, { cause: error }); }
      }
    }
  } finally { await db.close(); }
});
