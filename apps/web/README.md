# Mingle Kerala DEV (Next.js)

Private beta application built separately from the existing static-site/Render/Neon app.

## Local development

Node.js 22+ recommended. From `apps/web` run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The landing page is the first scaffold milestone; **Google authentication and private chat are not yet implemented.** Do not expose this scaffold publicly or route LIVE traffic to it.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:local
```

The feature branch uses a temporary `npm install` step in CI because this sandbox cannot access the npm registry to generate a committed lockfile. Before accepting Task 1 as completed, generate and commit a lockfile in an environment with registry access, change CI to `npm ci`, and verify all four checks. Existing GitHub Pages deployment remains unchanged.
