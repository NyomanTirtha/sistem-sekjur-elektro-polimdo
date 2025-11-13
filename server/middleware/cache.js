const etag = require("etag");

/**
 * @file Middleware caching dinamis untuk Express.
 * Mengimplementasikan Cache-Control, validasi ETag, dan header Vary berdasarkan path request.
 */

// Header standar untuk menginstruksikan klien dan proxy agar tidak menyimpan respons ke cache.
const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache", // Dukungan legacy untuk HTTP/1.0
  Expires: "0",
};

// Mendefinisikan strategi caching untuk berbagai prefix path API.
const cacheRules = {
  longCache: ["/prodi", "/dosen", "/mata-kuliah"],
  shortCache: ["/pengajuan-sa", "/mahasiswa"],
  noCache: ["/auth"],
};

/**
 * Fungsi bantuan untuk menerapkan header no-cache pada sebuah respons.
 * @param {import('express').Response} res - Objek respons Express.
 */
function applyNoCache(res) {
  for (const [k, v] of Object.entries(noCacheHeaders)) res.set(k, v);
}

/**
 * Middleware Express untuk mengatur header cache secara dinamis.
 * Membungkus res.send/json untuk menyuntikkan ETag dan menangani respons 304 Not Modified.
 */
const setCacheHeaders = (req, res, next) => {
  // Pengaman untuk mencegah pembungkusan res.send/json lebih dari sekali per siklus request.
  if (!res._etagWrapped) {
    res._etagWrapped = true;

    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    // Bungkus res.send untuk menyuntikkan logika ETag.
    res.send = function (body) {
      // Hanya proses ETag untuk permintaan GET yang berhasil (status 2xx).
      if (
        req.method === "GET" &&
        res.statusCode >= 200 &&
        res.statusCode < 300
      ) {
        // Siapkan body untuk perhitungan ETag agar deterministik.
        let bodyForEtag = body;
        if (bodyForEtag === undefined || bodyForEtag === null) {
          bodyForEtag = "";
        } else if (
          typeof bodyForEtag !== "string" &&
          !Buffer.isBuffer(bodyForEtag)
        ) {
          try {
            bodyForEtag = JSON.stringify(bodyForEtag);
          } catch (e) {
            bodyForEtag = String(bodyForEtag);
          }
        }

        // Hanya set ETag jika belum ada header ETag (biarkan upstream override bila perlu).
        if (!res.getHeader("ETag")) {
          const tag = etag(bodyForEtag);
          res.set("ETag", tag);

          // Jika ETag dari klien cocok dengan ETag baru, kirim 304 Not Modified.
          if (req.headers["if-none-match"] === tag) {
            res.status(304).end();
            return; // Akhiri respons.
          }
        }
      }

      // Pastikan kita mengirim string/Buffer ke originalSend agar Express tidak melakukan
      // behaviour internal yang bisa memicu pemanggilan ulang ke res.json/res.send.
      let sendBody = body;
      if (!Buffer.isBuffer(sendBody) && typeof sendBody !== "string") {
        try {
          sendBody = JSON.stringify(sendBody);
          if (!res.getHeader("Content-Type")) {
            res.set("Content-Type", "application/json; charset=utf-8");
          }
        } catch (e) {
          sendBody = String(sendBody);
        }
      }

      return originalSend(sendBody);
    };

    // Bungkus res.json untuk memastikan logika ETag juga diterapkan.
    res.json = function (body) {
      if (!res.getHeader("Content-Type")) {
        res.set("Content-Type", "application/json; charset=utf-8");
      }
      // Delegasikan ke res.send (yang sudah dioverride di atas) sehingga body akan
      // di-serialize dan ETag akan dihitung oleh wrapper res.send. Menggunakan
      // res.send menghindari rekursi karena override res.send langsung memanggil
      // originalSend dengan string/Buffer.
      return res.send(body);
    };
  }

  // Lewati caching sepenuhnya untuk metode yang mengubah data (state-changing methods).
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    applyNoCache(res);
    return next();
  }

  // Normalisasi path agar rule yang memakai prefix tanpa /api tetap bekerja.
  // Contoh: /api/prodi -> /prodi
  const normalizedPath = req.path.replace(/^\/api(\/|$)/, "/");

  // KEAMANAN: Jangan izinkan caching publik untuk request yang terautentikasi
  // atau untuk endpoint otentikasi (mis. /api/auth). Jika ada header
  // Authorization atau rute target adalah auth, paksa no-cache.
  if (req.headers["authorization"] || normalizedPath.startsWith("/auth")) {
    // Untuk request terautentikasi atau auth-related endpoints, gunakan no-store
    // agar tidak ada data user yang tersimpan di cache publik/proxy.
    applyNoCache(res);
  } else {
    // Tentukan strategi cache yang sesuai dari cacheRules.
    const matchedRule = Object.entries(cacheRules).find(([_, paths]) =>
      paths.some((p) => normalizedPath.startsWith(p)),
    );
    const rule = matchedRule?.[0];

    // Terapkan header Cache-Control berdasarkan aturan yang cocok.
    switch (rule) {
      case "noCache":
        applyNoCache(res);
        break;
      case "longCache":
        // SWR (Stale-While-Revalidate) meningkatkan UX dengan menyajikan konten usang sambil mengambil versi baru di latar belakang.
        res.set(
          "Cache-Control",
          "public, max-age=300, stale-while-revalidate=60",
        );
        break;
      case "shortCache":
        res.set(
          "Cache-Control",
          "public, max-age=60, stale-while-revalidate=30",
        );
        break;
      default:
        // Cache default untuk permintaan GET yang tidak cocok.
        res.set("Cache-Control", "public, max-age=30");
    }
  }

  // Instruksikan cache untuk membedakan respons berdasarkan header ini.
  // Penting untuk mencegah cache poisoning dan menyajikan konten yang benar (misal: terkompresi, per pengguna).
  res.set("Vary", "Accept-Encoding, Authorization");

  next();
};

/**
 * Helper kecil untuk mendaftarkan middleware pada aplikasi Express.
 * Berguna jika Anda ingin mendaftarkan cache secara terpusat di `server.js`.
 * Contoh: const { registerCache } = require('./middleware/cache'); registerCache(app);
 */
function registerCache(app) {
  if (!app || typeof app.use !== "function") return;
  app.use(setCacheHeaders);
}

module.exports = { setCacheHeaders, registerCache };
