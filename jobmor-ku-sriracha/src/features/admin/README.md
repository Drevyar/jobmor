# Admin Feature

This directory owns administrative workflows. Route files under
`src/app/(admin)` should compose screens from this directory without embedding
authorization or database logic directly in the route.

## Scope

- Live platform counts
- Student and employer account suspension and restoration
- Read-only job list
- User report intake and moderation

## Current state

The dashboard, user list, jobs, and reports read records from Supabase. Admins
can suspend or restore student and employer accounts, and resolve or dismiss
pending reports. Students can submit a report from a job detail screen. Apply
the `202609240001_admin_read_jobs.sql` and
`202609240002_admin_workflows.sql` migrations before using these workflows.
Student email confirmation is automatic through Auth; there is no separate
student identity-verification queue.

## Suggested structure

```text
admin/
├── components/                 # Admin screens
├── admin-service.ts            # Supabase queries and admin actions
└── README.md
```

Administrative access must be verified by trusted backend logic and Supabase
RLS. Never rely on a hidden tab, route guard, user metadata supplied by the
client, or UI-only role checks as the authorization boundary.
