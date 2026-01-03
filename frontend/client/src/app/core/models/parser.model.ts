export type PatternInputType = 'text' | 'url';

export interface PatternParseRequest {
  inputType: PatternInputType;
  content: string;
  title?: string;
}

export interface PatternRow {
  rowNumber: number;
  instruction: string;
  stitches?: string[];
  notes?: string;
}

export interface PatternParseResponse {
  rows: PatternRow[];
  summary?: string;
  warnings?: string[];
  sourceType: PatternInputType;
  sourceTitle?: string | null;
  rawExcerpt?: string;
}
