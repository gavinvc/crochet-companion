const { z } = require('zod');
const Pattern = require('../models/Pattern');
const User = require('../models/User');
const { verifyAccessToken } = require('../utils/token');

const rowSchema = z.object({
  rowNumber: z.number().int().positive().optional(),
  instruction: z.string().min(1),
  stitches: z.array(z.string()).optional(),
  notes: z.string().optional(),
  rowSpan: z.number().int().positive().optional()
});

const createPatternSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(600).optional().default(''),
  imageUrl: z.string().url().optional().or(z.literal('')).default(''),
  rows: z.array(rowSchema).min(1)
});

const normalizeRows = (rows) => {
  return rows.map((row, index) => ({
    rowNumber: Number.isInteger(row.rowNumber) && row.rowNumber > 0 ? row.rowNumber : index + 1,
    instruction: row.instruction.trim(),
    stitches: Array.isArray(row.stitches) ? row.stitches.map(item => String(item).trim()).filter(Boolean) : [],
    notes: row.notes ? row.notes.trim() : '',
    rowSpan: Number.isInteger(row.rowSpan) && row.rowSpan > 0 ? row.rowSpan : 1
  }));
};

const toSummary = (pattern, viewerId) => {
  const followerCount = pattern.followers?.length || 0;
  const isFollowing = viewerId ? pattern.followers.some(f => f.equals(viewerId)) : false;
  const rowCount = (pattern.rows || []).reduce((sum, r) => sum + (r.rowSpan || 1), 0);
  const isSample = Boolean(pattern.isSample);
  const isOwner = viewerId ? pattern.author?._id?.toString() === viewerId.toString() : false;
  return {
    id: pattern._id.toString(),
    title: pattern.title,
    description: pattern.description,
    imageUrl: pattern.imageUrl,
    followerCount,
    rowCount,
    author: pattern.author,
    isFollowing,
    isOwner,
    isSample,
    canDelete: isOwner && !isSample,
    createdAt: pattern.createdAt
  };
};

const getViewerId = (req) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);
    return decoded.sub;
  } catch (error) {
    return null;
  }
};

const createPattern = async (req, res, next) => {
  try {
    const parsed = createPatternSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { title, description, imageUrl, rows } = parsed.data;
    const normalizedRows = normalizeRows(rows);

    const pattern = await Pattern.create({
      title,
      description,
      imageUrl,
      rows: normalizedRows,
      author: req.user._id
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.patternsShared': 1 } }, { new: false });

    await pattern.populate({ path: 'author', select: 'displayName handle avatarUrl' });

    return res.status(201).json({ pattern: toSummary(pattern, req.user._id) });
  } catch (error) {
    return next(error);
  }
};

const listPatterns = async (req, res, next) => {
  try {
    const viewerId = getViewerId(req);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const scope = req.query.scope;

    const query = {};
    if (scope === 'mine') {
      if (!viewerId) return res.status(401).json({ message: 'Authentication required' });
      query.author = viewerId;
    }
    if (scope === 'following') {
      if (!viewerId) return res.status(401).json({ message: 'Authentication required' });
      query.followers = viewerId;
    }

    const patterns = await Pattern.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'author', select: 'displayName handle avatarUrl' })
      .lean({ virtuals: true });

    const summaries = patterns.map(p => toSummary(p, viewerId));
    return res.json({ patterns: summaries });
  } catch (error) {
    return next(error);
  }
};

const getPattern = async (req, res, next) => {
  try {
    const viewerId = getViewerId(req);
    const pattern = await Pattern.findById(req.params.patternId)
      .populate({ path: 'author', select: 'displayName handle avatarUrl' })
      .lean({ virtuals: true });

    if (!pattern) {
      return res.status(404).json({ message: 'Pattern not found' });
    }

    const followerCount = pattern.followers?.length || 0;
    const isFollowing = viewerId ? pattern.followers.some(f => f.toString() === viewerId) : false;
    const isSample = Boolean(pattern.isSample);
    const isOwner = viewerId ? pattern.author?._id?.toString() === viewerId.toString() : false;

    return res.json({
      pattern: {
        id: pattern._id.toString(),
        title: pattern.title,
        description: pattern.description,
        imageUrl: pattern.imageUrl,
        followerCount,
        rowCount: (pattern.rows || []).reduce((sum, r) => sum + (r.rowSpan || 1), 0),
        author: pattern.author,
        rows: pattern.rows,
        isFollowing,
        isOwner,
        isSample,
        canDelete: isOwner && !isSample,
        createdAt: pattern.createdAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

const toggleFollow = async (req, res, next) => {
  try {
    const pattern = await Pattern.findById(req.params.patternId);
    if (!pattern) {
      return res.status(404).json({ message: 'Pattern not found' });
    }

    const followerId = req.user._id;
    const alreadyFollowing = pattern.followers.some(f => f.equals(followerId));

    if (alreadyFollowing) {
      pattern.followers = pattern.followers.filter(f => !f.equals(followerId));
      await User.findByIdAndUpdate(followerId, { $inc: { 'stats.patternsFavorited': -1 } }, { new: false });
    } else {
      pattern.followers.push(followerId);
      await User.findByIdAndUpdate(followerId, { $inc: { 'stats.patternsFavorited': 1 } }, { new: false });
    }

    await pattern.save();

    return res.json({
      patternId: pattern._id.toString(),
      isFollowing: !alreadyFollowing,
      followerCount: pattern.followers.length
    });
  } catch (error) {
    return next(error);
  }
};

const deletePattern = async (req, res, next) => {
  try {
    const pattern = await Pattern.findById(req.params.patternId);
    if (!pattern) {
      return res.status(404).json({ message: 'Pattern not found' });
    }

    if (pattern.isSample) {
      return res.status(403).json({ message: 'Sample patterns cannot be deleted.' });
    }

    const isOwner = pattern.author?.toString?.() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ message: 'You can only delete your own patterns.' });
    }

    await Pattern.findByIdAndDelete(pattern._id);
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.patternsShared': -1 } }, { new: false });

    return res.json({ success: true, patternId: pattern._id.toString() });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPattern,
  listPatterns,
  getPattern,
  toggleFollow,
  deletePattern
};
