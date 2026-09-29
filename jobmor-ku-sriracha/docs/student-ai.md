# Student AI Job Finder

QuickMatch, Job Radar and Opportunity Discovery share one server-side eligibility engine in `supabase/functions/_shared/student-recommendations.ts`. The Student Home screen adds the three sections without changing the existing navigation or job browsing flow. Job preferences are optional fields on the Student Profile screen.

## Setup

1. Install dependencies with `npm install` and copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project's public values. Never put a service role or Gemini key in `.env` as an `EXPO_PUBLIC_*` value.
3. Apply migrations with `npx supabase db push` after linking the intended project. The migration `20260928204004_student_recommendations.sql` adds the preference, interaction and radar tables plus a private rate limiter.
4. Set Supabase Edge Function secrets `GEMINI_API_KEY` and `GEMINI_MODEL` server-side. The current deployment uses the project's existing Gemini configuration; do not put the key in the app.
5. Deploy with `npx supabase functions deploy student-ai --project-ref <project-ref>`. Its `verify_jwt=false` setting allows the function to validate the bearer token itself using Supabase Auth, then require a verified Student profile. It is not a public recommendation endpoint.
6. Start locally with `npm run web` or `npm start`. Run `npm run check` and `npx expo export --platform web` before a presentation.

## Flows

- **QuickMatch:** Student taps Find a job. The server reads their profile, declared availability, preferences, own applications and skips, and active jobs. Deterministic filtering removes filled, expired, inactive, already applied/skipped, unavailable or conflicting jobs and enforces selected category, area and comparable minimum wage. Gemini chooses one from a bounded eligible set and explains it. Skip persists per Student/job. Interested opens a confirmation dialog; Confirm application calls the existing `applyForJob` path and the existing `applications` table. No application is created before confirmation.
- **Job Radar:** Opening Student Home or tapping Refresh requests recommendations. New recommendations are stored in `job_radar_recommendations`; reopening returns stored relevant records. Viewing a job marks it seen; Dismiss hides it. Applied, skipped, full, inactive or now-ineligible jobs no longer appear. No push notifications are implied.
- **Opportunity Discovery:** Tapping Discover opportunities sends only stated work skills/experience and available job categories to Gemini. It intentionally explores beyond the Student's preferred category while retaining other factual constraints. The server validates categories against live eligible jobs. Inferred skills remain temporary suggestions and never update `profiles`. View jobs opens Explore with that category filter.

The function uses the existing Gemini REST adapter with strict JSON schemas. It sends work evidence and job facts, but not names, contact information or sensitive profile attributes. Invalid AI identifiers, malformed responses and unsupported categories are rejected. AI failures return safe error codes. Gemini is used for semantic selection/explanation and inference, while schedule, capacity, wage, history, role and ownership checks are normal code/database checks.

## Database and security

The new `student_job_preferences`, `student_job_interactions` and `job_radar_recommendations` tables reference existing `profiles` and `jobs`. RLS is enabled. Verified Students may read and edit their own preferences and read/mark their own radar items. Interaction and radar creation happen only through the authorized server function. Employers and other Students cannot read or write these rows. The server checks the bearer token and verified Student role before using its service-role client; server-generated records are always scoped to that authenticated Student. Gemini requests are limited to 20 per Student per rolling hour.

The project reuses `profiles.work_skills`, `profiles.work_experience`, `student_availability`, `jobs`, `applications` and the existing application uniqueness/RLS rules. There is no duplicate application or profile table.

## Demonstration with real data

Use separate verified Student A and Student B accounts created through normal registration and verified by the project's existing process. Use a verified Employer account to create active jobs with future dates and parseable shifts (`18:00 - 22:00`), and at least two worker slots. In Student A's Profile, add a stated skill such as Customer Service, experience such as helping at a family restaurant, and an availability interval fully covering a job shift. Set a matching category or area preference. For Student B, enter different weekend availability and a Cashier skill. These values are examples for manually entered demonstration data, not production mock logic.

Check QuickMatch with two eligible jobs; Skip one and request again; confirm that an already applied job is excluded. Try a conflicting availability interval, no availability, no experience, a wage preference above a job's wage, and an inactive job. Open Radar twice, view then dismiss a job, and verify its stored state. Run Opportunity Discovery with detailed, short and absent experience, then open a suggested category in Explore. Check that an Employer account cannot call the Student action and a Student account cannot change another Student's radar/preference records.

## Current boundaries

- Distance is not calculated: the schema has a free-text location, not coordinates or travel time. Preferred area uses a case-insensitive text match.
- Wage thresholds compare only jobs with the same wage unit. Other wage units remain possible and are not falsely converted.
- Missing availability is labelled unknown and must be confirmed by the Student. Declared availability is not proof of actual attendance.
- Radar refreshes when Home opens or the Student taps Refresh. It does not send background or push notifications.
- The server deliberately limits record counts (500 active jobs, 5,000 accepted applications) and returns a clear error instead of silently analyzing truncated data.
- Job shifts must use a parseable time range. Jobs without one are not recommended, though they remain visible in ordinary browsing.
- Hosted end-to-end verification still needs real signed-in Student/Employer sessions and valid Gemini quota. The automated suite covers matching, RLS and error handling without putting fake data in production.
