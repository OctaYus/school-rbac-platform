# School RBAC Platform

A production-grade, role-based school management application: students, marks,
encrypted health records, and teacher sessions — secured with three-layer access
control, MFA, application-layer encryption, rate limiting, and append-only audit
logging.

Built with **Next.js 15 (App Router) + TypeScript**, **Prisma + PostgreSQL**,
**Auth.js v5**, **Tailwind v4 + shadcn/ui**, **Zod**, **Vitest** and
**Playwright**.

> **Stack note:** the spec locked Next.js 15; `create-next-app` now ships 16, so
> Next is pinned to `^15` for Auth.js v5 compatibility. Tailwind v4 is used
> (current shadcn default). DB provider defaults to **Neon** (any Postgres works).

---

## Quick start

```bash
pnpm install
cp .env.example .env.local      # fill in real values (also copy to .env for Prisma CLI)

# generate the two required secrets:
openssl rand -hex 32            # -> ENCRYPTION_KEY (64 hex chars)
openssl rand -base64 32         # -> AUTH_SECRET

pnpm db:migrate                 # apply migrations to your Postgres
pnpm db:seed                    # seed demo users (prints credentials once), students, sessions
pnpm dev                        # http://localhost:3000
```

`pnpm db:seed` prints one strong password per role **once** to stdout. Set
`SEED_DEMO_PASSWORD` to use a fixed password (handy for local E2E).

## Environment variables

See [`.env.example`](./.env.example). Required: `DATABASE_URL`, `AUTH_SECRET`,
`ENCRYPTION_KEY`. Optional (degrade gracefully if unset): `SMTP_*` (magic-link
email), `UPSTASH_REDIS_REST_*` (distributed rate limiting — falls back to
in-memory in dev), `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`,
`NEXT_PUBLIC_SENTRY_DSN`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev / build / serve |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test` / `pnpm test:watch` | Vitest unit tests |
| `pnpm test:e2e` | Playwright (needs a built + seeded app) |
| `pnpm db:migrate` / `pnpm db:deploy` | Prisma migrate (dev / prod) |
| `pnpm db:seed` / `pnpm db:studio` | Seed / Prisma Studio |
| `pnpm format` | Prettier write |

## Roles & RBAC matrix

Four roles: `OWNER` (super-admin), `MANAGER`, `SUPERVISOR`, `TEACHER`.

| Capability | OWNER | MANAGER | SUPERVISOR | TEACHER |
|---|:--:|:--:|:--:|:--:|
| Create/disable accounts | ✅ | ✅ | ❌ | ❌ |
| Assign roles | ✅ | ✅ (not OWNER) | ❌ | ❌ |
| Create/edit/delete students | ✅ | ✅ | ✅ | ✅ |
| Update status / marks / notes | ✅ | ✅ | ✅ | ✅ |
| Update health records | ✅ | ✅ | ✅ | ✅ (assigned only) |
| View all students | ✅ | ✅ | ✅ | ❌ (assigned only) |
| Create session templates | ✅ | ✅ | ✅ | ❌ |
| Assign sessions | ✅ | ✅ | ✅ | ❌ |
| Mark session taken/missed/resched | ✅ | ✅ | ✅ | ✅ (own only) |
| View audit log | ✅ | ✅ | ❌ | ❌ |
| View any teacher's calendar | ✅ | ✅ | ✅ | ❌ (own only) |
| Manage settings | ✅ | ✅ | ❌ | ❌ |

### Three-layer enforcement

1. **Middleware** (`src/middleware.ts`) — coarse route gating by auth + admin role.
2. **Guards** (`src/lib/auth/guards.ts`) — `requireRole` / `requireCapability` /
   `assertStudentAccess` / `assertSessionOwnership` on every server entry point.
3. **Data layer** (`src/lib/db/scope.ts`) — `scopedFor(user)` injects ownership
   `WHERE` clauses so a teacher physically cannot read another teacher's rows.

Every server action re-derives the user + role from the session
(`getCurrentUser`) and re-authorizes. Client-side role checks only hide UI.

## Security model (summary)

- **AuthN:** Argon2id password hashing; optional TOTP MFA + hashed backup codes;
  hashed single-use 10-min magic-link tokens; per-account lockout + per-IP rate
  limiting; JWT sessions with `tokenVersion`-based instant invalidation on
  password/role/MFA change and admin force-logout.
- **AuthZ:** three-layer RBAC, per-resource ownership checks (no IDOR).
- **Input:** Zod `.strict()` on every boundary; no raw SQL.
- **Data at rest:** `HealthRecord.details` + TOTP secret encrypted with
  AES-256-GCM (versioned bundle, AAD, auth-tag tamper detection).
- **HTTP:** nonce-based CSP, HSTS, `X-Frame-Options: DENY` + `frame-ancestors
  'none'`, nosniff, strict Referrer/Permissions policies.
- **Audit:** every mutation logged with actor/IP/UA/diff; the `AuditLog` table is
  append-only (DB trigger blocks UPDATE/DELETE).

See [`docs/threat-model.md`](./docs/threat-model.md) for the STRIDE pass and
[`SECURITY.md`](./SECURITY.md) for disclosure.

## Deployment (Vercel)

1. Push to GitHub; import the repo in Vercel.
2. Add a Postgres database (Neon/Supabase via the Vercel integration) — sets
   `DATABASE_URL`.
3. Add env vars (mark `ENCRYPTION_KEY`, `AUTH_SECRET`, `DATABASE_URL`,
   `SMTP_PASSWORD` as **Sensitive**): `AUTH_SECRET`, `ENCRYPTION_KEY`,
   `AUTH_URL` (your prod URL), and any optional integrations.
4. Set the build command to `pnpm build` and add `pnpm exec prisma migrate
   deploy` as a deploy/post-install step (or run it once from CI).
5. Production deploys on `main`; preview deploys on PRs.

> **Cloudflare Workers/Pages note:** this app uses the native `@node-rs/argon2`
> binding and Prisma's native query engine, which do **not** run on Cloudflare's
> `workerd` runtime. A Cloudflare deploy requires swapping Argon2 for a
> WASM/Web-Crypto hash and Prisma for the Neon HTTP driver adapter via the
> OpenNext Cloudflare adapter. Vercel (Node runtime) is the supported target.

## CI

`.github/workflows/ci.yml` runs on every PR: install → prisma
generate/validate/migrate → lint → typecheck → unit tests → build → secret-grep
of the build output → `pnpm audit`. A second job seeds Postgres and runs the
Playwright RBAC suite. Dependabot is enabled.

## License

For evaluation/demonstration purposes.
