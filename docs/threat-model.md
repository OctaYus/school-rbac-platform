# Threat model (STRIDE)

A short STRIDE pass over the three highest-risk areas: authentication, sessions,
and student/health data. Assets: user credentials, session tokens, student PII,
and mental/physical health records (most sensitive).

## Trust boundaries

- Browser ↔ Next.js server (server actions / route handlers).
- Server ↔ PostgreSQL.
- Server ↔ third parties (SMTP, Upstash, HIBP, Turnstile).

Client-supplied identity/role is **never** trusted; every server entry point
re-derives the user from the session and re-authorizes.

## Authentication

| STRIDE | Threat | Mitigation |
|---|---|---|
| **S**poofing | Credential stuffing / brute force | Argon2id; per-account lockout w/ exponential backoff; per-IP rate limit; Turnstile after threshold (hook). |
| Spoofing | User enumeration via timing/messages | Constant dummy Argon2 verify on unknown accounts; generic error + generic forgot-password response. |
| **T**ampering | Forged magic-link token | Tokens random (256-bit), stored **hashed** (SHA-256), single-use, 10-min TTL. |
| **I**nfo disclosure | Password reuse from breaches | HIBP k-anonymity check on invite/reset (full hash never leaves server). |
| **E**levation | Weak/guessable passwords | 12+ char policy w/ complexity, enforced server-side via Zod. |
| **R**epudiation | "I didn't do that" | All auth-relevant mutations audited with actor/IP/UA. |

## Sessions

| STRIDE | Threat | Mitigation |
|---|---|---|
| Spoofing | Stolen cookie replay | `HttpOnly`, `Secure`, `SameSite` cookies; short-lived (8h) JWT. |
| Tampering | Forged/edited JWT | Signed with `AUTH_SECRET`; claims re-validated against DB. |
| Elevation | Stale role after demotion / disabled account still active | `tokenVersion` bumped on role/password/MFA change + force-logout; JWT revalidated against DB on an interval and in `getCurrentUser`. |
| Info disclosure | XSS stealing token | Strict nonce-based CSP (no `unsafe-inline`/`eval` scripts); React auto-escaping; no `dangerouslySetInnerHTML`. |
| **D**oS | Auth endpoint flooding | Sliding-window rate limits on login/reset/MFA/session actions. |

## Student & health data

| STRIDE | Threat | Mitigation |
|---|---|---|
| Tampering | One teacher edits another's students | Three-layer RBAC: middleware + `assert*` guards + `scopedFor` query scoping (assignment join). |
| Info disclosure | IDOR on `/students/[id]` etc. | Teacher reads/writes go through ownership-scoped queries; direct fetch by id returns null if out of scope. |
| Info disclosure | Health details leak from DB dump | `HealthRecord.details` encrypted (AES-256-GCM + AAD); key only on server, never serialized to client. |
| Info disclosure | Sensitive values in logs/audit | pino PII redaction; audit diffs `redact()` health/secret fields. |
| Repudiation | Tampered audit trail | `AuditLog` append-only via DB trigger blocking UPDATE/DELETE. |
| Tampering | SQL/parameter injection | Prisma parameterized queries only; Zod `.strict()` rejects unexpected keys. |

## Residual risks / follow-ups

- Turnstile + Sentry are wired as env-gated placeholders; enable in production.
- Per-IP rate limiting falls back to in-memory without Upstash (set
  `UPSTASH_REDIS_REST_*` in production).
- A dedicated least-privilege DB role should additionally `REVOKE UPDATE,
  DELETE ON "AuditLog"` (trigger already enforces append-only).
- CSP keeps `style-src 'unsafe-inline'` (framework-injected styles); script-src
  is strict nonce + `strict-dynamic`.
