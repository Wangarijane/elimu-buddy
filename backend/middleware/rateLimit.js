import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

let redisClient = null;

// Try to connect to Redis if available
try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected for rate limiting");
    });

    redisClient.on("error", (err) => {
      console.error("⚠️ Redis error, falling back to memory store:", err.message);
      redisClient = null;
    });
  }
} catch (error) {
  console.warn("⚠️ Redis not available, using memory store for rate limiting");
}

// Factory to create a rate limiter
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 min
    max = 100,
    message = "Too many requests, please try again later.",
    standardHeaders = true,
    legacyHeaders = false,
    store = null,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = null,
    handler = null,
    onLimitReached = null,
    skip = null,
    statusCode = 429,
  } = options;

  // Use Redis if available, otherwise default (in-memory)
  const storeConfig =
    store ||
    (redisClient
      ? new RedisStore({
          sendCommand: (...args) => redisClient.call(...args),
        })
      : undefined);

  return rateLimit({
    windowMs,
    max,
    store: storeConfig,
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator:
      keyGenerator ||
      ((req) => req.user?.id || req.ip || req.connection?.remoteAddress),
    message: {
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    handler:
      handler ||
      ((req, res) => {
        res.status(statusCode).json({
          success: false,
          error: "RATE_LIMIT_EXCEEDED",
          message,
          retryAfter: Math.ceil(windowMs / 1000),
          limit: max,
          remaining: 0,
          resetTime: new Date(Date.now() + windowMs),
        });
      }),
    onLimitReached,
    skip,
    statusCode,
  });
};

// Global API limiter
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many API requests from this IP, please try again later.",
});

// Strict limiter for sensitive routes
export const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts. Please try again later.",
});

// Auth limiter (login/signup/password reset)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip || req.connection?.remoteAddress,
});

// Chat limiter
export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many chat messages, slow down.",
  keyGenerator: (req) => req.user?.id || req.ip,
  skipFailedRequests: true,
});

// File upload limiter
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many uploads, try again later.",
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Payment limiter
export const paymentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many payment attempts, please try again later.",
  keyGenerator: (req) => req.user?.id || req.ip,
  skipSuccessfulRequests: true,
});

// Search limiter
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many searches, slow down.",
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Admin limiter
export const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many admin requests, please try again later.",
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => req.user?.role === "super_admin", // super admins bypass
});

// Subscription-based limiter
export const subscriptionBasedLimiter = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return strictLimiter(req, res, next);
  }

  const plans = {
    free: 50,
    basic: 200,
    premium: 500,
    family: 1000,
  };

  const maxRequests = plans[user.subscription?.plan] || plans.free;

  const dynamicLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    message: `Rate limit exceeded for ${user.subscription?.plan || "free"} plan.`,
    keyGenerator: () => user.id,
  });

  return dynamicLimiter(req, res, next);
};

// Endpoint-specific limiter
export const endpointLimiter = (endpoint, options = {}) =>
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: `Too many requests to ${endpoint}, please try again later.`,
    ...options,
  });

// Default export
export default apiLimiter;
