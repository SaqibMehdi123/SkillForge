const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const auth = require('../middleware/auth');

// All routes are protected with auth middleware
router.use(auth);

// Get all photos for authenticated user
router.get('/', photoController.getUserPhotos);

// Upload a new photo
router.post('/', photoController.uploadPhoto);

// Delete a photo
router.delete('/:photoId', photoController.deletePhoto);

module.exports = router; 