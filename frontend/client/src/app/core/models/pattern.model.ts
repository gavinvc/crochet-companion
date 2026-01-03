export interface PatternRow {
  rowNumber: number;
  instruction: string;
  stitches?: string[];
  notes?: string;
  rowSpan?: number;
}

export interface PatternAuthor {
  id?: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
}

export interface PatternSummary {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  followerCount: number;
  rowCount: number;
  author: PatternAuthor;
  isFollowing?: boolean;
  isOwner?: boolean;
  createdAt: string;
}

export interface PatternDetail extends PatternSummary {
  rows: PatternRow[];
}

export interface CreatePatternPayload {
  title: string;
  description?: string;
  imageUrl?: string;
  rows: PatternRow[];
}
