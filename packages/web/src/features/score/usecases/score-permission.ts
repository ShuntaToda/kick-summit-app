import type { Match } from "@/server/domain/entities/match";

export function canEditMatch(
  match: Match,
  selectedTeamId: string | null,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  if (!selectedTeamId) return false;
  return (
    match.teamAId === selectedTeamId ||
    match.teamBId === selectedTeamId ||
    match.refereeTeamId === selectedTeamId ||
    match.refereeTeamId2 === selectedTeamId
  );
}
