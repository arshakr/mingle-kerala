# DEV database

Keep the standard root Supabase layout. Migration SQL/timestamps are unchanged. Never apply these migrations to the live Neon database.

- migrations/: forward-only schema history.
- tests/static/: dependency-free Node assertions; run npm run test:db from root.
- tests/database/: pgTAP assertions for a disposable Supabase database.
- seed.sql: DEV seed notes, no personal data.

CI applies the schema to disposable PostgreSQL 16 with a minimal auth.users stub and checks constraints/RLS flags. This is schema smoke coverage, not full Supabase authorization coverage. No hosted credentials are used.

RLS is enabled with no browser policies. Restricted user policies remain unimplemented on this branch. Run pgTAP in disposable Supabase before enabling browser access.
