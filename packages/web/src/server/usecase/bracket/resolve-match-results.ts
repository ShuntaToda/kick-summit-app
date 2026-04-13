import type { BracketRepository } from "../../domain/entities/bracket";
import type { MatchRepository } from "../../domain/entities/match";
import type { TeamRepository } from "../../domain/entities/team";
import type { GroupRepository } from "../../domain/entities/group";
import { computeStandings } from "../../domain/services/standings-service";

const GROUP_RANK_PREFIX = "group-rank:";

function parseGroupRankRef(refLabel: string): { groupId: string; rank: number } | null {
  if (!refLabel.startsWith(GROUP_RANK_PREFIX)) return null;
  const rest = refLabel.slice(GROUP_RANK_PREFIX.length);
  const lastColon = rest.lastIndexOf(":");
  if (lastColon === -1) return null;
  const groupId = rest.slice(0, lastColon);
  const rank = Number(rest.slice(lastColon + 1));
  if (!groupId || isNaN(rank) || rank < 1) return null;
  return { groupId, rank };
}

/**
 * スコア更新・試合終了時に呼び出し、以下を実行する:
 * 1. match-result 参照を持つブラケットの次ラウンド Match に勝者/敗者の teamId を反映する（finished のみ）
 * 2. group-rank 参照を持つカスタムリーグ試合の teamAId/teamBId をグループ順位から解決する（スコアがあれば常に）
 */
export const createResolveMatchResults =
  (
    bracketRepo: BracketRepository,
    matchRepo: MatchRepository,
    teamRepo?: TeamRepository,
    groupRepo?: GroupRepository,
  ) =>
  async (eventId: string, updatedMatchId: string): Promise<{ hasTie: boolean }> => {
    const updatedMatch = await matchRepo.findById(updatedMatchId);
    if (!updatedMatch) return { hasTie: false };

    // --- 1. ブラケット（トーナメント）の次ラウンド解決（finished のみ）---
    if (
      updatedMatch.status === "finished" &&
      updatedMatch.scoreA !== null &&
      updatedMatch.scoreB !== null &&
      updatedMatch.scoreA !== updatedMatch.scoreB
    ) {
      const winnerId =
        updatedMatch.scoreA > updatedMatch.scoreB
          ? updatedMatch.teamAId
          : updatedMatch.teamBId;
      const loserId =
        updatedMatch.scoreA > updatedMatch.scoreB
          ? updatedMatch.teamBId
          : updatedMatch.teamAId;

      const brackets = await bracketRepo.findAll(eventId);
      const referencing = brackets.filter(
        (b) =>
          (b.homeRef?.type === "match-result" && b.homeRef.matchId === updatedMatchId) ||
          (b.awayRef?.type === "match-result" && b.awayRef.matchId === updatedMatchId),
      );

      for (const bracket of referencing) {
        const match = await matchRepo.findById(bracket.matchId);
        if (!match) continue;

        let teamAId = match.teamAId;
        let teamBId = match.teamBId;
        let changed = false;

        if (
          bracket.homeRef?.type === "match-result" &&
          bracket.homeRef.matchId === updatedMatchId
        ) {
          const resolved = bracket.homeRef.result === "winner" ? winnerId : loserId;
          if (resolved && teamAId !== resolved) {
            teamAId = resolved;
            changed = true;
          }
        }

        if (
          bracket.awayRef?.type === "match-result" &&
          bracket.awayRef.matchId === updatedMatchId
        ) {
          const resolved = bracket.awayRef.result === "winner" ? winnerId : loserId;
          if (resolved && teamBId !== resolved) {
            teamBId = resolved;
            changed = true;
          }
        }

        if (changed) {
          await matchRepo.save({ ...match, teamAId, teamBId });
        }
      }
    }

    // --- 2. カスタムリーグの group-rank 参照解決 ---
    if (!teamRepo || !groupRepo) return { hasTie: false };
    // 予選リーグ試合のみ処理
    if (updatedMatch.type !== "league" || !updatedMatch.groupId) return { hasTie: false };

    const groupId = updatedMatch.groupId;

    // グループの全試合を取得
    const groupMatches = await matchRepo.findByGroupId(groupId);
    const allFinished = groupMatches.length > 0 && groupMatches.every((m) => m.status === "finished");

    // カスタムリーグの試合でこのグループの group-rank 参照を持つものを取得
    const allMatches = await matchRepo.findAll(eventId);
    const customLeagueMatches = allMatches.filter((m) => m.type === "custom-league");

    if (allFinished) {
      // 全試合完了 → 順位を計算してチームIDを解決
      const allTeams = await teamRepo.findAll(eventId);
      const standings = computeStandings(groupMatches, allTeams, groupId);

      // 同率かどうかを順位ごとに判定するヘルパー
      function isTiedRank(rank: number): boolean {
        const target = standings[rank - 1];
        if (!target) return false;
        return standings.some(
          (r, i) =>
            i !== rank - 1 &&
            r.points === target.points &&
            r.goalDifference === target.goalDifference &&
            r.goalsFor === target.goalsFor,
        );
      }

      let hasTie = false;

      for (const clMatch of customLeagueMatches) {
        let teamAId = clMatch.teamAId;
        let teamBId = clMatch.teamBId;
        let changed = false;

        if (clMatch.teamARefLabel) {
          const parsed = parseGroupRankRef(clMatch.teamARefLabel);
          if (parsed && parsed.groupId === groupId) {
            if (isTiedRank(parsed.rank)) {
              hasTie = true;
              if (teamAId !== null) { teamAId = null; changed = true; }
            } else {
              const resolved = standings[parsed.rank - 1]?.teamId ?? null;
              if (teamAId !== resolved) { teamAId = resolved; changed = true; }
            }
          }
        }

        if (clMatch.teamBRefLabel) {
          const parsed = parseGroupRankRef(clMatch.teamBRefLabel);
          if (parsed && parsed.groupId === groupId) {
            if (isTiedRank(parsed.rank)) {
              hasTie = true;
              if (teamBId !== null) { teamBId = null; changed = true; }
            } else {
              const resolved = standings[parsed.rank - 1]?.teamId ?? null;
              if (teamBId !== resolved) { teamBId = resolved; changed = true; }
            }
          }
        }

        if (changed) {
          await matchRepo.save({ ...clMatch, teamAId, teamBId });
        }
      }

      return { hasTie };
    } else {
      // 未完了試合あり → このグループの参照を null に戻す
      for (const clMatch of customLeagueMatches) {
        let teamAId = clMatch.teamAId;
        let teamBId = clMatch.teamBId;
        let changed = false;

        if (clMatch.teamARefLabel) {
          const parsed = parseGroupRankRef(clMatch.teamARefLabel);
          if (parsed && parsed.groupId === groupId && teamAId !== null) {
            teamAId = null; changed = true;
          }
        }

        if (clMatch.teamBRefLabel) {
          const parsed = parseGroupRankRef(clMatch.teamBRefLabel);
          if (parsed && parsed.groupId === groupId && teamBId !== null) {
            teamBId = null; changed = true;
          }
        }

        if (changed) {
          await matchRepo.save({ ...clMatch, teamAId, teamBId });
        }
      }
      return { hasTie: false };
    }

    return { hasTie: false };
  };
