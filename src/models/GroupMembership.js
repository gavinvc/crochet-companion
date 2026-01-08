const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    role: { type: String, enum: ['owner', 'moderator', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

membershipSchema.index({ user: 1, group: 1 }, { unique: true });
membershipSchema.index({ group: 1, role: 1 });

module.exports = mongoose.models.GroupMembership || mongoose.model('GroupMembership', membershipSchema);
