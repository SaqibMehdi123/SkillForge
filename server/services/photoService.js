const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Directory where photos are stored
const UPLOAD_DIR = path.join(__dirname, '../uploads/photos');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Generate a hash for an image to detect duplicates
 * @param {string} base64Data - Base64 encoded image data
 * @returns {string} MD5 hash of the image data
 */
const generateImageHash = (base64Data) => {
  return crypto.createHash('md5').update(base64Data).digest('hex');
};

/**
 * Check if an image already exists in the uploads folder
 * @param {string} imageHash - Hash of the image data
 * @param {string} userId - ID of the user
 * @returns {string|null} Filename if found, null otherwise
 */
const findExistingImage = async (imageHash, userId) => {
  try {
    // Get all user's photos
    const files = await fs.promises.readdir(UPLOAD_DIR);
    const userFiles = files.filter(file => file.startsWith(`${userId}_`));
    
    // Create a temporary hash file for comparison
    const hashFile = path.join(UPLOAD_DIR, '.temp_hash');
    
    // Check each file's hash
    for (const file of userFiles) {
      const filePath = path.join(UPLOAD_DIR, file);
      const fileData = await fs.promises.readFile(filePath, { encoding: 'base64' });
      const fileHash = generateImageHash(fileData);
      
      if (fileHash === imageHash) {
        console.log('Found duplicate image:', file);
        return file;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for existing image:', error);
    return null;
  }
};

/**
 * Save a photo to the filesystem
 * @param {string} imageData - Base64 encoded image data
 * @param {string} userId - ID of the user who took the photo
 * @param {string} taskName - Name of the task associated with the photo
 * @param {object} additionalMetadata - Additional metadata to store with the photo
 * @returns {object} Photo metadata
 */
const savePhoto = async (imageData, userId, taskName, additionalMetadata = {}) => {
  try {
    // Remove the data URL prefix if present
    let base64Data = imageData;
    let contentType = null;
    
    // Handle different image data formats
    if (typeof base64Data === 'string') {
      // Case 1: data URL format (webcam capture or some uploads)
      if (base64Data.startsWith('data:image')) {
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          // Extract content type and actual base64 data
          contentType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = base64Data.split(',')[1];
        }
      }
      // Case 2: Already a base64 string without prefix
    } else {
      // Case 3: Not a string - might be a Buffer or something else
      // Convert to string if it's a Buffer
      if (Buffer.isBuffer(base64Data)) {
        base64Data = base64Data.toString('base64');
      } else {
        throw new Error('Image data format not recognized');
      }
    }

    // Calculate image hash to detect duplicates
    const imageHash = generateImageHash(base64Data);
    
    // Check if this image already exists
    const existingFile = await findExistingImage(imageHash, userId);
    let filename, filepath;
    
    if (existingFile) {
      // Use the existing file rather than creating a duplicate
      console.log(`Using existing image file: ${existingFile}`);
      filename = existingFile;
      filepath = path.join(UPLOAD_DIR, filename);
    } else {
      // Generate a unique filename and save the new image
      filename = `${userId}_${uuidv4()}.jpg`;
      filepath = path.join(UPLOAD_DIR, filename);
      await fs.promises.writeFile(filepath, base64Data, 'base64');
      console.log(`New photo saved to ${filepath}`);
    }

    // Create and return metadata
    const photo = {
      id: uuidv4(),
      userId,
      filename,
      taskName,
      path: `/uploads/photos/${filename}`,
      createdAt: new Date(),
      // Include additional metadata if provided
      taskCategory: additionalMetadata.taskCategory || 'general',
      taskPriority: additionalMetadata.taskPriority || 'medium'
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

/**
 * Delete a photo by filename
 * @param {string} filename - Filename of the photo
 * @param {string} userId - ID of the user who owns the photo
 * @returns {boolean} Success status
 */
const deletePhotoByFilename = async (filename, userId) => {
  try {
    // Security check to make sure the file belongs to the user
    if (!filename.startsWith(`${userId}_`)) {
      console.warn('Security warning: Attempted to delete file not owned by user:', filename, userId);
      return false;
    }
    
    const filepath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
      console.log(`Deleted photo file: ${filepath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting photo by filename:', error);
    return false;
  }
};

module.exports = {
  savePhoto,
  getUserPhotos,
  deletePhoto,
  deletePhotoByFilename
}; 