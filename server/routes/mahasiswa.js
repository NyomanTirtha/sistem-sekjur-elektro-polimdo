// Mengimpor Express dan membuat instance router
const express = require("express");
const router = express.Router();

// Mengimpor controller yang berisi fungsi-fungsi
// untuk menjalankan logika (ambil data, simpan, edit, hapus).
const mahasiswaController = require("../controllers/mahasiswaController");
const multer = require("multer");
const upload = multer(); // digunakan untuk body > form-data pada postman

// Mendefinisikan rute-rute untuk API Mahasiswa
router.get("/", mahasiswaController.getAllMahasiswa); // Mengambil semua mahasiswa
router.get("/:nim", mahasiswaController.getMahasiswaById); // Mengambil mahasiswa berdasarkan ID
router.post("/", upload.none(), mahasiswaController.createMahasiswa); // Menambahkan mahasiswa baru
router.put("/:nim", upload.none(), mahasiswaController.updateMahasiswa); // Memperbarui mahasiswa berdasarkan ID
router.delete("/:nim", mahasiswaController.deleteMahasiswa); // Menghapus mahasiswa berdasarkan ID

module.exports = router;