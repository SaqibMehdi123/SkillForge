const config = {
  skillLevels: {
    BEGINNER: 'Beginner',
    ROOKIE: 'Rookie',
    APPRENTICE: 'Apprentice',
    MASTER: 'Master',
    GRAND_MASTER: 'Grand Master'
  },
  practiceRequirements: {
    MIN_DURATION: 15, // minutes
    MIN_TIMELAPSE_SESSIONS: 10
  },
  achievements: {
    types: {
      STREAK: 'streak',
      PRACTICE_TIME: 'practice_time',
      MILESTONES: 'milestones',
      SPECIAL: 'special'
    }
  },
  streak: {
    TOKEN_REWARD_INTERVAL: 5 // days
  },
  upload: {
    limits: {
      profileImage: 5 * 1024 * 1024, // 5MB
      practiceImage: 10 * 1024 * 1024, // 10MB
      categoryIcon: 2 * 1024 * 1024 // 2MB
    },
    allowedImageTypes: /jpeg|jpg|png|gif/
  },
  rewards: {
    available: [
      {
        id: 'custom_badge',
        name: 'Custom Badge',
        description: 'Create a custom badge for your profile',
        cost: 10
      },
      {
        id: 'profile_theme',
        name: 'Profile Theme',
        description: 'Unlock a special profile theme',
        cost: 15
      },
      {
        id: 'streak_protection',
        name: 'Streak Protection',
        description: 'Protect your streak for one missed day',
        cost: 20
      }
    ]
  },
  timelapseConfig: {
    minSessions: 10,
    maxSessions: 100,
    defaultFps: 2,
    outputFormat: 'mp4',
    quality: 'high'
  }
};

module.exports = config;
