export const dynamic = "force-dynamic";

import { getTeams } from "@/server/application/get-teams";
import { getMatches } from "@/server/application/get-matches";
import { Refresher } from "@/components/refresher";
import { TimetableTabs } from "@/components/timetable-tabs";
import { MatchStatusButton } from "@/components/match-status-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/server/domain/entities/match";

const STATUS_LABEL = {
  scheduled: "予定",
  ongoing: "進行中",
  finished: "終了",
} as const;

const STATUS_VARIANT = {
  scheduled: "outline",
  ongoing: "destructive",
  finished: "secondary",
} as const;

function MatchRow({
  match,
  teamName,
}: {
  match: Match;
  teamName: (id: string) => string;
}) {
  const isNear =
    Math.abs(new Date(match.scheduledTime).getTime() - Date.now()) <
    30 * 60 * 1000;

  return (
    <Card
      className={
        isNear && match.status !== "finished" ? "border-primary" : ""
      }
    >
      <CardContent className="flex items-center gap-3 py-3">
        <div className="w-14 shrink-0 text-center text-sm text-muted-foreground">
          {new Date(match.scheduledTime).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm font-medium">
            <span className="truncate">{teamName(match.teamAId)}</span>
            {match.status === "finished" ? (
              <span className="shrink-0 px-1">
                {match.scoreA} - {match.scoreB}
              </span>
            ) : (
              <span className="shrink-0 px-1 text-muted-foreground">vs</span>
            )}
            <span className="truncate">{teamName(match.teamBId)}</span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {match.court}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant={STATUS_VARIANT[match.status]}>
            {STATUS_LABEL[match.status]}
          </Badge>
          <MatchStatusButton matchId={match.id} status={match.status} />
        </div>
      </CardContent>
    </Card>
  );
}

function MatchList({
  matches,
  teamName,
}: {
  matches: Match[];
  teamName: (id: string) => string;
}) {
  if (matches.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        試合データがありません
      </p>
    );
  }
  return (
    <>
      {matches.map((m) => (
        <MatchRow key={m.id} match={m} teamName={teamName} />
      ))}
    </>
  );
}

export default async function TimetablePage() {
  const [teams, matches] = await Promise.all([getTeams(), getMatches()]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const teamName = (id: string) => teamMap.get(id)?.name ?? id;

  const leagueMatches = matches
    .filter((m) => m.type === "league")
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const tournamentMatches = matches
    .filter((m) => m.type === "tournament")
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  return (
    <div className="space-y-4">
      <Refresher />
      <h1 className="text-xl font-bold">タイムテーブル</h1>
      <TimetableTabs
        leagueContent={
          <MatchList matches={leagueMatches} teamName={teamName} />
        }
        tournamentContent={
          <MatchList matches={tournamentMatches} teamName={teamName} />
        }
      />
    </div>
  );
}
