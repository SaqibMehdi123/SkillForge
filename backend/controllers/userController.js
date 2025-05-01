// controllers/userController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('skills.category', 'name icon')
      .populate('achievements', 'name description icon')
      .populate('friends', 'name profileImage');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      if (req.file) {
        user.profileImage = req.file.filename;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send friend request
// @route   POST /api/users/:id/friend-request
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if request already sent
    if (targetUser.friendRequests.includes(req.user._id)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }
    
    // Check if already friends
    if (targetUser.friends.includes(req.user._id)) {
      return res.status(400).json({ message: 'Users are already friends' });
    }
    
    // Add current user to target user's friend requests
    targetUser.friendRequests.push(req.user._id);
    await targetUser.save();
    
    res.status(200).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept friend request
// @route   POST /api/users/friend-request/:id/accept
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const requester = await User.findById(req.params.id);
    
    if (!requester) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if friend request exists
    if (!user.friendRequests.includes(req.params.id)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }
    
    // Add users to each other's friends list
    user.friends.push(req.params.id);
    requester.friends.push(req.user._id);
    
    // Remove friend request
    user.friendRequests = user.friendRequests.filter(
      request => request.toString() !== req.params.id
    );
    
    await user.save();
    await requester.save();
    
    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  sendFriendRequest,
  acceptFriendRequest
};

// controllers/practiceController.js
const Practice = require('../models/Practice');
const User = require('../models/User');
const SkillCategory = require('../models/SkillCategory');
const Achievement = require('../models/Achievement');
const fs = require('fs');
const path = require('path');

