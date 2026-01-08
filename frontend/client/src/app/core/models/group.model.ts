import { PatternAuthor } from './pattern.model';

export interface GroupSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl?: string;
  tags: string[];
  memberCount: number;
  postCount: number;
  messageCount: number;
  isMember: boolean;
  role: 'owner' | 'moderator' | 'member' | null;
  featuredPatterns: Array<{
    id: string;
    title?: string;
    imageUrl?: string;
    author?: PatternAuthor | string;
  }>;
  createdAt: string;
}

export interface GroupDetail extends GroupSummary {}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  coverImageUrl?: string;
  tags?: string[];
  featuredPatternIds?: string[];
}

export interface GroupPost {
  id: string;
  content: string;
  pattern: { id: string; title?: string; imageUrl?: string } | null;
  attachments: string[];
  author: {
    _id: string;
    displayName: string;
    handle: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export interface CreatePostPayload {
  content: string;
  patternId?: string;
  attachments?: string[];
}

export interface GroupMessage {
  id: string;
  body: string;
  author: {
    _id: string;
    displayName: string;
    handle: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export interface CreateMessagePayload {
  body: string;
}
