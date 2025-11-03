export type Role = "participant" | "admin";

export interface Participant {
  id?: string;
  name: string;
  email: string;
  college: string;
  submitted_weight?: number | null;
  file_url?: string | null;
  score?: number;
  time_submitted?: string | null;
  created_at?: string;
}

export interface Competition {
  id: number;
  name?: string;
  round?: number;
  reference_weight?: number | null;
  tolerance?: number;
  material?: string | null;
  is_active: boolean;
  start_time?: string | null;
  drawing_url?: string | null;
  created_at?: string;
}

export interface LeaderboardEntry {
  id?: string;
  rank: number;
  name: string;
  college?: string;
  weightSubmitted: number;
  score: number;
  time: string; // ISO or formatted
  isNew?: boolean;
}

export type CompetitionStatus = "waiting" | "active" | "paused" | "expired";
