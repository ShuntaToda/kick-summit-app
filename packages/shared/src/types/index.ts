/** 試合ステータス */
export type MatchStatus = "scheduled" | "ongoing" | "finished";

/** 試合タイプ */
export type MatchType = "league" | "tournament";

/** 大会情報 */
export interface Tournament {
  id: string;
  name: string;
  date: string;
  passwordHash: string;
}

/** チーム */
export interface Team {
  id: string;
  name: string;
  group: string;
  color: string;
}

/** 試合 */
export interface Match {
  id: string;
  type: MatchType;
  group: string;
  teamAId: string;
  teamBId: string;
  scoreA: number | null;
  scoreB: number | null;
  halfScoreA: number | null;
  halfScoreB: number | null;
  scheduledTime: string;
  court: string;
  status: MatchStatus;
}

/** トーナメント枠 */
export interface TournamentBracket {
  id: string;
  round: number;
  slot: number;
  matchId: string;
}

/** リーグ順位表の行 */
export interface StandingsRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
