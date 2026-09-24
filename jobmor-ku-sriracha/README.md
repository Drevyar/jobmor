# JobMor

JobMor is a mobile job marketplace for Kasetsart University Sriracha students
and local employers. It provides dedicated workspaces for students, employers,
and platform administrators.

The project is under active development. Authentication, role guards, student
job flows, and employer CRUD are implemented. Admin metrics and account/job
lists use live Supabase data; report handling and moderation changes are not
implemented. Messaging remains a prototype.

## Project status

| Area | Status |
| --- | --- |
| Expo application and routing | Implemented |
| Student, employer, and admin navigation | Implemented |
| Email/password registration and sign-in | Implemented |
| Supabase auth schema and RLS foundation | Implemented |
| Password recovery | Web verified; Expo Go verification pending |
| Session and role route guards | Implemented |
| Student and employer CRUD workflows | Implemented |
| Unit and PostgreSQL authorization tests | Implemented; run with `npm test` |
| Native and hosted end-to-end tests | Pending |

The role workspaces currently establish layout, navigation, and empty states.
Search fields, filters, dashboards, applications, messages, reports, and other
controls do not imply completed business functionality unless their feature
documentation explicitly says otherwise.

## Technology

| Area | Technology |
| --- | --- |
| Application | Expo SDK 57 and React Native 0.86 |
| Language | TypeScript with strict mode |
| Routing | Expo Router |
| Authentication and data | Supabase |
| Localization | `expo-localization` and `i18n-js` |
| Icons | Ionicons |
| CI | GitHub Actions |

## Getting started

Employer Candidate Insight and Emergency Replacement setup:
[Gemini Edge Function guide](docs/employer-ai.md).

### Prerequisites

- Node.js 22 LTS
- npm
- An Expo-compatible mobile environment or a modern web browser
- Access to the team's Supabase development project

### Installation

```bash
npm install
cp .env.example .env
```

Add the development project's Supabase URL and publishable key to `.env`. Never
expose a service-role key, database password, access token, or third-party
secret through an `EXPO_PUBLIC_*` variable.

### Run the application

```bash
npm start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
npm run check
```

Run `npm run check` before every push and pull request.

`check` runs lint, TypeScript, and all Node test suites. SQL suites execute all
migrations in an in-memory PostgreSQL instance (PGlite) with a minimal Auth schema.
This verifies database constraints and RLS, but does not replace staging tests
against hosted Supabase Auth or Android/iOS device checks.

## Project structure

```text
src/
├── app/                         # Expo Router routes and layouts
│   ├── (auth)/                  # Public authentication routes
│   ├── (student)/               # Student workspace routes
│   ├── (employer)/              # Employer workspace routes
│   └── (admin)/                 # Admin workspace routes
├── components/                  # Shared presentation components
├── constants/                   # Theme and role navigation configuration
├── features/                    # Feature-owned UI, state, services, and types
│   ├── auth/
│   ├── student/
│   ├── employer/
│   └── admin/
├── hooks/                       # Cross-feature React hooks
├── lib/                         # Infrastructure clients such as Supabase
├── localization/                # Translation dictionaries
├── providers/                   # Application-level React providers
└── types/                       # Shared domain types

supabase/
├── migrations/                  # Versioned schema, functions, and RLS
├── seed.sql                     # Local development seed data
├── config.toml                  # Local Supabase configuration
└── README.md                    # Supabase operating procedures
```

## Architecture and ownership

- Keep `src/app` files small. Routes should parse parameters, coordinate
  navigation, and render a feature screen.
- Put role-specific UI, hooks, validation, services, and types in the matching
  `src/features/<role>` directory.
- Move a component to `src/components` only when multiple features or roles
  genuinely share it.
- Keep Supabase queries out of presentation components. Place them in typed
  feature services.
- Implement every database change as a new migration. Do not rely on
  undocumented Dashboard-only schema changes.
- Enforce authorization with database policies or trusted backend code. A
  hidden route, tab, or button is not a security boundary.

For example, employer job management should be organized as follows:

```text
src/app/(employer)/jobs.tsx
src/features/employer/job-list.tsx
src/features/employer/job-form.tsx
src/features/employer/job-service.ts
src/features/employer/types.ts
supabase/migrations/<timestamp>_jobs.sql
```

Each data-backed feature must provide loading, empty, success, validation, and
error states. Create, update, and delete operations must be tested with the
intended student, employer, and admin permissions.

## Supabase development

Database setup, migration conventions, password-recovery redirects, and admin
account creation are documented in [`supabase/README.md`](./supabase/README.md).

Commit migrations, `config.toml`, and generated public types. Never commit
database credentials, user passwords, service-role keys, or access tokens.

## Git workflow

Development follows:

```text
feature/* -> develop -> main
```

Start every feature from the latest `develop` branch:

```bash
git switch develop
git pull origin develop
git switch -c feature/employer-jobs
```

Create focused, buildable commits and use Conventional Commit prefixes such as
`feat`, `fix`, `refactor`, `test`, `docs`, and `chore`. Do not combine unrelated
features in one branch or pull request.

Before opening a pull request:

```bash
npm run check
git push -u origin feature/employer-jobs
```

Open pull requests against `develop`. Merge only after CI passes and a teammate
has reviewed the change. The `main` branch is reserved for tested releases
promoted from `develop`.

## Testing expectations

Each feature owner is responsible for:

- lint and TypeScript checks;
- validation, loading, empty, and failure states;
- light and dark theme review;
- web and Expo/native review when platform behavior differs;
- permission testing for every affected role;
- regression checks for authentication and navigation.

## Versioning

JobMor follows Semantic Versioning. Keep `package.json` and `app.json` aligned
when preparing a release.

## License

MIT. See [`LICENSE`](./LICENSE).
