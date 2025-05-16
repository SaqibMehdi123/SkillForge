const photoService = require('../services/photoService');
const Media = require('../models/Media');
const mongoose = require('mongoose');

/**
 * Upload a photo
 * @route POST /api/photos
 */
exports.uploadPhoto = async (req, res, next) => {
  try {
    const { imageData, taskName, taskCategory, taskPriority, timestamp, sessionId } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ message: 'Image data is required' });
    }
    
    // req.user contains the user ID from auth middleware
    const userId = req.user;
    
    // Save photo to filesystem using photoService
    const photo = await photoService.savePhoto(
      imageData, 
      userId, 
      taskName || 'Untitled Task',
      { 
        taskCategory,
        taskPriority,
        timestamp
      }
    );
    
    // Create Media document in MongoDB
    const mediaData = {
      user: mongoose.Types.ObjectId(userId),
      url: photo.path,
      type: 'photo',
      metadata: {
        taskName: taskName || 'Untitled Task',
        taskCategory: taskCategory || 'general',
        taskPriority: taskPriority || 'medium',
        timestamp: timestamp || new Date().toISOString()
      }
    };
    
    // If sessionId is provided, link this media to the practice session
    if (sessionId) {
      mediaData.session = mongoose.Types.ObjectId(sessionId);
    }
    
    // Save to Media collection
    const media = new Media(mediaData);
    await media.save();
    
    console.log('Media saved to database:', media._id);
    
    // Add full URLs to the photo object for the response
    const responsePhoto = {
      ...photo,
      fullPath: `http://localhost:5000${photo.path}`,
      mediaId: media._id
    };
    
    res.status(201).json({ photo: responsePhoto });
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
    
    // Get photos from file system
    const fsPhotos = await photoService.getUserPhotos(userId);
    
    // Get photos from Media collection
    const mediaPhotos = await Media.find({ 
      user: userId,
      type: 'photo'
    }).sort({ createdAt: -1 });
    
    // Map Media photos to the same format as filesystem photos
    const dbPhotos = mediaPhotos.map(media => ({
      id: media._id,
      userId: media.user.toString(),
      path: media.url,
      taskName: media.metadata?.taskName || 'Unknown Task',
      taskCategory: media.metadata?.taskCategory || 'general',
      taskPriority: media.metadata?.taskPriority || 'medium',
      createdAt: media.createdAt
    }));
    
    // Filter out duplicates (prefer DB entries)
    const dbPhotosPaths = new Set(dbPhotos.map(photo => photo.path));
    const uniqueFsPhotos = fsPhotos.filter(photo => !dbPhotosPaths.has(photo.path));
    
    // Combine both sets
    const photos = [...dbPhotos, ...uniqueFsPhotos];
    
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
    
    // Try to delete from Media collection
    const deletedMedia = await Media.findOneAndDelete({
      _id: photoId,
      user: userId
    });
    
    // If found in DB, also delete the file
    if (deletedMedia) {
      // Extract the filename from the URL
      const filename = deletedMedia.url.split('/').pop();
      await photoService.deletePhotoByFilename(filename, userId);
      return res.json({ message: 'Photo deleted successfully' });
    }
    
    // If not found in DB, try filesystem
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