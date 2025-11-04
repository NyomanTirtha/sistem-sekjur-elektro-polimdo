// Mengimpor Express dan membuat instance router
const express = require("express");
const router = express.Router();

// Mengimpor controller yang berisi fungsi-fungsi
// untuk menjalankan logika (ambil data, simpan, edit, hapus).
const prodiController = require("../controllers/prodiController");

// ✅ ADDED: Import middleware authentication
const { authenticateToken } = require("./auth");

// ✅ ADDED: Import multer untuk handling form-data
const multer = require("multer");
const upload = multer(); // digunakan untuk body > form-data pada postman

// ✅ CRITICAL: Semua routes memerlukan authentication dan context filtering
// Middleware ini akan menambahkan req.user dan req.userContext
router.use(authenticateToken);
router.get("/", prodiController.getAllProdi); 
router.get("/:id", prodiController.getProdiById); 
router.post("/", upload.none(), prodiController.createProdi); 
router.put("/:id", upload.none(), prodiController.updateProdi); 
router.delete("/:id", prodiController.deleteProdi); 
router.get("/jurusan/:jurusanId", prodiController.getProdiByJurusan);

module.exports = router;