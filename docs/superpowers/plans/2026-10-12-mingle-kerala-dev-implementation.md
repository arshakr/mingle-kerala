# Mingle Kerala DEV — Private Beta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and privately test Mingle Kerala, an anonymous, mobile-first, 18+ Kerala discovery/dating PWA, with 10–20 invited testers, advanced matching, protected chat, optional 30-second voice, moderation, notifications, and a Kerala-backwaters 3D landing page.

**Architecture:** Keep the existing static/Render/Neon app working while building a new isolated Next.js/TypeScript application at `apps/web/`. The application uses an independent development Supabase project for Google OAuth, PostgreSQL/RLS, Realtime, and private Storage. Server routes and PostgreSQL functions enforce trust boundaries; browser access never includes privileged credentials.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind, React Three Fiber/Three.js, Supabase Auth/PostgreSQL/Realtime/Storage, Vitest, Playwright, Supabase CLI/pgTAP, GitHub Actions. Use currently supported compatible package versions, pinned by lockfile after validation.

**Spec:** `docs/superpowers/specs/2026-10-12-mingle-kerala-dev-design.md` (branch `docs/mingle-kerala-dev-spec-2026-10-12`).

## Global Constraints

- **Private beta size:** 10–20 invited adults; the DEV app is not open to the public.
- **Registration:** Google Sign-In only; backend-enforced email invitation allowlist, self-declared DOB, 18+ confirmation; no claim of independent age verification.
- **Identity:** Public profiles never contain Google email/name/picture, full date of birth, phone, auth UID or access tokens; user-facing unique anonymous Mingle ID.
- **Kerala:** All 14 districts, Malayalam/English, advanced matching by gender/age band/district/interests/intentions and optional online-only.
- **Chat:** Mutual likes unlock conversation; alternatively approved request unlocks it. Text, emoji, reactions, typing/read state, voice <=30 s; no public file uploads.
- **Privacy:** Invisible Mode, 24h/7d/normal message retention, block/report, permission-scoped access and disappearing media. No E2EE claim or screenshot-prevention guarantee.
- **Brand:** Emerald #10B981, purple #7C3AED, gold #FBBF24, forest #071C18; Kerala backwater sunset/houseboat, optimized 3D, reduced-motion/low-end fallback, PWA.
- **Payments:** ₹0 DEV registration; any ₹19 one-time activation is future optional, gated by provider approval and server-verifiable payment state. Do not integrate live capture or activate paid mode in DEV.
- **Isolation:** Existing `index.html`, `next-backend/`, `render.yaml`, `CNAME`, and `.github/workflows/deploy-pages.yml` stay untouched until a separately reviewed migration.
- **Security:** No Supabase service-role key in client, deny-by-default RLS, explicit authorized Realtime channels, private Storage bucket, server-side rate limits and moderation action audit.
- **Work discipline:** Code goes to a new implementation branch/worktree; first review this plan. No code, infrastructure provisioning, DNS or LIVE environment changes are approved by this document.

## Review Focus — high-risk situations the owner of each task must test

1. **Uninvited but valid Google OAuth account** must not read profiles, subscribe to chats, create public profile or access audio: pinned by Task 4.
2. **Blocked, suspended, or newly removed conversation member** must fail message writes, media reads, and reconnect subscriptions: pinned by Tasks 9 and 10.
3. **Invisible participant** must not appear in online results or leak last-seen via realtime or profile payload, while still being able to message: pinned by Task 11.
4. **Concurrency / retries on likes or chat requests** must never create duplicate matches, conversations or requests: pinned by Tasks 7 and 8.
5. **Boundary values in DOB, audio and expiry** — age exactly 18 vs under 18, voice 30 vs >30 s, 24h expiry and failed cleanup — must behave deterministically: pinned by Tasks 5, 12 and 13.

---

## File map and module contracts

Create an isolated `apps/web/` Next.js project; the paths below are **relative to repository root**. Each domain folder owns a narrow responsibility.

