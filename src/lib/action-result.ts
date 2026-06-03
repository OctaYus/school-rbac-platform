import { isAppError, ValidationError } from "@/lib/errors";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/**
 * Map a thrown error to a safe ActionResult. AppErrors surface their (curated)
 * message; anything else is logged server-side and returns a generic message so
 * stack traces / internals never reach the client.
 */
export function handleActionError(e: unknown): ActionResult<never> {
  if (e instanceof ValidationError) {
    return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
  }
  if (isAppError(e)) {
    return { ok: false, error: e.message };
  }
  console.error("Unhandled server action error:", e);
  return { ok: false, error: "Something went wrong. Please try again." };
}
