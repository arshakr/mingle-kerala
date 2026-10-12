# Mingle Kerala DEV — Approved Architecture & Design Specification

- **Date:** 2026-10-12
- **Status:** Design draft for final written-spec review; implementation is NOT approved or started
- **Project:** Mingle Kerala, anonymous adult social discovery/dating platform for Kerala
- **Repository:** arshakr/mingle-kerala
- **Design basis:** User-approved design Sections 1, 2, and 3, plus prior 25 guided design decisions
- **First release:** Private, invitation-only DEV beta with 10–20 testers

## 1. Product goal and success criteria

Build a mobile-first, Malayalam/English, privacy-oriented web/PWA experience allowing adults in Kerala's 14 districts to discover compatible anonymous profiles, mutually match or request conversations, and exchange private text and short voice messages.

**The user chose:** Google-only login, self-declared date of birth + 18+ checkbox, anonymous premium profiles and customizable animated 3D avatars, district and advanced preference filtering, swipe matching, hybrid chat requests, 30-second voice messages, Invisible Mode, 24-hour/7-day disappearing-message options, web/in-app push notifications, advanced rules-based abuse controls, private DEV testing, and free-first access.

**Success for the first beta:** 10–20 invited adults can authenticate, complete a profile, discover one another using permissions-safe filters, mutually match or accept requests, send and receive authorized text/voice chat, block/report others, and use privacy settings. The admin can invite, revoke, and moderate testers. Tests prove cross-user data isolation. Mobile usage is viable on ordinary connections. Real payments stay disabled.

**Not success claims:** This document does not mean the website is deployed, accounts are configured, safety measures are implemented, age has been independently verified, or regulatory compliance has been certified.

## 2. Existing code and migration approach

The linked repository already contains a legacy static HTML/CSS/JavaScript frontend, a separate Express/Socket.IO backend, Prisma/PostgreSQL schema, a Render deployment manifest, and README guidance for GitHub Pages, Render, Neon, and email-link authentication. Some chat and moderation UX is demo-only.

**Approved new architecture replaces, not silently extends, the old deployment stack:** Next.js/TypeScript application; Supabase Auth (Google), Supabase PostgreSQL, Supabase Realtime, and Supabase Storage. Do not modify current production DNS or disable legacy services during development. First inspect old features/assets/tests, salvage suitable non-sensitive UX/assets, then build the new Next.js app in an isolated application directory/branch. Migrate only deliberately selected test data; never copy production identity/session secrets or private conversations by default. Old Render/Neon/Prisma deployment remains untouched until a separately approved retirement plan.

Delivery should be split into independently testable milestones, since 3D graphics, backend security, chat, moderation, and notifications are distinct subsystems.

## 3. Technology and logical architecture

- **Client:** Next.js App Router, TypeScript, Tailwind CSS, localized Malayalam/English UI, mobile-first responsive layout, installable PWA.
- **Visual layer:** Three.js + React Three Fiber for reusable optimized 3D backwater presentation and avatars; reduced-motion preference support; static/2D fallback for low-powered devices.
- **Authentication:** Supabase Auth Google OAuth, no user-chosen password and no SMS OTP. Google email and account identifiers must never appear in public APIs.
- **Data:** Supabase PostgreSQL with migrations, explicit constraints/indexes and Row Level Security (RLS).
- **API/transactions:** Next.js server routes/actions for privileged operations and transactional validation, with least-privilege credentials. Never expose a service-role key to browsers.
- **Realtime:** Supabase Realtime with protected subscriptions; database rows are source of truth. Do not rely on client-side filtering for privacy or moderation.
- **Audio:** Supabase Storage, private bucket, short-lived authorized access; enforced 30-second duration and upload-size/type limits.
- **Push:** Browser Push API, service worker and push subscription storage; permission opt-in and browser-availability fallback. Quiet hours enforced before delivery.
- **Deployment:** Private DEV web endpoint and separate DEV Supabase project. LIVE gets independent project, secrets, OAuth redirect URIs, bucket, and credentials only in a later launch phase.

**Design trade-off:** A single Next.js application plus managed Supabase minimizes operational complexity for 10–20 testers. Direct client operations are allowed only where verified RLS is sufficient; sensitive transactions go through a server-authorized path. A custom Socket.IO backend is not required for the initial beta. Re-evaluate costs/concurrency/commercial licenses before production.

## 4. Visual identity and navigation

**Brand colors:** emerald green #10B981, royal purple #7C3AED, gold #FBBF24, deep forest #071C18. Accessible contrast and keyboard focus remain mandatory.

**Landing page:** cinematic Kerala backwaters at sunset; coconut trees, traditional houseboat, animated water reflections, atmospheric particles, logo and tagline "Connect Hearts Across Kerala", prominent "Start Mingling" action. Progressive load: fast first paint with static poster, defer interactive 3D until capable hardware; cap frame rate and asset size.

