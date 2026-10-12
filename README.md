# Mingle Kerala

The live site and the new Next.js + Supabase DEV foundation are developed separately. DEV is not ready to replace production: authentication, invitation policies and chat remain future work.

| Path | Purpose |
| --- | --- |
| apps/web/ | Current DEV Next.js app and unit tests |
| supabase/migrations/ | Forward-only DEV schema history |
| supabase/tests/static/ | Migration source checks |
| supabase/tests/database/ | pgTAP assertions |
| docs/superpowers/ | Design and implementation plan |
| docs/development/ | Cleanup audit |
| Root HTML, css/, js/, assets/ | Retained live Pages frontend |
| next-backend/ | Retained live Express/Socket.IO/Prisma backend |

## Development

Use Node 22+ and npm. From the root:

```sh
npm ci --prefix apps/web
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

Copy apps/web/.env.example to apps/web/.env.local when configuring the separate DEV project. Never expose server secrets through NEXT_PUBLIC_ variables. The foundation does not connect to Supabase yet.

See [app setup](apps/web/README.md), [database checks](supabase/README.md), and [cleanup audit](docs/development/cleanup-2026-10-12.md).

## Live deployment

Root static files, CNAME, PWA files, the Pages deployment workflow, render.yaml and next-backend remain intact. Pages deploys main; Render uses next-backend. Keep these paths until the replacement passes preview, authentication, data-access and rollback checks. This cleanup does not deploy DEV or migrate hosted databases.

The old README is preserved in [legacy reference](next-backend/LEGACY.md). Its feature/compliance claims are historical, not verified current behavior. Use next-backend/README.md for backend setup.
