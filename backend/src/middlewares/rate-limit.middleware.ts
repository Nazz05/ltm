import { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
};

type CounterEntry = {
  count: number;
  resetAt: number;
};

const counters = new Map<string, CounterEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of counters.entries()) {
    if (entry.resetAt <= now) {
      counters.delete(key);
    }
  }
}, 30_000).unref();

export const createRateLimiter = ({ windowMs, maxRequests, keyPrefix = "global" }: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${keyPrefix}:${clientIp}`;

    const current = counters.get(key);
    if (!current || current.resetAt <= now) {
      counters.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", new Date(now + windowMs).toISOString());
      return next();
    }

    current.count += 1;
    counters.set(key, current);

    const remaining = Math.max(maxRequests - current.count, 0);
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", new Date(current.resetAt).toISOString());

    if (current.count > maxRequests) {
      return res.status(429).json({
        message: "Too many requests",
        code: "RATE_LIMITED",
        statusCode: 429,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        details: {
          retryAfterMs: Math.max(current.resetAt - now, 0),
          requestId: req.requestId,
        },
      });
    }

    next();
  };
};
