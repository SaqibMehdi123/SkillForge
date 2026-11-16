const PracticeSession = require('../models/PracticeSession');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { applyXp, rewardsForDuration, clampDuration, isValidDuration } = require('../services/xpService');
const path = require('path');
const fs = require('fs');

exports.startSession = async (req, res, next) => {
  try {
    const { skill, duration } = req.body;
    // Audit fix B11: validate at the boundary instead of letting Mongoose
    // ValidationErrors/CastErrors escape as 500s (or storing garbage).
    if (!skill || !String(skill).trim()) {
      return res.status(400).json({ message: 'A skill name is required' });
    }
    if (!isValidDuration(duration)) {
      return res.status(400).json({ message: 'A positive duration (in minutes) is required' });
    }
    const session = await PracticeSession.create({
      user: req.user,
      skill: String(skill).trim(),
      duration: clampDuration(duration),
      startedAt: new Date(),
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

exports.completeSession = async (req, res, next) => {
  try {
    // Audit fix B4: claim the session atomically ONLY while it is still
    // incomplete, so submitting the same completion twice can never pay
    // out XP/coins twice.
    const endedAt = new Date();
    const session = await PracticeSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user, completed: false },
      { $set: { completed: true, endedAt } },
      { new: true }
    );

    if (!session) {
      const existing = await PracticeSession.findById(req.params.id).lean();
      if (!existing || existing.user.toString() !== req.user) {
        return res.status(404).json({ message: 'Session not found' });
      }
      return res.status(409).json({ message: 'Session already completed' });
    }

    // Audit fix C9: rewards are computed from real elapsed time on the
    // server - the client's xpEarned/coinsEarned values are ignored.
    const elapsedMinutes = Math.max(
      0,
      (endedAt - (session.startedAt || session.createdAt)) / 60000
    );
    const { xpEarned, coinsEarned } = rewardsForDuration(elapsedMinutes);
    session.xpEarned = xpEarned;
    session.coinsEarned = coinsEarned;
    if (req.file) {
      session.photo = path.join('uploads', req.file.filename);
    }
    await session.save();

    // Update user XP/coins with the shared level-up rule
    const user = await User.findById(req.user);
    applyXp(user, session.xpEarned);
    user.coins = (user.coins || 0) + session.coinsEarned;
    await user.save();

    // Check and unlock first_steps achievement if this is their first completed session
    await checkAndUnlockFirstStepsAchievement(req.user);

    res.json(session);
  } catch (err) {
    next(err);
  }
};

// Helper function to check and unlock the first_steps achievement
async function checkAndUnlockFirstStepsAchievement(userId) {
  try {
    // Check if this is their first completed session
    const completedSessions = await PracticeSession.countDocuments({ 
      user: userId,
      completed: true 
    });
    
    // Check if they already have the achievement
    const existingAchievement = await Achievement.findOne({ 
      user: userId,
      badgeId: 'first_steps'
    });
    
    // If they completed at least one session and don't have the achievement yet
    if (completedSessions > 0 && !existingAchievement) {
      console.log('Unlocking first_steps achievement for user:', userId);
      
      // Create the achievement
      const achievement = await Achievement.create({
        user: userId,
        type: 'session',
        name: 'First Steps',
        description: 'Complete your first practice session',
        icon: 'session',
        badgeId: 'first_steps',
        dateUnlocked: new Date()
      });
      
      // Add the badge to user and award XP
      const user = await User.findById(userId);
      if (user) {
        // Add badge if not present
        if (!user.badges.includes('first_steps')) {
          user.badges.push('first_steps');
        }

        // Award 100 XP with the shared level-up rule (audit fix C9)
        applyXp(user, 100);

        await user.save();
        console.log('First Steps achievement unlocked for user:', userId);
      }
    }
  } catch (error) {
    console.error('Error checking/unlocking first_steps achievement:', error);
  }
}

exports.getHistory = async (req, res, next) => {
  try {
    // Fetch all practice sessions for the user
    // Audit fix P2: read-only list - lean keeps hydration cheap.
    const sessions = await PracticeSession.find({ user: req.user }).sort({ createdAt: -1 }).lean();
    
    // Map any client-specific properties to match the expected format
    const formattedSessions = sessions.map(sessionObj => {
      return {
        ...sessionObj,
        id: sessionObj._id, // Add ID field that client expects
        label: sessionObj.skill, // Use skill name as label
        name: sessionObj.skill, // Also set name field for consistency
        completedAt: sessionObj.endedAt, // Map endedAt to completedAt for client
        // Convert duration from minutes (DB) to seconds (client)
        duration: sessionObj.duration * 60,
        progress: sessionObj.completed ? 100 : 0,
      };
    });
    
    console.log(`Found ${formattedSessions.length} practice sessions for user ${req.user}`);
    res.json(formattedSessions);
  } catch (err) {
    console.error('Error fetching practice history:', err);
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
    }).sort({ endedAt: -1 }).lean();
    
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
    const { skill, category, priority, duration, startedAt, endedAt, completed, image } = req.body;

    // Audit fix B3: `completed: completed || true` made every session
    // completed:true and paid rewards for sessions the user marked as NOT
    // completed. Respect an explicit false; default to true only when absent.
    const isCompleted = completed === undefined ? true : Boolean(completed);

    // Audit fix C9: validate the duration and clamp it, then compute the
    // rewards server-side. Client-supplied xpEarned/coinsEarned are ignored.
    if (!isValidDuration(duration)) {
      return res.status(400).json({ message: 'A positive duration (in minutes) is required' });
    }
    const safeDuration = clampDuration(duration);
    const { xpEarned, coinsEarned } = rewardsForDuration(safeDuration);

    // Audit fix B11: dates must actually parse, otherwise Mongoose stores
    // Invalid Date -> CastError -> 500.
    const started = new Date(startedAt);
    const ended = new Date(endedAt);
    if (Number.isNaN(started.getTime()) || Number.isNaN(ended.getTime())) {
      return res.status(400).json({ message: 'startedAt and endedAt must be valid dates' });
    }

    console.log('Creating new practice session:', { skill, safeDuration });

    // Create a new practice session
    const session = await PracticeSession.create({
      user: req.user,
      skill,
      category: category || 'general',
      priority: priority || 'medium',
      duration: safeDuration,
      startedAt: started,
      endedAt: ended,
      completed: isCompleted,
      xpEarned: isCompleted ? xpEarned : 0,
      coinsEarned: isCompleted ? coinsEarned : 0,
      notes: req.body.notes || '',
      photo: image ? `/uploads/photos/${image.split('/').pop()}` : null // Save the photo URL if available
    });

    console.log('Practice session created:', session._id);

    // Update user XP/coins with the shared level-up rule - only for
    // completed sessions (B3).
    const user = await User.findById(req.user);
    if (user && isCompleted) {
      applyXp(user, xpEarned);
      user.coins = (user.coins || 0) + coinsEarned;
      await user.save();
    }

    // Check and unlock first_steps achievement
    if (isCompleted) {
      await checkAndUnlockFirstStepsAchievement(req.user);
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