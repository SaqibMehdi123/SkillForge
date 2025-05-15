const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Directory where photos are stored
const UPLOAD_DIR = path.join(__dirname, '../uploads/photos');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save a photo to the filesystem
 * @param {string} imageData - Base64 encoded image data
 * @param {string} userId - ID of the user who took the photo
 * @param {string} taskName - Name of the task associated with the photo
 * @returns {object} Photo metadata
 */
const savePhoto = async (imageData, userId, taskName) => {
  try {
    // Remove the data URL prefix if present
    let base64Data = imageData;
    if (base64Data.startsWith('data:image')) {
      base64Data = base64Data.split(',')[1];
    }

    // Generate a unique filename
    const filename = `${userId}_${uuidv4()}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save the file
    await fs.promises.writeFile(filepath, base64Data, 'base64');

    // Create and return metadata
    const photo = {
      id: uuidv4(),
      userId,
      filename,
      taskName,
      path: `/uploads/photos/${filename}`,
      createdAt: new Date()
    };

    return photo;
  } catch (error) {
    console.error('Error saving photo:', error);
    throw error;
  }
};

/**
 * Get all photos for a specific user
 * @param {string} userId - ID of the user 
 * @returns {Array} Array of photo metadata objects
 */
const getUserPhotos = async (userId) => {
  try {
    // In a real app, you would query a database
    // Here we'll scan the directory and filter by filename prefix
    const files = await fs.promises.readdir(UPLOAD_DIR);
    
    const userPhotos = files
      .filter(file => file.startsWith(`${userId}_`))
      .map(file => ({
        id: file.split('_')[1].split('.')[0],
        userId,
        filename: file,
        path: `/uploads/photos/${file}`,
        createdAt: fs.statSync(path.join(UPLOAD_DIR, file)).birthtime
      }));
    
    return userPhotos;
  } catch (error) {
    console.error('Error getting user photos:', error);
    throw error;
  }
};

/**
 * Delete a photo
 * @param {string} photoId - ID of the photo
 * @param {string} userId - ID of the user who owns the photo
 * @returns {boolean} Success status
 */
const deletePhoto = async (photoId, userId) => {
  try {
    const files = await fs.promises.readdir(UPLOAD_DIR);
    const photoFile = files.find(file => 
      file.startsWith(`${userId}_`) && file.includes(photoId)
    );
    
    if (!photoFile) {
      return false;
    }
    
    await fs.promises.unlink(path.join(UPLOAD_DIR, photoFile));
    return true;
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};

module.exports = {
  savePhoto,
  getUserPhotos,
  deletePhoto
}; 