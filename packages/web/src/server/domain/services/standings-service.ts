import type { Match } from "../entities/match";
import type { Team } from "../entities/team";

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

export function computeStandings(
  matches: Match[],
  teams: Team[],
  group: string
): StandingsRow[] {
  const groupTeams = teams.filter((t) => t.group === group);
  const groupMatches = matches.filter(
    (m) => m.type === "league" && m.group === group && m.status === "finished"
  );

  const rows: StandingsRow[] = groupTeams.map((team) => {
    const row: StandingsRow = {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };

    for (const match of groupMatches) {
      if (match.scoreA === null || match.scoreB === null) continue;

      if (match.teamAId === team.id) {
        row.played++;
        row.goalsFor += match.scoreA;
        row.goalsAgainst += match.scoreB;
        if (match.scoreA > match.scoreB) row.won++;
        else if (match.scoreA === match.scoreB) row.drawn++;
        else row.lost++;
      } else if (match.teamBId === team.id) {
        row.played++;
        row.goalsFor += match.scoreB;
        row.goalsAgainst += match.scoreA;
        if (match.scoreB > match.scoreA) row.won++;
        else if (match.scoreA === match.scoreB) row.drawn++;
        else row.lost++;
      }
    }

    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.points = row.won * 3 + row.drawn;
    return row;
  });

  // 勝点 → 得失点差 → 総得点 でソート
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return rows;
}
