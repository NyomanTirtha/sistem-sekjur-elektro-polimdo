const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

const isDevelopment = process.env.NODE_ENV === 'development';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (isDevelopment) return true;
    return req.path === '/api/health' || req.path.startsWith('/api/auth');
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba lagi.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req) => {
    return isDevelopment;
  },
  handler: (req, res, next, options) => {
    const windowMs = options.windowMs || (15 * 60 * 1000);
    const retryAfter = Math.ceil(windowMs / 1000);
    const minutes = Math.ceil(retryAfter / 60);

    res.status(429)
      .set('Retry-After', String(retryAfter))
      .json({
        success: false,
        message: `Terlalu banyak percobaan login. Silakan tunggu ${minutes} menit sebelum mencoba lagi.`,
        retryAfter: retryAfter
      });
  },
});

module.exports = {
  helmetConfig,
  apiLimiter,
  authLimiter,
};
