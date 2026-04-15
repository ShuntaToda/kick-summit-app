"use client";

import { useMemo } from "react";
import type { Team } from "@/server/domain/entities/team";
import type { Match, MatchType } from "@/server/domain/entities/match";

interface Props {
  teams: Team[];
  matches: Match[];
  highlightTeamId?: string | null;
  matchType?: MatchType;
}

type CellResult =
  | {
      symbol: "○" | "×" | "△";
      score: string;
    }
  | {
      symbol: "--";
    }
  | null;

function getResult(
  teamId: string,
  opponentId: string,
  matchMap: Map<string, Match>,
): CellResult {
  const key1 = `${teamId}-${opponentId}`;
  const key2 = `${opponentId}-${teamId}`;
  const match = matchMap.get(key1) || matchMap.get(key2);
  if (!match) return null;

  if (match.status !== "finished") {
    return { symbol: "--" };
  }

  const isTeamA = match.teamAId === teamId;
  const myScore = isTeamA ? (match.scoreA ?? 0) : (match.scoreB ?? 0);
  const oppScore = isTeamA ? (match.scoreB ?? 0) : (match.scoreA ?? 0);

  let symbol: "○" | "×" | "△";
  if (myScore > oppScore) symbol = "○";
  else if (myScore < oppScore) symbol = "×";
  else symbol = "△";

  return { symbol, score: `${myScore} - ${oppScore}` };
}

export function LeagueCrossTable({
  teams,
  matches,
  highlightTeamId,
  matchType = "league",
}: Props) {
  const matchMap = useMemo(() => {
    const map = new Map<string, Match>();
    for (const m of matches) {
      if (m.type !== matchType || !m.teamAId || !m.teamBId) continue;
      map.set(`${m.teamAId}-${m.teamBId}`, m);
    }
    return map;
  }, [matches, matchType]);

  if (teams.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border p-1.5 bg-muted text-left" />
            {teams.map((t) => (
              <th
                key={t.id}
                className={`border p-1.5 bg-muted text-center whitespace-nowrap ${
                  t.id === highlightTeamId ? "bg-yellow-100" : ""
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((rowTeam) => (
            <tr
              key={rowTeam.id}
              className={rowTeam.id === highlightTeamId ? "bg-yellow-100" : ""}
            >
              <td className="border p-1.5 font-medium whitespace-nowrap bg-muted">
                <div className="flex items-center gap-1">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: rowTeam.color }}
                  />
                  {rowTeam.name}
                </div>
              </td>
              {teams.map((colTeam) => {
                if (rowTeam.id === colTeam.id) {
                  return (
                    <td key={colTeam.id} className="border p-1.5 bg-muted/50" />
                  );
                }
                const result = getResult(rowTeam.id, colTeam.id, matchMap);
                if (!result) {
                  return (
                    <td key={colTeam.id} className="border p-1.5 text-center" />
                  );
                }
                if (result.symbol === "--") {
                  return (
                    <td
                      key={colTeam.id}
                      className="border p-1.5 text-center text-muted-foreground"
                    >
                      <div>--</div>
                    </td>
                  );
                }
                return (
                  <td key={colTeam.id} className="border p-1.5 text-center">
                    <div
                      className={
                        result.symbol === "○"
                          ? "text-blue-600"
                          : result.symbol === "×"
                            ? "text-destructive"
                            : "text-green-600"
                      }
                    >
                      {result.symbol}
                    </div>
                    <div>{result.score}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
