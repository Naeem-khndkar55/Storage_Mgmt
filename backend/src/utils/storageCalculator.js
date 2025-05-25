const File = require("../models/File");

const calculateFolderSize = async (folderId) => {
  try {
    // Calculate size of files in this folder
    const files = await File.find({ folder: folderId });
    let totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Calculate size of subfolders recursively
    const subfolders = await Folder.find({ parentFolder: folderId });
    for (const subfolder of subfolders) {
      totalSize += await calculateFolderSize(subfolder._id);
    }

    return totalSize;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

module.exports = {
  calculateFolderSize,
};
