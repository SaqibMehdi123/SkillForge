const PracticeSession = require('../models/PracticeSession');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

exports.startSession = async (req, res, next) => {
  try {
    const { skill, duration } = req.body;
    const session = await PracticeSession.create({
      user: req.user,
      skill,
      duration,
      startedAt: new Date(),
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

exports.completeSession = async (req, res, next) => {
  try {
    const session = await PracticeSession.findById(req.params.id);
    if (!session || session.user.toString() !== req.user) {
      return res.status(404).json({ message: 'Session not found' });
    }
    session.completed = true;
    session.endedAt = new Date();
    session.xpEarned = req.body.xpEarned || 10;
    session.coinsEarned = req.body.coinsEarned || 1;
    if (req.file) {
      session.photo = path.join('uploads', req.file.filename);
    }
    await session.save();
    // Update user XP/coins
    const user = await User.findById(req.user);
    user.xp += session.xpEarned;
    user.coins += session.coinsEarned;
    await user.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const sessions = await PracticeSession.find({ user: req.user }).sort({ startedAt: -1 });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

// New method to get practice photos
exports.getPracticePhotos = async (req, res, next) => {
  try {
    // Get all completed practice sessions for this user that have photos
    const sessions = await PracticeSession.find({
      user: req.user,
      completed: true,
      photo: { $exists: true, $ne: null }
    }).sort({ endedAt: -1 });
    
    // Extract photo information from sessions
    const practicePhotos = sessions.map(session => {
      return {
        id: session._id,
        url: `/${session.photo}`,
        skillName: session.skill,
        date: session.endedAt,
        taskName: session.skill // Use skill name as task name if needed
      };
    });
    
    // If there are no practice photos found, try to get mock/sample photos
    if (practicePhotos.length === 0) {
      try {
        // Check if we have any sample images in public directory
        const samplePath = path.join(__dirname, '../public/samples');
        if (fs.existsSync(samplePath)) {
          const files = fs.readdirSync(samplePath)
            .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));
          
          const samplePhotos = files.map((file, index) => ({
            id: `sample-${index}`,
            url: `/public/samples/${file}`,
            skillName: 'Sample Skill',
            date: new Date(),
            taskName: 'Sample Practice'
          }));
          
          return res.status(200).json({
            data: samplePhotos,
            message: 'Sample practice photos returned'
          });
        }
      } catch (error) {
        console.error('Error getting sample photos:', error);
      }
    }
    
    res.status(200).json({
      data: practicePhotos,
      message: 'Practice photos retrieved successfully'
    });
  } catch (err) {
    console.error('Error getting practice photos:', err);
    next(err);
  }
};

// New method to save a practice session
exports.saveSession = async (req, res, next) => {
  try {
    const { skill, category, priority, duration, startedAt, endedAt, completed, xpEarned, coinsEarned, image } = req.body;
    
    console.log('Creating new practice session:', req.body);
    
    // Create a new practice session
    const session = await PracticeSession.create({
      user: req.user,
      skill,
      category: category || 'general',
      priority: priority || 'medium',
      duration,
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      completed: completed || true,
      xpEarned: xpEarned || Math.round(duration / 5),
      coinsEarned: coinsEarned || Math.round(duration / 10),
      notes: req.body.notes || '',
      photo: image ? `/uploads/photos/${image.split('/').pop()}` : null // Save the photo URL if available
    });
    
    console.log('Practice session created:', session);
    
    // Update user XP/coins
    const user = await User.findById(req.user);
    if (user) {
      user.xp = (user.xp || 0) + session.xpEarned;
      user.coins = (user.coins || 0) + session.coinsEarned;
      await user.save();
    }
    
    res.status(201).json({ 
      success: true, 
      session,
      message: 'Practice session saved successfully' 
    });
  } catch (err) {
    console.error('Error saving practice session:', err);
    next(err);
  }
}; 