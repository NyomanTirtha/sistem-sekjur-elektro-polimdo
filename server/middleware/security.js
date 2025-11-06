// middleware/security.js - Security Middleware Configuration
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// ✅ Rate Limiting untuk Login (Brute Force Protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 percobaan per 15 menit
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Jangan hitung request yang berhasil
});

// ✅ Rate Limiting untuk API umum
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per 15 menit
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Rate Limiting untuk File Upload
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 10, // Maksimal 10 upload per jam
  message: {
    success: false,
    message: 'Terlalu banyak upload. Silakan coba lagi nanti.'
  },
});

// ✅ Helmet Configuration (Security Headers)
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow iframe jika diperlukan
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

module.exports = {
  loginLimiter,
  apiLimiter,
  uploadLimiter,
  helmetConfig
};

