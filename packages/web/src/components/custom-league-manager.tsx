"use client";

import { useState, useEffect, useActionState } from "react";
import { saveMatchFormAction, deleteMatchAction } from "@/lib/actions/match";
import { saveCustomLeagueFormAction, deleteCustomLeagueFormAction, resolveGroupRankOverrideAction } from "@/lib/actions/custom-league";
import type { ActionState } from "@/lib/actions/helpers";
import type { StandingsRow } from "@/server/domain/services/standings-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Pencil, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Match } from "@/server/domain/entities/match";
import type { Team } from "@/server/domain/entities/team";
import type { Group } from "@/server/domain/entities/group";
import type { CustomLeague } from "@/server/domain/entities/custom-league";
import type { Court } from "@/server/domain/entities/court";

type Props = {
  customLeagues: CustomLeague[];
  matches: Match[];
  teams: Team[];
  groups: Group[];
  courts: Court[];
  standings: Record<string, StandingsRow[]>;
  eventId: string;
};

type MatchForm = {
  id?: string;
  teamAId: string;
  teamARefLabel: string;
  teamBId: string;
  teamBRefLabel: string;
  scheduledTime: string;
  durationMinutes: number;
  court: string;
  refereeTeamId: string;
  refereeTeamId2: string;
};

const NONE = "__none__";
const GROUP_RANK_PREFIX = "group-rank:";

// refLabel のエンコード/デコード: "group-rank:{groupId}:{rank}"
function encodeGroupRank(groupId: string, rank: number) {
  return `${GROUP_RANK_PREFIX}${groupId}:${rank}`;
}

function decodeGroupRank(refLabel: string): { groupId: string; rank: number } | null {
  if (!refLabel.startsWith(GROUP_RANK_PREFIX)) return null;
  const rest = refLabel.slice(GROUP_RANK_PREFIX.length);
  const lastColon = rest.lastIndexOf(":");
  if (lastColon === -1) return null;
  const groupId = rest.slice(0, lastColon);
  const rank = Number(rest.slice(lastColon + 1));
  if (!groupId || isNaN(rank)) return null;
  return { groupId, rank };
}

const RANKS = [1, 2, 3, 4];

function toFormTime(iso: string) {
  return iso.slice(0, 16);
}

function fromFormTime(local: string) {
  return local ? `${local}:00` : "";
}

const init: ActionState = { success: false };

function emptyMatchForm(): MatchForm {
  return {
    teamAId: "",
    teamARefLabel: "",
    teamBId: "",
    teamBRefLabel: "",
    scheduledTime: "",
    durationMinutes: 10,
    court: "",
    refereeTeamId: "",
    refereeTeamId2: "",
  };
}