**Signed-in navigation:** Home/Discover, Matches, Online, Chats, Profile. Shared settings include languages, notification preferences, privacy, and support. All 3D avatar designs use a small licensed/reusable model library; persist avatar configuration instead of one model file per member.

## 5. Account onboarding and age policy

1. User chooses Google sign-in.
2. Google/Supabase authenticates; backend checks signed-in identity against an admin-managed invitation allowlist. An uninvited identity may transiently exist in the Auth service, but **must not gain app access, profile creation, or data access**; disable/purge stale unauthorized identities where supported. Do not imply the frontend-only check blocks OAuth signup.
3. User reads and accepts age confirmation and site rules, supplies date of birth and acknowledges being 18 or older. Reject entries indicating under 18; record time/version of consent. This is **self-declaration, not independently verified age**; this risk must be reviewed before public launch.
4. Create unique anonymous Mingle ID and username; select district, gender (male/female/prefer not to say), language(s), age-range display, interests, relationship intention, short bio, and 3D avatar.
5. Account is ACTIVE in the private free DEV test. No payment is captured.

**Privacy:** Do not display Google picture, Google profile name, Google email, exact birth date, device IP, or account ID publicly. Store minimum age-check data necessary for enforcement and accountability; prefer a private eligibility flag plus derived age band over retaining full DOB indefinitely, subject to legal review. The public profile exposes only chosen anonymous fields.

## 6. Discovery and advanced matching

All 14 districts: Thiruvananthapuram, Kollam, Pathanamthitta, Alappuzha, Kottayam, Idukki, Ernakulam, Thrissur, Palakkad, Malappuram, Kozhikode, Wayanad, Kannur, Kasaragod.

**Filters:** selected districts; desired genders; age bands; preferred language(s); shared interests/hobbies; intentions (friendship/dating/serious relationship); optional online-only filter. Use deterministic database queries, no paid AI service. Display an indicative compatibility percentage only when computed from explicitly disclosed preference criteria, with no claim of actual relationship prediction.

**Swipes:** Like and Skip states unique per actor/target pair. A mutual Like creates exactly one match, idempotently. A skip does not reveal itself to the other user. Users cannot discover blocked accounts or suspended/unapproved testers. Database filters and server/RLS checks enforce these restrictions, not just the UI.

## 7. Hybrid chat permissions and messaging

**Conversation admission rules:**
- Mutual match may open a chat automatically.
- An unmatched user may submit one pending chat request to another allowed user; the recipient may accept or reject it.
- No messages are permitted while a request is pending, rejected, blocked, or restricted.
- Block actions deny further chat/request actions in both directions. Suspended/removed testers lose access immediately to the extent possible through server invalidation and short session duration.

**Message types:** Unicode text (Malayalam/English), emoji and reactions, and recorded audio up to 30 seconds. Features: typing indicator, sent/delivered/read state where feasible, unread count, deletion controls, push/in-app alerts. Avoid embedding unsafe HTML in message rendering.

**Audio privacy:** Preview before sending, compress efficiently, verify file MIME/content and duration server-side, enforce upload limits and sender authorization, and use a private bucket with short-lived access. Warn that a user's voice may identify them despite an anonymous profile.

**Transport/data:** Supabase Realtime transmits authorized events; messages persist in PostgreSQL, audio bytes in private Storage. RLS or restricted server functions enforce conversation membership on every read/write. Use private Realtime channels with topic-based authorization, test revocation and subscription leakage. Messaging is **not end-to-end encrypted** in this version; encryption in transit and vendor-side storage controls are distinct from E2EE.

## 8. Presence, retention, privacy and notifications

**Presence:** Users are visible by default when actively connected. Invisible Mode leaves them discoverable and able to chat, but hides presence, last seen, and inclusion in Online Now. Do not broadcast invisible presence to unauthorized subscribers or accidentally reveal it via queryable timestamps. The public online endpoint reads a derived, access-controlled presence view, not raw auth events.

**Retention modes:** Each conversation has a setting: normal, 24h, or 7d. New settings apply prospectively to new messages, with a visible system notice to both participants. Each message stores an immutable expiry timestamp computed at creation; normal messages follow published default retention/erasure rules. Scheduled server-side deletion removes expired DB content and associated audio objects. Cleanup is eventually consistent; document reasonable lag, backup expiration, report holds, and deletion limitations. Screenshots or copied media cannot be prevented.

**Reports:** Preserve the minimum necessary reported evidence under access-controlled retention when abuse is alleged; hold and deletion rules must be explicit. An unreported chat remains private from routine administrator browsing.

