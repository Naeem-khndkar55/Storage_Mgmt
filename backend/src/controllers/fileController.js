const fs = require("fs");
const path = require("path");
const File = require("../models/File");
const Folder = require("../models/Folder");
const User = require("../models/User");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const { folder } = req.body;
    let fileType = "other";

    // Determine file type
    const ext = path.extname(req.file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
      fileType = "image";
    } else if (ext === ".pdf") {
      fileType = "pdf";
    } else if ([".txt", ".doc", ".docx"].includes(ext)) {
      fileType = "note";
    }

    // Check if folder exists
    if (folder) {
      const folderExists = await Folder.findOne({
        _id: folder,
        user: req.user._id,
      });
      if (!folderExists) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Folder not found" });
      }
    }

    const file = await File.create({
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      type: fileType,
      folder: folder || null,
      user: req.user._id,
    });

    // Update user storage
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: req.file.size },
    });

    res.status(201).json(file);
  } catch (error) {
    console.error(error);
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const { type, favorite, date } = req.query;
    let query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    if (favorite === "true") {
      query.isFavorite = true;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const files = await File.find(query).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getFileById = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(file.path, file.name);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateFile = async (req, res) => {
  try {
    const { isFavorite } = req.body;

    const file = await File.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isFavorite },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Delete file from filesystem
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Update user storage
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: -file.size },
    });

    await file.remove();

    res.json({ message: "File removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getStorageStats = async (req, res) => {
  try {
    const stats = await File.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" },
        },
      },
    ]);

    // Get recent files
    const recentFiles = await File.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const user = await User.findById(req.user._id).select("storageUsed");

    res.json({
      stats,
      recentFiles,
      storageUsed: user.storageUsed,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
