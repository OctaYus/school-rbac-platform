/**
 * HTTP security headers + Content Security Policy.
 *
 * CSP is nonce-based: middleware generates a per-request nonce, sets it on the
 * forwarded request headers (so Next applies it to its own <script> tags) and
 * on the response CSP header. `strict-dynamic` lets those nonced scripts load
 * their dependencies without an explicit host allowlist.
 *
 * In development we relax script-src/style-src ('unsafe-eval'/'unsafe-inline')
 * because Next's HMR uses eval; production is strict (no unsafe-inline/eval for
 * scripts). style-src keeps 'unsafe-inline' (React/Next inject inline styles and
 * style nonces are not auto-applied) — the high-value protection is on scripts.
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https:`;

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self' https://challenges.cloudflare.com`,
    `frame-src 'self' https://challenges.cloudflare.com`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `manifest-src 'self'`,
    !isDev ? `upgrade-insecure-requests` : "",
  ].filter(Boolean);

  return directives.join("; ");
}

/** Static security headers applied to every response (also see next.config.ts). */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "X-DNS-Prefetch-Control": "off",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};
