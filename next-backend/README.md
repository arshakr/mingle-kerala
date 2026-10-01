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

The repository root contains the Render Blueprint and GitHub Pages workflow. Google sign-in setup requires:

- A pooled Neon PostgreSQL URL stored as Render's `DATABASE_URL` and a direct URL stored as `DIRECT_URL`.
- A Google OAuth web client ID stored as Render's `GOOGLE_CLIENT_ID`. Google sign-in does not require SMTP or a Google client secret.
- A random secret of at least 32 bytes stored as Render's `AUTH_SECRET`.

To configure Google sign-in, create an OAuth client with application type **Web application** in Google Cloud Console. Add `https://arshakr.github.io` under **Authorized JavaScript origins** (also add `http://localhost:8081` for local testing). Copy the client ID (not a client secret) to `GOOGLE_CLIENT_ID` in Render and redeploy. The login page uses Google's Identity Services button; the backend verifies every ID token against this client ID before issuing its own session cookie.

The Render Free Blueprint serves the API at `https://mingle-kerala-api.onrender.com`; the frontend uses this URL for production API calls. The Blueprint runs `prisma db push` during the build because Render Free doesn't support pre-deploy commands. Store database URLs and secrets in provider dashboards; never commit them to the repository.

Email sign-in is an optional fallback. It needs SMTP credentials and an SMTP-capable host. Render Free blocks outbound SMTP ports `25`, `465`, and `587`, so Google sign-in is the email-free login method on that plan.
