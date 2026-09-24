# Employer AI with Gemini

Both existing panels call `supabase.functions.invoke('employer-ai')`. The function
authenticates the bearer token using Supabase Auth, verifies the employer's role,
verification status and job ownership, loads job-scoped applicants, filters
availability/overlapping commitments, then calls Gemini on the server.

## Configuration and deployment

Required Supabase Edge Function Secrets:

```text
GEMINI_API_KEY=<configure privately in Supabase Edge Function Secrets>
GEMINI_MODEL=gemini-2.5-flash
```

The model defaults to `gemini-2.5-flash` when unset. An absent key produces the
safe `notConfigured` error (HTTP 503) after authorization. An empty replacement
pool returns an empty result without requiring a provider call.

Never put the key in frontend `.env`, `EXPO_PUBLIC_*`, `VITE_*`, source code,
logs, screenshots or Git. Supabase supplies `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` to the function. Existing secrets need no change.

From the application directory, deploy only this function when ready:

```powershell
npx supabase functions deploy employer-ai --project-ref ygurqvincjuiapukalrv
```

The existing `verify_jwt = false` setting delegates JWT validation to the
function's `auth.getUser` call; it does not allow unauthenticated AI access.
No authentication, RLS or schema changes are needed for the provider migration.
The template's optional OpenAI setting for local Supabase Studio and commented
vector-bucket example are unrelated to Employer AI and remain unchanged.
The earlier AI feature still requires its existing migration
`supabase/migrations/20260924035509_employer_ai_context.sql` (work profile fields,
student availability, usage budget). If it has not been applied to the target
database, deploy alone will not enable the feature. Review migration status
before applying the earlier feature's database changes.

## Provider and response contracts

Native `fetch` calls Gemini's `v1beta/models/{model}:generateContent` endpoint
with the key in `x-goog-api-key`, never the URL. No additional SDK is required.
The request specifies JSON output and the existing JSON Schema. Response parsing
requires one completed candidate, ignores thought parts, rejects blocked or
truncated results, and passes JSON through the existing strict validators.

- Candidate Insight: `kind`, `availability`, and `insight` containing `summary`,
  `strengths`, `gaps`, `interviewQuestions`.
- Emergency Replacement: `kind`, `shift`, `excluded`, and `candidates` containing
  `candidateId`, `applicationId`, `name`, `reasons`, `warnings`.

Candidate aliases must exactly match the supplied set. The backend restores real
IDs and application order; Gemini cannot add, omit or rank people. It receives
work-related fields, not names/contact information. Free-text evidence remains
untrusted input. Prompts prohibit invented evidence, sensitive-attribute inference
and hiring decisions; employers must verify claims and make the final decision.

HTTP failures, rate limits, refusal, invalid JSON and a 30-second timeout become
safe error codes. The UI retains loading/error states and explicit retry through
the Analyze/Find buttons. There are no automatic provider retries or page-load
calls. Provider errors and keys are never returned or logged. Provider data
handling is governed by your Google account's terms; this adapter makes no
zero-retention claim.

## Local checks

```powershell
cd C:\Users\tarit\OneDrive\Desktop\jobmor\jobmor-ku-sriracha
npm run check
npx --yes --package deno deno check supabase/functions/employer-ai/index.ts
npx expo export --platform web
npm run web
```

The automated suite uses synthetic fixtures and a mocked Gemini HTTP boundary;
it makes no paid AI requests. It covers both handler-to-provider-to-validator
flows, no applicants, authorization failure, missing configuration, malformed and
empty output, refusal, truncation, rate limits, network timeout and invented IDs.

For a local Supabase stack (Docker required):

```powershell
npm run supabase:start
npx supabase functions serve employer-ai
```

Use a separate local app configuration pointing to that local Supabase instance
and its publishable key. Without a local Gemini key, authenticated requests with
eligible data should show a configuration error; keep real keys in hosted secrets.
To exercise real Gemini, use the hosted development project after function
deployment with the secrets already configured there.

## Manual verification after deployment

1. Use real verified student and employer accounts. The student records skills,
   experience and a future availability window and applies to the employer's job.
2. Employer: My Jobs → Applicants → Applicant Detail → Analyze with AI. Verify
   the four insight sections, availability state and human-decision note. Retry
   explicitly; reload must not automatically invoke AI.
3. Employer: Job Detail → Emergency Replacement. Enter a future shift covered by
   the pending student's availability. Find replacements and open the applicant's
   details to contact them manually. No assignment or acceptance should happen.
4. Verify an empty pool, absent availability and an overlapping accepted job are
   excluded. The replacement pool remains pending applicants of the same job.
5. Test another employer's job and a student token: access must be rejected before
   provider calls. Test unavailable provider/configuration on a local or separate
   test environment, without removing hosted production secrets.

Remaining limits: live responses and hosted permissions must be verified after
deployment. Schema validation checks structure and IDs, not the truth of every
generated sentence. No new invitation, scheduling or global candidate-search
system is introduced by this migration.

References: [Gemini REST API](https://ai.google.dev/api/generate-content),
[structured output](https://ai.google.dev/gemini-api/docs/structured-output),
[Supabase secrets](https://supabase.com/docs/guides/functions/secrets).
