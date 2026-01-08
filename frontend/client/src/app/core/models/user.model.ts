export interface User {
  _id: string;
  displayName: string;
  handle: string;
  email: string;
  bio?: string;
  location?: string;
  experienceLevel?: string;
  avatarUrl?: string;
  stats?: {
    patternsShared: number;
    patternsFavorited: number;
    stitchesTracked: number;
    projectsCompleted?: number;
  };
  favoriteYarns?: string[];
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
  handle?: string;
  experienceLevel?: string;
}
