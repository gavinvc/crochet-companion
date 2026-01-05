import { PatternDetail, PatternSummary } from '../models/pattern.model';

const computeRowCount = (rows: PatternDetail['rows']) =>
  rows.reduce((total, row) => total + Math.max(1, row.rowSpan ?? 1), 0);

type MutablePattern = PatternDetail & { rowCount?: number };

const GAVIN_FOLLOWERS = 0;

const initialPatterns: MutablePattern[] = [
  {
    id: 'sample-sunny-granny-square',
    title: 'Sunny Granny Square Coaster',
    description: 'Beginner-friendly granny square that works up in under 30 minutes.',
    imageUrl: 'https://www.craftpassion.com/wp-content/uploads/crochet-solid-granny-square-coaster-720x405.jpg',
    followerCount: GAVIN_FOLLOWERS,
    rowCount: 0,
    author: { displayName: 'Gavin VC', handle: 'gavinvc' },
    isFollowing: false,
    isOwner: true,
    createdAt: '2025-11-05T00:00:00.000Z',
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
    id: 'sample-textured-mug-rug',
    title: 'Textured Mug Rug',
    description: 'Short, satisfying make with woven texture and tidy fringe.',
    imageUrl: 'https://kickincrochet.com/wp-content/uploads/2022/07/IMG_20220612_073801625_BURST000_COVER_TOPms.jpg',
    followerCount: GAVIN_FOLLOWERS,
    rowCount: 0,
    author: { displayName: 'Gavin VC', handle: 'gavinvc' },
    isFollowing: false,
    isOwner: true,
    createdAt: '2025-10-18T00:00:00.000Z',
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
    id: 'sample-ribbed-beanie',
    title: 'Chunky Ribbed Beanie',
    description: 'No-seam beanie worked flat with gentle stretch and cozy brim.',
    imageUrl: 'https://www.crochet365knittoo.com/wp-content/uploads/2019/12/Ribbed-Wonder-Hat-to-the-side.jpg',
    followerCount: GAVIN_FOLLOWERS,
    rowCount: 0,
    author: { displayName: 'Gavin VC', handle: 'gavinvc' },
    isFollowing: false,
    isOwner: true,
    createdAt: '2025-09-12T00:00:00.000Z',
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

const cloneRows = (rows: PatternDetail['rows']) => rows.map(row => ({ ...row, stitches: row.stitches ? [...row.stitches] : undefined }));

const toSummary = (pattern: MutablePattern): PatternSummary => {
  const rowCount = computeRowCount(pattern.rows);
  return {
    id: pattern.id,
    title: pattern.title,
    description: pattern.description,
    imageUrl: pattern.imageUrl,
    followerCount: pattern.followerCount,
    rowCount,
    author: { ...pattern.author },
    isFollowing: Boolean(pattern.isFollowing),
    isOwner: Boolean(pattern.isOwner),
    createdAt: pattern.createdAt
  };
};

let samplePatterns: MutablePattern[] = initialPatterns.map(pattern => ({
  ...pattern,
  rowCount: computeRowCount(pattern.rows)
}));

export const isSamplePatternId = (patternId?: string | null): boolean =>
  !!patternId && samplePatterns.some(pattern => pattern.id === patternId);

export const getSampleSummaries = (): PatternSummary[] => samplePatterns.map(pattern => toSummary(pattern));

export const getSamplePatternDetail = (patternId: string): PatternDetail | undefined => {
  const found = samplePatterns.find(pattern => pattern.id === patternId);
  if (!found) return undefined;

  return {
    ...toSummary(found),
    rows: cloneRows(found.rows)
  };
};

export const getSampleMine = (): PatternSummary[] => getSampleSummaries().filter(pattern => pattern.isOwner);
export const getSampleFollowing = (): PatternSummary[] => getSampleSummaries().filter(pattern => pattern.isFollowing);

export const toggleSampleFollow = (
  patternId: string
): { isFollowing: boolean; followerCount: number } | null => {
  const found = samplePatterns.find(pattern => pattern.id === patternId);
  if (!found) return null;

  const isFollowing = !found.isFollowing;
  const nextCount = Math.max(0, (found.followerCount || 0) + (isFollowing ? 1 : -1));

  found.isFollowing = isFollowing;
  found.followerCount = nextCount;

  return { isFollowing, followerCount: nextCount };
};

export const deleteSamplePattern = (patternId: string): boolean => {
  const index = samplePatterns.findIndex(pattern => pattern.id === patternId);
  if (index === -1) return false;
  samplePatterns.splice(index, 1);
  return true;
};
