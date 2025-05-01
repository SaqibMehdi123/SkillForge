const User = require('../models/User');
const config = require('../config/config');

const getRewards = async (req, res) => {
  try {
    const rewards = config.rewards.available;
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const redeemTokens = async (req, res) => {
  try {
    const { skillId, rewardId } = req.body;
    const user = await User.findById(req.user._id);
    const skill = user.skills.id(skillId);
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const reward = config.rewards.available.find(r => r.id === rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    if (skill.redeemTokens < reward.cost) {
      return res.status(400).json({ message: 'Insufficient tokens' });
    }

    skill.redeemTokens -= reward.cost;
    await user.save();

    // Notify via socket
    req.io.to(user._id.toString()).emit('tokenRedeemed', {
      skillId,
      rewardId,
      remainingTokens: skill.redeemTokens
    });

    res.json({ 
      message: 'Tokens redeemed successfully',
      reward,
      remainingTokens: skill.redeemTokens
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRewards, redeemTokens };
