const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

messageSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.models.GroupMessage || mongoose.model('GroupMessage', messageSchema);
