const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    pattern: { type: mongoose.Schema.Types.ObjectId, ref: 'Pattern', default: null },
    attachments: { type: [String], default: [] }
  },
  { timestamps: true }
);

postSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.models.GroupPost || mongoose.model('GroupPost', postSchema);
