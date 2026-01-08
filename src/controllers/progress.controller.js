const { z } = require('zod');
const Pattern = require('../models/Pattern');
const ProjectProgress = require('../models/ProjectProgress');
const User = require('../models/User');

const rowSchema = z.object({
  rowNumber: z.number().int().positive().optional(),
  instruction: z.string().min(1),
  stitches: z.array(z.string()).optional(),
  notes: z.string().optional(),
  rowSpan: z.number().int().positive().optional()
});

const communityPayloadSchema = z.object({
  patternType: z.literal('community'),
  patternId: z.string().min(1),
  currentRowNumber: z.number().int().positive().optional(),
  status: z.enum(['in-progress', 'completed']).optional()
});

const parsedPayloadSchema = z.object({
  patternType: z.literal('parsed'),
  title: z.string().min(3).max(200),
  rows: z.array(rowSchema).min(1),
  sourceType: z.string().max(30).optional(),
  sourceTitle: z.string().max(200).optional(),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  currentRowNumber: z.number().int().positive().optional(),
  status: z.enum(['in-progress', 'completed']).optional()
});

const updatePayloadSchema = z.object({
  currentRowNumber: z.number().int().positive().optional(),
  status: z.enum(['in-progress', 'completed']).optional()
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

const computeRowCount = (rows = []) => rows.reduce((sum, row) => sum + Math.max(1, row.rowSpan || 1), 0);

const clampProgress = (currentRowNumber, rowCount) => {
  if (!rowCount || rowCount < 1) return 1;
  if (!currentRowNumber || currentRowNumber < 1) return 1;
  return Math.min(currentRowNumber, rowCount);
};

const formatProgress = (progress, { includeRows = false } = {}) => {
  const base = {
    id: progress._id.toString(),
    patternType: progress.patternType,
    patternId: progress.pattern
      ? progress.pattern._id
        ? progress.pattern._id.toString()
        : progress.pattern.toString()
      : undefined,
    title: progress.title,
    rowCount: progress.rowCount || 0,
    currentRowNumber: progress.currentRowNumber || 1,
    status: progress.status,
    imageUrl: progress.imageUrl || (progress.pattern && progress.pattern.imageUrl) || '',
    sourceType: progress.source?.sourceType || null,
    sourceTitle: progress.source?.sourceTitle || null,
    updatedAt: progress.updatedAt,
    createdAt: progress.createdAt,
    completedAt: progress.completedAt || null
  };

  if (includeRows) {
    base.rows = progress.rows || [];
  }

  if (progress.pattern && progress.pattern.title) {
    base.pattern = {
      id: progress.pattern._id ? progress.pattern._id.toString() : progress.pattern.toString(),
      title: progress.pattern.title,
      author: progress.pattern.author,
      imageUrl: progress.pattern.imageUrl || ''
    };
  }

  return base;
};

const adjustCompletionStat = async (userId, previousStatus, nextStatus) => {
  if (previousStatus === nextStatus) return;
  if (nextStatus === 'completed') {
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.projectsCompleted': 1 } }, { new: false });
  } else if (previousStatus === 'completed' && nextStatus !== 'completed') {
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.projectsCompleted': -1 } }, { new: false });
  }
};

const saveProgress = async (req, res, next) => {
  try {
    const payload = req.body || {};

    if (payload.patternType === 'community') {
      const parsed = communityPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      }

      const { patternId } = parsed.data;
      const pattern = await Pattern.findById(patternId).select('title rows imageUrl author');
      if (!pattern) {
        return res.status(404).json({ message: 'Pattern not found' });
      }

      const rowCount = computeRowCount(pattern.rows || []);
      const nextStatus = parsed.data.status || 'in-progress';
      const nextCurrent = clampProgress(parsed.data.currentRowNumber, rowCount);

      const filter = { user: req.user._id, pattern: pattern._id, patternType: 'community' };
      const existing = await ProjectProgress.findOne(filter);

      const update = {
        title: pattern.title,
        pattern: pattern._id,
        patternType: 'community',
        rowCount,
        currentRowNumber: nextCurrent,
        status: nextStatus,
        imageUrl: pattern.imageUrl || '',
        source: { sourceType: 'community', sourceTitle: pattern.title },
        completedAt: nextStatus === 'completed' ? existing?.completedAt || new Date() : null
      };

      const updated = await ProjectProgress.findOneAndUpdate(
        filter,
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).populate({ path: 'pattern', select: 'title author imageUrl' });

      await adjustCompletionStat(req.user._id, existing?.status, nextStatus);

      return res.status(existing ? 200 : 201).json({ progress: formatProgress(updated) });
    }

    if (payload.patternType === 'parsed') {
      const parsed = parsedPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      }

      const normalizedRows = normalizeRows(parsed.data.rows);
      const rowCount = computeRowCount(normalizedRows);
      const nextStatus = parsed.data.status || 'in-progress';
      const nextCurrent = clampProgress(parsed.data.currentRowNumber, rowCount);

      const doc = await ProjectProgress.create({
        user: req.user._id,
        patternType: 'parsed',
        title: parsed.data.title,
        rows: normalizedRows,
        rowCount,
        currentRowNumber: nextCurrent,
        status: nextStatus,
        imageUrl: parsed.data.imageUrl || '',
        source: { sourceType: parsed.data.sourceType || 'parser', sourceTitle: parsed.data.sourceTitle || parsed.data.title },
        completedAt: nextStatus === 'completed' ? new Date() : null
      });

      await adjustCompletionStat(req.user._id, null, nextStatus);

      return res.status(201).json({ progress: formatProgress(doc, { includeRows: true }) });
    }

    return res.status(400).json({ message: 'Unknown pattern type' });
  } catch (error) {
    return next(error);
  }
};

