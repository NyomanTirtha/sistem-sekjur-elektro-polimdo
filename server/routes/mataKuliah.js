// routes/mataKuliah.js

// Mengimpor Express dan membuat instance router
const express = require("express");
const router = express.Router();

// Mengimpor controller yang berisi fungsi-fungsi
// untuk menjalankan logika (ambil data, simpan, edit, hapus).
const mataKuliahController = require("../controllers/mataKuliahController");
const multer = require("multer");
const upload = multer(); // digunakan untuk body > form-data pada postman

// Mendefinisikan rute-rute untuk API Mata Kuliah
router.get("/", mataKuliahController.getAllMataKuliah); // Mengambil semua mata kuliah
router.get("/:id", mataKuliahController.getMataKuliahById); // Mengambil mata kuliah berdasarkan ID
router.post("/", upload.none(), mataKuliahController.createMataKuliah); // Menambahkan mata kuliah baru
router.put("/:id", mataKuliahController.updateMataKuliah); // Memperbarui mata kuliah berdasarkan ID
router.delete("/:id", mataKuliahController.deleteMataKuliah); // Menghapus mata kuliah berdasarkan ID

module.exports = router;