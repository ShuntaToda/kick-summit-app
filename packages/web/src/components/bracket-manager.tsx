"use client";

import { useState, useEffect, useActionState, useMemo, useCallback } from "react";
import { Trash2, Plus, Edit2, X, Check } from "lucide-react";
import {
  saveBracketFormAction,
  deleteBracketAction,
  deleteAllBracketsAction,
  addBracketSlotAction,
} from "@/lib/actions/bracket";
import type { ActionState } from "@/lib/actions/helpers";
import type { Bracket, TeamRef } from "@/server/domain/entities/bracket";
import type { Match } from "@/server/domain/entities/match";
import type { Group } from "@/server/domain/entities/group";
import type { Team } from "@/server/domain/entities/team";
import type { Court } from "@/server/domain/entities/court";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

type Props = {
  brackets: Bracket[];
  matches: Match[];
  groups: Group[];
  teams: Team[];
  courts: Court[];
  eventId: string;
};

type EditState = {
  bracketId: string;
  homeRef: TeamRef | null;
  awayRef: TeamRef | null;
  scheduledTime: string;
  court: string;
  durationMinutes: number;
};

const init: ActionState = { success: false };

function getRefLabel(
  ref: TeamRef | null,
  teamMap: Map<string, Team>,
  bracketByMatchId: Map<string, Bracket>,
  groupMap: Map<string, Group>,
): string {
  if (!ref) return "TBD";
  if (ref.type === "team") {
    return teamMap.get(ref.teamId)?.name ?? "不明なチーム";
  }
  if (ref.type === "group-rank") {
    const group = groupMap.get(ref.groupId);
    return `${group?.name ?? "?"}${ref.rank}位`;
  }
  const bracket = bracketByMatchId.get(ref.matchId);
  const label = bracket?.matchLabel || "不明な試合";
  return ref.result === "winner" ? `${label}の勝者` : `${label}の敗者`;
}

function encodeRef(ref: TeamRef | null): string {
  if (!ref) return "none";
  if (ref.type === "team") return `team:${ref.teamId}`;
  if (ref.type === "group-rank") return `group-rank:${ref.groupId}:${ref.rank}`;
  return `match-result:${ref.matchId}:${ref.result}`;
}

function decodeRef(value: string): TeamRef | null {
  if (value === "none") return null;
  if (value.startsWith("team:")) {
    return { type: "team", teamId: value.slice(5) };
  }
  if (value.startsWith("group-rank:")) {
    const parts = value.slice(11);
    const lastColon = parts.lastIndexOf(":");
    const groupId = parts.slice(0, lastColon);
    const rank = Number(parts.slice(lastColon + 1));
    return { type: "group-rank", groupId, rank };
  }
  if (value.startsWith("match-result:")) {
    const parts = value.slice(13);
    const lastColon = parts.lastIndexOf(":");
    const matchId = parts.slice(0, lastColon);
    const result = parts.slice(lastColon + 1) as "winner" | "loser";
    return { type: "match-result", matchId, result };
  }
  return null;
}

