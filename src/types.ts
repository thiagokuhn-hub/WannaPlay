

// Add Tennis category type
export type TennisCategory = '1.0' | '1.5' | '2.0' | '2.5' | '3.0' | '3.5' | '4.0' | '4.5' | '5.0' | '5.5' | '6.0' | '6.5' | '7.0';

// Update Sport type
export type Sport = 'padel' | 'beach-tennis' | 'tennis';

// Update Player interface
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
  requiredCategories: (PadelCategory | BeachTennisCategory | TennisCategory)[];
  tennis_category?: TennisCategory;  // Add this field
}

export type PadelCategory = 'CAT 1' | 'CAT 2' | 'CAT 3' | 'CAT 4' | 'CAT 5' | 'CAT 6';

export type BeachTennisCategory = 'INICIANTE' | 'CAT C' | 'CAT B' | 'CAT A' | 'PROFISSIONAL';

export type PlayingSide = 'left' | 'right' | 'both';

export type Gender = 'male' | 'female';

interface Availability {
  id: string;
  player: Player;
  sports: Sport[];
  locations: string[];
  timeSlots: TimeSlot[];
  notes?: string;
  duration: AvailabilityDuration;
  createdAt: string;
  expiresAt: string;
  is_public: boolean; // Make sure this exists
  groups?: Group[]; // Make sure this exists
}