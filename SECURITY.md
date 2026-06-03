# Security Policy

## Reporting a vulnerability

Please report security issues privately. **Do not open a public issue.**

- Email: `security@example.com` (replace with your real address), or
- Use GitHub's **Report a vulnerability** (Security → Advisories) on this repo.

Include: affected version/commit, a description, reproduction steps or PoC, and
impact. We aim to acknowledge within **3 business days** and provide a remediation
timeline after triage. Please allow **90 days** for a fix before public
disclosure; we're happy to coordinate.

We will credit reporters who wish to be acknowledged.

## Scope

In scope: authentication/authorization (IDOR, privilege escalation), injection,
session handling, cryptographic handling of secrets and health records, CSRF,
CSP/header bypass, and audit-log integrity.

Out of scope: findings requiring a compromised host/DB, social engineering,
self-XSS, missing best-practice headers without demonstrated impact, and rate
limits on non-sensitive endpoints.

## Handling of sensitive data

- Passwords: Argon2id, never logged.
- Health record details and TOTP secrets: AES-256-GCM encrypted at rest.
- Logs: structured (pino) with PII redaction.
- Audit log: append-only (DB trigger).

## Supported versions

The latest `main` is supported. Security fixes are not back-ported to older tags.
