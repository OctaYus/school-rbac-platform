# Contributing

Thanks for contributing! This project favors small, well-tested changes.

## Setup

```bash
pnpm install
cp .env.example .env.local   # and .env for Prisma CLI
pnpm db:migrate && pnpm db:seed
pnpm dev
```

Node version is pinned in `.nvmrc` (use `nvm use`). pnpm is the package manager.

## Workflow

1. Branch off `main`.
2. Make your change with tests.
3. Ensure the full gate passes locally:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```
4. Open a PR. CI must be green; PRs get a Vercel preview deploy.

A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files).

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `docs:`, `test:`…).
- **Validation:** every server action / route handler parses input with a Zod
  schema using `.strict()`.
- **Authorization:** start every server entry point with `requireUser` /
  `requireCapability` / `requireRole`; read student & session data through
  `scopedFor(user)`; add ownership asserts for teacher-scoped resources.
- **Auditing:** every create/update/delete on User/Student/Mark/HealthRecord/
  Session calls `writeAudit(...)`. Never put secrets or health details in a diff
  (use `redact()`).
- **Secrets:** never commit `.env*` (except `.env.example`); never log PII.
- **Crypto:** sensitive free-text is encrypted via `lib/security/crypto.ts`.

## Tests

- Unit (Vitest): RBAC matrix, row scoping, encryption, Zod schemas, TOTP.
- E2E (Playwright): per-role access control. Requires a built + seeded app:
  ```bash
  pnpm build && pnpm db:seed && pnpm test:e2e
  ```

Add a test for every behavioral change. Security-relevant changes should include
a test demonstrating the control.
