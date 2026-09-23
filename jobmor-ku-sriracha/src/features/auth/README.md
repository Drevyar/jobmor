# Authentication Feature

This directory owns account registration, sign-in, password recovery, session
handling, role resolution, and authenticated profile actions.

## Implemented

- Student and employer registration
- Email/password sign-in
- Role lookup from the Supabase `profiles` table
- Role-based post-login navigation
- Session restoration, refresh, and application-wide session state
- Protected student, employer, and admin route groups with cross-role guards
- A signed-out app launch opens the sign-in form; account selection is on the create-account screen
- Sign-out
- Forgot-password and reset-password screens
- Recovery handling for implicit-token and PKCE callback formats
- Email-confirmation callback handling for PKCE codes, token hashes, and session tokens
- Shared validation and localized authentication messages

## Remaining work

- Verify email confirmation and password recovery through Expo Go or a development build
- Run signed-in end-to-end checks for login, logout, recovery, and cross-role route access

## Security requirements

- Use only the Supabase publishable key in the Expo client.
- Never expose the service-role key or database credentials.
- Resolve authorization from the database-backed profile, not editable client
  state.
- Treat navigation guards as user-experience controls; Supabase RLS remains the
  security boundary.
- Avoid revealing whether a submitted password-recovery email exists.
