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
import type { StandingsRow } from "@/server/domain/services/standings-service";

interface Props {
  standings: Record<string, StandingsRow[]>;
}

export function LeagueTabs({ standings }: Props) {
  const { selectedTeamId } = useTeam();
  const groups = Object.keys(standings).sort();
  const [tab, setTab] = useState(groups[0] ?? "");

  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        データがありません
      </p>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full">
        {groups.map((g) => (
          <TabsTrigger key={g} value={g} className="flex-1">
            グループ{g}
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((g) => (
        <TabsContent key={g} value={g} className="mt-3">
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
                {(standings[g] ?? []).map((row, i) => (
                  <TableRow
                    key={row.teamId}
                    className={
                      row.teamId === selectedTeamId
                        ? "bg-primary/10 font-semibold"
                        : ""
                    }
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{row.teamName}</TableCell>
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
        </TabsContent>
      ))}
    </Tabs>
  );
}