| Area | Files (new unless noted) | Responsibility |
|---|---|---|
| App entry | `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css` | responsive public home and shared shell |
| Auth | `apps/web/src/app/auth/callback/route.ts`, `apps/web/src/lib/auth/guard.ts`, `apps/web/src/lib/supabase/server.ts`, `browser.ts` | OAuth callback and server authorization |
| Onboarding | `apps/web/src/app/onboarding/page.tsx`, `apps/web/src/lib/domain/age.ts`, `apps/web/src/lib/domain/profile.ts` | age confirmation, anonymous setup |
| Schema | `supabase/migrations/202610120001_core.sql`, `202610120002_policy.sql`, `202610120003_messaging.sql`, `202610120004_operations.sql` | versioned DB schema, functions, RLS |
| Privacy tests | `supabase/tests/database/*.test.sql` | pgTAP role/policy/transaction checks |
| Discovery | `apps/web/src/lib/domain/discovery.ts`, `apps/web/src/app/(app)/discover/page.tsx` | filter normalization and paging |
| Matching | `apps/web/src/lib/domain/matching.ts`, `apps/web/src/app/api/matches/route.ts` | atomic likes and matches |
| Requests | `apps/web/src/lib/domain/requests.ts`, `apps/web/src/app/api/chat-requests/route.ts` | request admission and status |
| Chat | `apps/web/src/lib/domain/chat.ts`, `apps/web/src/app/(app)/chats/[id]/page.tsx`, `apps/web/src/app/api/messages/route.ts` | validation, messages, UI |
| Presence | `apps/web/src/lib/domain/presence.ts`, `apps/web/src/lib/realtime/channels.ts` | ephemeral state and visibility |
| Audio | `apps/web/src/lib/domain/voice.ts`, `apps/web/src/app/api/voice/route.ts` | short recordings and private Storage |
| Retention | `apps/web/src/lib/domain/retention.ts`, `apps/web/src/app/api/cron/purge/route.ts` | expiry timestamps and secure cleanup |
| Notifications | `apps/web/src/lib/domain/notifications.ts`, `apps/web/public/sw.js`, `apps/web/src/app/api/push/route.ts` | in-app and opt-in Web Push |
| Safety | `apps/web/src/lib/domain/moderation.ts`, `apps/web/src/app/(admin)/admin/page.tsx` | reports, evidence, action logs |
| Visuals | `apps/web/src/components/landing/BackwatersScene.tsx`, `apps/web/src/components/avatar/Avatar.tsx` | lazy 3D and avatar renderer |
| Language/PWA | `apps/web/src/i18n/en.json`, `ml.json`, `apps/web/src/app/manifest.ts` | translated UI, installability |
| Payments | `apps/web/src/lib/domain/activation.ts`, `apps/web/src/app/(admin)/admin/billing/page.tsx` | free/test-only activation switch |
| Tests/CI | `apps/web/src/**/*.test.ts`, `apps/web/e2e/*.spec.ts`, `.github/workflows/dev-app-ci.yml` | unit, E2E, policy checks |
| Guides | `apps/web/README.md`, `docs/operations/dev-runbook.md` | DEV setup, incident and test instructions |

**Shared types (single source):** `apps/web/src/lib/domain/types.ts` exports `AccountState = 'pending_age'|'active'|'restricted'|'suspended'`, `ChatRequestStatus = 'pending'|'accepted'|'rejected'|'cancelled'`, `RetentionMode = 'normal'|'24h'|'7d'`, `MessageKind = 'text'|'voice'`, `DiscoveryFilters`, and `AuthContext`. Separate internal DB identifiers from `mingleId` used publicly.

**Server context interface:** `requireApprovedUser(): Promise<AuthContext>`, with `AuthContext = { accountId: string; authUserId: string; role: 'user'|'admin'; state: AccountState }`. Server operations use that context and audited functions; no user-supplied actorId is trusted.

## Independent delivery slices

- **Slice 1, foundation (Tasks 1–5):** Running DEV shell with Google login, invitation/age gate, secure profile and RLS. This must be independently usable before matching work.
- **Slice 2, discovery (Tasks 6–8):** Filterable directory, swipes/matches and chat-request workflow; approved tester-to-tester end-to-end.
- **Slice 3, messaging/privacy (Tasks 9–13):** Authorized text, realtime, presence, voice, deletion. No design polish until cross-user tests pass.
- **Slice 4, trust and experience (Tasks 14–17):** Moderation, notifications, 3D/avatars, multilingual PWA.
- **Slice 5, readiness (Tasks 18–20):** Future payment flag/test mode, DEV deployment, beta readiness/security review. Payment goes LIVE only after a new authorization and provider/legal check.

## Slice 1 — Foundation

### Task 1: Preserve legacy, initialize the isolated web shell and CI

**Files:** Create `apps/web/package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/lib/domain/types.ts`, `vitest.config.ts`, `src/lib/domain/__tests__/shell.test.ts`, `.github/workflows/dev-app-ci.yml`, `apps/web/README.md`; do NOT change existing deploy workflow.

**Interfaces:** `getBrandTokens(): { primary:string; secondary:string; accent:string; background:string }`; package scripts `lint`, `typecheck`, `test`, `build`.

