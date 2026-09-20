# Admin Feature

This directory owns administrative workflows. Route files under
`src/app/(admin)` should compose screens from this directory without embedding
authorization or database logic directly in the route.

## Scope

- Platform metrics and operational health
- Student and employer account review
- Job moderation
- Reports and verification queues
- Administrative audit-oriented actions

## Current state

Admin routes, navigation, dashboard metrics, and empty states are visual
prototypes. Moderation, reporting, and user-management CRUD operations are not
yet implemented.

## Suggested structure

```text
admin/
├── admin-dashboard.tsx
├── user-management.tsx
├── job-moderation.tsx
├── report-queue.tsx
├── admin-service.ts
└── types.ts
```

Administrative access must be verified by trusted backend logic and Supabase
RLS. Never rely on a hidden tab, route guard, user metadata supplied by the
client, or UI-only role checks as the authorization boundary.
