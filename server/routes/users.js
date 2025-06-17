// Mengimpor Express dan membuat instance router
const express = require("express");
const router = express.Router();

// Mengimpor controller yang berisi fungsi-fungsi
// untuk menjalankan logika (ambil data, simpan, edit, hapus).
const userController = require("../controllers/usersController");
const multer = require("multer");
const upload = multer(); // digunakan untuk body > form-data pada postman

router.get("/", userController.getAllUsers); // Mengambil semua users
router.get("/:id", userController.getUserById); // Mengambil user berdasarkan ID
router.get("/role/:role", userController.getUsersByRole); // Mengambil users berdasarkan role
router.post("/", upload.none(), userController.createUser); // Menambahkan user baru
router.put("/:id", upload.none(), userController.updateUser); // Memperbarui user berdasarkan ID
router.delete("/:id", userController.deleteUser); // Menghapus user berdasarkan ID

module.exports = router;