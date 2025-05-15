const photoService = require('../services/photoService');

/**
 * Upload a photo
 * @route POST /api/photos
 */
exports.uploadPhoto = async (req, res, next) => {
  try {
    const { imageData, taskName } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ message: 'Image data is required' });
    }
    
    // req.user contains the user ID from auth middleware
    const userId = req.user;
    
    const photo = await photoService.savePhoto(imageData, userId, taskName || 'Untitled Task');
    
    res.status(201).json({ photo });
  } catch (error) {
    console.error('Error uploading photo:', error);
    next(error);
  }
};

/**
 * Get all photos for the authenticated user
 * @route GET /api/photos
 */
exports.getUserPhotos = async (req, res, next) => {
  try {
    const userId = req.user;
    const photos = await photoService.getUserPhotos(userId);
    
    res.json({ photos });
  } catch (error) {
    console.error('Error getting photos:', error);
    next(error);
  }
};

/**
 * Delete a photo
 * @route DELETE /api/photos/:photoId
 */
exports.deletePhoto = async (req, res, next) => {
  try {
    const photoId = req.params.photoId;
    const userId = req.user;
    
    const success = await photoService.deletePhoto(photoId, userId);
    
    if (!success) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    next(error);
  }
}; 