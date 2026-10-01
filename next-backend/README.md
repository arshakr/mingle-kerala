# Mingle Kerala Backend

`server.js` provides email-link authentication, persisted profiles, protected profile discovery, an Express health endpoint, and authenticated Socket.IO connections. Profile and sign-in-link data are stored through Prisma in PostgreSQL. Chat messages are not persisted.

## Local development

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

The server listens on `http://localhost:3001` by default. Set `PORT` to override it. For this worktree's local run, use port `3002`.

## Deployment configuration

The repository root contains the Render Blueprint and GitHub Pages workflow. Production setup requires:

- A pooled Neon PostgreSQL URL stored as Render's `DATABASE_URL` and a direct URL stored as `DIRECT_URL`.
- SMTP settings stored in Render: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS`.
- A sender address stored as Render's `EMAIL_FROM`. For Gmail SMTP, use the same Gmail address as `SMTP_USER`.
- A random secret of at least 32 bytes stored as Render's `AUTH_SECRET`.
- DNS configured for `minglekerala.in` (frontend) and `api.minglekerala.in` (backend).

For Gmail, use `smtp.gmail.com`, port `465`, and secure TLS. `SMTP_USER` is your full Gmail address; `SMTP_PASS` is a Google App Password, not your normal account password. App Passwords require 2-Step Verification on the Google account. Set `EMAIL_FROM` to that same Gmail address (optionally formatted as `Mingle Kerala <you@gmail.com>`). Gmail has sending limits and is intended here as a small-project SMTP option, not a bulk mailing service.

**Render Free limitation:** Free web services block outbound traffic on SMTP ports `25`, `465`, and `587`, so Gmail SMTP cannot send from a Render Free service. Use a Render plan that permits SMTP egress or host the backend somewhere that allows it.

The Render pre-deploy step pushes the Prisma schema to the configured database. Store all credentials in the provider dashboard; never commit them to the repository.
