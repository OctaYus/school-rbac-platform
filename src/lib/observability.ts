import "server-only";

import { logger } from "@/lib/logger";

/**
 * Sentry placeholder (env-gated).
 *
 * Real wiring lives behind NEXT_PUBLIC_SENTRY_DSN: install @sentry/nextjs and
 * forward to Sentry.captureException here. Until then we log structured errors
 * via pino so nothing is silently swallowed and no internals leak to clients.
 */
const SENTRY_ENABLED = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  logger.error({ err: error, sentry: SENTRY_ENABLED, ...context }, "captured exception");
  // if (SENTRY_ENABLED) Sentry.captureException(error, { extra: context });
}