export function CustomLeagueManager({ customLeagues, matches, teams, groups, courts, standings, eventId }: Props) {
  const [showNewLeagueForm, setShowNewLeagueForm] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [editingLeagueName, setEditingLeagueName] = useState("");
  const [expandedLeagueId, setExpandedLeagueId] = useState<string | null>(
    customLeagues[0]?.id ?? null,
  );

  const [saveLeagueState, saveLeagueAction] = useActionState(saveCustomLeagueFormAction, init);
  const [deleteLeagueState, deleteLeagueAction] = useActionState(deleteCustomLeagueFormAction, init);

  useEffect(() => {
    if (saveLeagueState.success) {
      setShowNewLeagueForm(false);
      setNewLeagueName("");
      setEditingLeagueId(null);
      setEditingLeagueName("");
    }
  }, [saveLeagueState.timestamp]);

  useEffect(() => {
    if (deleteLeagueState.success) {
      setExpandedLeagueId(null);
    }
  }, [deleteLeagueState.timestamp]);

  const matchesByLeague = (leagueId: string) =>
    matches
      .filter((m) => m.type === "custom-league" && m.customLeagueId === leagueId)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  return (
    <div className="space-y-4">
      <TieBreakSection
        matches={matches}
        groups={groups}
        teams={teams}
        standings={standings}
        eventId={eventId}
      />
      {customLeagues.map((league) => (
        <Card key={league.id}>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              {editingLeagueId === league.id ? (
                <form action={saveLeagueAction} className="flex flex-1 items-center gap-2">
                  <input type="hidden" name="id" value={league.id} />
                  <input type="hidden" name="eventId" value={eventId} />
                  <Input
                    name="name"
                    value={editingLeagueName}
                    onChange={(e) => setEditingLeagueName(e.target.value)}
                    className="h-7 flex-1 text-sm"
                    autoFocus
                  />
                  <SubmitButton size="sm" disabled={!editingLeagueName.trim()}>保存</SubmitButton>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingLeagueId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-2 text-left"
                    onClick={() => setExpandedLeagueId(expandedLeagueId === league.id ? null : league.id)}
                  >
                    <CardTitle className="text-base">{league.name}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {matchesByLeague(league.id).length}試合
                    </span>
                    {expandedLeagueId === league.id
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingLeagueId(league.id);
                        setEditingLeagueName(league.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <form action={deleteLeagueAction}>
                      <input type="hidden" name="id" value={league.id} />
                      <SubmitButton size="icon" variant="ghost">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </SubmitButton>
                    </form>
                  </div>
                </>
              )}
            </div>
          </CardHeader>
          {expandedLeagueId === league.id && (
            <CardContent className="space-y-3 pt-0">
              <LeagueMatchList
                matches={matchesByLeague(league.id)}
                teams={teams}
                groups={groups}
                courts={courts}
                customLeagueId={league.id}
                eventId={eventId}
              />
            </CardContent>
          )}
        </Card>
      ))}

      {showNewLeagueForm ? (
        <Card>
          <CardContent className="pt-4">
            <form action={saveLeagueAction} className="space-y-3">
              <input type="hidden" name="eventId" value={eventId} />
              <div className="space-y-1">
                <Label className="text-xs">リーグ名</Label>
                <Input
                  name="name"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="例: 決勝リーグ"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <SubmitButton size="sm" disabled={!newLeagueName.trim()}>追加</SubmitButton>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setShowNewLeagueForm(false); setNewLeagueName(""); }}>
                  <X className="mr-1 h-4 w-4" />
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setShowNewLeagueForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          リーグを追加
        </Button>
      )}
    </div>
  );
}

