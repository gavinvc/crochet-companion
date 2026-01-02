const mongoose = require('mongoose');

const EXPERIENCE_LEVELS = ['beginner', 'confident-beginner', 'intermediate', 'advanced', 'designer'];

const statsSchema = new mongoose.Schema(
  {
    patternsShared: { type: Number, default: 0 },
    patternsFavorited: { type: Number, default: 0 },
    stitchesTracked: { type: Number, default: 0 }
  },
  { _id: false }
);

const socialLinksSchema = new mongoose.Schema(
  {
    instagram: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true },
    handle: { type: String, required: true, trim: true, lowercase: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: 'beginner' },
    favoriteYarns: { type: [String], default: [] },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    stats: { type: statsSchema, default: () => ({}) },
    socialLinks: { type: socialLinksSchema, default: () => ({}) }
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
module.exports.EXPERIENCE_LEVELS = EXPERIENCE_LEVELS;
