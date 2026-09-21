# Employer Feature

<<<<<<< HEAD
This directory owns the authenticated employer experience. Route files under
`src/app/(employer)` should remain thin and render feature implementations from
this directory.

## Scope

- Employer dashboard and business profile
- Job creation, editing, publication, closure, and deletion
- Applicant review and application status updates
- Employer messaging
- Operational metrics derived from employer-owned records

## Current state

The employer routes, dashboard shell, form layout, and empty states are visual
prototypes. Job and applicant controls are not yet connected to complete CRUD
operations.

## Suggested structure

```text
employer/
├── employer-dashboard.tsx
├── job-list.tsx
├── job-form.tsx
├── applicant-list.tsx
├── employer-service.ts
├── validation.ts
└── types.ts
```

Every mutation must be scoped to the authenticated employer. Ownership checks
must be enforced by Supabase RLS; client-side filtering alone is insufficient.
=======
Employer routes use the existing Expo Router tabs and authenticated role guard. Screens use `employer-service.ts`, which calls the existing Supabase client / PostgREST API. Database types are generated from the connected project in `src/types/database.generated.ts`.

Implemented flows:
- Dashboard → My jobs → Create / View / Edit / Delete (confirmation dialog).
- Jobs → Applicants → Detail → Accept / Reject, with status filters.
- Profile → Edit company and contact fields → atomic save through `update_employer_profile`.

Data and security:
- `jobs.employer_id` references the existing `employer_profiles` table.
- `applications` references jobs and the existing applicant `profiles` row; one application per applicant/job.
- Employer operations require a verified employer. RLS enforces ownership on reads and writes; column grants prevent reassignment of ownership/applicant IDs, timestamps, and auth fields.
- Employers can read contact details only for applicants to their own jobs. Email and verification status are read-only.
- The private role lookup avoids recursive RLS; it accepts no user ID and only reads the caller's verified role. The profile RPC uses invoker privileges and updates both existing profile rows atomically.
- Job deletion cascades its applications, as stated in the confirmation dialog.
- Student insertion/read policies support the new application contract, but existing Student screens are unchanged. Student application submission UI is outside this Employer task.

Assumptions and intentional omissions:
- Working date and free-text shift use the workplace's local time; wage is THB with hour/day/month/job units.
- No existing storage buckets, company-description/logo columns, student education/skills/experience/rating columns were present. These are not fabricated. Company icon is a fallback; no new storage dependency was added.
- Messages remains the existing placeholder.
- Accept/reject updates the stored decision; it does not send notifications or enforce staffing capacity, neither of which has an existing contract.

Verification:
- `npm run check` — ESLint and TypeScript.
- `node --test scripts/test-employer-validation.mjs` — 7 validation tests, including impossible dates and numeric bounds (Node 22.18+ or 24 supports TypeScript stripping).
- `npx expo export --platform web` — all routes build, including unchanged Student routes.
- `supabase/tests/employer_security.sql` — execute with a database-owner connection; all fixtures roll back. Verifies CRUD, accept/reject, profile saves, cross-account denials, immutable IDs, role escalation denial, and anonymous denial.
- The same database regression assertions ran successfully during `employer_rpc_permissions` against the connected project. Its subtransaction rolls back all test data even on success. A separate query confirmed zero fixture profiles remaining and RLS enabled.

Deployment:
- Both Employer migrations have been applied to the configured project. Local migration versions match the remote history.
- The existing auth foundation was already installed on the remote database without a migration-history entry. Do not blindly push that old baseline again; reconcile its history first after comparing the live schema. A fresh local database should apply all migrations normally.
- Existing Supabase Advisor warnings about legacy auth trigger/admin functions and leaked-password protection are outside these Employer changes.

Manual verification still requires a signed-in Employer browser session: create a disposable draft, edit it, cancel deletion once, confirm deletion, review a real test application and edit the business profile. Database flows were exercised, but a full authenticated UI walkthrough must not be inferred from a successful build alone.
>>>>>>> develop
