import { nanoid } from "nanoid";
import type { MatchRepository, MatchType, MatchStatus } from "../../domain/entities/match";

type SaveMatchInput = {
  id?: string;
  eventId: string;
  type: MatchType;
  groupId: string | null;
  teamAId: string | null;
  teamBId: string | null;
  scheduledTime: string;
  durationMinutes: number;
  court: string;
  status: MatchStatus;
  refereeTeamId?: string | null;
  refereeTeamId2?: string | null;
  customLeagueId?: string | null;
  teamARefLabel?: string | null;
  teamBRefLabel?: string | null;
};

export const createSaveMatch =
  (matchRepo: MatchRepository) =>
  async (input: SaveMatchInput): Promise<void> => {
    const id = input.id ?? nanoid();
    const existing = input.id ? await matchRepo.findById(input.id) : null;
    await matchRepo.save({
      id,
      eventId: input.eventId,
      type: input.type,
      groupId: input.groupId,
      teamAId: input.teamAId,
      teamBId: input.teamBId,
      scoreA: existing?.scoreA ?? null,
      scoreB: existing?.scoreB ?? null,
      halfScoreA: existing?.halfScoreA ?? null,
      halfScoreB: existing?.halfScoreB ?? null,
      scheduledTime: input.scheduledTime,
      durationMinutes: input.durationMinutes,
      court: input.court,
      status: input.status,
      refereeTeamId: input.refereeTeamId ?? existing?.refereeTeamId ?? null,
      refereeTeamId2: input.refereeTeamId2 ?? existing?.refereeTeamId2 ?? null,
      customLeagueId: input.customLeagueId ?? existing?.customLeagueId ?? null,
      teamARefLabel: input.teamARefLabel ?? existing?.teamARefLabel ?? null,
      teamBRefLabel: input.teamBRefLabel ?? existing?.teamBRefLabel ?? null,
    });
  };
