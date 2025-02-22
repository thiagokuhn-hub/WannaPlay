// Existing types...

export interface Player {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  padel_category?: PadelCategory;  // Changed from padelCategory
  beach_tennis_category?: BeachTennisCategory;  // Changed from beachTennisCategory
  playing_side: PlayingSide;  // Changed from playingSide
  gender: Gender;
  avatar?: string;
  is_admin?: boolean;  // Changed from isAdmin
  blocked?: boolean;
  blocked_at?: string;  // Changed from blockedAt
  created_at?: string;
  updated_at?: string;
  cep?: string;
  preferred_sports?: Sport[];
}

export type PadelCategory = 'CAT 1' | 'CAT 2' | 'CAT 3' | 'CAT 4' | 'CAT 5' | 'CAT 6';

export type BeachTennisCategory = 'INICIANTE' | 'CAT C' | 'CAT B' | 'CAT A' | 'PROFISSIONAL';

export type PlayingSide = 'left' | 'right' | 'both';

export type Gender = 'male' | 'female';