export interface User {
  id: string;
  nickname: string;
  email: string;
  first_name: string;
  last_name: string;
  total_points: number;
  avatar_url?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type MatchStatus = "scheduled" | "live" | "finished";

export interface Match {
  id: string;
  external_id: string;
  home_team: string;
  away_team: string;
  home_flag: string | null;
  away_flag: string | null;
  group: string | null;
  stage: string | null;
  kickoff: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  locked: boolean;
}

export interface Prediction {
  id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points: number | null;
  scored: boolean;
  updated_at: string;
}

export interface GroupMember {
  user_id: string;
  nickname: string;
  points: number;
  live_points: number;
  rank: number;
}

export interface LeaderboardEntry extends GroupMember {
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  member_count: number;
  members: GroupMember[];
}

export interface MemberPrediction {
  user_id: string;
  nickname: string;
  home_score: number;
  away_score: number;
  points: number | null;
  scored: boolean;
}

export interface MatchPredictions {
  match: Match;
  predictions: MemberPrediction[];
}
