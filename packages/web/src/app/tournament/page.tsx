export const dynamic = "force-dynamic";

import { Suspense } from "react";
import * as container from "@/server/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Refresher } from "@/components/shared/refresher";
import { CardSkeleton } from "@/components/shared/section-skeleton";
import type { Match } from "@/server/domain/entities/match";
import type { Team } from "@/server/domain/entities/team";
import type { Bracket } from "@/server/domain/entities/bracket";

function roundLabel(round: number, totalRounds: number) {
  if (round === totalRounds) return "決勝";
  if (round === totalRounds - 1) return "準決勝";
  return `ラウンド${round}`;
}

function groupByRound(brackets: Bracket[]) {
  const map = new Map<number, Bracket[]>();
  for (const b of brackets) {
    const list = map.get(b.round) ?? [];
    list.push(b);
    map.set(b.round, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, slots]) => ({
      round,
      slots: slots.sort((a, b) => a.slot - b.slot),
    }));
}

function getTeamDisplayName(
  teamId: string | null,
  ref: Bracket["homeRef"] | Bracket["awayRef"],
  teamMap: Map<string, Team>,
  bracketByMatchId: Map<string, Bracket>,
  groupMap: Map<string, { name: string }>,
): string {
  if (teamId) {
    return teamMap.get(teamId)?.name ?? "TBD";
  }
  if (!ref) return "TBD";
  if (ref.type === "team") {
    return teamMap.get(ref.teamId)?.name ?? "TBD";
  }
  if (ref.type === "group-rank") {
    const group = groupMap.get(ref.groupId);
    return `${group?.name ?? "?"}${ref.rank}位`;
  }
  const bracket = bracketByMatchId.get(ref.matchId);
  const label = bracket?.matchLabel || "不明な試合";
  return ref.result === "winner" ? `${label}の勝者` : `${label}の敗者`;
}

function BracketMatch({
  bracket,
  match,
  teamMap,
  bracketByMatchId,
  groupMap,
}: {
  bracket: Bracket;
  match: Match;
  teamMap: Map<string, Team>;
  bracketByMatchId: Map<string, Bracket>;
  groupMap: Map<string, { name: string }>;
}) {
  const teamAName = getTeamDisplayName(match.teamAId, bracket.homeRef, teamMap, bracketByMatchId, groupMap);
  const teamBName = getTeamDisplayName(match.teamBId, bracket.awayRef, teamMap, bracketByMatchId, groupMap);

  return (
    <Card>
      <CardContent className="py-3">
        {bracket.matchLabel && (
          <div className="mb-1 text-xs text-muted-foreground">
            {bracket.matchLabel}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">{teamAName}</div>
            <div className="text-sm font-medium">{teamBName}</div>
          </div>
          {match.status === "finished" ? (
            <div className="space-y-1 text-right">
              <div
                className={`text-sm ${
                  (match.scoreA ?? 0) > (match.scoreB ?? 0)
                    ? "font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {match.scoreA}
              </div>
              <div
                className={`text-sm ${
                  (match.scoreB ?? 0) > (match.scoreA ?? 0)
                    ? "font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {match.scoreB}
              </div>
            </div>
          ) : (
            <Badge variant="outline">
              {match.scheduledTime && !isNaN(new Date(match.scheduledTime).getTime()) ? (
                <>
                  {new Date(match.scheduledTime).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" - "}
                  {new Date(new Date(match.scheduledTime).getTime() + match.durationMinutes * 60 * 1000).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              ) : "未定"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type PageProps = { searchParams: Promise<{ id?: string }> };

async function TournamentData({ eventId }: { eventId: string }) {
  const [tournamentData, groups] = await Promise.all([
    container.getEventTournamentData(eventId),
    container.getGroups(eventId),
  ]);
  const { brackets, matches, teams } = tournamentData;

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const matchMap = new Map(matches.map((m) => [m.id, m]));
  const bracketByMatchId = new Map(brackets.map((b) => [b.matchId, b]));
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const rounds = groupByRound(brackets);

  if (brackets.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        トーナメントデータがありません
      </p>
    );
  }

  const totalRounds = rounds.length;

  return (
    <div className="space-y-4">
      {rounds.map(({ round, slots }) => (
        <div key={round} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {roundLabel(round, totalRounds)}
          </h2>
          {slots.map((bracket) => {
            const match = matchMap.get(bracket.matchId);
            if (!match) return null;
            return (
              <BracketMatch
                key={bracket.id}
                bracket={bracket}
                match={match}
                teamMap={teamMap}
                bracketByMatchId={bracketByMatchId}
                groupMap={groupMap}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default async function TournamentPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";

  return (
    <div className="space-y-6">
      <Refresher />
      <h1 className="text-xl font-bold">トーナメント表</h1>
      <Suspense fallback={<CardSkeleton count={4} />}>
        <TournamentData eventId={eventId} />
      </Suspense>
    </div>
  );
}
