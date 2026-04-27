# SoilPlus 2.0 — Security audit

_Last reviewed: 2026-04-26 · Auditor: project author + automated review_

This document captures the threat model, the secrets in play, and the
hardening that's already in place. Read this before deploying.

---

## 1. Secrets inventory

All secrets live in `.env.local`. **`.env.local` is in `.gitignore`** (line 7
of the file) and there is no git repo in the project at the moment, so
nothing has ever been committed. Verify before you run `git init`:

```bash
grep -F '.env.local' .gitignore   # must print: .env.local
```

| Secret | Scope | Where read | Browser-exposed? |
|---|---|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API quota | `app/api/{chat,diagnose,forecast,analyze}/route.ts` | **No** — server-only |
| `SUPABASE_URL` | Supabase project endpoint | `lib/store.ts` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | **Supabase admin (bypasses RLS)** | `lib/store.ts` | **No — must never leak** |
| `SESSION_SECRET` | HMAC signing for session cookies | `lib/auth.ts` | No |
| `OPENWEATHERMAP_API_KEY` | Free-tier weather quota | `app/api/weather/route.ts` | No |

None of these are prefixed `NEXT_PUBLIC_`, so Next.js will not inline them
into the client bundle. Confirmed by repo-wide grep — no app-level
`NEXT_PUBLIC_*` references.

### What an attacker would do with each key (and your blast radius)

- **Gemini key:** burn through your Google AI Studio quota and run up a bill.
  _Mitigation:_ rotate at https://aistudio.google.com/apikey; set a per-project
  quota cap; the 4 routes that use it are rate-limited.
- **Supabase service-role key:** **full read/write on every table, bypassing
  RLS.** This is the single most dangerous secret in the project. _Mitigation:_
  rotate immediately at Supabase → Settings → API → "Reset service_role" if
  you ever accidentally commit it. Never embed this in client code, edge
  configs that are shipped to browsers, or screenshots.
- **Session secret:** if leaked, an attacker can forge any user's session
  cookie. _Mitigation:_ regenerate with `openssl rand -hex 32` and redeploy;
  every existing session is invalidated on next request.
- **OpenWeatherMap key:** quota-burn only (free tier, no billing risk).

### Rotation runbook

```bash
# Gemini
open https://aistudio.google.com/apikey   # delete old, create new

# Supabase service_role
open https://supabase.com/dashboard/project/wpetubtrcurxbdtqudyh/settings/api

# Session secret
openssl rand -hex 32

# OpenWeatherMap
open https://home.openweathermap.org/api_keys
```

After any rotation, update `.env.local` locally + the env vars in your
hosting provider (Vercel / Fly / etc.), then redeploy.

---

## 2. Transport & headers

`next.config.mjs` ships these headers on every response:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` — blocks clickjacking iframes.
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(), geolocation=(self),
  payment=(), usb=()` — only the camera (`/diagnose`) and geolocation
  (`/weather`) features are enabled.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `poweredByHeader: false` — drops `X-Powered-By: Next.js`.

There is no Content-Security-Policy yet. Add one at the hosting layer if you
want to lock down `script-src` / `connect-src`.

---

## 3. AuthN / AuthZ

- Passwords are hashed with `pbkdf2(sha512, 100_000 iters, 64 bytes)` plus a
  per-user 16-byte salt — `lib/auth.ts:27`.
- Session cookies are stateless HMAC-signed JWT-likes (`uid` + `exp`),
  `httpOnly`, `sameSite=lax`, `secure` in production, 30-day TTL —
  `lib/auth.ts:150`.
- HMAC verification uses `crypto.timingSafeEqual` to avoid timing leaks —
  `lib/auth.ts:65`.
- Password verification also uses `timingSafeEqual` — `lib/auth.ts:138`.
- The first user to register becomes admin (`countUsers() === 0`) —
  `lib/auth.ts:121`. Make sure you sign up first on a fresh deployment
  before sharing the URL.
- Device-owner gating: every page under `/dashboard`, `/connect`,
  `/irrigation`, `/forecast` checks `getSessionUser()` server-side via
  `<DeviceGate>` and verifies `deviceOwner === true` (auto-recomputed from
  paid orders on `/api/auth/me`).

---

## 4. Abuse / DoS surface

In-memory token-bucket rate limit (`lib/rate-limit.ts`):

| Route | Cap | Window |
|---|---|---|
| `/api/chat` | 30 req | 60 s |
| `/api/diagnose` | 15 req | 60 s |
| `/api/forecast` | 20 req | 60 s |
| `/api/analyze` | (see file) | 60 s |
| `/api/weather` | (see file) | 60 s |

Per-IP keying via `x-forwarded-for`. **This is per-instance** — if you scale
horizontally, swap to Upstash Redis (note already in `lib/rate-limit.ts:3`).

Hard caps:
- `/api/diagnose`: 11 MB base64 (~8 MB decoded) image limit.
- `/api/chat`: each message capped at 2 KB, last 20 turns kept.
- `/api/forecast`: `areaM2` capped at 10,000,000 m² (1000 ha).

---

## 5. Input validation

All API routes wrap `req.json()` in `try/catch` and return 400 on parse
failure. Type guards like `isReading`, `isMsg` reject malformed shapes
before they hit business logic. SQL is delegated to the Supabase client
which parameterises everything — no raw string interpolation in the
codebase (verify with `grep -r "FROM\|INSERT\|UPDATE" lib/ app/`).

User text is rendered through React, which escapes by default — no
`dangerouslySetInnerHTML` in the project.

---

## 6. Database posture (Supabase)

- All app traffic uses the **service_role key** through `lib/store.ts`.
  Service-role bypasses RLS, so the security boundary is the Next.js API
  route layer, not Supabase RLS.
- For defence-in-depth, RLS should still be **default-deny** on every table
  so that if the anon key is ever used, no rows are exposed. Verify in
  Supabase → Authentication → Policies.
- Rotate the service_role key if `.env.local` ever lands in a commit, a
  pastebin, a CI log, or a screenshot.

---

## 7. Pre-deploy checklist

- [ ] `.env.local` is **not** committed (`git check-ignore .env.local` →
      should print the path).
- [ ] `SESSION_SECRET` is the 64-hex-char production value, not the
      `soilplus-dev-secret-change-me-in-production` fallback in
      `lib/auth.ts:42`.
- [ ] All four secrets are configured in your hosting provider's env-var UI
      (Vercel → Project Settings → Environment Variables).
- [ ] First signup on the prod URL is **you** — you become the admin.
- [ ] Sign in on production over HTTPS only (cookies are `secure` in prod).
- [ ] Test rate limits with `for i in {1..40}; do curl -X POST .../api/chat ...; done`.

---

## 8. Known limitations

- No Content-Security-Policy header yet.
- Rate limiter is in-memory; doesn't survive serverless cold starts or
  scale beyond one instance.
- File-based fallback store (`./.data/*.json`) is for local dev only — if
  the Supabase env vars are missing in production, password hashes end up
  on the server's disk. Always set Supabase vars in prod.
- No 2FA / MFA on admin accounts.
- No audit log for admin actions on orders.

---

## 9. If a key leaks

1. Rotate the affected secret (see runbook above).
2. Search git history: `git log -p --all -S '<first 12 chars of leaked key>'`.
3. If it's the **Supabase service_role**, also assume every row of every
   table has been read; consider whether the user/order data needs
   notification.
4. Re-deploy with the new secret.
5. Document the incident below with date + scope + mitigation.

| Date | Secret | Where leaked | Action |
|---|---|---|---|
| _none yet_ | | | |
