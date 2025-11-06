const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");
const multer = require("multer");
const upload = multer();

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.get("/role/:role", userController.getUsersByRole);
router.post("/", upload.none(), userController.createUser);
router.put("/:id", upload.none(), userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
