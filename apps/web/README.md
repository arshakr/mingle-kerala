# Mingle Kerala — separate Next.js DEV app

First coding milestone: mobile-first Kerala backwaters-inspired **static fallback landing page**, placeholder login route, domain types and test setup. Google Sign-In, Supabase database, avatars, Realtime and audio are NOT wired yet. The existing live static/GitHub Pages/Render/Neon application stays unchanged.

## Run locally

Requires Node 22+ and npm registry access.

```bash
cd apps/web
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

Do not copy Neon credentials into this app. Google OAuth and the private Supabase DEV project will be added after verified invitation-gate/RLS tests. This app is not deployed.
