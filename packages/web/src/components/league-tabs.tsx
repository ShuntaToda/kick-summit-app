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
import type { CustomLeague } from "@/server/domain/entities/custom-league";

interface Props {
  standings: Record<string, StandingsRow[]>;
  groupNames: Record<string, string>;
  teams: Team[];
  matches: Match[];
  customLeagues: CustomLeague[];
  customLeagueStandings: Record<string, StandingsRow[]>;
}

function StandingsTable({
  rows,
  selectedTeamId,
}: {
  rows: StandingsRow[];
  selectedTeamId: string | null;
}) {
  return (
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
            <TableHead className="w-10 text-center font-bold">勝点</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={row.teamId}
              className={row.teamId === selectedTeamId ? "bg-yellow-100 font-semibold" : ""}
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
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </TableCell>
              <TableCell className="text-center font-bold">{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function LeagueTabs({ standings, groupNames, teams, matches, customLeagues, customLeagueStandings }: Props) {
  const { selectedTeamId } = useTeam();
  const groupIds = Object.keys(standings).sort();
  const allTabIds = [
    ...groupIds,
    ...customLeagues.map((cl) => `cl-${cl.id}`),
  ];
  const [tab, setTab] = useState(allTabIds[0] ?? "");

  if (allTabIds.length === 0) {
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
        {customLeagues.map((cl) => (
          <TabsTrigger key={`cl-${cl.id}`} value={`cl-${cl.id}`} className="flex-1">
            {cl.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {groupIds.map((gId) => (
        <TabsContent key={gId} value={gId} className="mt-3 space-y-4">
          <StandingsTable rows={standings[gId] ?? []} selectedTeamId={selectedTeamId} />
          <div className="overflow-x-auto rounded-md border">
            <LeagueCrossTable
              teams={teams.filter((t) => t.groupId === gId)}
              matches={matches.filter((m) => m.type === "league" && m.groupId === gId)}
              highlightTeamId={selectedTeamId}
            />
          </div>
        </TabsContent>
      ))}

      {customLeagues.map((cl) => {
        const clMatches = matches.filter(
          (m) => m.type === "custom-league" && m.customLeagueId === cl.id,
        );
        const clTeamIds = new Set<string>();
        clMatches.forEach((m) => {
          if (m.teamAId) clTeamIds.add(m.teamAId);
          if (m.teamBId) clTeamIds.add(m.teamBId);
        });
        const clTeams = teams.filter((t) => clTeamIds.has(t.id));
        return (
          <TabsContent key={`cl-${cl.id}`} value={`cl-${cl.id}`} className="mt-3 space-y-4">
            <StandingsTable
              rows={customLeagueStandings[cl.id] ?? []}
              selectedTeamId={selectedTeamId}
            />
            <div className="overflow-x-auto rounded-md border">
              <LeagueCrossTable
                teams={clTeams}
                matches={clMatches}
                highlightTeamId={selectedTeamId}
                matchType="custom-league"
              />
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
