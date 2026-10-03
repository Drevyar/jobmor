# Employer Candidate Insight

The Applicant Detail screen calls `supabase.functions.invoke('employer-ai')` only when the employer taps Analyze with AI. The Edge Function authenticates the user, verifies the employer role and job ownership, loads that job's applicant and declared availability, and sends only job-related data to Gemini. It returns a summary, strengths, gaps, interview questions and a deterministic availability state. It never changes application status.

The Emergency Replacement action has been removed from the client and the Edge Function contract. Requests with that action now return `invalidRequest`. Student availability remains in the database because QuickMatch and Job Radar use it. No schema or RLS change is required for this removal.

## Configuration

Set `GEMINI_API_KEY` and `GEMINI_MODEL` as Supabase Edge Function secrets. Never put the key in `EXPO_PUBLIC_*` or source files. The model defaults to `gemini-2.5-flash` when the secret is absent. The function returns a safe error when the provider is not configured.

Deploy the changed function to apply the removed endpoint and stronger Thai-language instruction:

```powershell
npx supabase functions deploy employer-ai --project-ref ygurqvincjuiapukalrv
```

The existing `verify_jwt = false` delegates token validation to `auth.getUser` inside the function. Job ownership is checked before privileged reads. The provider receives no names or contact information. Gemini uses a strict JSON schema; the employer makes the hiring decision.

## Verification

Run `npm run check` and `npx expo export --platform web`. With a verified Employer account, open My Jobs → Applicants → Applicant Detail → Analyze with AI. Check the four insight sections, availability note, loading/error feedback, and that no analysis runs on page load. Confirm another employer's job is rejected. Check that the Job Detail screen has no Emergency Replacement action. After deployment, an old client request for `emergency-replacement` must receive HTTP 400 with `invalidRequest`.

A real Gemini call and hosted behavior require a deployed function and valid secrets. Automated tests mock the provider boundary.
