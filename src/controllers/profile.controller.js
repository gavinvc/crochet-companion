const { z } = require('zod');
const User = require('../models/User');
const { EXPERIENCE_LEVELS } = require('../models/User');

const updateSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  bio: z.string().max(280).optional(),
  location: z.string().max(120).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  favoriteYarns: z.array(z.string().max(60)).max(8).optional(),
  avatarUrl: z.string().url().optional(),
  socialLinks: z
    .object({
      instagram: z.string().url().optional(),
      tiktok: z.string().url().optional(),
      website: z.string().url().optional()
    })
    .partial()
    .optional()
});

const getPublicProfile = async (req, res, next) => {
  try {
    const { handle } = req.params;
    const user = await User.findOne({ handle: handle.toLowerCase() })
      .select('-passwordHash')
      .populate('followers', 'handle displayName')
      .populate('following', 'handle displayName');

    if (!user) {
      return res.status(404).json({ message: 'Maker not found' });
    }

    return res.json({ profile: user });
  } catch (error) {
    return next(error);
  }
};

const getOwnProfile = async (req, res) => {
  return res.json({ profile: req.user.toSafeObject() });
};

const updateProfile = async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const updates = parsed.data;
    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    return res.json({ profile: updated.toSafeObject() });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPublicProfile,
  getOwnProfile,
  updateProfile
};
