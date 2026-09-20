# Employer Feature

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