- [ ] **Step 1 — failing test:** Assert `getBrandTokens()` matches `#10B981`, `#7C3AED`, `#FBBF24`, `#071C18`, and home renders a `Start Mingling` button.
- [ ] **Step 2 — red:** Run `cd apps/web && npm test -- --run src/lib/domain/__tests__/shell.test.ts`. Expected FAIL (missing functions/app).
- [ ] **Step 3 — implementation:** Initialize App Router with pinned supported versions, implement the token helper, layout/home, TS/Vitest/Testing Library and CI that runs only inside `apps/web`; preserve legacy `main` deploy behavior.
- [ ] **Step 4 — green:** Run `npm run lint && npm run typecheck && npm test -- --run && npm run build` in `apps/web`. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web .github/workflows/dev-app-ci.yml && git commit -m "feat(dev): isolate Next.js app and CI"`.

### Task 2: Create versioned foundation schema with constraints

**Files:** Create `supabase/config.toml`, `supabase/migrations/202610120001_core.sql`, `supabase/seed.sql`, `supabase/tests/database/core.test.sql`.

**Interfaces:** Tables `invitations` (normalized verified Google email), `private_accounts` (auth UUID/role/age confirmation/account state), `public_profiles` (unique `mingle_id` and `anonymous_name`, district_id, age band, language, avatar JSON and invisible flag), `districts`, `interests`, `profile_interests`, `discovery_preferences`. `districts` contains exactly the 14 districts listed in spec §6.

- [ ] **Step 1 — failing pgTAP:** Assert 14 seeded districts, unique `mingle_id`, no public email column, foreign keys and checks rejecting invalid district/age band.
- [ ] **Step 2 — red:** Run `supabase db reset && supabase test db` from repository root on a disposable local Supabase instance. Expected FAIL before schema.
- [ ] **Step 3 — implementation:** Create migration, table ownership defaults, indexes, normalized district seed and idempotent seed procedure; no auth identities in public profile payload.
- [ ] **Step 4 — green:** Repeat `supabase db reset && supabase test db`. Expected PASS; inspect `supabase migration list`.
- [ ] **Step 5 — commit:** `git add supabase && git commit -m "feat(db): add accounts, profiles and discovery schema"`.

### Task 3: Deny-by-default RLS and read-safe public profile cards

**Files:** Create `supabase/migrations/202610120002_policy.sql`, `supabase/tests/database/policies.test.sql`, `apps/web/src/lib/domain/public-profile.ts` and its test.

**Interfaces:** `PublicProfileCard = { mingleId:string; anonymousName:string; district:string; ageBand:string; gender:string; interests:string[]; intentions:string[]; avatarConfig:unknown; isOnline:boolean }`; `toPublicProfileCard(row:unknown): PublicProfileCard`. Public profile fetch must use a safe select/RPC, never `select *` against private identity tables.

- [ ] **Step 1 — failing tests:** pgTAP tests authenticated strangers cannot select `private_accounts`/invitations; anonymous users cannot select profiles; approved accounts see only allowed card fields; TypeScript test confirms email/authUserId/dateOfBirth are absent.
- [ ] **Step 2 — red:** Run `supabase test db` and targeted `npm test -- --run src/lib/domain/public-profile.test.ts`. Expected FAIL.
- [ ] **Step 3 — implementation:** Add RLS policies for every foundation table, no public select grants for private tables, approved-account row filtering, safe card projection; implement mapping function.
- [ ] **Step 4 — green:** Repeat tests; attempt unauthorized reads with two distinct test JWT identities. Expected denial.
- [ ] **Step 5 — commit:** `git add supabase apps/web/src/lib/domain && git commit -m "feat(security): enforce foundation RLS and profile projection"`.

### Task 4: Google OAuth callback and real invitation gate

**Files:** Create `apps/web/src/lib/supabase/server.ts`, `browser.ts`, `src/lib/auth/guard.ts`, `src/app/auth/callback/route.ts`, `src/app/(auth)/login/page.tsx`, `src/lib/auth/guard.test.ts`, `apps/web/e2e/auth.spec.ts`, `apps/web/.env.example`.

**Interfaces:** `requireApprovedUser(): Promise<AuthContext>`; `resolveInvitation(authUserId:string, verifiedEmail:string): Promise<'approved'|'denied'>`. All browser-facing routes call the gate or an RLS-protected operation.

- [ ] **Step 1 — failing tests:** Mock Google OAuth callback: approved verified email creates gated session; uninvited verified email receives access denied; forged email and unauthenticated user cannot read data, subscribe or upload.
- [ ] **Step 2 — red:** Run `cd apps/web && npm test -- --run src/lib/auth/guard.test.ts`; expected FAIL.
- [ ] **Step 3 — implementation:** Configure Supabase SSR cookies, Google-only provider login, callback exchange, normalized invitation verification using the trusted OAuth identity, authorization guard, deny-by-default browser routes; ensure stale uninvited auth records confer no app access.
- [ ] **Step 4 — green:** Run targeted tests, `npm run typecheck`, and E2E `npx playwright test e2e/auth.spec.ts` using fixture auth accounts. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web && git commit -m "feat(auth): gate Google login to invited testers"`.

### Task 5: Age confirmation, profile onboarding, minimal private identity

**Files:** Create `apps/web/src/lib/domain/age.ts`, `age.test.ts`, `profile.ts`, `profile.test.ts`, `src/app/onboarding/page.tsx`, `src/app/api/onboarding/route.ts`, `apps/web/e2e/onboarding.spec.ts`.

**Interfaces:** `isAtLeast18(dobISO:string, todayISO:string):boolean`; `createAnonymousProfile(input:OnboardingInput, ctx:AuthContext):Promise<{ mingleId:string }>`; `OnboardingInput = { dob:string; confirms18:boolean; districtId:string; gender:'male'|'female'|'prefer_not_to_say'; languages:('ml'|'en')[]; interests:string[]; intention:'friendship'|'dating'|'serious'; bio:string; avatarConfig:object }`.

