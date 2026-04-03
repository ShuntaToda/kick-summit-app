import { nanoid } from "nanoid";
import type { BracketRepository, TeamRef } from "../../domain/entities/bracket";
import type { MatchRepository, MatchStatus } from "../../domain/entities/match";

type SaveBracketInput = {
  id?: string;
  eventId: string;
  bracketName: string;
  round: number;
  slot: number;
  matchLabel?: string;
  homeRef: TeamRef | null;
  awayRef: TeamRef | null;
  matchId?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  court?: string;
};

function resolveTeamId(
  ref: TeamRef | null,
  matchMap: Map<string, { teamAId: string | null; teamBId: string | null; scoreA: number | null; scoreB: number | null; status: string }>,
): string | null {
  if (!ref) return null;
  if (ref.type === "team") return ref.teamId;
  if (ref.type === "group-rank") return null; // グループ順位は表示用。確定後に手動でチーム指定に変更
  // match-result: 参照先が finished なら勝者/敗者を返す
  const m = matchMap.get(ref.matchId);
  if (!m || m.status !== "finished") return null;
  if (m.scoreA === null || m.scoreB === null || m.scoreA === m.scoreB) return null;
  if (ref.result === "winner") {
    return m.scoreA > m.scoreB ? m.teamAId : m.teamBId;
  }
  return m.scoreA > m.scoreB ? m.teamBId : m.teamAId;
}

export const createSaveBracket =
  (bracketRepo: BracketRepository, matchRepo: MatchRepository) =>
  async (input: SaveBracketInput): Promise<void> => {
    const bracketId = input.id ?? nanoid();
    const matchId = input.matchId ?? nanoid();

    const existing = input.matchId
      ? await matchRepo.findById(input.matchId)
      : null;

    // match-result 参照を解決するために関連試合を取得
    const refsToResolve = [input.homeRef, input.awayRef].filter(
      (r): r is TeamRef & { type: "match-result" } => r?.type === "match-result",
    );
    const refMatchMap = new Map<string, { teamAId: string | null; teamBId: string | null; scoreA: number | null; scoreB: number | null; status: string }>();
    if (refsToResolve.length > 0) {
      const refMatches = await Promise.all(
        refsToResolve.map((r) => matchRepo.findById(r.matchId)),
      );
      for (const m of refMatches) {
        if (m) refMatchMap.set(m.id, m);
      }
    }

    const teamAId = resolveTeamId(input.homeRef, refMatchMap);
    const teamBId = resolveTeamId(input.awayRef, refMatchMap);

    await matchRepo.save({
      id: matchId,
      eventId: input.eventId,
      type: "tournament",
      groupId: null,
      teamAId,
      teamBId,
      scoreA: existing?.scoreA ?? null,
      scoreB: existing?.scoreB ?? null,
      halfScoreA: existing?.halfScoreA ?? null,
      halfScoreB: existing?.halfScoreB ?? null,
      scheduledTime: input.scheduledTime || existing?.scheduledTime || "00:00",
      durationMinutes: input.durationMinutes ?? existing?.durationMinutes ?? 10,
      court: input.court ?? existing?.court ?? "A",
      status: existing?.status ?? ("scheduled" as MatchStatus),
      refereeTeamId: existing?.refereeTeamId ?? null,
    });

    await bracketRepo.save({
      id: bracketId,
      eventId: input.eventId,
      bracketName: input.bracketName,
      round: input.round,
      slot: input.slot,
      matchId,
      matchLabel: input.matchLabel ?? "",
      homeRef: input.homeRef,
      awayRef: input.awayRef,
    });
  };
