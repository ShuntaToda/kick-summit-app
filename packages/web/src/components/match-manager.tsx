"use client";

import { useState, useEffect, useActionState } from "react";
import { saveMatchFormAction, deleteMatchAction } from "@/lib/actions/match";
import type { ActionState } from "@/lib/actions/helpers";
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
import { Trash2, Pencil, Plus, X } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Match, MatchType } from "@/server/domain/entities/match";
import type { Team } from "@/server/domain/entities/team";
import type { Group } from "@/server/domain/entities/group";

type Props = {
  matches: Match[];
  teams: Team[];
  groups: Group[];
  eventId: string;
};

type MatchForm = {
  id?: string;
  type: MatchType;
  groupId: string;
  teamAId: string;
  teamBId: string;
  scheduledTime: string;
  durationMinutes: number;
  court: string;
  refereeTeamId: string;
};

const NONE = "__none__";

function toFormTime(iso: string) {
  return iso.slice(0, 16);
}

function fromFormTime(local: string) {
  return local ? `${local}:00` : "";
}

const init: ActionState = { success: false };

export function MatchManager({ matches, teams, groups, eventId }: Props) {
  const [editingMatch, setEditingMatch] = useState<MatchForm | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const emptyForm: MatchForm = {
    type: "league",
    groupId: groups[0]?.id ?? "",
    teamAId: "",
    teamBId: "",
    scheduledTime: "",
    durationMinutes: 10,
    court: "",
    refereeTeamId: "",
  };

  const [newMatch, setNewMatch] = useState<MatchForm>(emptyForm);
  const [addState, addAction] = useActionState(saveMatchFormAction, init);
  const [editState, editAction] = useActionState(saveMatchFormAction, init);

  useEffect(() => {
    if (addState.success) {
      setNewMatch(emptyForm);
      setShowAddForm(false);
    }
  }, [addState.timestamp]);

  useEffect(() => {
    if (editState.success) setEditingMatch(null);
  }, [editState.timestamp]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const teamLabel = (id: string | null) => {
    if (!id) return <span>TBD</span>;
    const team = teamMap.get(id);
    if (!team) return <span>{id}</span>;
    return (
      <span className="inline-flex items-center gap-1">
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: team.color }}
        />
        {team.name}
      </span>
    );
  };

  const sorted = [...matches].sort((a, b) =>
    a.scheduledTime.localeCompare(b.scheduledTime),
  );

  const tournamentMatches = sorted.filter((m) => m.type === "tournament");

  const leagueByGroup = groups.map((group) => ({
    group,
    matches: sorted.filter((m) => m.type === "league" && m.groupId === group.id),
  }));

  const ungroupedLeague = sorted.filter(
    (m) => m.type === "league" && !groups.some((g) => g.id === m.groupId),
  );

  function startEdit(match: Match) {
    setEditingMatch({
      id: match.id,
      type: match.type,
      groupId: match.groupId ?? "",
      teamAId: match.teamAId ?? "",
      teamBId: match.teamBId ?? "",
      scheduledTime: toFormTime(match.scheduledTime),
      durationMinutes: match.durationMinutes,
      court: match.court,
      refereeTeamId: match.refereeTeamId ?? "",
    });
  }

  function buildPayload(form: MatchForm) {
    return JSON.stringify({
      id: form.id,
      type: form.type,
      groupId: form.groupId || null,
      teamAId: form.teamAId || null,
      teamBId: form.teamBId || null,
      scheduledTime: fromFormTime(form.scheduledTime),
      durationMinutes: form.durationMinutes,
      court: form.court,
      refereeTeamId: form.refereeTeamId || null,
    });
  }

  function renderMatchList(title: string, list: Match[]) {
    if (list.length === 0) return null;
    return (
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        {list.map((match) => (
          <Card key={match.id}>
            <CardContent className="py-3">
              {editingMatch?.id === match.id ? (
                <MatchFormFields
                  form={editingMatch}
                  onChange={setEditingMatch}
                  teams={teams}
                  groups={groups}
                  formAction={editAction}
                  eventId={eventId}
                  buildPayload={buildPayload}
                  onCancel={() => setEditingMatch(null)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-24 shrink-0 text-center text-xs text-muted-foreground">
                    {match.scheduledTime && !isNaN(new Date(match.scheduledTime).getTime()) ? (
                      <>
                        {new Date(match.scheduledTime).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" - "}
                        {new Date(new Date(match.scheduledTime).getTime() + match.durationMinutes * 60 * 1000).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </>
                    ) : (
                      <span className="text-muted-foreground">未定</span>
                    )}
                    <div className="mt-0.5">{match.court}</div>
                  </div>
                  <div className="min-w-0 flex-1 text-center text-sm">
                    <div className="font-medium">{teamLabel(match.teamAId)}</div>
                    <div className="text-xs text-muted-foreground">vs</div>
                    <div className="font-medium">{teamLabel(match.teamBId)}</div>
                    {match.refereeTeamId && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        審判: {teamMap.get(match.refereeTeamId)?.name ?? match.refereeTeamId}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(match)}
                    >
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {leagueByGroup.map(({ group, matches: gm }) => (
        <div key={group.id}>
          {renderMatchList(`予選リーグ - ${group.name}`, gm)}
        </div>
      ))}
      {renderMatchList("予選リーグ - 未分類", ungroupedLeague)}
      {renderMatchList("決勝トーナメント", tournamentMatches)}

      {showAddForm ? (
        <Card>
          <CardContent className="pt-6">
            <MatchFormFields
              form={newMatch}
              onChange={(f) => setNewMatch(f)}
              teams={teams}
              groups={groups}
              formAction={addAction}
              eventId={eventId}
              buildPayload={buildPayload}
              onCancel={() => setShowAddForm(false)}
              isNew
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          試合を追加
        </Button>
      )}
    </div>
  );
}

function MatchFormFields({
  form,
  onChange,
  teams,
  groups,
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
  formAction: (payload: FormData) => void;
  eventId: string;
  buildPayload: (form: MatchForm) => string;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const filteredTeams = form.groupId
    ? teams.filter((t) => t.groupId === form.groupId)
    : teams;

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="payload" value={buildPayload(form)} />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">種別</Label>
            <Select
              value={form.type}
              onValueChange={(v) => onChange({ ...form, type: v as MatchType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="league">予選リーグ</SelectItem>
                <SelectItem value="tournament">決勝トーナメント</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">グループ</Label>
            <Select
              value={form.groupId || NONE}
              onValueChange={(v) => onChange({ ...form, groupId: v === NONE ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>なし</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">チームA</Label>
            <Select
              value={form.teamAId || NONE}
              onValueChange={(v) => onChange({ ...form, teamAId: v === NONE ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>TBD</SelectItem>
                {filteredTeams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">チームB</Label>
            <Select
              value={form.teamBId || NONE}
              onValueChange={(v) => onChange({ ...form, teamBId: v === NONE ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>TBD</SelectItem>
                {filteredTeams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
            <Input
              value={form.court}
              onChange={(e) => onChange({ ...form, court: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">審判</Label>
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
        </div>
        <div className="flex gap-2">
          <SubmitButton
            size="sm"
            disabled={!form.scheduledTime || !form.court}
          >
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
