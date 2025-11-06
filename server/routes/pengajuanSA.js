// routes/pengajuanSA.js - Updated dengan endpoint baru

// Mengimpor Express dan membuat instance router
const express = require("express");
const router = express.Router();
const multer = require('multer');

// Mengimpor controller yang berisi fungsi-fungsi
const pengajuanSAController = require("../controllers/pengajuanSAController");

// ✅ SECURITY: Konfigurasi multer dengan validasi (PRIORITY 1)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Format standar industri: bukti-pembayaran-sa-{nim}-{YYYYMMDD-HHmmss}-{random}.{ext}
    const mahasiswaId = req.body.mahasiswaId || 'unknown';
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const timeStr = timestamp.toTimeString().slice(0, 8).replace(/:/g, ''); // HHmmss
    const randomStr = Math.random().toString(36).substring(2, 8); // Random 6 karakter
    
    // ✅ SECURITY: Sanitize extension - hanya allow image extensions
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = allowedExts.includes(ext) ? ext : 'jpg';
    
    // ✅ SECURITY: Sanitize filename - remove dangerous characters
    const sanitizedMahasiswaId = mahasiswaId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    const filename = `bukti-pembayaran-sa-${sanitizedMahasiswaId}-${dateStr}-${timeStr}-${randomStr}.${safeExt}`;
    cb(null, filename);
  }
});

// ✅ SECURITY: File filter - hanya allow image files (PRIORITY 1)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File harus berupa gambar (JPG, PNG, GIF, atau WEBP)'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // ✅ SECURITY: Max 5MB (PRIORITY 1)
    files: 1 // ✅ SECURITY: Maksimal 1 file per request
  }
});

// Mendefinisikan rute-rute untuk API Pengajuan SA
router.get("/", pengajuanSAController.getAllPengajuanSA); // Mengambil semua pengajuan SA
router.get("/mahasiswa/:mahasiswaId", pengajuanSAController.getPengajuanSAByMahasiswa); // Mengambil pengajuan SA berdasarkan mahasiswa
router.get("/dosen/:dosenId", pengajuanSAController.getPengajuanSAByDosen);
router.get("/:id", pengajuanSAController.getPengajuanSAById); // Mengambil pengajuan SA berdasarkan ID
// ✅ SECURITY: Import upload limiter
const { uploadLimiter } = require('../middleware/security');

router.post("/", uploadLimiter, upload.single('buktiPembayaran'), pengajuanSAController.createPengajuanSA); // Menambahkan pengajuan SA baru

// Routes untuk assign dosen (Kaprodi) 
router.get("/suggested-dosen", pengajuanSAController.getSuggestedDosen);
router.put("/detail/:detailId/assign-dosen", pengajuanSAController.assignDosenToMataKuliah);
router.put("/:id/assign-all-dosen", pengajuanSAController.assignAllDosenToMataKuliah);

// Routes untuk input nilai (Dosen)
router.put("/detail/:detailId/nilai", pengajuanSAController.inputNilaiSA);

// Routes untuk verifikasi dan tolak (Admin)
router.put("/:id/verifikasi", pengajuanSAController.verifikasiPengajuanSA);
router.put("/:id/tolak", pengajuanSAController.tolakPengajuanSA);

// Routes untuk backward compatibility (jika masih digunakan)
router.put("/:id/status", pengajuanSAController.updateStatusPengajuanSA);
router.put("/:id/nilai", pengajuanSAController.updateNilaiPengajuanSA);

module.exports = router;