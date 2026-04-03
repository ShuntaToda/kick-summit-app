import type { BracketRepository } from "../../domain/entities/bracket";
import type { MatchRepository } from "../../domain/entities/match";

/**
 * 試合終了時に呼び出し、match-result 参照を持つブラケットの
 * 次ラウンド Match に勝者/敗者の teamId を反映する。
 */
export const createResolveMatchResults =
  (bracketRepo: BracketRepository, matchRepo: MatchRepository) =>
  async (eventId: string, finishedMatchId: string): Promise<void> => {
    const finishedMatch = await matchRepo.findById(finishedMatchId);
    if (!finishedMatch || finishedMatch.status !== "finished") return;
    if (
      finishedMatch.scoreA === null ||
      finishedMatch.scoreB === null ||
      finishedMatch.scoreA === finishedMatch.scoreB
    ) {
      return; // 同点は反映しない
    }

    const winnerId =
      finishedMatch.scoreA > finishedMatch.scoreB
        ? finishedMatch.teamAId
        : finishedMatch.teamBId;
    const loserId =
      finishedMatch.scoreA > finishedMatch.scoreB
        ? finishedMatch.teamBId
        : finishedMatch.teamAId;

    const brackets = await bracketRepo.findAll(eventId);

    // この試合を参照するブラケットを探す
    const referencing = brackets.filter(
      (b) =>
        (b.homeRef?.type === "match-result" && b.homeRef.matchId === finishedMatchId) ||
        (b.awayRef?.type === "match-result" && b.awayRef.matchId === finishedMatchId),
    );

    for (const bracket of referencing) {
      const match = await matchRepo.findById(bracket.matchId);
      if (!match) continue;

      let teamAId = match.teamAId;
      let teamBId = match.teamBId;
      let changed = false;

      if (
        bracket.homeRef?.type === "match-result" &&
        bracket.homeRef.matchId === finishedMatchId
      ) {
        const resolved = bracket.homeRef.result === "winner" ? winnerId : loserId;
        if (resolved && teamAId !== resolved) {
          teamAId = resolved;
          changed = true;
        }
      }

      if (
        bracket.awayRef?.type === "match-result" &&
        bracket.awayRef.matchId === finishedMatchId
      ) {
        const resolved = bracket.awayRef.result === "winner" ? winnerId : loserId;
        if (resolved && teamBId !== resolved) {
          teamBId = resolved;
          changed = true;
        }
      }

      if (changed) {
        await matchRepo.save({
          ...match,
          teamAId,
          teamBId,
        });
      }
    }
  };