function LeagueMatchList({
  matches,
  teams,
  groups,
  courts,
  customLeagueId,
  eventId,
}: {
  matches: Match[];
  teams: Team[];
  groups: Group[];
  courts: Court[];
  customLeagueId: string;
  eventId: string;
}) {
  const [editingMatch, setEditingMatch] = useState<MatchForm | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMatch, setNewMatch] = useState<MatchForm>(emptyMatchForm());
  const [addState, addAction] = useActionState(saveMatchFormAction, init);
  const [editState, editAction] = useActionState(saveMatchFormAction, init);

  useEffect(() => {
    if (addState.success) {
      setNewMatch(emptyMatchForm());
      setShowAddForm(false);
    }
  }, [addState.timestamp]);

  useEffect(() => {
    if (editState.success) setEditingMatch(null);
  }, [editState.timestamp]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  function decodeRefLabelDisplay(refLabel: string): string {
    const decoded = decodeGroupRank(refLabel);
    if (!decoded) return refLabel;
    const groupName = groupMap.get(decoded.groupId)?.name ?? decoded.groupId;
    return `${groupName} ${decoded.rank}位`;
  }

  function teamLabel(id: string | null, refLabel: string | null) {
    if (refLabel) return <span className="text-muted-foreground italic">{decodeRefLabelDisplay(refLabel)}</span>;
    if (!id) return <span className="text-muted-foreground">TBD</span>;
    const team = teamMap.get(id);
    if (!team) return <span>{id}</span>;
    return (
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: team.color }} />
        {team.name}
      </span>
    );
  }

  function buildPayload(form: MatchForm, id?: string) {
    return JSON.stringify({
      id,
      type: "custom-league",
      groupId: null,
      customLeagueId,
      teamAId: form.teamAId || null,
      teamARefLabel: form.teamARefLabel || null,
      teamBId: form.teamBId || null,
      teamBRefLabel: form.teamBRefLabel || null,
      scheduledTime: fromFormTime(form.scheduledTime),
      durationMinutes: form.durationMinutes,
      court: form.court,
      refereeTeamId: form.refereeTeamId || null,
      refereeTeamId2: form.refereeTeamId2 || null,
    });
  }

  function startEdit(match: Match) {
    setEditingMatch({
      id: match.id,
      teamAId: match.teamAId ?? "",
      teamARefLabel: match.teamARefLabel ?? "",
      teamBId: match.teamBId ?? "",
      teamBRefLabel: match.teamBRefLabel ?? "",
      scheduledTime: toFormTime(match.scheduledTime),
      durationMinutes: match.durationMinutes,
      court: match.court,
      refereeTeamId: match.refereeTeamId ?? "",
      refereeTeamId2: match.refereeTeamId2 ?? "",
    });
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <Card key={match.id}>
          <CardContent className="py-3">
            {editingMatch?.id === match.id ? (
              <CustomLeagueMatchForm
                form={editingMatch}
                onChange={setEditingMatch}
                teams={teams}
                groups={groups}
                courts={courts}
                formAction={editAction}
                eventId={eventId}
                buildPayload={(f) => buildPayload(f, f.id)}
                onCancel={() => setEditingMatch(null)}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-center text-xs text-muted-foreground">
                  {match.scheduledTime && !isNaN(new Date(match.scheduledTime).getTime()) ? (
                    <>
                      {new Date(match.scheduledTime).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(new Date(match.scheduledTime).getTime() + match.durationMinutes * 60 * 1000).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </>
                  ) : (
                    <span>未定</span>
                  )}
                  <div className="mt-0.5">{match.court}</div>
                </div>
                <div className="min-w-0 flex-1 text-center text-sm">
                  <div className="font-medium">{teamLabel(match.teamAId, match.teamARefLabel)}</div>
                  <div className="text-xs text-muted-foreground">vs</div>
                  <div className="font-medium">{teamLabel(match.teamBId, match.teamBRefLabel)}</div>
                  {(match.refereeTeamId || match.refereeTeamId2) && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      審判: {match.refereeTeamId ? (teamMap.get(match.refereeTeamId)?.name ?? match.refereeTeamId) : ""}
                      {match.refereeTeamId2 ? ` / ${teamMap.get(match.refereeTeamId2)?.name ?? match.refereeTeamId2}` : ""}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(match)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <form action={deleteMatchAction}>
                    <input type="hidden" name="id" value={match.id} />
                    <SubmitButton size="icon" variant="ghost">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </SubmitButton>
                  </form>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {showAddForm ? (
        <Card>
          <CardContent className="pt-4">
            <CustomLeagueMatchForm
              form={newMatch}
              onChange={setNewMatch}
              teams={teams}
              groups={groups}
              courts={courts}
              formAction={addAction}
              eventId={eventId}
              buildPayload={(f) => buildPayload(f)}
              onCancel={() => setShowAddForm(false)}
              isNew
            />
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAddForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          試合を追加
        </Button>
      )}
    </div>
  );
}

// 同率が発生している group-rank を検出して手動確定UIを表示
function TieBreakSection({
  matches,
  groups,
  teams,
  standings,
  eventId,
}: {
  matches: Match[];
  groups: Group[];
  teams: Team[];
  standings: Record<string, StandingsRow[]>;
  eventId: string;
}) {
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  // カスタムリーグ試合で使われている group-rank refLabel を収集
  const usedRefLabels = new Set<string>();
  for (const m of matches) {
    if (m.type !== "custom-league") continue;
    if (m.teamARefLabel?.startsWith(GROUP_RANK_PREFIX)) usedRefLabels.add(m.teamARefLabel);
    if (m.teamBRefLabel?.startsWith(GROUP_RANK_PREFIX)) usedRefLabels.add(m.teamBRefLabel);
  }

  // 同率が発生しているか確認
  // 同率 = 同じ points / goalDifference / goalsFor が複数チームにある rank
  type TieEntry = {
    refLabel: string;
    groupId: string;
    groupName: string;
    rank: number;
    tiedTeams: StandingsRow[]; // 同点のチーム群
    resolvedTeamId: string | null; // 現在の teamAId/teamBId
  };

  const tieEntries: TieEntry[] = [];

  for (const refLabel of usedRefLabels) {
    const decoded = decodeGroupRank(refLabel);
    if (!decoded) continue;
    const { groupId, rank } = decoded;
    const rows = standings[groupId] ?? [];
    if (rows.length < rank) continue;

    // 全試合が終了していないグループはスキップ
    const groupLeagueMatches = matches.filter(
      (m) => m.type === "league" && m.groupId === groupId,
    );
    const allFinished = groupLeagueMatches.length > 0 &&
      groupLeagueMatches.every((m) => m.status === "finished");
    if (!allFinished) continue;

    const targetRow = rows[rank - 1];
    if (!targetRow) continue;
    // 前後の行と比較して同率かチェック
    const isTied = rows.some(
      (r, i) =>
        i !== rank - 1 &&
        r.points === targetRow.points &&
        r.goalDifference === targetRow.goalDifference &&
        r.goalsFor === targetRow.goalsFor,
    );
    if (!isTied) continue;

    // 同率グループのチームを収集
    const tiedTeams = rows.filter(
      (r) =>
        r.points === targetRow.points &&
        r.goalDifference === targetRow.goalDifference &&
        r.goalsFor === targetRow.goalsFor,
    );

    // 現在解決済みの teamId を確認
    const resolvedTeamId =
      matches.find(
        (m) =>
          m.type === "custom-league" &&
          (m.teamARefLabel === refLabel || m.teamBRefLabel === refLabel),
      )?.teamARefLabel === refLabel
        ? (matches.find(
            (m) => m.type === "custom-league" && m.teamARefLabel === refLabel,
          )?.teamAId ?? null)
        : (matches.find(
            (m) => m.type === "custom-league" && m.teamBRefLabel === refLabel,
          )?.teamBId ?? null);

    tieEntries.push({
      refLabel,
      groupId,
      groupName: groupMap.get(groupId)?.name ?? groupId,
      rank,
      tiedTeams,
      resolvedTeamId,
    });
  }

  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const e of tieEntries) {
      if (e.resolvedTeamId) init[e.refLabel] = e.resolvedTeamId;
    }
    return init;
  });
  const [state, action] = useActionState(resolveGroupRankOverrideAction, { success: false });

  if (tieEntries.length === 0) return null;

  const overrideList = tieEntries.map((e) => ({
    refLabel: e.refLabel,
    teamId: overrides[e.refLabel] ?? "",
  }));

  return (
    <Card className="border-orange-300">
      <CardHeader className="py-3">
        <CardTitle className="text-base text-orange-600">同率順位の決定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          以下の順位で同率が発生しています。じゃんけん等で決定したチームを選択してください。
        </p>
        {tieEntries.map((entry) => (
          <div key={entry.refLabel} className="space-y-1">
            <Label className="text-xs font-medium">
              {entry.groupName} {entry.rank}位（同率）
            </Label>
            <Select
              value={overrides[entry.refLabel] ?? NONE}
              onValueChange={(v) =>
                setOverrides((prev) => ({ ...prev, [entry.refLabel]: v === NONE ? "" : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="チームを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>未選択</SelectItem>
                {entry.tiedTeams.map((row) => (
                  <SelectItem key={row.teamId} value={row.teamId}>
                    {row.teamName}（{row.points}pt / 得失{row.goalDifference > 0 ? "+" : ""}{row.goalDifference}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <form action={action}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="overrides" value={JSON.stringify(overrideList)} />
          <SubmitButton
            size="sm"
            disabled={overrideList.some((o) => !o.teamId)}
            className="w-full"
          >
            確定する
          </SubmitButton>
        </form>
        {state.success && (
          <p className="text-xs text-green-600">確定しました</p>
        )}
        {state.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TeamRefInput({
  label,
  teamId,
  refLabel,
  teams,
  groups,
  onTeamIdChange,
  onRefLabelChange,
}: {
  label: string;
  teamId: string;
  refLabel: string;
  teams: Team[];
  groups: Group[];
  onTeamIdChange: (v: string) => void;
  onRefLabelChange: (v: string) => void;
}) {
  // 現在の選択値を決定: group-rank encoded string or teamId or NONE
  const selectValue = refLabel
    ? refLabel // group-rank:xxx:N 形式
    : teamId || NONE;

  function handleSelectChange(v: string) {
    if (v === NONE) {
      onTeamIdChange("");
      onRefLabelChange("");
    } else if (v.startsWith(GROUP_RANK_PREFIX)) {
      // グループ順位選択
      onTeamIdChange("");
      onRefLabelChange(v);
    } else {
      // チーム選択
      onTeamIdChange(v);
      onRefLabelChange("");
    }
  }

  const teamsByGroup = groups.map((g) => ({
    group: g,
    teams: teams.filter((t) => t.groupId === g.id),
  }));

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>TBD</SelectItem>
          {/* グループ順位オプション */}
          {groups.map((g) => (
            <div key={`rank-${g.id}`}>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{g.name}（順位）</div>
              {RANKS.map((rank) => {
                const encoded = encodeGroupRank(g.id, rank);
                return (
                  <SelectItem key={encoded} value={encoded}>
                    {g.name} {rank}位
                  </SelectItem>
                );
              })}
            </div>
          ))}
          {/* チームオプション */}
          {teamsByGroup.map(({ group, teams: gt }) =>
            gt.length > 0 ? (
              <div key={`team-${group.id}`}>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{group.name}（チーム）</div>
                {gt.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </div>
            ) : null,
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

function CustomLeagueMatchForm({
  form,
  onChange,
  teams,
  groups,
  courts,
  formAction,
  eventId,
  buildPayload,
  onCancel,
  isNew,
}: {
  form: MatchForm;
  onChange: (form: MatchForm) => void;
  teams: Team[];
  groups: Group[];
  courts: Court[];
  formAction: (payload: FormData) => void;
  eventId: string;
  buildPayload: (form: MatchForm) => string;
  onCancel: () => void;
  isNew?: boolean;
}) {
  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="payload" value={buildPayload(form)} />
      <div className="space-y-3">
        <TeamRefInput
          label="チームA"
          teamId={form.teamAId}
          refLabel={form.teamARefLabel}
          teams={teams}
          groups={groups}
          onTeamIdChange={(v) => onChange({ ...form, teamAId: v })}
          onRefLabelChange={(v) => onChange({ ...form, teamARefLabel: v })}
        />
        <TeamRefInput
          label="チームB"
          teamId={form.teamBId}
          refLabel={form.teamBRefLabel}
          teams={teams}
          groups={groups}
          onTeamIdChange={(v) => onChange({ ...form, teamBId: v })}
          onRefLabelChange={(v) => onChange({ ...form, teamBRefLabel: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">開始時間</Label>
            <Input
              type="datetime-local"
              value={form.scheduledTime}
              onChange={(e) => onChange({ ...form, scheduledTime: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">試合時間 (分)</Label>
            <Input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => onChange({ ...form, durationMinutes: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">コート</Label>
            <Select
              value={form.court || NONE}
              onValueChange={(v) => onChange({ ...form, court: v === NONE ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>未定</SelectItem>
                {courts.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">正審</Label>
            <Select
              value={form.refereeTeamId || NONE}
              onValueChange={(v) => onChange({ ...form, refereeTeamId: v === NONE ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>なし</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">副審</Label>
            <Select
              value={form.refereeTeamId2 || NONE}
              onValueChange={(v) => onChange({ ...form, refereeTeamId2: v === NONE ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>なし</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <SubmitButton size="sm">
            {isNew ? "追加" : "保存"}
          </SubmitButton>
          <Button size="sm" variant="ghost" type="button" onClick={onCancel}>
            <X className="mr-1 h-4 w-4" />
            キャンセル
          </Button>
        </div>
      </div>
    </form>
  );
}
