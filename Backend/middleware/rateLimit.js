import { AppError } from '../middleware/errorHandler.js';

/**
 * Simple in-memory sliding-window IP rate limiter for sensitive endpoints (e.g., OTP).
 */
export function createIpRateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 20, message } = {}) {
  const buckets = new Map();

  return (req, _res, next) => {
    const now = Date.now();
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    let entry = buckets.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
      entry = { count: 1, windowStart: now };
      buckets.set(key, entry);
      if (buckets.size > 5000) {
        for (const [k, v] of buckets.entries()) {
          if (now - v.windowStart >= windowMs) buckets.delete(k);
        }
      }
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
      return next(
        new AppError(
          message || `Too many requests from this device. Please try again in ${retryAfterSeconds}s.`,
          429,
          'RATE_LIMIT_EXCEEDED',
          { retryAfterSeconds }
        )
      );
    }

    entry.count += 1;
    return next();
  };
}
