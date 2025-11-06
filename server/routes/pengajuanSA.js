// routes/pengajuanSA.js - Updated dengan endpoint baru

// Mengimpor Express dan membuat instance router
const express = require("express");
const router = express.Router();
const multer = require('multer');

// Mengimpor controller yang berisi fungsi-fungsi
const pengajuanSAController = require("../controllers/pengajuanSAController");

// Konfigurasi multer untuk upload file
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
    const ext = file.originalname.split('.').pop(); // Ekstensi file
    const filename = `bukti-pembayaran-sa-${mahasiswaId}-${dateStr}-${timeStr}-${randomStr}.${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

// Mendefinisikan rute-rute untuk API Pengajuan SA
router.get("/", pengajuanSAController.getAllPengajuanSA); // Mengambil semua pengajuan SA
router.get("/mahasiswa/:mahasiswaId", pengajuanSAController.getPengajuanSAByMahasiswa); // Mengambil pengajuan SA berdasarkan mahasiswa
router.get("/dosen/:dosenId", pengajuanSAController.getPengajuanSAByDosen);
router.get("/:id", pengajuanSAController.getPengajuanSAById); // Mengambil pengajuan SA berdasarkan ID
router.post("/", upload.single('buktiPembayaran'), pengajuanSAController.createPengajuanSA); // Menambahkan pengajuan SA baru

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