// @desc    Create a new practice session
// @route   POST /api/practice
// @access  Private
const createPractice = async (req, res) => {
  try {
    const { skillCategoryId, duration, notes } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    
    // Validate skill category
    const skillCategory = await SkillCategory.findById(skillCategoryId);
    if (!skillCategory) {
      return res.status(404).json({ message: 'Skill category not found' });
    }
    
    // Create practice record
    const practice = await Practice.create({
      user: req.user._id,
      skillCategory: skillCategoryId,
      duration: parseInt(duration),
      image: req.file.filename,
      notes
    });
    
    // Update user's skill stats
    const user = await User.findById(req.user._id);
    
    // Find the skill in user's skills array or create if not exists
    let skillIndex = user.skills.findIndex(
      skill => skill.category.toString() === skillCategoryId
    );
    
    if (skillIndex === -1) {
      // Add new skill to user's skills array
      user.skills.push({
        category: skillCategoryId,
        currentStreak: 1,
        longestStreak: 1,
        totalPracticeTime: parseInt(duration),
        lastPracticeDate: new Date(),
        level: 'Beginner'
      });
      skillIndex = user.skills.length - 1;
    } else {
      // Update existing skill
      const skill = user.skills[skillIndex];
      const lastPracticeDate = new Date(skill.lastPracticeDate);
      const currentDate = new Date();
      
      // Reset the date part to compare just the dates without time
      lastPracticeDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      // Check if practice done on a different day than the last practice
      if (!skill.lastPracticeDate || lastPracticeDate < currentDate) {
        // If practice done on a consecutive day, increment streak
        const oneDayInMs = 24 * 60 * 60 * 1000;
        const dayDifference = Math.round(
          (currentDate - lastPracticeDate) / oneDayInMs
        );
        
        if (dayDifference === 1) {
          skill.currentStreak += 1;
          // Update longest streak if current streak is longer
          if (skill.currentStreak > skill.longestStreak) {
            skill.longestStreak = skill.currentStreak;
          }
          
          // Check streak-based achievements
          await checkAndAwardStreakAchievements(user, skill);
          
          // Award redeem tokens every 5 days of streak
          if (skill.currentStreak % 5 === 0) {
            skill.redeemTokens += 1;
          }
        } else if (dayDifference > 1) {
          // Reset streak if not consecutive
          skill.currentStreak = 1;
        }
      }
      
      // Update practice time and date
      skill.totalPracticeTime += parseInt(duration);
      skill.lastPracticeDate = new Date();
      
      // Check if level should be updated
      await updateSkillLevel(skill, skillCategory);
      
      // Check practice time achievements
      await checkAndAwardPracticeTimeAchievements(user, skill);
    }
    
    await user.save();
    
    res.status(201).json(practice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to update skill level based on practice time
const updateSkillLevel = async (skill, skillCategory) => {
  const totalPracticeTime = skill.totalPracticeTime;
  
  if (totalPracticeTime >= skillCategory.thresholds.grandMaster) {
    skill.level = 'Grand Master';
  } else if (totalPracticeTime >= skillCategory.thresholds.master) {
    skill.level = 'Master';
  } else if (totalPracticeTime >= skillCategory.thresholds.apprentice) {
    skill.level = 'Apprentice';
  } else if (totalPracticeTime >= skillCategory.thresholds.rookie) {
    skill.level = 'Rookie';
  } else {
    skill.level = 'Beginner';
  }
};

// Helper function to check and award streak achievements
const checkAndAwardStreakAchievements = async (user, skill) => {
  // Find streak achievements that user doesn't have yet
  const streakAchievements = await Achievement.find({
    type: 'streak',
    threshold: { $lte: skill.currentStreak },
    _id: { $nin: user.achievements }
  });
  
  // Add eligible achievements to user
  for (const achievement of streakAchievements) {
    if (
      (!achievement.skillSpecific) || 
      (achievement.skillSpecific && achievement.skillCategory.toString() === skill.category.toString())
    ) {
      user.achievements.push(achievement._id);
    }
  }
};

// Helper function to check and award practice time achievements
const checkAndAwardPracticeTimeAchievements = async (user, skill) => {
  // Find practice time achievements that user doesn't have yet
  const practiceTimeAchievements = await Achievement.find({
    type: 'practice_time',
    threshold: { $lte: skill.totalPracticeTime },
    _id: { $nin: user.achievements }
  });
  
  // Add eligible achievements to user
  for (const achievement of practiceTimeAchievements) {
    if (
      (!achievement.skillSpecific) || 
      (achievement.skillSpecific && achievement.skillCategory.toString() === skill.category.toString())
    ) {
      user.achievements.push(achievement._id);
    }
  }
};

// @desc    Get user practice sessions
// @route   GET /api/practice
// @access  Private
const getUserPractices = async (req, res) => {
  try {
    const { skillCategoryId, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { user: req.user._id };
    
    if (skillCategoryId) {
      query.skillCategory = skillCategoryId;
    }
    
    const practices = await Practice.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('skillCategory', 'name icon');
    
    const total = await Practice.countDocuments(query);
    
    res.json({
      practices,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get practice session by ID
// @route   GET /api/practice/:id
// @access  Private
const getPracticeById = async (req, res) => {
  try {
    const practice = await Practice.findById(req.params.id)
      .populate('skillCategory', 'name icon')
      .populate('user', 'name profileImage');
    
    if (!practice) {
      return res.status(404).json({ message: 'Practice not found' });
    }
    
    // Check if practice belongs to user or is from a friend
    const user = await User.findById(req.user._id);
    
    if (
      practice.user._id.toString() !== req.user._id.toString() &&
      !user.friends.includes(practice.user._id)
    ) {
      return res.status(403).json({ message: 'Not authorized to view this practice' });
    }
    
    res.json(practice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get feed of friend's practices
// @route   GET /api/practice/feed
// @access  Private
const getFriendsFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Get practices from friends and self
    const practices = await Practice.find({
      user: { $in: [...user.friends, req.user._id] }
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('skillCategory', 'name icon')
      .populate('user', 'name profileImage');
    
    const total = await Practice.countDocuments({
      user: { $in: [...user.friends, req.user._id] }
    });
    
    res.json({
      practices,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a timelapse video from practice images
// @route   POST /api/practice/timelapse/:skillCategoryId
// @access  Private
const createTimelapse = async (req, res) => {
  try {
    const { skillCategoryId } = req.params;
    
    // Check if user has enough practices for timelapse
    const practiceCount = await Practice.countDocuments({
      user: req.user._id,
      skillCategory: skillCategoryId
    });
    
    if (practiceCount < 10) {
      return res.status(400).json({ 
        message: 'Not enough practice sessions for timelapse. Need at least 10 sessions.' 
      });
    }
    
    // Note: In a real implementation, this would initiate a background job
    // to collect images and create a video. For now, we just return a success message.
    res.json({ 
      message: 'Timelapse creation initiated. You will be notified when it\'s ready.',
      // In a real implementation, we would return an ID or URL for the timelapse
      timelapseId: 'temp-id'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPractice,
  getUserPractices,
  getPracticeById,
  getFriendsFeed,
  createTimelapse
};

// controllers/skillCategoryController.js
const SkillCategory = require('../models/SkillCategory');
const User = require('../models/User');

// @desc    Create a skill category
// @route   POST /api/skill-categories
// @access  Private/Admin
const createSkillCategory = async (req, res) => {
  try {
    const { name, description, minimumDuration, thresholds } = req.body;
    
    const categoryExists = await SkillCategory.findOne({ name });
    
    if (categoryExists) {
      return res.status(400).json({ message: 'Skill category already exists' });
    }
    
    const skillCategory = await SkillCategory.create({
      name,
      description,
      minimumDuration: minimumDuration || 15,
      icon: req.file ? req.file.filename : undefined,
      thresholds: thresholds || undefined
    });
    
    res.status(201).json(skillCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all skill categories
// @route   GET /api/skill-categories
// @access  Public
const getSkillCategories = async (req, res) => {
  try {
    const skillCategories = await SkillCategory.find({});
    res.json(skillCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's skill categories with stats
// @route   GET /api/skill-categories/user
// @access  Private
const getUserSkillCategories = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('skills.category', 'name description icon minimumDuration');
    
    res.json(user.skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSkillCategory,
  getSkillCategories,
  getUserSkillCategories
};

// controllers/achievementController.js
const Achievement = require('../models/Achievement');
const User = require('../models/User');

// @desc    Create an achievement
// @route   POST /api/achievements
// @access  Private/Admin
const createAchievement = async (req, res) => {
  try {
    const { name, description, type, threshold, skillSpecific, skillCategory } = req.body;
    
    const achievementExists = await Achievement.findOne({ name });
    
    if (achievementExists) {
      return res.status(400).json({ message: 'Achievement already exists' });
    }
    
    const achievement = await Achievement.create({
      name,
      description,
      icon: req.file ? req.file.filename : undefined,
      type,
      threshold,
      skillSpecific: skillSpecific || false,
      skillCategory: skillSpecific ? skillCategory : undefined
    });
    
    res.status(201).json(achievement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Public
const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({})
      .populate('skillCategory', 'name');
    
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's achievements
// @route   GET /api/achievements/user
// @access  Private
const getUserAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('achievements', 'name description icon type threshold');
    
    res.json(user.achievements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAchievement,
  getAchievements,
  getUserAchievements
};