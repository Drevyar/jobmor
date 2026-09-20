# Student Feature

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
