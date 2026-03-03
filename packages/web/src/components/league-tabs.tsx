"use client";

import { useState } from "react";
import { useTeam } from "@/hooks/use-team";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeagueCrossTable } from "@/components/league-cross-table";
import type { StandingsRow } from "@/server/domain/services/standings-service";
import type { Team } from "@/server/domain/entities/team";
import type { Match } from "@/server/domain/entities/match";

interface Props {
  standings: Record<string, StandingsRow[]>;
  groupNames: Record<string, string>;
  teams: Team[];
  matches: Match[];
}

export function LeagueTabs({ standings, groupNames, teams, matches }: Props) {
  const { selectedTeamId } = useTeam();
  const groupIds = Object.keys(standings).sort();
  const [tab, setTab] = useState(groupIds[0] ?? "");

  if (groupIds.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        データがありません
      </p>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full">
        {groupIds.map((gId) => (
          <TabsTrigger key={gId} value={gId} className="flex-1">
            {groupNames[gId] ?? gId}
          </TabsTrigger>
        ))}
      </TabsList>
      {groupIds.map((gId) => (
        <TabsContent key={gId} value={gId} className="mt-3 space-y-4">
          <div className="overflow-x-auto rounded-md border">
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
                {(standings[gId] ?? []).map((row, i) => (
                  <TableRow
                    key={row.teamId}
                    className={
                      row.teamId === selectedTeamId
                        ? "bg-primary/10 font-semibold"
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
                    <TableCell className="text-center">{row.played}</TableCell>
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
          <div className="overflow-x-auto rounded-md border">
            <LeagueCrossTable
              teams={teams.filter((t) => t.groupId === gId)}
              matches={matches.filter(
                (m) => m.type === "league" && m.groupId === gId,
              )}
              highlightTeamId={selectedTeamId}
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
