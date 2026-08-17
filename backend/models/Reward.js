const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  pointsCost: { type: Number, required: true },
  category: { type: String, default: 'General' },
  icon: { type: String, default: '🎁' },
  promoPrefix: { type: String, required: true },
  stock: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const claimedRewardSchema = new mongoose.Schema({
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  rewardTitle: { type: String, required: true },
  couponCode: { type: String, required: true, unique: true },
  pointsSpent: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Used', 'Expired'], default: 'Active' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

const Reward = mongoose.model('Reward', rewardSchema);
const ClaimedReward = mongoose.model('ClaimedReward', claimedRewardSchema);

module.exports = { Reward, ClaimedReward };
