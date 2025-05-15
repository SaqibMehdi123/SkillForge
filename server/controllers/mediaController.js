const Media = require('../models/Media');
const path = require('path');

exports.getMyMedia = async (req, res, next) => {
  try {
    const media = await Media.find({ user: req.user });
    res.json(media);
  } catch (err) {
    next(err);
  }
};

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { type, metadata, session } = req.body;
    const media = await Media.create({
      user: req.user,
      session,
      url: path.join('uploads', req.file.filename),
      type,
      metadata,
    });
    res.status(201).json(media);
  } catch (err) {
    next(err);
  }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media || media.user.toString() !== req.user) {
      return res.status(404).json({ message: 'Media not found' });
    }
    await media.remove();
    res.json({ message: 'Media deleted' });
  } catch (err) {
    next(err);
  }
}; 