# JobMor Supabase workflow

## Safety rules

- Commit `config.toml`, migrations, and `seed.sql`.
- Never commit the database password, access token, user password, or `service_role` key.
- The mobile app uses only the project URL and publishable key.
- Apply every schema change through a new migration. Do not leave Dashboard-only changes undocumented.

## Link the hosted development project

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
npm run supabase:types
```

The project ref is in the Dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.

## Dashboard settings

In Authentication settings:

1. Enable email/password sign-up.
2. Enable email confirmations.
3. Add `jobmorkusriracha://auth/callback` to Redirect URLs.
4. Add the local web callback only for development: `http://localhost:8081/auth/callback`.
5. Set the minimum password length to at least 8.

## Create the single development admin

Apply migrations first. Set these values only in the current terminal session, then run the script. Do not save the service-role key in `.env` used by Expo.

PowerShell:

```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
$env:ADMIN_EMAIL="admin@jobmor.local"
$env:ADMIN_PASSWORD="SET_THE_PRIVATE_PASSWORD_HERE"
npm run admin:create
```

The migration enforces a unique index that allows only one `admin` profile. Public registration accepts only `student` and `employer`.
