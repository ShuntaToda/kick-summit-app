export const dynamic = "force-dynamic";

import { getTournamentData } from "@/server/application/get-tournament-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Refresher } from "@/components/refresher";
import type { Match } from "@/server/domain/entities/match";
import type { Team } from "@/server/domain/entities/team";
import type { TournamentBracket } from "@/server/domain/entities/bracket";

function roundLabel(round: number, totalRounds: number) {
  if (round === totalRounds) return "決勝";
  if (round === totalRounds - 1) return "準決勝";
  return `ラウンド${round}`;
}

function groupByRound(brackets: TournamentBracket[]) {
  const map = new Map<number, TournamentBracket[]>();
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

function BracketMatch({
  match,
  teamMap,
}: {
  match: Match;
  teamMap: Map<string, Team>;
}) {
  const teamAName = teamMap.get(match.teamAId)?.name ?? "TBD";
  const teamBName = teamMap.get(match.teamBId)?.name ?? "TBD";

  return (
    <Card>
      <CardContent className="py-3">
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
              {new Date(match.scheduledTime).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function TournamentPage() {
  const { brackets, matches, teams } = await getTournamentData();

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const matchMap = new Map(matches.map((m) => [m.id, m]));
  const rounds = groupByRound(brackets);

  if (brackets.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">トーナメント表</h1>
        <p className="py-8 text-center text-muted-foreground">
          トーナメントデータがありません
        </p>
      </div>
    );
  }

  const totalRounds = rounds.length;

  return (
    <div className="space-y-6">
      <Refresher />
      <h1 className="text-xl font-bold">トーナメント表</h1>

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
                match={match}
                teamMap={teamMap}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
