# Student Feature

<<<<<<< HEAD
This directory owns the authenticated student experience. Route files under
`src/app/(student)` should delegate their implementation to components, hooks,
services, validation, and types defined here.

## Scope

- Job discovery, search, filters, and job details
- Applications and application status tracking
- Saved jobs and bookmarks
- Student messaging
- Student profile and verification status

## Current state

The student routes and shared visual prototypes are available. Search,
filtering, applications, messaging, bookmarks, and profile data are not yet
connected to production CRUD operations.

## Suggested structure

```text
student/
├── job-search-screen.tsx
├── job-card.tsx
├── application-list.tsx
├── student-service.ts
├── hooks.ts
├── validation.ts
└── types.ts
```

Keep Supabase access in typed services. Students must never be able to modify
employer-owned jobs or access another student's private applications or
messages. Enforce these rules through Supabase RLS as well as the UI.
=======
Owns job discovery, job details, applications, messages, bookmarks, and student profile. Add feature-specific components, hooks, services, and types here; keep route files thin.

## Implemented flows

- Home/explore extend `components/job-discovery.tsx` with backend search/filtering of loaded jobs. List, detail, applications and saved jobs reuse `JobCard` and the existing employer `JobSummary`/UI primitives.
- `student-service.ts` uses the existing typed Supabase client. Authentication is resolved from `auth.getUser()`; RLS enforces ownership independently of the client.
- Apply inserts into the existing `applications` table. Its unique key rejects duplicate submissions. Only `pending` applications can be withdrawn, by deleting the row; no new lifecycle status is introduced. Reapplication is possible while the job is active.
- Saved jobs persist in `saved_jobs` with a composite primary key. Closed jobs remain visible only to students with a saved job or application. Draft jobs remain hidden, with an unavailable entry that still allows unsaving/withdrawing a pending application.
- Profile edits only `profiles.display_name` and `profiles.phone`. Email, role and verification are read-only. No resume, education or skills fields exist in the current schema.
- Screens reload on navigation focus. Mutations update UI only after a successful backend response, with an immediate submission lock and the existing confirmation modal/error notice pattern.

## Database prerequisite

Apply `supabase/migrations/20260921040000_student_features.sql` to the intended Supabase environment before using these screens (the preceding migrations must already be applied). Use the existing migration workflow, `npm run supabase:push`, after linking/authenticating the intended project. This implementation does not automatically deploy migrations to the hosted database.

## Verification

```sh
npm run check
node --test scripts/test-student-validation.mjs scripts/test-student-service.mjs scripts/test-student-actions.mjs scripts/test-employer-validation.mjs
npx expo export --platform web --output-dir .expo/student-web-verify
```

Run `supabase/tests/student_security.sql` and the existing `employer_security.sql` through a database-owner connection in a test environment. Both scripts roll back fixtures. They test actual PostgreSQL grants/RLS/constraints. Service and action tests use deterministic transports and Node's existing test runner; they do not replace a signed-in browser test against Supabase.

Authenticated end-to-end browser checks remain necessary after migration: browse/detail, apply, duplicate/error, withdraw confirm/cancel/error, save/unsave and refresh, profile prefill/save/validation. Anonymous direct navigation must redirect to authentication.

Current listing follows the existing client-side loading pattern and Supabase response limits; server-side pagination can be added when the job volume requires it. Search covers job title/description/category/location, not private employer profile data.
>>>>>>> develop
