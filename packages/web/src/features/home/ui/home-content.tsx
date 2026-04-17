"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Palette, ChevronRight } from "lucide-react";
import { useTeam } from "@/hooks/use-team";
import { getNow, onNowChange } from "@/lib/now";
import { getMatchState } from "@/features/match/usecases/match-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TeamHeader } from "@/features/team/ui/team-header";
import { LeagueCrossTable } from "@/features/league/ui/league-cross-table";
import { decodeRefLabel } from "@/components/utils/ref-label";
import type { Team } from "@/server/domain/entities/team";
import type { Match } from "@/server/domain/entities/match";
import type { Group } from "@/server/domain/entities/group";
import type { CustomLeague } from "@/server/domain/entities/custom-league";
import type { StandingsRow } from "@/server/domain/services/standings-service";

interface Props {
  teams: Team[];
  matches: Match[];
  standings: Record<string, StandingsRow[]>;
  groups: Group[];
  customLeagues: CustomLeague[];
  eventId: string;
}


export function HomeContent({
  teams,
  matches,
  standings,
  groups,
  customLeagues,
  eventId,
}: Props) {
  const { selectedTeamId, selectTeam, clearTeam } = useTeam();
  const [now, setNow] = useState(getNow());

  useEffect(() => {
    if (selectedTeamId && !teams.some((t) => t.id === selectedTeamId)) {
      clearTeam();
    }
  }, [selectedTeamId, teams, clearTeam]);

  useEffect(() => {
    const id = setInterval(() => setNow(getNow()), 30_000);
    const unsub = onNowChange(() => setNow(getNow()));
    return () => { clearInterval(id); unsub(); };
  }, []);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const groupNameMap = useMemo(
    () => new Map(groups.map((g) => [g.id, g.name])),
    [groups],
  );

  const customLeagueMap = useMemo(
    () => new Map(customLeagues.map((cl) => [cl.id, cl.name])),
    [customLeagues],
  );

  const myTeam = selectedTeamId ? teamMap.get(selectedTeamId) : undefined;

  const upcomingMatches = useMemo(() => {
    if (!selectedTeamId) return [];
    return matches
      .filter((m) => {
        if (m.status === "finished") return false;
        return (
          m.teamAId === selectedTeamId ||
          m.teamBId === selectedTeamId ||
          m.refereeTeamId === selectedTeamId ||
          m.refereeTeamId2 === selectedTeamId
        );
      })
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [matches, selectedTeamId]);

  const groupStandings = myTeam?.groupId ? (standings[myTeam.groupId] ?? []) : [];

  const groupTeams = useMemo(() => {
    if (!myTeam?.groupId) return [];
    return teams.filter((t) => t.groupId === myTeam.groupId);
  }, [teams, myTeam?.groupId]);

  const groupMatches = useMemo(() => {
    if (!myTeam?.groupId) return [];
    return matches.filter(
      (m) => m.type === "league" && m.groupId === myTeam.groupId,
    );
  }, [matches, myTeam?.groupId]);

  function teamName(id: string | null) {
    if (!id) return "TBD";
    return teamMap.get(id)?.name ?? id;
  }

  function teamColor(id: string | null) {
    if (!id) return "#888";
    return teamMap.get(id)?.color ?? "#888";
  }


  function TeamLabel({
    id,
    refLabel,
  }: {
    id: string | null;
    refLabel?: string | null;
  }) {
    const info = id ? teamMap.get(id) : null;
    if (refLabel) {
      return (
        <div className="text-center">
          <span className="text-xs text-muted-foreground italic">
            {decodeRefLabel(refLabel, groupNameMap)}
          </span>
          {info && (
            <div>
              <span
                className="inline-block border-b-2 pb-0.5 text-sm font-medium"
                style={{ borderColor: info.color }}
              >
                {info.name}
              </span>
            </div>
          )}
        </div>
      );
    }
    const color = teamColor(id);
    const name = teamName(id);
    return (
      <div className="text-center">
        <span
          className="inline-block border-b-2 pb-0.5 text-sm font-medium"
          style={{ borderColor: color }}
        >
          {name}
        </span>
      </div>
    );
  }

  function groupName(groupId: string | null) {
    if (!groupId) return "";
    return groupNameMap.get(groupId) ?? groupId;
  }

  if (!selectedTeamId) {
    return null;
  }

  return (
    <div className="space-y-4">
      <TeamHeader teams={teams} />

      {/* 直近の試合 */}
      {upcomingMatches.length > 0 && (
        <Card className="gap-2 py-3">
          <CardHeader className="pb-0 ps-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              直近の試合
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[560px] overflow-y-auto space-y-4">
            {upcomingMatches.map((match, idx) => {
              const isRefereeOnly =
                (match.refereeTeamId === selectedTeamId ||
                  match.refereeTeamId2 === selectedTeamId) &&
                match.teamAId !== selectedTeamId &&
                match.teamBId !== selectedTeamId;
              const isOngoing = getMatchState(match, now) === "playing";
              return (
                <div key={match.id} className={idx > 0 ? "border-t pt-4" : ""}>
                  <div
                    className={`space-y-2 ${
                      isOngoing
                        ? "rounded-lg border-2 border-primary p-3"
                        : isRefereeOnly
                          ? "rounded-lg border border-dashed bg-muted p-3"
                          : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {match.scheduledTime &&
                          !isNaN(new Date(match.scheduledTime).getTime()) && (
                            <span>
                              {new Date(match.scheduledTime).toLocaleTimeString(
                                "ja-JP",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                              {" - "}
                              {new Date(
                                new Date(match.scheduledTime).getTime() +
                                  match.durationMinutes * 60 * 1000,
                              ).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        {match.court && (
                          <span className={match.scheduledTime ? " ml-1.5" : ""}>
                            {match.court}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isOngoing && (
                          <Badge
                            variant="destructive"
                            className="rounded-sm text-[10px] px-1.5 py-0"
                          >
                            試合中
                          </Badge>
                        )}
                        {isRefereeOnly && !isOngoing && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            審判担当
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {match.type === "league"
                            ? groupName(match.groupId)
                            : match.type === "custom-league" && match.customLeagueId
                              ? (customLeagueMap.get(match.customLeagueId) ?? "カスタムリーグ")
                              : "決勝トーナメント"}
                        </Badge>
                      </div>
                    </div>
                    <div className={isRefereeOnly ? "opacity-60" : ""}>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <TeamLabel
                          id={match.teamAId}
                          refLabel={match.teamARefLabel}
                        />
                        <span className="text-xs text-muted-foreground">
                          vs
                        </span>
                        <TeamLabel
                          id={match.teamBId}
                          refLabel={match.teamBRefLabel}
                        />
                      </div>
                      {(match.refereeTeamId || match.refereeTeamId2) &&
                        !isRefereeOnly && (
                          <div className="mt-1 text-center text-xs text-muted-foreground">
                            審判:{" "}
                            {match.refereeTeamId
                              ? teamName(match.refereeTeamId)
                              : ""}
                            {match.refereeTeamId2
                              ? ` / ${teamName(match.refereeTeamId2)}`
                              : ""}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {upcomingMatches.length === 0 && selectedTeamId && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            全試合終了
          </CardContent>
        </Card>
      )}

      {/* グループリーグ表 */}
      {groupStandings.length > 0 && (
        <Card className="gap-2 py-3">
          <CardHeader className="pb-0 ps-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              {groupName(myTeam?.groupId ?? null)} リーグ表
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>チーム</TableHead>
                    <TableHead className="w-8 text-center">試</TableHead>
                    <TableHead className="w-8 text-center">勝</TableHead>
                    <TableHead className="w-8 text-center">分</TableHead>
                    <TableHead className="w-8 text-center">負</TableHead>
                    <TableHead className="w-10 text-center">得失</TableHead>
                    <TableHead className="w-10 text-center font-bold">
                      勝点
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupStandings.map((row, i) => (
                    <TableRow
                      key={row.teamId}
                      className={
                        row.teamId === selectedTeamId
                          ? "bg-yellow-100 font-semibold"
                          : ""
                      }
                    >
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="inline-block h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: row.teamColor }}
                          />
                          {row.teamName}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {row.played}
                      </TableCell>
                      <TableCell className="text-center">{row.won}</TableCell>
                      <TableCell className="text-center">{row.drawn}</TableCell>
                      <TableCell className="text-center">{row.lost}</TableCell>
                      <TableCell className="text-center">
                        {row.goalDifference > 0
                          ? `+${row.goalDifference}`
                          : row.goalDifference}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {row.points}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 対戦表 */}
      {groupTeams.length > 1 && (
        <Card className="gap-2 py-3">
          <CardHeader className="pb-0 ps-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              {groupName(myTeam?.groupId ?? null)} 対戦表
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <LeagueCrossTable
              teams={groupTeams}
              matches={groupMatches}
              highlightTeamId={selectedTeamId}
            />
          </CardContent>
        </Card>
      )}

      {/* チーム設定 */}
      <Link
        href={`/team-settings?${new URLSearchParams({
          ...(eventId !== "default" ? { id: eventId } : {}),
          teamId: selectedTeamId,
        }).toString()}`}
        className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">チーム設定</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
