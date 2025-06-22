// Mengimpor Express dan membuat instance router
const express = require("express");
const router = express.Router();

// Mengimpor controller yang berisi fungsi-fungsi
// untuk menjalankan logika (ambil data, simpan, edit, hapus).
const dosenController = require("../controllers/dosenController");
const multer = require("multer");
const upload = multer(); // digunakan untuk body > form-data pada postman

// Mendefinisikan rute-rute untuk API Dosen
router.get("/", dosenController.getAllDosen); // Mengambil semua dosen
router.get("/:nip", dosenController.getDosenById); // Mengambil dosen berdasarkan NIP (FIXED)
router.post("/", upload.none(), dosenController.createDosen); // Menambahkan dosen baru
router.put("/:nip", dosenController.updateDosen); // Memperbarui dosen berdasarkan NIP (FIXED)
router.delete("/:nip", dosenController.deleteDosen); // Menghapus dosen berdasarkan NIP (FIXED)

module.exports = router;