export function BracketManager({ brackets, matches, groups, teams, courts, eventId }: Props) {
  const [editing, setEditing] = useState<EditState | null>(null);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups],
  );

  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    for (const t of teams) map.set(t.id, t);
    return map;
  }, [teams]);

  const matchMap = useMemo(() => {
    const map = new Map<string, Match>();
    for (const m of matches) map.set(m.id, m);
    return map;
  }, [matches]);

  const groupMap = useMemo(() => {
    const map = new Map<string, Group>();
    for (const g of groups) map.set(g.id, g);
    return map;
  }, [groups]);

  // matchId → Bracket のマップ（match-result のラベル参照用）
  const bracketByMatchId = useMemo(() => {
    const map = new Map<string, Bracket>();
    for (const b of brackets) map.set(b.matchId, b);
    return map;
  }, [brackets]);

  const bracketsByName = useMemo(() => {
    const map = new Map<string, Bracket[]>();
    for (const b of brackets) {
      const list = map.get(b.bracketName) ?? [];
      list.push(b);
      map.set(b.bracketName, list);
    }
    return map;
  }, [brackets]);

  const bracketNames = useMemo(
    () => [...bracketsByName.keys()].sort(),
    [bracketsByName],
  );

  if (brackets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ブラケット表示・編集</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            トーナメントブラケットがありません。上の生成から作成してください。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bracketNames.map((name) => {
        const nameBrackets = bracketsByName.get(name) ?? [];
        return (
          <BracketSection
            key={name}
            bracketName={name}
            brackets={nameBrackets}
            matchMap={matchMap}
            teamMap={teamMap}
            bracketByMatchId={bracketByMatchId}
            groupMap={groupMap}
            groups={sortedGroups}
            teams={teams}
            courts={courts}
            allBrackets={brackets}
            eventId={eventId}
            editing={editing}
            setEditing={setEditing}
          />
        );
      })}
    </div>
  );
}

