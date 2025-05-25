const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const upload = require("../middlewares/upload");
const {
  uploadFile,
  getFiles,
  getFileById,
  downloadFile,
  updateFile,
  deleteFile,
  getStorageStats,
} = require("../controllers/fileController");

router
  .route("/")
  .post(protect, upload.single("file"), uploadFile)
  .get(protect, getFiles);

router.route("/stats").get(protect, getStorageStats);

router
  .route("/:id")
  .get(protect, getFileById)
  .put(protect, updateFile)
  .delete(protect, deleteFile);

router.route("/:id/download").get(protect, downloadFile);

module.exports = router;
