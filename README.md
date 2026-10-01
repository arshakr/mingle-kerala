# 🌊 Mingle Kerala

> Anonymous social discovery platform for Kerala adults 18+

**Connect Anonymously. Stay Private.**

[![GitHub Pages](https://img.shields.io/badge/Frontend-GitHub%20Pages-blue?logo=github)](https://arshakr.github.io/mingle-kerala/)
[![Render](https://img.shields.io/badge/Backend-Render.com-purple?logo=render)](https://render.com)
[![Neon](https://img.shields.io/badge/Database-Neon.tech-green)](https://neon.tech)

---

## 📋 Overview

Mingle Kerala is a privacy-first anonymous social platform allowing adults 18+ from all 14 Kerala districts to connect, chat, and discover each other — without revealing real identities.

**Current Features:**
- ✉️ Email sign-in links with expiring, one-time tokens (Gmail SMTP)
- 🎭 Database-backed profiles with anonymous usernames
- 🗺️ 14 Kerala district filter & discovery
- 💬 Demo real-time chat preview (Socket.IO; not end-to-end encrypted or persisted)
- 🛡️ Safety center and emergency-exit UI (moderation flows are demo-only)
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
python -m http.server 8081 --bind 127.0.0.1
# Open http://localhost:8081
```

### Backend (local dev)
```bash
cd mingle-kerala/next-backend

# Install dependencies
npm install

# Copy .env.example to .env and set DATABASE_URL, DIRECT_URL,
# SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM,
# and a random AUTH_SECRET. For Gmail, SMTP_PASS is a Google App Password.
Copy-Item .env.example .env

# Start the API and Socket.IO server
npm run dev
# Server runs on http://localhost:3002
```
The local frontend at `http://localhost:8081` connects to the backend on port 3002. Email sign-in and profile APIs require working PostgreSQL and SMTP credentials. Gmail SMTP requires 2-Step Verification and a Google App Password; use the same Gmail address for `SMTP_USER` and `EMAIL_FROM`.

---

## 📁 Project Structure

```
mingle-kerala/
├── index.html             ← Landing page (particles + rain animation)
├── age-verify.html        ← 18+ age gate
├── login.html             ← Email sign-in + profile setup
├── verify.html            ← One-time email link confirmation
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

1. Push or merge the deployment configuration to `main`
2. Enable **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. The workflow deploys the frontend to `https://minglekerala.in` using the included `CNAME`

### 2. Backend → Render.com

The root `render.yaml` defines the API service. Create a Blueprint in Render from the repository and add pooled `DATABASE_URL`, direct `DIRECT_URL`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and a cryptographically random `AUTH_SECRET` (at least 32 bytes) in the Render dashboard. Gmail SMTP uses `smtp.gmail.com`, port `465`, with secure TLS; `SMTP_PASS` must be a Google App Password (requires 2-Step Verification), not your normal Gmail password. Set `EMAIL_FROM` to the same Gmail address as `SMTP_USER`. Keep credentials in provider dashboards only. Gmail has sending limits and is not intended for bulk email.

### 3. Database → Neon.tech

1. Create account at [neon.tech](https://neon.tech)
2. Create a new PostgreSQL project
3. Copy the **Connection String** (with `?sslmode=require`)
4. Add Neon’s pooled connection URL as `DATABASE_URL` and its direct connection URL as `DIRECT_URL` in Render. The Render pre-deploy step applies the Prisma schema. Never commit connection strings or API credentials.

### 4. Configure the custom domain

The frontend expects `https://minglekerala.in` and the backend expects `https://api.minglekerala.in`. Configure the corresponding GitHub Pages and Render DNS records before enabling production traffic. Profile discovery requires email verification and a saved profile; the current chat screen still uses demo conversations and messages.

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