- [ ] **Step 1 — failing tests:** Exactly 18 on the supplied date is accepted; one day short is rejected; invalid calendar dates and unchecked confirmation rejected; retry creates no duplicate `mingleId`; profile never echoes full DOB/Google email.
- [ ] **Step 2 — red:** Run `npm test -- --run src/lib/domain/age.test.ts src/lib/domain/profile.test.ts`. Expected FAIL.
- [ ] **Step 3 — implementation:** Use date-only calendar comparisons (no local timezone drift), server validation, atomic account/profile creation, non-identifying username generator with uniqueness retry, consent version/timestamp; minimize DOB storage.
- [ ] **Step 4 — green:** Run targeted tests, RLS tests and E2E onboarding. Expected PASS for adult, underage and interrupted cases.
- [ ] **Step 5 — commit:** `git add apps/web supabase && git commit -m "feat(onboarding): age declaration and anonymous identity"`.

**Slice 1 acceptance gate:** Two approved Google fixture users complete sign-in/onboarding; a third uninvited identity cannot read, create or subscribe; no real payment is requested; `main` deployment unchanged.

## Slice 2 — Discovery and matching

### Task 6: Filterable discovery query and user preferences

**Files:** Create `apps/web/src/lib/domain/discovery.ts`, `discovery.test.ts`, `apps/web/src/app/(app)/discover/page.tsx`, `apps/web/src/app/api/discover/route.ts`, `apps/web/e2e/discovery.spec.ts`.

**Interfaces:** `DiscoveryFilters = { districts:string[]; genders:string[]; minAge:number; maxAge:number; interests:string[]; intentions:string[]; languages:string[]; onlineOnly:boolean; pageSize:number; cursor?:string }`; `normalizeDiscoveryFilters(raw:unknown):DiscoveryFilters`; `discoverProfiles(filters:DiscoveryFilters,ctx:AuthContext):Promise<{cards:PublicProfileCard[]; nextCursor?:string}>`.

- [ ] **Step 1 — failing tests:** District filter returns only desired districts; blocked/self/suspended accounts excluded; 14 district names recognized; online-only omits invisible users; forged age ranges/page sizes rejected.
- [ ] **Step 2 — red:** Run `npm test -- --run src/lib/domain/discovery.test.ts`. Expected FAIL.
- [ ] **Step 3 — implementation:** Add indexed database query/RPC with cursor pagination, safe card DTO, advanced filter controls and empty/loading states; no paid ML dependency.
- [ ] **Step 4 — green:** Run targeted tests, `supabase test db`, Playwright discover spec. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web supabase && git commit -m "feat(discovery): advanced Kerala profile search"`.

### Task 7: Atomic swipes and unique mutual matches

**Files:** Create `supabase/migrations/202610120003_messaging.sql` (swipes, matches, requests, conversations and related constraints), `apps/web/src/lib/domain/matching.ts`, `matching.test.ts`, `src/app/api/matches/route.ts`, `supabase/tests/database/matches.test.sql`.

**Interfaces:** `submitSwipe(targetMingleId:string, decision:'like'|'skip',ctx:AuthContext):Promise<{matched:boolean; matchId?:string}>`; PostgreSQL function `submit_swipe(target_mingle_id text, decision text)` uses `auth.uid()`.

- [ ] **Step 1 — failing tests:** Reciprocal likes yield one match; simultaneous duplicates/retries yield exactly one match; skipping never creates a match; self-like/blocked/suspended/unapproved targets fail.
- [ ] **Step 2 — red:** Run `supabase test db` and `npm test -- --run src/lib/domain/matching.test.ts`. Expected FAIL.
- [ ] **Step 3 — implementation:** Implement normalized unordered participant pair unique index, idempotent transaction/RPC, RLS and Swipe UI; use server identity, never client actor ID.
- [ ] **Step 4 — green:** Run tests plus concurrent request simulation. Expected PASS and one DB match row.
- [ ] **Step 5 — commit:** `git add supabase apps/web && git commit -m "feat(matches): atomic mutual likes"`.

### Task 8: Conversation requests and admission state machine

**Files:** Create `apps/web/src/lib/domain/requests.ts`, `requests.test.ts`, `apps/web/src/app/api/chat-requests/route.ts`, `supabase/tests/database/requests.test.sql`.

**Interfaces:** `createChatRequest(targetMingleId:string,ctx:AuthContext):Promise<{requestId:string}>`; `respondToChatRequest(requestId:string, response:'accept'|'reject',ctx:AuthContext):Promise<{conversationId?:string}>`; enforced `pending -> accepted|rejected|cancelled`.

- [ ] **Step 1 — failing tests:** Only recipient can accept; stranger cannot send into pending request; duplicate pending/concurrent requests coalesce; accepted request opens exactly one chat; blocked parties cannot request.
- [ ] **Step 2 — red:** Run targeted Vitest + pgTAP suite. Expected FAIL.
- [ ] **Step 3 — implementation:** Server-authorized transactional admission RPC, unique conversation pair, request inbox and Accept/Reject UI, anti-spam request counters.
- [ ] **Step 4 — green:** Run tests and two-account Playwright request/accept flow. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web supabase && git commit -m "feat(chat): implement request admission"`.

**Slice 2 acceptance gate:** Two invited testers can find each other, mutually match or request/accept chat; concurrent/retried calls preserve uniqueness and authorization.