const listProgress = async (req, res, next) => {
  try {
    const progressDocs = await ProjectProgress.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .populate({ path: 'pattern', select: 'title author imageUrl' });

    const inProgress = [];
    const completed = [];

    progressDocs.forEach((doc) => {
      const formatted = formatProgress(doc);
      if (doc.status === 'completed') {
        completed.push(formatted);
      } else {
        inProgress.push(formatted);
      }
    });

    return res.json({
      inProgress,
      completed,
      summary: { completedCount: completed.length }
    });
  } catch (error) {
    return next(error);
  }
};

const getProgress = async (req, res, next) => {
  try {
    const progress = await ProjectProgress.findOne({ _id: req.params.progressId, user: req.user._id })
      .populate({ path: 'pattern', select: 'title author imageUrl rows' });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    return res.json({ progress: formatProgress(progress, { includeRows: true }) });
  } catch (error) {
    return next(error);
  }
};

const getProgressForPattern = async (req, res, next) => {
  try {
    const progress = await ProjectProgress.findOne({
      user: req.user._id,
      pattern: req.params.patternId,
      patternType: 'community'
    }).populate({ path: 'pattern', select: 'title author imageUrl rows' });

    if (!progress) {
      return res.json({ progress: null });
    }

    return res.json({ progress: formatProgress(progress, { includeRows: true }) });
  } catch (error) {
    return next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const parsed = updatePayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const progress = await ProjectProgress.findOne({ _id: req.params.progressId, user: req.user._id });
    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    const rowCount = progress.rowCount || computeRowCount(progress.rows || []);
    const nextStatus = parsed.data.status || progress.status;
    const nextCurrent = parsed.data.currentRowNumber
      ? clampProgress(parsed.data.currentRowNumber, rowCount)
      : progress.currentRowNumber;

    const previousStatus = progress.status;

    progress.currentRowNumber = nextCurrent;
    progress.status = nextStatus;
    progress.completedAt = nextStatus === 'completed' ? progress.completedAt || new Date() : null;

    await progress.save();
    await adjustCompletionStat(req.user._id, previousStatus, nextStatus);

    return res.json({ progress: formatProgress(progress, { includeRows: true }) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  saveProgress,
  listProgress,
  getProgress,
  getProgressForPattern,
  updateProgress
};
