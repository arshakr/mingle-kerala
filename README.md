# 🌊 Mingle Kerala

> Anonymous social discovery platform for Kerala adults 18+

**Connect Anonymously. Stay Private.**

[![GitHub Pages](https://img.shields.io/badge/Frontend-GitHub%20Pages-blue?logo=github)](https://arshakr.github.io/mingle-kerala/)
[![Render](https://img.shields.io/badge/Backend-Render.com-purple?logo=render)](https://render.com)
[![Neon](https://img.shields.io/badge/Database-Neon.tech-green)](https://neon.tech)

---

## 📋 Overview

Mingle Kerala is a privacy-first anonymous social platform allowing adults 18+ from all 14 Kerala districts to connect, chat, and discover each other — without revealing real identities.

**Key Features:**
- 🎭 Auto-generated anonymous usernames (no real name required)
- 🗺️ 14 Kerala district filter & discovery
- 💬 Real-time private encrypted chat (Socket.io)
- 🛡️ AI safety moderation + emergency exit
- 🇮🇳 Malayalam language support
- 📱 PWA — installable on mobile
- 🌧️ Kerala monsoon rain animation
- ✨ Dark glassmorphism UI

---

## 🚀 Quick Start

### Frontend (local preview)
```bash
# Option 1: VS Code Live Server
# Open mingle-kerala/ in VS Code → Right-click index.html → Open with Live Server

# Option 2: Python HTTP server
cd mingle-kerala
python -m http.server 8080
# Open http://localhost:8080
```

### Backend (local dev)
```bash
cd mingle-kerala/next-backend

# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env
# Edit .env — add your Neon.tech DATABASE_URL

# 3. Push Prisma schema to database
npm run db:push

# 4. Start the server
npm run dev
# Server runs on http://localhost:3001
```

---

## 📁 Project Structure

```
mingle-kerala/
├── index.html             ← Landing page (particles + rain animation)
├── age-verify.html        ← 18+ age gate
├── login.html             ← Anonymous 3-step profile setup
├── dashboard.html         ← Main app feed
├── discover.html          ← Filter & browse users
├── chat.html              ← Real-time private chat
├── settings.html          ← User preferences
├── privacy.html           ← Privacy policy (Indian law compliant)
├── terms.html             ← Terms of service
├── safety.html            ← Safety center + emergency resources
├── manifest.json          ← PWA manifest
├── sw.js                  ← Service worker (offline support)
├── css/
│   ├── global.css         ← Design system, tokens, components
│   ├── landing.css        ← Landing page styles
│   ├── dashboard.css      ← App shell, sidebar, bottom tabs
│   └── chat.css           ← Chat UI, bubbles, input
├── js/
│   ├── utils.js           ← Shared helpers (auth, toast, navigation)
│   ├── particles.js       ← Canvas particle animation
│   ├── rain.js            ← Kerala monsoon rain animation
│   └── landing.js         ← Landing page interactivity
├── assets/
│   ├── icon-192.png       ← PWA icon
│   └── icon-512.png       ← PWA icon (large)
└── next-backend/
    ├── server.js          ← Express + Socket.io server
    ├── package.json
    ├── .env.example       ← Environment template
    ├── .gitignore
    └── prisma/
        └── schema.prisma  ← PostgreSQL schema (7 models)
```

---

## 🌐 Deployment

### 1. Frontend → GitHub Pages

1. Push the `mingle-kerala/` folder contents to your GitHub repo root
2. Go to **Settings → Pages → Source**: `main` branch, `/ (root)`
3. Site will be live at: `https://<username>.github.io/mingle-kerala/`

### 2. Backend → Render.com

1. Push the entire repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `next-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
5. Add environment variables:
   - `DATABASE_URL` — your Neon.tech connection string
   - `NODE_ENV` — `production`

### 3. Database → Neon.tech

1. Create account at [neon.tech](https://neon.tech)
2. Create a new PostgreSQL project
3. Copy the **Connection String** (with `?sslmode=require`)
4. Add to `next-backend/.env` as `DATABASE_URL`
5. Run: `cd next-backend && npm run db:push`

### 4. Connect Frontend to Backend

In `chat.html`, replace:
```javascript
const RENDER_URL = 'https://YOUR-RENDER-URL.onrender.com';
```
With your actual Render service URL.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| `--teal-glow` | `#00d4aa` |
| `--gold-glow` | `#f59e0b` |
| `--purple-glow` | `#8b5cf6` |
| `--pink-glow` | `#ec4899` |
| `--bg-base` | `#050b12` |

**Typography:** Inter (headings) + Noto Sans Malayalam (body)

---

## 🛡️ Safety & Legal

- Strict 18+ age verification gate
- Anonymous-by-design (no PII collection)
- Emergency exit button in all chat views
- Report abuse system with reason categories
- Compliant with Indian IT Act 2000 + DPDP Act 2023
- In-app Safety Center with Kerala/India emergency numbers

---

## 📜 License

Private project. All rights reserved. © 2024 Mingle Kerala.

---

*Made with ❤️ for Kerala* 🌧️☕
# mingle-kerala
