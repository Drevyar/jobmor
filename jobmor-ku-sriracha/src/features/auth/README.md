# Authentication Feature

This directory owns account registration, sign-in, password recovery, session
handling, role resolution, and authenticated profile actions.

## Implemented

- Student and employer registration
- Email/password sign-in
- Role lookup from the Supabase `profiles` table
- Role-based post-login navigation
- Sign-out
- Forgot-password and reset-password screens
- Recovery handling for implicit-token and PKCE callback formats
- Shared validation and localized authentication messages

## Remaining work

- Verify password recovery through Expo Go or a development build
- Implement the application-wide session provider
- Protect student, employer, and admin route groups
- Reject cross-role navigation
- Restore valid sessions on application startup
- Test login, logout, recovery, and route access for every role

## Security requirements

- Use only the Supabase publishable key in the Expo client.
- Never expose the service-role key or database credentials.
- Resolve authorization from the database-backed profile, not editable client
  state.
- Treat navigation guards as user-experience controls; Supabase RLS remains the
  security boundary.
- Avoid revealing whether a submitted password-recovery email exists.
