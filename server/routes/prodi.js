const express = require("express");
const router = express.Router();
const prodiController = require("../controllers/prodiController");
const { authenticateToken } = require("./auth");
const multer = require("multer");
const upload = multer();

router.use(authenticateToken);

router.get("/", prodiController.getAllProdi);
router.get("/:id", prodiController.getProdiById);
router.post("/", upload.none(), prodiController.createProdi);
router.put("/:id", upload.none(), prodiController.updateProdi);
router.delete("/:id", prodiController.deleteProdi);
router.get("/jurusan/:jurusanId", prodiController.getProdiByJurusan);

module.exports = router;
