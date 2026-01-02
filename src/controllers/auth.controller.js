const bcrypt = require('bcryptjs');
const { z } = require('zod');

const User = require('../models/User');
const { EXPERIENCE_LEVELS } = require('../models/User');
const { generateAccessToken } = require('../utils/token');
const { buildHandle, withRandomSuffix } = require('../utils/string');

const registerSchema = z.object({
  displayName: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  handle: z.string().min(3).max(40).regex(/^[a-zA-Z0-9-]+$/).optional(),
  bio: z.string().max(280).optional().default(''),
  location: z.string().max(120).optional().default(''),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional().default('beginner'),
  avatarUrl: z.string().url().or(z.literal('')).optional().default('')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const formatSession = (userDoc) => {
  const safeUser = userDoc.toSafeObject();
  return {
    token: generateAccessToken(userDoc._id.toString()),
    user: safeUser
  };
};

const ensureUniqueHandle = async (preferredHandle, fallbackName) => {
  let candidate = preferredHandle ? buildHandle(preferredHandle) : buildHandle(fallbackName);

  // Try a handful of unique variations before giving up.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await User.findOne({ handle: candidate });
    if (!existing) {
      return candidate;
    }
    candidate = withRandomSuffix(candidate);
  }

  return `${candidate}-${Date.now().toString(36)}`;
};

const registerUser = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { displayName, email, password, handle, bio, location, experienceLevel, avatarUrl } = parsed.data;

    const normalizedEmail = email.toLowerCase();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const uniqueHandle = await ensureUniqueHandle(handle, displayName);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      displayName,
      email: normalizedEmail,
      handle: uniqueHandle,
      passwordHash,
      bio,
      location,
      experienceLevel,
      avatarUrl
    });

    return res.status(201).json(formatSession(user));
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json(formatSession(user));
  } catch (error) {
    return next(error);
  }
};

const getSession = async (req, res) => {
  return res.json({ user: req.user.toSafeObject() });
};

module.exports = {
  registerUser,
  loginUser,
  getSession
};
