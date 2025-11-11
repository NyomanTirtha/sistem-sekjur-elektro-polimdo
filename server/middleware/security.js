const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

/**
 * @file Kumpulan middleware keamanan untuk aplikasi Express.
 * Mengkonfigurasi header keamanan HTTP dan pembatasan permintaan (rate limiting).
 */

// Konfigurasi dasar untuk Helmet. Mengatur header HTTP untuk melindungi dari kerentanan umum.
const helmetConfig = helmet({
  // Content Security Policy (CSP) untuk memitigasi serangan XSS.
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

// Flag untuk mendeteksi lingkungan development.
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Rate limiter umum untuk melindungi semua endpoint API dari permintaan berlebih.
 * Bertindak sebagai jaring pengaman tingkat pertama.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Jendela waktu 15 menit.
  max: 100, // Batas 100 permintaan per IP selama jendela waktu.
  message: {
    success: false,
    message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.",
  },
  standardHeaders: true, // Menggunakan header standar `RateLimit-*`.
  legacyHeaders: false, // Menonaktifkan header lama `X-RateLimit-*`.
  skip: (req) => {
    // Nonaktifkan rate limiting di lingkungan development atau untuk health check.
    // Endpoint otentikasi sengaja TIDAK dilewati agar tetap terlindungi oleh limiter ini.
    return isDevelopment || req.path === "/api/health";
  },
});

/**
 * Rate limiter yang lebih ketat, dirancang khusus untuk endpoint login.
 * Tujuannya untuk mencegah serangan brute-force pada password.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Batas lebih rendah (10 percobaan) untuk endpoint sensitif.
  message: {
    success: false,
    message:
      "Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba lagi.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Penting: Jangan hitung permintaan yang berhasil.
  // Ini mencegah pengguna yang sah terkunci setelah berhasil login.
  skipSuccessfulRequests: true,
  skip: (req) => isDevelopment, // Nonaktifkan hanya di development.

  // Handler kustom untuk memberikan respons yang lebih informatif saat limit terlampaui.
  handler: (req, res, next, options) => {
    const windowMs = options.windowMs || 15 * 60 * 1000;
    const retryAfter = Math.ceil(windowMs / 1000);
    const minutes = Math.ceil(retryAfter / 60);

    // Kirim respons 429 Too Many Requests.
    res
      .status(429)
      .set("Retry-After", String(retryAfter)) // Header standar untuk memberitahu klien kapan harus mencoba lagi.
      .json({
        success: false,
        message: `Terlalu banyak percobaan login. Silakan tunggu ${minutes} menit sebelum mencoba lagi.`,
        retryAfter: retryAfter,
      });
  },
});

module.exports = {
  helmetConfig,
  apiLimiter,
  authLimiter,
};
