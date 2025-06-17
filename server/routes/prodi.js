// Mengimpor Express dan membuat instance router
const express = require("express");
const router = express.Router();

// Mengimpor controller yang berisi fungsi-fungsi
// untuk menjalankan logika (ambil data, simpan, edit, hapus).
const prodiController = require("../controllers/prodiController");
const multer = require("multer");
const upload = multer(); // digunakan untuk body > form-data pada postman

// Mendefinisikan rute-rute untuk API Program Studi
router.get("/", prodiController.getAllProdi); // Mengambil semua program studi
router.get("/:id", prodiController.getProdiById); // Mengambil program studi berdasarkan ID
router.post("/", upload.none(), prodiController.createProdi); // Menambahkan program studi baru
router.put("/:id", prodiController.updateProdi); // Memperbarui program studi berdasarkan ID
router.delete("/:id", prodiController.deleteProdi); // Menghapus program studi berdasarkan ID

module.exports = router;