## Slice 3 — Messaging and privacy

### Task 9: Protected text messaging and membership revocation

**Files:** Extend `202610120003_messaging.sql` or create a new forward-only migration for messages/read receipts/reactions; create `apps/web/src/lib/domain/chat.ts`, `chat.test.ts`, `apps/web/src/app/api/messages/route.ts`, `apps/web/src/app/(app)/chats/[id]/page.tsx`, `supabase/tests/database/messages.test.sql`.

**Interfaces:** `sendTextMessage(conversationId:string,text:string,ctx:AuthContext):Promise<{messageId:string}>`; `listMessages(conversationId:string,after?:string,ctx?:AuthContext):Promise<MessageView[]>`; `markRead(conversationId:string,messageId:string,ctx:AuthContext):Promise<void>`.

- [ ] **Step 1 — failing tests:** Sender and accepted counterpart may read; stranger/pending requester/blocked/restricted former participant cannot read or send; Unicode Malayalam/emoji round-trip; injected HTML renders as escaped text.
- [ ] **Step 2 — red:** Run `npm test -- --run src/lib/domain/chat.test.ts` and `supabase test db`. Expected FAIL.
- [ ] **Step 3 — implementation:** DB authorization, normalized message model/reactions/read receipts, route validation, accessible chat UI and idempotent send tokens. Block removes active send permission.
- [ ] **Step 4 — green:** Run tests and Playwright message send/receive/blocked-session tests. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web supabase && git commit -m "feat(chat): authorize persisted text messages"`.

### Task 10: Private realtime channels and reconnection

**Files:** Create `apps/web/src/lib/realtime/channels.ts`, `channels.test.ts`, `apps/web/src/components/chat/LiveChat.tsx`, `supabase/tests/database/realtime.test.sql`.

**Interfaces:** `subscribeToConversation(client:SupabaseClient,conversationId:string,onMessage:(message:MessageView)=>void):Promise<()=>void>`; channels named `conversation:<uuid>`, with Realtime authorization bound to membership and active account status.

- [ ] **Step 1 — failing tests:** Stranger cannot subscribe; participant receives only own conversation; user blocked mid-session fails on refresh/reconnect and next write/media access; duplicate events do not duplicate bubbles.
- [ ] **Step 2 — red:** Run targeted Vitest and database policy tests. Expected FAIL.
- [ ] **Step 3 — implementation:** Configure Realtime private channel policy, subscribe/unsubscribe cleanup, reconnect backfill, typing/read state and dedupe; use DB writes as source of truth.
- [ ] **Step 4 — green:** Run tests with two accepted testers and a third attacker identity. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web supabase && git commit -m "feat(realtime): protected chat subscriptions"`.

### Task 11: Invisible Mode without presence leakage

**Files:** Create `apps/web/src/lib/domain/presence.ts`, `presence.test.ts`, `apps/web/src/app/(app)/online/page.tsx`, `apps/web/src/components/settings/PrivacySettings.tsx`, `supabase/tests/database/presence.test.sql`.

**Interfaces:** `setInvisibleMode(enabled:boolean,ctx:AuthContext):Promise<void>`; `listVisibleOnline(ctx:AuthContext):Promise<PublicProfileCard[]>`.

- [ ] **Step 1 — failing tests:** Invisible user's status/last-seen absent from card/Online Now and publicly subscribed presence; same user can still send chat; visible user shows online only while truly connected.
- [ ] **Step 2 — red:** Run Vitest and pgTAP presence tests. Expected FAIL.
- [ ] **Step 3 — implementation:** Server-controlled visibility state, authorized presence projection, user Privacy Settings; minimize last-seen storage/exposure. Avoid raw presence broadcast to all clients.
- [ ] **Step 4 — green:** Run target + E2E profile/online tests. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web supabase && git commit -m "feat(privacy): add non-leaking invisible mode"`.

### Task 12: Private voice clips with hard 30-second policy

**Files:** Create `apps/web/src/lib/domain/voice.ts`, `voice.test.ts`, `apps/web/src/app/api/voice/route.ts`, `apps/web/src/components/chat/VoiceRecorder.tsx`, `supabase/tests/database/voice.test.sql`.

**Interfaces:** `createVoiceUploadIntent(conversationId:string,mimeType:string,sizeBytes:number,ctx:AuthContext):Promise<{uploadToken:string; objectPath:string}>`; `finalizeVoiceMessage(conversationId:string,objectPath:string,ctx:AuthContext):Promise<{messageId:string}>`; `getVoicePlaybackUrl(messageId:string,ctx:AuthContext):Promise<string>`.

- [ ] **Step 1 — failing tests:** Genuine 30-second recording accepted; >30-second or oversized/wrong-format rejected after server-side media probing (never trust browser-declared duration); blocked/stranger cannot upload or download; voice is inaccessible via public URL.
- [ ] **Step 2 — red:** Run `npm test -- --run src/lib/domain/voice.test.ts` and `supabase test db`. Expected FAIL.
- [ ] **Step 3 — implementation:** Private Storage bucket, strict object key scheme, single-use short-lived signed upload intents, audio file signature/size/duration verification by a server-capable media metadata probe before publishing, safe signed playback and orphan cleanup; compression and privacy reminder.
- [ ] **Step 4 — green:** Run target/security tests; manual iPhone/Android recording test for permissions. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web supabase && git commit -m "feat(voice): private 30-second audio messaging"`.

