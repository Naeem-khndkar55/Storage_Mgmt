const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
} = require("../controllers/folderController");

router.route("/").post(protect, createFolder).get(protect, getFolders);

router
  .route("/:id")
  .get(protect, getFolderById)
  .put(protect, updateFolder)
  .delete(protect, deleteFolder);

module.exports = router;
