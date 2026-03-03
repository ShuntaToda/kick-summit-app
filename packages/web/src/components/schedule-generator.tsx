"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveMatch, deleteMatch } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import type { Match } from "@/server/domain/entities/match";
import type { Team } from "@/server/domain/entities/team";
import type { Group } from "@/server/domain/entities/group";

type Props = {
  teams: Team[];
  groups: Group[];
  existingMatches: Match[];
};

type MatchDraft = {
  groupId: string;
  teamAId: string;
  teamBId: string;
  scheduledTime: string;
  court: string;
  refereeTeamId: string | null;
};

type BreakPeriod = { start: string; end: string };
type CourtMode = "shared" | "per-group";

// --- アルゴリズム ---

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

function generateRoundRobin(
  teamIds: string[],
): { teamAId: string; teamBId: string }[][] {
  const teams = shuffle(teamIds);
  if (teams.length % 2 !== 0) teams.push("__bye__");

  const n = teams.length;
  const fixed = teams[0];
  const rotating = teams.slice(1);
  const rounds: { teamAId: string; teamBId: string }[][] = [];

  for (let r = 0; r < n - 1; r++) {
    const current = [fixed, ...rotating];
    const roundMatches: { teamAId: string; teamBId: string }[] = [];

    for (let i = 0; i < n / 2; i++) {
      const a = current[i]!;
      const b = current[n - 1 - i]!;
      if (a !== "__bye__" && b !== "__bye__") {
        roundMatches.push({ teamAId: a, teamBId: b });
      }
    }

    rounds.push(roundMatches);
    rotating.push(rotating.shift()!);
  }

  return rounds;
}