**Notifications:** In-app event feed plus opt-in web push. Quiet hours and per-category toggles; default text is generic ("You have a new message") with no sender identity or content. Browser/PWA support varies by device; never promise universal background delivery.

## 9. Administration and abuse controls

- Only explicitly assigned admin identities can open the protected admin area; role changes and significant actions generate immutable audit records.
- Admin abilities: manage email invitations, view aggregate usage and district distribution, review reports, warn/restrict/suspend testers, record decisions, hear appeals, and control future registration activation policy.
- The dashboard must not provide unrestricted private-chat search or browsing. Moderation access is scoped to user-submitted reports/evidence and auditable need-to-know workflows.
- Rules-based spam detection: limits per sender for chat requests/messages, repeated-message fingerprints, suspicious signup patterns, escalating cooldowns, false-positive appeal path.
- Require server-side rate limiting and consistent atomic enforcement; UI timers alone are insufficient. Ban bypass and collusion are residual risks, especially with easy Google account creation.
- Admin testers cannot impersonate other users or bypass privacy RLS through browser-facing keys.

## 10. Proposed data model (relational, not final SQL)

Private account domain:
- invitations: id, normalized_email, invited_by, status, expires_at, redeemed_at.
- private_accounts: auth_user_id, role, state, age_eligible, age_confirmation_version, confirmed_at, consent_versions, created_at, restricted_at.
- public_profiles: account_id (internal FK), mingle_id (public unique), anonymous_name, district_id, display_age_band, gender, languages, bio, relationship_intent, avatar_config, is_discoverable, invisible_mode, created_at.
- interests, profile_interests, discovery_preferences.

Connection domain:
- swipes: actor_id, target_id, decision, created_at; unique(actor_id,target_id).
- matches: normalized unordered participant pair, created_at; unique pair.
- chat_requests: sender_id, recipient_id, status, created_at, responded_at; indexes preventing duplicate simultaneous pending requests.
- conversations: id, participant_pair, created_at, retention_mode; unique participant pair.
- conversation_members: conversation_id, account_id, permissions.
- messages: id, conversation_id, sender_id, kind, body, object_key, created_at, expires_at, deleted_at; DB check constraints for text vs audio shape.
- message_reactions and read_receipts.

Safety/operational domain:
- blocks: blocker_id, blocked_id, created_at; unique directional pair.
- reports, report_evidence, moderation_actions, admin_audit_logs.
- notification_preferences, notification_events, push_subscriptions.
- presence_sessions (ephemeral source) and rate_limit_counters (server-enforced).
- configuration: registration_payment_mode, price_minor_units, feature_flags, published_policy_version.
- payment_orders, payment_events, activation_ledger (test-only integration in DEV; no production payment credentials).

**Data minimization:** avoid writing authenticated email/name into the public_profiles table. Create explicit RLS policies for ALL tables and test policy coverage. Avoid storing raw Google tokens, payment card details, or long-lived audio public URLs.

## 11. One-time ID activation (disabled for DEV)

User decision: free at the start; optional one-time fee approximately INR 19 for **new registrations only** if hosting/payment costs require it. Existing users' original access should not be silently revoked.

**Mode values:** FREE, PAID_TEST, PAID_LIVE. DEV must be FREE or PAID_TEST only. A paid mode is enabled only after provider accepts the dating-platform business type and pricing, taxes, cancellation/refund rules, and terms are reviewed.

**Activation states:** INVITED -> AUTHENTICATED -> ELIGIBLE_18_SELF_DECLARED -> PROFILE_READY -> ACTIVE_FREE, or PENDING_PAYMENT -> PAYMENT_VERIFIED -> ACTIVE_PAID. Payment failure preserves PENDING_PAYMENT; refunds/chargebacks create a reviewed state, never an automatic irreversible ban without published policy.

Server creates unique payment order and validates provider signature/webhook with idempotency and replay safeguards. Only server-verified paid success can activate a paid account. Never trust a client-side payment-success screen or store payment details in public profiles. Fees/taxes/provider approval must be checked again before LIVE; a one-time charge does not guarantee sustainable recurring revenue.

## 12. Security architecture and threat model

Top risks: IDOR/chat leakage, invisible-presence leakage, forged match/request state, abusive message flooding, arbitrary storage reads, underage self-declaration bypass, compromised admin account, SQL/RLS policy mistakes, vulnerable 3D dependencies, and oversharing via notifications.

Mitigations:
- RLS deny-by-default, least privilege, server validation and authenticated Supabase JWT verification.
- Realtime subscriptions require private-channel authorization; short-lived auth and channel refresh/reconnect rules when members are removed.
- Object-storage access rules tied to eligible conversation members; expiring URLs, upload validation, metadata/content validation and storage quotas.
- CSRF protections as appropriate to auth transport, secure same-site cookies where used, CSP, safe content rendering, dependency pinning and audits.
- Rate limits and anti-automation protections on login/onboarding/invitations/swipes/requests/message submission.
- No privileged credentials in client bundles, logs, example env files, screenshots or repository commits.
- Backups, incident response contacts, moderator audit logs, breach response and account deletion workflows.

