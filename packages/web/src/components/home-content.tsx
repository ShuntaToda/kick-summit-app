"use client";

import { useMemo } from "react";
import { useTeam } from "@/hooks/use-team";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { TeamHeader } from "@/components/team-header";
import type { Team } from "@/server/domain/entities/team";
import type { Match } from "@/server/domain/entities/match";
import type { StandingsRow } from "@/server/domain/services/standings-service";

interface Props {
  teams: Team[];
  matches: Match[];
  standings: Record<string, StandingsRow[]>;
}

export function HomeContent({ teams, matches, standings }: Props) {
  const { selectedTeamId } = useTeam();

  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );

  const myTeam = selectedTeamId ? teamMap.get(selectedTeamId) : undefined;

  const nextMatch = useMemo(() => {
    if (!selectedTeamId) return null;
    return (
      matches
        .filter(
          (m) =>
            m.status !== "finished" &&
            (m.teamAId === selectedTeamId || m.teamBId === selectedTeamId)
        )
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0] ??
      null
    );
  }, [matches, selectedTeamId]);

  const lastResult = useMemo(() => {
    if (!selectedTeamId) return null;
    return (
      matches
        .filter(
          (m) =>
            m.status === "finished" &&
            (m.teamAId === selectedTeamId || m.teamBId === selectedTeamId)
        )
        .sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime))[0] ??
      null
    );
  }, [matches, selectedTeamId]);

  const groupStandings = myTeam?.group
    ? standings[myTeam.group] ?? []
    : [];

  function teamName(id: string) {
    return teamMap.get(id)?.name ?? id;
  }

  return (
    <div className="space-y-4">
      <TeamHeader teams={teams} />

      {/* 次の試合 */}
      {nextMatch && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              次の試合
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {new Date(nextMatch.scheduledTime).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              {nextMatch.court}
            </div>
            <div className="flex items-center justify-center gap-4 text-lg font-bold">
              <span>{teamName(nextMatch.teamAId)}</span>
              <span className="text-muted-foreground">vs</span>
              <span>{teamName(nextMatch.teamBId)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Badge variant="outline">
                {nextMatch.type === "league"
                  ? `予選 グループ${nextMatch.group}`
                  : "決勝トーナメント"}
              </Badge>
              {nextMatch.status === "scheduled" && (
                <Countdown targetTime={nextMatch.scheduledTime} />
              )}
              {nextMatch.status === "ongoing" && (
                <Badge variant="destructive">試合中</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!nextMatch && selectedTeamId && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            全試合終了
          </CardContent>
        </Card>
      )}

      {/* 直近の結果 */}
      {lastResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              直近の結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4 text-lg font-bold">
              <span>{teamName(lastResult.teamAId)}</span>
              <span>
                {lastResult.scoreA} - {lastResult.scoreB}
              </span>
              <span>{teamName(lastResult.teamBId)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* グループ内順位 */}
      {groupStandings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              グループ{myTeam?.group} 順位
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {groupStandings.map((row, i) => (
              <div
                key={row.teamId}
                className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm ${
                  row.teamId === selectedTeamId
                    ? "bg-primary/10 font-semibold"
                    : ""
                }`}
              >
                <span>
                  {i + 1}位 {row.teamName}
                </span>
                <span className="text-muted-foreground">
                  勝点{row.points}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