### Task 13: 24-hour/7-day/normal retention and scheduled purge

**Files:** Create `apps/web/src/lib/domain/retention.ts`, `retention.test.ts`, `apps/web/src/app/api/cron/purge/route.ts`, `apps/web/src/components/chat/RetentionControl.tsx`, `supabase/tests/database/retention.test.sql`, `.github/workflows/dev-retention.yml`.

**Interfaces:** `getExpiresAt(createdAt:Date,mode:RetentionMode):Date|null`; `updateRetentionMode(conversationId:string,mode:RetentionMode,ctx:AuthContext):Promise<void>`; `purgeExpiredMessages(now:Date):Promise<{deletedMessages:number; deletedObjects:number}>`.

- [ ] **Step 1 — failing tests:** 24h expires at exactly creation +24h; 7d at +7d; normal yields null; mode change does not retroactively alter old expiries; reported-evidence hold respected; failed Storage delete retries safely.
- [ ] **Step 2 — red:** Run `npm test -- --run src/lib/domain/retention.test.ts` and pgTAP. Expected FAIL.
- [ ] **Step 3 — implementation:** Immutable per-message `expires_at`, user-visible retention notice, secret-authenticated purge endpoint, idempotent DB + Storage deletion queue, durable deletion/audit status; DEV-only scheduled GitHub Actions invocation using repository secrets without exposing privileged keys to client. Document schedule delay/backup limits.
- [ ] **Step 4 — green:** Run targeted tests and dry-run purge on seeded messages/audio; verify replay safe and unauthorized cron calls denied. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web supabase .github/workflows/dev-retention.yml && git commit -m "feat(privacy): enforce disappearing message retention"`.

**Slice 3 acceptance gate:** Cross-account authorization tests all pass. Two invited users can text and exchange <=30s voice clips; Invisible Mode, blocking, and expiry enforce server-side privacy boundaries.

## Slice 4 — Trust and polished experience

### Task 14: Report/block/moderate with admin audit trail

**Files:** Create `supabase/migrations/202610120004_operations.sql`, `apps/web/src/lib/domain/moderation.ts`, `moderation.test.ts`, `apps/web/src/app/(admin)/admin/page.tsx`, `apps/web/src/app/api/reports/route.ts`, `supabase/tests/database/admin.test.sql`.

**Interfaces:** `blockUser(targetMingleId:string,ctx:AuthContext):Promise<void>`; `fileReport(targetMingleId:string,reason:ReportReason,evidenceIds:string[],ctx:AuthContext):Promise<{reportId:string}>`; `reviewReport(reportId:string,action:'warn'|'restrict'|'suspend'|'dismiss',admin:AuthContext):Promise<void>`.

- [ ] **Step 1 — failing tests:** Non-admin cannot load moderation records, user cannot report fabricated messages from other chats, admin sees report-scoped evidence only; restrictions stop future chats; every admin decision creates an audit log.
- [ ] **Step 2 — red:** Run targeted Vitest + pgTAP. Expected FAIL.
- [ ] **Step 3 — implementation:** Report/block schema, approved evidence retention, rules-based spam/request cooldowns, admin protected pages, actions/appeals and immutable admin audit; never add unrestricted message browsing.
- [ ] **Step 4 — green:** Run tests, negative-access E2E and manual report review. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web supabase && git commit -m "feat(safety): reporting and audited moderation"`.

### Task 15: In-app and optional privacy-preserving web push

**Files:** Create `apps/web/src/lib/domain/notifications.ts`, `notifications.test.ts`, `apps/web/src/app/api/push/route.ts`, `apps/web/public/sw.js`, `apps/web/src/components/settings/NotificationSettings.tsx`.

**Interfaces:** `shouldNotify(event:NotificationEvent,preferences:NotificationPreferences,now:Date,timezone:string):boolean`; `createPushSubscription(subscription:PushSubscriptionJSON,ctx:AuthContext):Promise<void>`.

- [ ] **Step 1 — failing tests:** Quiet hours in Asia/Kolkata suppress pushes crossing midnight; user declines permissions and still receives in-app badges; outgoing push has generic text without identities or message body; invalid/expired subscription pruned.
- [ ] **Step 2 — red:** Run `npm test -- --run src/lib/domain/notifications.test.ts`. Expected FAIL.
- [ ] **Step 3 — implementation:** Scoped in-app events, opt-in Push API/service worker, VAPID keys kept server-side, category toggles, quiet hours; feature detect devices, do not claim guaranteed iOS background delivery.
- [ ] **Step 4 — green:** Run unit test and manual browser matrix (iOS PWA, Android, desktop). Expected PASS/fallback recorded.
- [ ] **Step 5 — commit:** `git add apps/web && git commit -m "feat(notifications): private opt-in push alerts"`.

