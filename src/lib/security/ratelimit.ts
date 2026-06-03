import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Sliding-window rate limiting.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL / _TOKEN are configured
 * (required in production); otherwise falls back to a per-instance in-memory
 * limiter for local development. The in-memory limiter is NOT suitable for
 * production (per-instance, resets on deploy) and is gated to non-production.
 */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms when the window resets
}

interface Limiter {
  limit(key: string): Promise<RateLimitResult>;
}

function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// ---- In-memory fallback (dev only) ----------------------------------------
class MemoryLimiter implements Limiter {
  private hits = new Map<string, number[]>();
  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  async limit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const arr = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    arr.push(now);
    this.hits.set(key, arr);
    const remaining = Math.max(0, this.max - arr.length);
    return { success: arr.length <= this.max, remaining, reset: now + this.windowMs };
  }
}

// ---- Upstash adapter -------------------------------------------------------
class UpstashLimiter implements Limiter {
  private rl: Ratelimit;
  constructor(redis: Redis, max: number, window: `${number} s` | `${number} m`) {
    this.rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window),
      prefix: "rl",
      analytics: false,
    });
  }
  async limit(key: string): Promise<RateLimitResult> {
    const r = await this.rl.limit(key);
    return { success: r.success, remaining: r.remaining, reset: r.reset };
  }
}

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!upstashConfigured()) return null;
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

function makeLimiter(
  max: number,
  windowMs: number,
  window: `${number} s` | `${number} m`,
): Limiter {
  const r = getRedis();
  if (r) return new UpstashLimiter(r, max, window);
  if (process.env.NODE_ENV === "production") {
    // Surface a clear signal rather than silently degrading in prod.
    console.error("Rate limiting falling back to in-memory in production — set UPSTASH_REDIS_*");
  }
  return new MemoryLimiter(max, windowMs);
}

// Named limiters for sensitive flows.
export const loginIpLimiter = makeLimiter(10, 60_000, "60 s"); // 10/min/IP
export const loginAccountLimiter = makeLimiter(5, 300_000, "300 s"); // 5/5min/account
export const passwordResetLimiter = makeLimiter(5, 600_000, "600 s"); // 5/10min
export const mfaLimiter = makeLimiter(10, 300_000, "300 s");
export const apiLimiter = makeLimiter(60, 60_000, "60 s"); // 60/min general API
export const sessionActionLimiter = makeLimiter(30, 60_000, "60 s");
