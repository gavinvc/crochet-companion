require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const connectDatabase = require('../src/config/database');
const Pattern = require('../src/models/Pattern');
const User = require('../src/models/User');

const SEED_HANDLE = (process.env.SEED_HANDLE || 'gavinvc').toLowerCase();
const SEED_EMAIL = (process.env.SEED_EMAIL || 'gavinvc@example.com').toLowerCase();
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'ChangeMe123!';
const SEED_DISPLAY_NAME = process.env.SEED_DISPLAY_NAME || 'Gavin VC';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crochet-companion';

const samplePatterns = [
  {
    title: 'Sunny Granny Square Coaster',
    description: 'Beginner-friendly granny square that works up in under 30 minutes.',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    rows: [
      {
        rowNumber: 1,
        instruction:
          'Start with a magic ring, ch 3 (counts as dc), 2 dc into ring, ch 2; *3 dc, ch 2* repeat 3x, join to top of ch 3, tighten ring, ch 1, turn.',
        stitches: ['magic ring', 'ch', 'dc'],
        notes: 'Row ends with 4 dc clusters separated by ch-2 corners.'
      },
      {
        rowNumber: 2,
        instruction:
          'Ch 3, dc in same st, dc in next 2 sts, (2 dc, ch 2, 2 dc) in ch-2 corner; *dc in next 3 sts, (2 dc, ch 2, 2 dc) in corner* repeat around, join, ch 1, turn.',
        stitches: ['ch', 'dc'],
        rowSpan: 1
      },
      {
        rowNumber: 3,
        instruction:
          'Ch 3, dc in same st, dc in each st across to corner; (2 dc, ch 2, 2 dc) in each corner space, dc in every st along sides, join, ch 1, turn.',
        stitches: ['ch', 'dc'],
        rowSpan: 1
      },
      {
        rowNumber: 4,
        instruction: 'Repeat Row 3 once more for a slightly larger coaster; fasten off and weave in ends.',
        stitches: ['dc', 'ch'],
        rowSpan: 1
      }
    ]
  },
  {
    title: 'Textured Mug Rug',
    description: 'Short, satisfying make with woven texture and tidy fringe.',
    imageUrl: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80',
    rows: [
      {
        rowNumber: 1,
        instruction: 'Ch 26, hdc in 2nd ch from hook and across, ch 1, turn.',
        stitches: ['ch', 'hdc']
      },
      {
        rowNumber: 2,
        instruction: 'Hdc in first st, *sl st in next st, hdc in next st* repeat across, ending with hdc in last st, ch 1, turn.',
        stitches: ['hdc', 'sl st'],
        notes: 'Creates woven look without gaps.'
      },
      {
        rowNumber: 3,
        instruction: 'Repeat Row 2 for woven texture.',
        stitches: ['hdc', 'sl st'],
        rowSpan: 6,
        notes: 'Work until piece measures about 6" wide.'
      },
      {
        rowNumber: 9,
        instruction: 'Hdc in each st across for a clean edge, fasten off and add fringe if desired.',
        stitches: ['hdc']
      }
    ]
  },
  {
    title: 'Chunky Ribbed Beanie',
    description: 'No-seam beanie worked flat with gentle stretch and cozy brim.',
    imageUrl: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=800&q=80',
    rows: [
      {
        rowNumber: 1,
        instruction: 'Ch 46 for height, hdc in 2nd ch from hook and across, ch 1, turn.',
        stitches: ['ch', 'hdc']
      },
      {
        rowNumber: 2,
        instruction: 'Hdc in back loop only across, ch 1, turn.',
        stitches: ['hdc blo'],
        rowSpan: 18,
        notes: 'Repeats build the ribbing; stop when fabric wraps head with slight stretch.'
      },
      {
        rowNumber: 20,
        instruction: 'Bring short edges together, whipstitch or slip stitch to seam. Cinch crown closed and weave in ends.',
        stitches: ['sl st', 'seaming']
      }
    ]
  }
];

const upsertUser = async () => {
  let user = await User.findOne({ handle: SEED_HANDLE });
  if (user) return user;

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  user = await User.create({
    displayName: SEED_DISPLAY_NAME,
    email: SEED_EMAIL,
    handle: SEED_HANDLE,
    passwordHash,
    experienceLevel: 'intermediate',
    bio: 'Sample pattern author',
    avatarUrl: ''
  });
  return user;
};

const upsertPattern = async (userId, patternData) => {
  const query = { title: patternData.title, author: userId };
  const existing = await Pattern.findOne(query);

  const payload = {
    ...patternData,
    author: userId
  };

  if (existing) {
    await Pattern.updateOne({ _id: existing._id }, payload, { runValidators: true });
    return { id: existing._id, created: false };
  }

  const created = await Pattern.create({ ...payload, createdAt: new Date(patternData.createdAt || Date.now()) });
  await User.updateOne({ _id: userId }, { $inc: { 'stats.patternsShared': 1 } });
  return { id: created._id, created: true };
};

(async () => {
  try {
    await connectDatabase(MONGO_URI);
    console.log('[seed] connected to Mongo');

    const user = await upsertUser();
    console.log(`[seed] using author ${user.displayName} (${user.handle})`);

    let created = 0;
    let updated = 0;

    for (const pattern of samplePatterns) {
      const result = await upsertPattern(user._id, pattern);
      if (result.created) created += 1;
      else updated += 1;
    }

    console.log(`[seed] patterns created: ${created}, updated: ${updated}`);
  } catch (error) {
    console.error('[seed] failed', error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
})();
