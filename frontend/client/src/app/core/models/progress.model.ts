import { PatternRow } from './pattern.model';

export type ProgressPatternType = 'community' | 'parsed';
export type ProgressStatus = 'in-progress' | 'completed';

export interface ProjectProgress {
  id: string;
  patternType: ProgressPatternType;
  patternId?: string;
  title: string;
  rowCount: number;
  currentRowNumber: number;
  status: ProgressStatus;
  imageUrl?: string;
  sourceType?: string | null;
  sourceTitle?: string | null;
  updatedAt: string;
  createdAt: string;
  completedAt?: string | null;
}

export interface ProjectProgressDetail extends ProjectProgress {
  rows?: PatternRow[];
}

export interface SaveCommunityProgressPayload {
  patternId: string;
  currentRowNumber: number;
  status?: ProgressStatus;
}

export interface SaveParsedProgressPayload {
  title: string;
  rows: PatternRow[];
  sourceType?: string;
  sourceTitle?: string;
  imageUrl?: string;
  currentRowNumber?: number;
  status?: ProgressStatus;
}
