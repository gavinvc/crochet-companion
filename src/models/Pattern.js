const mongoose = require('mongoose');

const rowSchema = new mongoose.Schema(
  {
    rowNumber: { type: Number, default: 0 },
    instruction: { type: String, required: true, trim: true },
    stitches: { type: [String], default: [] },
    notes: { type: String, default: '' },
    rowSpan: { type: Number, default: 1, min: 1 }
  },
  { _id: false }
);

const patternSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 600 },
    imageUrl: { type: String, default: '' },
    rows: { type: [rowSchema], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.models.Pattern || mongoose.model('Pattern', patternSchema);
