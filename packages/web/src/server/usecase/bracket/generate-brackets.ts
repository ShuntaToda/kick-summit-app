import { nanoid } from "nanoid";
import type { BracketRepository, Bracket } from "../../domain/entities/bracket";
import type { MatchRepository } from "../../domain/entities/match";

type GenerateInput = {
  eventId: string;
  bracketName: string;
  teamCount: number;
  defaultScheduledTime: string;
  defaultDurationMinutes: number;
  defaultCourts: string[];
};

function generateMatchLabel(round: number, slot: number, totalRounds: number): string {
  if (totalRounds === round && round >= 2) return "決勝";
  if (totalRounds - 1 === round && totalRounds >= 3) return `準決勝第${slot + 1}試合`;
  return `${round}回戦第${slot + 1}試合`;
}

export const createGenerateBrackets =
  (bracketRepo: BracketRepository, matchRepo: MatchRepository) =>
  async (input: GenerateInput): Promise<void> => {
    const {
      eventId,
      bracketName,
      teamCount,
      defaultScheduledTime,
      defaultDurationMinutes,
      defaultCourts,
    } = input;

    if (teamCount < 2) return;

    // 同名の既存ブラケットと関連試合を削除
    const existingBrackets = await bracketRepo.findAll(eventId);
    const sameName = existingBrackets.filter((b) => b.bracketName === bracketName);
    await Promise.all(
      sameName.map((b) =>
        Promise.all([bracketRepo.delete(b.id), matchRepo.delete(b.matchId)]),
      ),
    );

    // 2のべき乗に切り上げ
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const totalRounds = Math.ceil(Math.log2(bracketSize));

    const generated: { bracket: Bracket; matchId: string }[] = [];

    for (let round = 1; round <= totalRounds; round++) {
      const slotsInRound = bracketSize / Math.pow(2, round);
      for (let slot = 0; slot < slotsInRound; slot++) {
        const matchId = nanoid();
        const bracketId = nanoid();
        generated.push({
          bracket: {
            id: bracketId,
            eventId,
            bracketName,
            round,
            slot,
            matchId,
            matchLabel: generateMatchLabel(round, slot, totalRounds),
            homeRef: null,
            awayRef: null,
          },
          matchId,
        });
      }
    }

    // 試合とブラケットを保存
    await Promise.all(
      generated.map(({ bracket, matchId }, i) =>
        Promise.all([
          matchRepo.save({
            id: matchId,
            eventId,
            type: "tournament",
            groupId: null,
            teamAId: null,
            teamBId: null,
            scoreA: null,
            scoreB: null,
            halfScoreA: null,
            halfScoreB: null,
            scheduledTime: defaultScheduledTime || "00:00",
            durationMinutes: defaultDurationMinutes,
            court: defaultCourts.length > 0 ? defaultCourts[i % defaultCourts.length]! : "",
            status: "scheduled",
            refereeTeamId: null,
            refereeTeamId2: null,
            customLeagueId: null,
            teamARefLabel: null,
            teamBRefLabel: null,
          }),
          bracketRepo.save(bracket),
        ]),
      ),
    );
  };