/** datetime-local 文字列に分を足す */
function addMinutes(dateTimeStr: string, minutes: number): string {
  const d = new Date(dateTimeStr);
  d.setMinutes(d.getMinutes() + minutes);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${mi}`;
}

/** datetime-local 文字列から HH:MM を取り出す */
function extractTime(dateTimeStr: string): string {
  const d = new Date(dateTimeStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** datetime-local 文字列を M/D HH:MM に整形 */
function formatSlotTime(dateTimeStr: string): string {
  const d = new Date(dateTimeStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function generateTimeSlots(
  startTime: string,
  intervalMinutes: number,
  breaks: BreakPeriod[],
  maxSlots: number,
): string[] {
  const slots: string[] = [];
  let current = startTime;

  while (slots.length < maxSlots) {
    const t = extractTime(current);
    const inBreak = breaks.some((b) => t >= b.start && t < b.end);

    if (inBreak) {
      const breakEnd = breaks.find((b) => t >= b.start && t < b.end)!;
      // 休憩終了時刻を同日の datetime-local 文字列に変換
      const datePart = current.split("T")[0];
      current = `${datePart}T${breakEnd.end}`;
      continue;
    }

    slots.push(current);
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
}

function scheduleMatches(
  allMatches: { groupId: string; teamAId: string; teamBId: string }[],
  slots: string[],
  courts: string[],
  allTeamIds: string[],
  autoReferee: boolean,
): MatchDraft[] {
  const remaining = [...allMatches];
  const lastPlayed = new Map<string, number>();
  const scheduled: MatchDraft[] = [];

  for (let slotIdx = 0; slotIdx < slots.length && remaining.length > 0; slotIdx++) {
    const playingThisSlot = new Set<string>();
    const slotMatches: Omit<MatchDraft, "refereeTeamId">[] = [];

    const scored = remaining.map((m, i) => {
      const waitA = slotIdx - (lastPlayed.get(m.teamAId) ?? -2);
      const waitB = slotIdx - (lastPlayed.get(m.teamBId) ?? -2);
      return { index: i, score: Math.min(waitA, waitB), match: m };
    });

    scored.sort((a, b) => b.score - a.score);

    const toRemove: number[] = [];
    let courtIdx = 0;

    for (const { index, match } of scored) {
      if (courtIdx >= courts.length) break;
      if (playingThisSlot.has(match.teamAId) || playingThisSlot.has(match.teamBId)) continue;

      playingThisSlot.add(match.teamAId);
      playingThisSlot.add(match.teamBId);

      slotMatches.push({
        groupId: match.groupId,
        teamAId: match.teamAId,
        teamBId: match.teamBId,
        scheduledTime: slots[slotIdx]!,
        court: courts[courtIdx]!,
      });

      lastPlayed.set(match.teamAId, slotIdx);
      lastPlayed.set(match.teamBId, slotIdx);
      toRemove.push(index);
      courtIdx++;
    }

    if (autoReferee) {
      const refereeThisSlot = new Set<string>();
      for (const m of slotMatches) {
        const candidate = allTeamIds.find(
          (id) => !playingThisSlot.has(id) && !refereeThisSlot.has(id),
        );
        scheduled.push({ ...m, refereeTeamId: candidate ?? null });
        if (candidate) refereeThisSlot.add(candidate);
      }
    } else {
      for (const m of slotMatches) {
        scheduled.push({ ...m, refereeTeamId: null });
      }
    }

    toRemove.sort((a, b) => b - a);
    for (const idx of toRemove) {
      remaining.splice(idx, 1);
    }
  }

  return scheduled;
}

function generateSchedule(
  targetGroups: Group[],
  teams: Team[],
  config: {
    startTime: string;
    interval: number;
    courts: string[];
    breaks: BreakPeriod[];
    courtMode: CourtMode;
    groupCourts: Record<string, string[]>;
    autoReferee: boolean;
  },
): MatchDraft[] {
  const allTeamIds = teams.map((t) => t.id);

  if (config.courtMode === "per-group") {
    const allScheduled: MatchDraft[] = [];

    for (const group of targetGroups) {
      const groupTeams = teams.filter((t) => t.groupId === group.id);
      if (groupTeams.length < 2) continue;

      const courts = config.groupCourts[group.id] ?? [];
      if (courts.length === 0) continue;

      const rounds = generateRoundRobin(groupTeams.map((t) => t.id));
      const matches = rounds.flat().map((m) => ({ groupId: group.id, ...m }));
      const slots = generateTimeSlots(config.startTime, config.interval, config.breaks, matches.length + 20);
      allScheduled.push(...scheduleMatches(matches, slots, courts, allTeamIds, config.autoReferee));
    }

    return allScheduled.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }

  const allMatches: { groupId: string; teamAId: string; teamBId: string }[] = [];

  for (const group of targetGroups) {
    const groupTeams = teams.filter((t) => t.groupId === group.id);
    if (groupTeams.length < 2) continue;

    const rounds = generateRoundRobin(groupTeams.map((t) => t.id));
    for (const round of rounds) {
      for (const match of round) {
        allMatches.push({ groupId: group.id, ...match });
      }
    }
  }

  const slots = generateTimeSlots(config.startTime, config.interval, config.breaks, allMatches.length + 20);
  return scheduleMatches(allMatches, slots, config.courts, allTeamIds, config.autoReferee);
}

// --- コンポーネント ---

export function ScheduleGenerator({ teams, groups, existingMatches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [targetGroup, setTargetGroup] = useState<string>("all");
  const [startTime, setStartTime] = useState("");
  const [matchDuration, setMatchDuration] = useState(10);
  const [interval, setInterval] = useState(15);
  const [courtMode, setCourtMode] = useState<CourtMode>("shared");
  const [courts, setCourts] = useState(["コート1", "コート2"]);
  const [newCourt, setNewCourt] = useState("");
  const [groupCourts, setGroupCourts] = useState<Record<string, string[]>>({});
  const [newGroupCourt, setNewGroupCourt] = useState<Record<string, string>>({});
  const [breaks, setBreaks] = useState<BreakPeriod[]>([]);
  const [autoReferee, setAutoReferee] = useState(true);
  const [newBreakStart, setNewBreakStart] = useState("");
  const [newBreakEnd, setNewBreakEnd] = useState("");
  const [preview, setPreview] = useState<MatchDraft[] | null>(null);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const teamName = (id: string) => teamMap.get(id)?.name ?? id;

  const targetGroups = targetGroup === "all"
    ? groups
    : groups.filter((g) => g.id === targetGroup);

  const existingTargetMatches = existingMatches.filter(
    (m) => m.type === "league" && (targetGroup === "all" || m.groupId === targetGroup),
  );

  function addGroupCourt(groupId: string) {
    const name = (newGroupCourt[groupId] ?? "").trim();
    if (!name) return;
    setGroupCourts({
      ...groupCourts,
      [groupId]: [...(groupCourts[groupId] ?? []), name],
    });
    setNewGroupCourt({ ...newGroupCourt, [groupId]: "" });
  }

  function removeGroupCourt(groupId: string, idx: number) {
    setGroupCourts({
      ...groupCourts,
      [groupId]: (groupCourts[groupId] ?? []).filter((_, j) => j !== idx),
    });
  }

  const hasCourts = courtMode === "shared"
    ? courts.length > 0
    : targetGroups.every((g) => (groupCourts[g.id] ?? []).length > 0);

  function handleGenerate() {
    if (!startTime || !hasCourts) return;
    const result = generateSchedule(targetGroups, teams, {
      startTime,
      interval,
      courts,
      breaks,
      courtMode,
      groupCourts,
      autoReferee,
    });
    setPreview(result);
  }

  function handleSave() {
    if (!preview) return;
    startTransition(async () => {
      await Promise.all(existingTargetMatches.map((m) => deleteMatch(m.id)));
      await Promise.all(
        preview.map((m) =>
          saveMatch({
            type: "league",
            groupId: m.groupId,
            teamAId: m.teamAId,
            teamBId: m.teamBId,
            scheduledTime: m.scheduledTime,
            durationMinutes: matchDuration,
            court: m.court,
            status: "scheduled",
            refereeTeamId: m.refereeTeamId,
          }),
        ),
      );
      setPreview(null);
      router.refresh();
    });
  }

  // プレビューをタイムスロット別にグループ化
  const previewBySlot = preview
    ? Array.from(
        preview.reduce((map, m) => {
          const list = map.get(m.scheduledTime) ?? [];
          list.push(m);
          map.set(m.scheduledTime, list);
          return map;
        }, new Map<string, MatchDraft[]>()),
      ).sort(([a], [b]) => a.localeCompare(b))
    : null;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h2 className="text-sm font-bold">スケジュール自動生成</h2>

        {/* 対象グループ */}
        <div className="space-y-1">
          <Label className="text-xs">対象</Label>
          <Select value={targetGroup} onValueChange={(v) => { setTargetGroup(v); if (v !== "all") setCourtMode("shared"); setPreview(null); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全グループ</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 設定フォーム */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 space-y-1">
            <Label className="text-xs">開始日時</Label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">試合時間 (分)</Label>
            <Input
              type="number"
              min={1}
              value={matchDuration}
              onChange={(e) => setMatchDuration(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">試合間隔 (分)</Label>
            <Input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
            />
          </div>
          <div />
        </div>

        {/* コートモード（全グループ時のみ） */}
        {targetGroup === "all" && (
          <div className="space-y-2">
            <Label className="text-xs">コート割り当て</Label>
            <Select value={courtMode} onValueChange={(v) => { setCourtMode(v as CourtMode); setPreview(null); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shared">共有（全グループで共有）</SelectItem>
                <SelectItem value="per-group">グループ別（専用コート）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* コート設定 */}
        {targetGroup !== "all" || courtMode === "shared" ? (
          <div className="space-y-2">
            <Label className="text-xs">コート</Label>
            <div className="flex flex-wrap gap-2">
              {courts.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                >
                  {c}
                  <button
                    onClick={() => setCourts(courts.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="コート名"
                value={newCourt}
                onChange={(e) => setNewCourt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCourt.trim()) {
                    setCourts([...courts, newCourt.trim()]);
                    setNewCourt("");
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (newCourt.trim()) {
                    setCourts([...courts, newCourt.trim()]);
                    setNewCourt("");
                  }
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                追加
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {targetGroups.map((group) => (
              <div key={group.id} className="space-y-2 rounded-md border p-3">
                <Label className="text-xs font-medium">{group.name} のコート</Label>
                <div className="flex flex-wrap gap-2">
                  {(groupCourts[group.id] ?? []).map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                    >
                      {c}
                      <button
                        onClick={() => removeGroupCourt(group.id, i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="コート名"
                    value={newGroupCourt[group.id] ?? ""}
                    onChange={(e) => setNewGroupCourt({ ...newGroupCourt, [group.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addGroupCourt(group.id);
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addGroupCourt(group.id)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    追加
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 審判自動割り当て */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={autoReferee}
            onClick={() => { setAutoReferee(!autoReferee); setPreview(null); }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${autoReferee ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${autoReferee ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          <Label className="text-xs">余りチームを審判に自動割り当て</Label>
        </div>

        {/* 休憩 */}
        <div className="space-y-2">
          <Label className="text-xs">休憩時間帯</Label>
          {breaks.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs">
                {b.start} 〜 {b.end}
              </span>
              <button
                onClick={() => setBreaks(breaks.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={newBreakStart}
              onChange={(e) => setNewBreakStart(e.target.value)}
              className="w-28"
            />
            <span className="text-xs text-muted-foreground">〜</span>
            <Input
              type="time"
              value={newBreakEnd}
              onChange={(e) => setNewBreakEnd(e.target.value)}
              className="w-28"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (newBreakStart && newBreakEnd) {
                  setBreaks([...breaks, { start: newBreakStart, end: newBreakEnd }]);
                  setNewBreakStart("");
                  setNewBreakEnd("");
                }
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              追加
            </Button>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={!startTime || !hasCourts}>
          スケジュール生成
        </Button>

        {/* プレビュー */}
        {previewBySlot && (
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-xs font-bold text-muted-foreground">
              プレビュー ({preview!.length}試合)
            </h3>
            <div className="space-y-2">
              {previewBySlot.map(([time, matches]) => (
                <div key={time} className="flex gap-3">
                  <div className="w-32 shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
                    {formatSlotTime(time)} - {extractTime(addMinutes(time, matchDuration))}
                  </div>
                  <div className="flex-1 space-y-1">
                    {matches.map((m, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-muted-foreground">{m.court}:</span>{" "}
                        <span className="font-medium">{teamName(m.teamAId)}</span>
                        <span className="text-muted-foreground"> vs </span>
                        <span className="font-medium">{teamName(m.teamBId)}</span>
                        <span className="ml-1 text-muted-foreground">
                          ({groupMap.get(m.groupId)?.name})
                        </span>
                        {m.refereeTeamId && (
                          <span className="ml-1 text-muted-foreground">
                            審判: {teamName(m.refereeTeamId)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {existingTargetMatches.length > 0 && (
              <p className="text-xs text-destructive">
                ※ 既存のリーグ戦 {existingTargetMatches.length}試合は削除されます
              </p>
            )}

            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