### Task 16: Cinematic backwater landing and reusable animated avatars

**Files:** Create `apps/web/src/components/landing/BackwatersScene.tsx`, `BackwatersScene.test.tsx`, `apps/web/src/components/avatar/Avatar.tsx`, `Avatar.test.tsx`, `apps/web/public/assets/backwaters-poster.webp`, and optimized licensed source models/assets in `apps/web/public/assets/3d/`.

**Interfaces:** `BackwatersScene({reducedMotion}:{reducedMotion:boolean})`; `Avatar({config,animated}:{config:AvatarConfig;animated:boolean})`; `AvatarConfig` uses an allowlisted model/outfit/hair/color enum, never an arbitrary user-supplied asset URL.

- [ ] **Step 1 — failing tests:** Low-performance/reduced-motion renders poster instead of 3D canvas; 3D is lazy-loaded; unsafe model path rejected; Start Mingling stays clickable with JS/3D failure.
- [ ] **Step 2 — red:** Run `npm test -- --run src/components/landing/BackwatersScene.test.tsx src/components/avatar/Avatar.test.tsx`. Expected FAIL.
- [ ] **Step 3 — implementation:** Build optimized Kerala houseboat/backwaters sunset scene with coconut-tree silhouettes/water effects, translucent UI and simple reusable avatar assets; enforce rendering budgets, accessibility and licensed asset provenance. Keep landing visuals from blocking login.
- [ ] **Step 4 — green:** Unit tests, `npm run build`, low-end mobile manual performance/a11y check. Expected PASS or documented measured thresholds.
- [ ] **Step 5 — commit:** `git add apps/web && git commit -m "feat(ui): add Kerala cinematic scene and avatar library"`.

### Task 17: Malayalam/English UI, responsive PWA and settings

**Files:** Create `apps/web/src/i18n/en.json`, `ml.json`, `apps/web/src/lib/i18n.ts`, `i18n.test.ts`, `apps/web/src/app/manifest.ts`, `apps/web/src/app/(app)/layout.tsx`, `apps/web/e2e/mobile.spec.ts`.

**Interfaces:** `translate(locale:'ml'|'en',key:TranslationKey):string`; default language chosen on profile or browser, user-switchable; PWA manifest points to original owned icons.

- [ ] **Step 1 — failing tests:** Every English UI key has Malayalam counterpart; language toggle persists; app keyboard navigation works; 360px screen shows all five tabs without horizontal overflow; offline shell does not leak stale private messages.
- [ ] **Step 2 — red:** Run unit i18n tests and `npx playwright test e2e/mobile.spec.ts`. Expected FAIL.
- [ ] **Step 3 — implementation:** Translate core flows/errors, Malayalam-compatible typography, accessible bottom navigation, profile/privacy/settings, correct icons/manifest and conservative offline shell cache policy (never cache private chat responses).
- [ ] **Step 4 — green:** Run target tests, mobile browser checks, Lighthouse PWA/a11y smoke test. Expected PASS.
- [ ] **Step 5 — commit:** `git add apps/web && git commit -m "feat(pwa): localize and optimize mobile experience"`.

**Slice 4 acceptance gate:** Admin can invite/revoke and review reports; notifications degrade gracefully; Kerala-themed PWA works with real/low-end device fallbacks and Malayalam UI.

## Slice 5 — Cost controls, deployment and beta readiness

### Task 18: Free/test-only one-time ID activation configuration

**Files:** Create `apps/web/src/lib/domain/activation.ts`, `activation.test.ts`, `apps/web/src/app/(admin)/admin/billing/page.tsx`, optional payment-order mock schema in operations migration; ensure no real gateway keys or capture SDK loaded.

**Interfaces:** `RegistrationMode = 'FREE'|'PAID_TEST'|'PAID_LIVE'`; `getActivationDecision(mode:RegistrationMode,verifiedPayment:boolean,environment:'development'|'production'): 'ACTIVE'|'PENDING_PAYMENT'|'DENIED'`.

- [ ] **Step 1 — failing tests:** DEV FREE activates with no charge; DEV PAID_TEST uses fake verified state; DEV PAID_LIVE always denied; mock callback replay never double-activates; existing active users remain active when fee config changes.
- [ ] **Step 2 — red:** Run `npm test -- --run src/lib/domain/activation.test.ts`. Expected FAIL.
- [ ] **Step 3 — implementation:** Implement server-only feature config, mock state machine, admin read-only simulated view of ₹19 option; block real payment collection. Document separate provider eligibility/tax/terms/verification approval required before any future live charge.
- [ ] **Step 4 — green:** Run test and E2E free registration with payment mode disabled. Expected PASS, no live gateway calls.
- [ ] **Step 5 — commit:** `git add apps/web && git commit -m "feat(billing): add safe free and test activation policy"`.

### Task 19: Provision private DEV with isolated Supabase and hosting

**Files:** Create `docs/operations/dev-runbook.md`, `apps/web/.env.example`, `apps/web/e2e/dev-smoke.spec.ts`; adjust only `apps/web` deploy configuration and dedicated CI if necessary.