function BracketSection({
  bracketName,
  brackets,
  matchMap,
  teamMap,
  bracketByMatchId,
  groupMap,
  groups,
  teams,
  courts,
  allBrackets,
  eventId,
  editing,
  setEditing,
}: {
  bracketName: string;
  brackets: Bracket[];
  matchMap: Map<string, Match>;
  teamMap: Map<string, Team>;
  bracketByMatchId: Map<string, Bracket>;
  groupMap: Map<string, Group>;
  groups: Group[];
  teams: Team[];
  courts: Court[];
  allBrackets: Bracket[];
  eventId: string;
  editing: EditState | null;
  setEditing: (s: EditState | null) => void;
}) {
  const [editState, editAction] = useActionState(saveBracketFormAction, init);

  useEffect(() => {
    if (editState.success) setEditing(null);
  }, [editState.timestamp]);

  const roundMap = useMemo(() => {
    const map = new Map<number, Bracket[]>();
    for (const b of brackets) {
      const list = map.get(b.round) ?? [];
      list.push(b);
      map.set(b.round, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.slot - b.slot);
    }
    return map;
  }, [brackets]);

  const rounds = useMemo(
    () => [...roundMap.keys()].sort((a, b) => a - b),
    [roundMap],
  );

  const maxRound = rounds.length > 0 ? Math.max(...rounds) : 0;

  const getRoundLabel = useCallback((round: number) => {
    if (round === maxRound) return "決勝";
    if (round === maxRound - 1 && maxRound >= 2) return "準決勝";
    return `${round}回戦`;
  }, [maxRound]);

  function startEdit(bracket: Bracket) {
    const match = matchMap.get(bracket.matchId);
    setEditing({
      bracketId: bracket.id,
      homeRef: bracket.homeRef,
      awayRef: bracket.awayRef,
      scheduledTime: match?.scheduledTime ?? "",
      court: match?.court ?? "A",
      durationMinutes: match?.durationMinutes ?? 10,
    });
  }

  function buildEditPayload(bracket: Bracket) {
    if (!editing) return "";
    return JSON.stringify({
      id: bracket.id,
      bracketName: bracket.bracketName,
      round: bracket.round,
      slot: bracket.slot,
      matchLabel: bracket.matchLabel,
      homeRef: editing.homeRef,
      awayRef: editing.awayRef,
      matchId: bracket.matchId,
      scheduledTime: editing.scheduledTime,
      durationMinutes: editing.durationMinutes,
      court: editing.court,
    });
  }

  function buildSlotPayload(round: number) {
    const existing = roundMap.get(round) ?? [];
    const nextSlot = existing.length > 0
      ? Math.max(...existing.map((b) => b.slot)) + 1
      : 0;
    return JSON.stringify({
      bracketName,
      round,
      slot: nextSlot,
      matchLabel: `${round}回戦第${nextSlot + 1}試合`,
      homeRef: null,
      awayRef: null,
    });
  }

  function buildRoundPayload() {
    return JSON.stringify({
      bracketName,
      round: maxRound + 1,
      slot: 0,
      matchLabel: `${maxRound + 1}回戦第1試合`,
      homeRef: null,
      awayRef: null,
    });
  }

  const deleteAllPayload = JSON.stringify(
    brackets.map((b) => ({ id: b.id, matchId: b.matchId })),
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{bracketName}</CardTitle>
        <form
          action={deleteAllBracketsAction}
          onSubmit={(e) => {
            if (!confirm(`「${bracketName}」の全ブラケットを削除しますか？`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="payload" value={deleteAllPayload} />
          <SubmitButton variant="destructive" size="sm">
            <Trash2 className="mr-1 h-4 w-4" />
            全削除
          </SubmitButton>
        </form>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: `repeat(${rounds.length}, minmax(200px, 1fr))`,
            }}
          >
            {rounds.map((round) => {
              const bracketsInRound = roundMap.get(round) ?? [];
              return (
                <div key={round} className="space-y-3">
                  <h3 className="text-sm font-semibold">
                    {getRoundLabel(round)}
                  </h3>

                  <div
                    className="flex flex-col justify-around gap-3"
                    style={{ minHeight: round === 1 ? "auto" : `${(roundMap.get(1)?.length ?? 1) * 80}px` }}
                  >
                    {bracketsInRound.map((bracket) => {
                      const match = matchMap.get(bracket.matchId);
                      const isEditing = editing?.bracketId === bracket.id;

                      return (
                        <div
                          key={bracket.id}
                          className="rounded-md border bg-card p-2 text-sm shadow-sm"
                        >
                          {isEditing ? (
                            <form action={editAction}>
                              <input type="hidden" name="eventId" value={eventId} />
                              <input type="hidden" name="payload" value={buildEditPayload(bracket)} />
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">チーム1</Label>
                                  <TeamRefSelect
                                    value={editing.homeRef}
                                    groups={groups}
                                    teams={teams}
                                    allBrackets={allBrackets}
                                    currentBracketMatchId={bracket.matchId}
                                    currentRound={bracket.round}
                                    onChange={(r) =>
                                      setEditing({ ...editing, homeRef: r })
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">チーム2</Label>
                                  <TeamRefSelect
                                    value={editing.awayRef}
                                    groups={groups}
                                    teams={teams}
                                    allBrackets={allBrackets}
                                    currentBracketMatchId={bracket.matchId}
                                    currentRound={bracket.round}
                                    onChange={(r) =>
                                      setEditing({ ...editing, awayRef: r })
                                    }
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">時刻</Label>
                                    <Input
                                      type="time"
                                      value={editing.scheduledTime}
                                      onChange={(e) =>
                                        setEditing({
                                          ...editing,
                                          scheduledTime: e.target.value,
                                        })
                                      }
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">コート</Label>
                                    <Select
                                      value={editing.court}
                                      onValueChange={(v) =>
                                        setEditing({
                                          ...editing,
                                          court: v,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {courts.map((c) => (
                                          <SelectItem key={c.id} value={c.name}>
                                            {c.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <SubmitButton
                                    size="sm"
                                    className="h-7 text-xs"
                                  >
                                    <Check className="mr-1 h-3 w-3" />
                                    保存
                                  </SubmitButton>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    type="button"
                                    onClick={() => setEditing(null)}
                                  >
                                    <X className="mr-1 h-3 w-3" />
                                    取消
                                  </Button>
                                </div>
                              </div>
                            </form>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  {bracket.matchLabel && (
                                    <div className="mb-0.5 text-xs text-muted-foreground">
                                      {bracket.matchLabel}
                                    </div>
                                  )}
                                  <span className="font-medium">
                                    {getRefLabel(bracket.homeRef, teamMap, bracketByMatchId, groupMap)}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(bracket)}
                                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <form action={deleteBracketAction}>
                                    <input type="hidden" name="id" value={bracket.id} />
                                    <input type="hidden" name="matchId" value={bracket.matchId} />
                                    <button
                                      type="submit"
                                      className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </form>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">vs</div>
                              <div className="font-medium">
                                {getRefLabel(bracket.awayRef, teamMap, bracketByMatchId, groupMap)}
                              </div>
                              {match && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {match.scheduledTime && `${match.scheduledTime} · `}
                                  コート{match.court}
                                  {match.status === "finished" && (
                                    <span className="ml-1 font-medium text-green-600">
                                      {match.scoreA} - {match.scoreB}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <form action={addBracketSlotAction}>
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="payload" value={buildSlotPayload(round)} />
                    <SubmitButton
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      スロット追加
                    </SubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <form action={addBracketSlotAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="payload" value={buildRoundPayload()} />
            <SubmitButton variant="outline" size="sm">
              <Plus className="mr-1 h-3 w-3" />
              ラウンド追加
            </SubmitButton>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamRefSelect({
  value,
  groups,
  teams,
  allBrackets,
  currentBracketMatchId,
  currentRound,
  onChange,
}: {
  value: TeamRef | null;
  groups: Group[];
  teams: Team[];
  allBrackets: Bracket[];
  currentBracketMatchId: string;
  currentRound: number;
  onChange: (ref: TeamRef | null) => void;
}) {
  const currentValue = encodeRef(value);

  // グループごとのチーム分類
  const teamsByGroup = useMemo(() => {
    const map = new Map<string, Team[]>();
    for (const team of teams) {
      const list = map.get(team.groupId) ?? [];
      list.push(team);
      map.set(team.groupId, list);
    }
    return map;
  }, [teams]);

  // ラウンドごとのブラケット分類（自分自身は除外、同ラウンド以降は除外）
  const bracketsByRound = useMemo(() => {
    const map = new Map<number, Bracket[]>();
    for (const b of allBrackets) {
      if (b.matchId === currentBracketMatchId) continue;
      if (b.round >= currentRound) continue;
      const list = map.get(b.round) ?? [];
      list.push(b);
      map.set(b.round, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.slot - b.slot);
    }
    return map;
  }, [allBrackets, currentBracketMatchId]);

  const sortedRounds = useMemo(
    () => [...bracketsByRound.keys()].sort((a, b) => a - b),
    [bracketsByRound],
  );

  return (
    <Select
      value={currentValue}
      onValueChange={(v) => onChange(decodeRef(v))}
    >
      <SelectTrigger className="h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">TBD</SelectItem>

        {groups.map((group) => {
          const groupTeams = teamsByGroup.get(group.id) ?? [];
          const maxRank = Math.max(groupTeams.length, 3);
          return (
            <SelectGroup key={group.id}>
              <SelectLabel>{group.name}</SelectLabel>
              {groupTeams.map((team) => (
                <SelectItem key={team.id} value={`team:${team.id}`}>
                  {team.name}
                </SelectItem>
              ))}
              {Array.from({ length: maxRank }, (_, i) => i + 1).map((rank) => (
                <SelectItem
                  key={`${group.id}-rank-${rank}`}
                  value={`group-rank:${group.id}:${rank}`}
                >
                  {group.name}{rank}位
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}

        {sortedRounds.map((round) => {
          const roundBrackets = bracketsByRound.get(round) ?? [];
          if (roundBrackets.length === 0) return null;
          return (
            <SelectGroup key={`round-${round}`}>
              <SelectLabel>{round}回戦</SelectLabel>
              {roundBrackets.map((b) => {
                const label = b.matchLabel || `${b.round}回戦第${b.slot + 1}試合`;
                return [
                  <SelectItem
                    key={`${b.matchId}-winner`}
                    value={`match-result:${b.matchId}:winner`}
                  >
                    {label}の勝者
                  </SelectItem>,
                  <SelectItem
                    key={`${b.matchId}-loser`}
                    value={`match-result:${b.matchId}:loser`}
                  >
                    {label}の敗者
                  </SelectItem>,
                ];
              })}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
