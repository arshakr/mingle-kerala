# Mingle Kerala Backend

`server.js` provides email-link authentication, persisted profiles, protected profile discovery, an Express health endpoint, and authenticated Socket.IO connections. Profile and sign-in-link data are stored through Prisma in PostgreSQL. Chat messages are not persisted.

## Local development

Requires Node.js 18 or later.

```bash
npm install
npm run dev
```

The server listens on `http://localhost:3001` by default. Set `PORT` to override it. For this worktree's local run, use port `3002`.

## Deployment configuration

The repository root contains the Render Blueprint and GitHub Pages workflow. Production setup requires:

- A pooled Neon PostgreSQL URL stored as Render's `DATABASE_URL` and a direct URL stored as `DIRECT_URL`.
- A Resend API key stored as Render's `RESEND_API_KEY`.
- A verified sender address stored as Render's `EMAIL_FROM`.
- A random secret of at least 32 bytes stored as Render's `AUTH_SECRET`.
- DNS configured for `minglekerala.in` (frontend) and `api.minglekerala.in` (backend).

The Render pre-deploy step pushes the Prisma schema to the configured database. No credentials belong in the repository.