**Interfaces:** Env names `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key equivalent), `SUPABASE_SERVICE_ROLE_KEY` (server only when unavoidable), `CRON_SECRET`, web push keys, `APP_ENV=development`; distinct callback URLs per environment.

- [ ] **Step 1 — failing tests:** E2E smoke test rejects uninvited Google account; valid tester can reach discovery; leaked `SUPABASE_SERVICE_ROLE_KEY` absent from client bundles; DEV hostname cannot use LIVE DB project ID.
- [ ] **Step 2 — red:** Run `npx playwright test e2e/dev-smoke.spec.ts` against disposable local env. Expected FAIL before deployment wiring.
- [ ] **Step 3 — implementation:** Set up isolated DEV hosting only with HTTPS, restricted tester access and DEV Supabase OAuth callback, RLS migrations, private Storage bucket, quota alerts, monitoring, backups and secrets in provider dashboard. Verify the chosen host's commercial-use and free-tier terms before provisioning; never change `CNAME`/LIVE DNS without explicit approval.
- [ ] **Step 4 — green:** Run smoke tests against authorized DEV test URL; verify GitHub Pages old site unchanged; inspect public bundle for secrets. Expected PASS.
- [ ] **Step 5 — commit:** `git add docs/operations apps/web .github/workflows/dev-app-ci.yml && git commit -m "chore(devops): document and verify isolated beta deployment"`.

### Task 20: Security regression, moderation drills and first private beta acceptance

**Files:** Create `apps/web/e2e/security.spec.ts`, `apps/web/e2e/beta-journey.spec.ts`, `docs/operations/beta-test-checklist.md`, `docs/operations/incident-response.md`.

**Interfaces:** The regression suite is the acceptance interface; test account fixtures `admin`, `invitedAlice`, `invitedBob`, `uninvitedEve`, `suspendedTester`. Never keep real email/password/token fixtures in the repository.

- [ ] **Step 1 — failing tests:** Eve cannot view profiles or chat; Bob cannot read Alice's separate conversation; a blocked user's pending channel/storage access fails; reported content follows evidence hold; underage age-check fails; normal chat/voice/billing-free flow succeeds.
- [ ] **Step 2 — red:** Run `npx playwright test e2e/security.spec.ts e2e/beta-journey.spec.ts` with seeded fixture accounts. Expected initial FAIL until complete integration.
- [ ] **Step 3 — implementation:** Resolve regressions, test concurrency with 10–20 accounts, accessible mobile paths, moderation abuse cases, key rotation, account removal, backup/recovery, service outage handling, monitoring and cost alerts; record any remaining risk and legal-age/privacy review before LIVE.
- [ ] **Step 4 — green:** Run `npm run lint && npm run typecheck && npm test -- --run && npm run build && npx playwright test`; root `supabase test db`; manual two-device chat/voice/push and administrator report drill. Expected PASS with test evidence saved in checklist.
- [ ] **Step 5 — commit:** `git add apps/web docs/operations && git commit -m "test(beta): verify privacy and invite-only readiness"`.

**Final acceptance gate:** Owner signs off on a private, 10–20-person beta; keep LIVE unmodified, no real payments, and document self-declared-age and non-E2EE limitations.

---

## Command reference (from repository root)

```bash
# Run only after plan approval and workspace preparation
cd apps/web
npm ci
npm run lint
npm run typecheck
npm test -- --run
npm run build
npx playwright test

# In repository root; requires local Supabase CLI and runtime
supabase start
supabase db reset
supabase test db
```

**Environment discipline:** Use synthetic fixture accounts/emails and local databases for automated tests; tests must not modify a real LIVE project. Create DEV secrets by hand in approved dashboards or secure automation, not in GitHub commits. Some browser tests require seeded OAuth session fixtures and local Supabase startup; configure a deterministic test helper instead of driving live Google UI automatically.

## Plan self-review mapping

| Specification coverage | Owning tasks |
|---|---|
| §2 legacy migration/isolation | 1, 19 |
| §3 architecture/RLS, authenticated app | 1–4 |
| §4 branding/3D/nav | 1, 16–17 |
| §5 Google onboarding and age declaration | 4–5 |
| §6 district preferences/discovery | 2–3, 6–7 |
| §7 hybrid requests, text, voice, Realtime | 7–10, 12 |
| §8 invisible mode, disappearing messages, notification | 11, 13, 15 |
| §9 moderation and admin log | 14 |
| §10 database design | 2–3, 7–9, 14, 18 |
| §11 optional test payment | 18 |
| §12 threat model / negative auth cases | 3–4, 9–14, 20 |
| §13 failure handling / retries | 7–13, 20 |
| §14 tests and milestone gates | 1–20 |
| §15 DEV/LIVE split | 1, 19–20 |
| §16 non-goals | all tasks, explicit exclusions |
| §17 legal/safety and provider checks | 18–20 |

**Plan handoff:** This written plan is for user review; creating the plan does not authorize implementation. After user approval, agree on execution approach (Subagent-driven recommended for multiple security-sensitive independently testable interfaces; Native alternative). Then begin Task 1 only on a separate implementation branch/worktree. All 20 tasks are unchecked until tested and implemented.
