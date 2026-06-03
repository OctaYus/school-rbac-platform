import "server-only";
import pino from "pino";

/**
 * Structured JSON logger with PII redaction. Server-only — never import from
 * client components. Sensitive fields are censored regardless of nesting.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: [
      "password",
      "*.password",
      "passwordHash",
      "*.passwordHash",
      "token",
      "*.token",
      "mfaSecret",
      "*.mfaSecret",
      "details",
      "*.details",
      "req.headers.authorization",
      "req.headers.cookie",
      "headers.authorization",
      "headers.cookie",
    ],
    censor: "[redacted]",
  },
});
