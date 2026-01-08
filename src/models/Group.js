const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '', maxlength: 600 },
    coverImageUrl: { type: String, default: '' },
    tags: { type: [String], default: [] },
    featuredPatterns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pattern' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 1, min: 0 },
    postCount: { type: Number, default: 0, min: 0 },
    messageCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Group || mongoose.model('Group', groupSchema);