**Privacy reality:** This is anonymous to other members, **not anonymity from the operator or OAuth provider**. Google identities, voice, reports and logs can contain personal data. No feature guarantees screenshot prevention, perfect abuse detection or provable age.

## 13. Error handling and operational behavior

- If Google OAuth fails or is cancelled: show actionable retry, do not create a partial public profile.
- If user is not invited: generic denial; no access to discovery, Realtime or storage.
- If database/Realtimes fail: queue no unverified sent statuses; display reconnect state and safely retry idempotent writes.
- If chat request and match race: transactions/upserts ensure one valid conversation.
- If blocked during a session: reject next write and revoke channel access on token renewal/reconnect; minimize stale realtime authorization windows.
- If audio upload fails: clean up orphaned object, message remains unsent.
- If deletion job fails: retry idempotently, alert administrator on delayed expiry beyond documented thresholds.
- If browser push unavailable/denied: in-app notifications still function.

## 14. Delivery milestones and acceptance tests

**M1 — Foundation & invitations:** New isolated Next.js app, DEV Supabase project, Google sign-in, allowlist, self-declared age gate, private profile, role handling, migration scripts, CI checks. Test unauthorized and uninvited access.

**M2 — Discovery & match:** Profiles, districts, filters, swipe logic, request state machine, blocking. Test preference accuracy, pair uniqueness and cross-user RLS isolation.

**M3 — Private messaging:** Text Realtime, request acceptance, read states, voice upload <=30s, retention modes, automatic cleanup. Test forged participants, direct storage URLs, expired content, block events and reconnects.

**M4 — 3D UX & PWA:** Cinematic backwaters, model/avatar customization, Malayalam/English, accessibility/mobile fallback, PWA shell. Measure performance on lower-end phones and reduced motion.

**M5 — Safety/admin/push:** Reports with minimal evidence, spam limits, restricted dashboard, notifications, consent/quiet hours, audit logs. Automated security and manual abuse-case tests.

**M6 — Private beta readiness:** Invite 10–20 adults, test concurrency, usability, account deletion, moderation and mobile browsers. Confirm hosting terms, quota alerts, costs, backups, documented limitations.

Every milestone requires unit/integration tests, schema/RLS tests, and demo acceptance before progressing. First beta should prioritize reliable auth/messaging/privacy over polishing the cinematic visuals.

## 15. Environment separation and deployment policy

- DEV website: private, invitation-only, HTTPS, separate env vars, Google OAuth callback, Supabase project, bucket and push keys. Subdomain dev.minglekerala.com is **illustrative, not registered or provisioned**.
- LIVE website: no creation/deployment under this spec. Requires separate decision on domain ownership, commercial hosting, payment processor onboarding, age/safety practices, moderation staffing, terms/privacy documents and legal review.
- Branching: preserve existing legacy main deployments. Commit this design to a docs-only feature branch; implementation plans should explicitly select migration topology and deployment workflow before code changes.
- Hosting economics: start with free eligible development resources, no assumption of indefinite free hosting; check quota/current plan terms for Supabase services and Vercel Hobby's non-commercial-only restriction before choosing a host for public or monetized launch.

## 16. Explicit non-goals and future work

Not part of the first DEV beta: verified identity/age-document collection, video calling, photo sharing, public profile photographs, unrestricted file sharing, paid AI matchmaking, universal background push support, native mobile applications, full end-to-end message encryption, any live payment collection, or public LIVE registration. Stronger age assurance, enterprise moderation, commercial hosting and optional premium monetization require separate proposals.

## 17. Legal, safety and privacy review required before public launch

Obtain up-to-date professional review of applicable Indian privacy, consumer, intermediary, cybersecurity and payments rules; data retention and deletion requirements; safety reporting; guardian/minor exclusion; dating category payment-provider eligibility; privacy policy and terms. Self-declared DOB alone does not establish true age. Avoid claiming compliance, E2EE, screenshot protection or independently verified users unless demonstrated.

## 18. Official architectural references (re-check versions when implementing)

- Supabase Google Auth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Realtime Authorization: https://supabase.com/docs/guides/realtime/authorization
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Vercel Hobby conditions: https://vercel.com/docs/plans/hobby

## 19. Review checkpoint

The user has approved design Sections 1–3, not this exact written artifact. **Next action is user review and approval of this specification.** No application code, deployment, provisioning or implementation plan should be started until that review. Following written-spec approval, create a separate task-by-task implementation plan and obtain approval of its execution approach.
