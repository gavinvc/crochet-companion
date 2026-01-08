const mongoose = require('mongoose');

const progressRowSchema = new mongoose.Schema(
  {
    rowNumber: { type: Number, default: 0 },
    instruction: { type: String, required: true, trim: true },
    stitches: { type: [String], default: [] },
    notes: { type: String, default: '' },
    rowSpan: { type: Number, default: 1, min: 1 }
  },
  { _id: false }
);

const projectProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pattern: { type: mongoose.Schema.Types.ObjectId, ref: 'Pattern', default: null },
    patternType: { type: String, enum: ['community', 'parsed'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    source: {
      sourceType: { type: String, default: undefined },
      sourceTitle: { type: String, default: undefined }
    },
    imageUrl: { type: String, default: '' },
    rows: { type: [progressRowSchema], default: [] },
    rowCount: { type: Number, default: 0 },
    currentRowNumber: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

projectProgressSchema.index({ user: 1, status: 1 });
projectProgressSchema.index(
  { user: 1, pattern: 1, patternType: 1 },
  { unique: true, partialFilterExpression: { patternType: 'community', pattern: { $exists: true, $ne: null } } }
);

module.exports = mongoose.models.ProjectProgress || mongoose.model('ProjectProgress', projectProgressSchema);
