const Folder = require("../models/Folder");
const File = require("../models/File");
const User = require("../models/User");
const { calculateFolderSize } = require("../utils/storageCalculator");

exports.createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;

    // Generate path
    let path = name;
    if (parentFolder) {
      const parent = await Folder.findById(parentFolder);
      if (!parent) {
        return res.status(404).json({ message: "Parent folder not found" });
      }
      path = `${parent.path}/${name}`;
    }

    const folder = await Folder.create({
      name,
      path,
      parentFolder: parentFolder || null,
      user: req.user._id,
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(folders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getFolderById = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Get files in this folder
    const files = await File.find({
      folder: folder._id,
      user: req.user._id,
    }).sort({ createdAt: -1 });

    // Get subfolders
    const subfolders = await Folder.find({
      parentFolder: folder._id,
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      folder,
      files,
      subfolders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const { isFavorite } = req.body;

    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isFavorite },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.json(folder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Delete all files in this folder
    await File.deleteMany({ folder: folder._id, user: req.user._id });

    // Delete all subfolders recursively
    const deleteSubfolders = async (parentId) => {
      const subfolders = await Folder.find({ parentFolder: parentId });
      for (const subfolder of subfolders) {
        await File.deleteMany({ folder: subfolder._id, user: req.user._id });
        await deleteSubfolders(subfolder._id);
        await subfolder.remove();
      }
    };

    await deleteSubfolders(folder._id);

    // Update user storage
    const folderSize = await calculateFolderSize(folder._id);
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { storageUsed: -folderSize },
    });

    await folder.remove();

    res.json({ message: "Folder removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
