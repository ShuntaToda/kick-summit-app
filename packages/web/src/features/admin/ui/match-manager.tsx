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
import type { Match } from "@/server/domain/entities/match";
import type { Team } from "@/server/domain/entities/team";
import type { Group } from "@/server/domain/entities/group";
import type { CustomLeague } from "@/server/domain/entities/custom-league";
import type { MatchType } from "@/server/domain/entities/match";

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
  refereeTeamId2: string;
};

function buildMatchPayload(form: MatchForm): string {
  const scheduledTime = form.scheduledTime ? `${form.scheduledTime}:00` : "";
  return JSON.stringify({
    id: form.id,
    type: "league",
    groupId: form.groupId || null,
    teamAId: form.teamAId || null,
    teamBId: form.teamBId || null,
    scheduledTime,
    durationMinutes: form.durationMinutes,
    court: form.court,
    refereeTeamId: form.refereeTeamId || null,
    refereeTeamId2: form.refereeTeamId2 || null,
  });
}

function matchToForm(match: Match): MatchForm {
  return {
    id: match.id,
    type: match.type,
    groupId: match.groupId ?? "",
    teamAId: match.teamAId ?? "",
    teamBId: match.teamBId ?? "",
    scheduledTime: match.scheduledTime.slice(0, 16),
    durationMinutes: match.durationMinutes,
    court: match.court,
    refereeTeamId: match.refereeTeamId ?? "",
    refereeTeamId2: match.refereeTeamId2 ?? "",
  };
}

type Props = {
  matches: Match[];
  teams: Team[];
  groups: Group[];
  customLeagues: CustomLeague[];
  eventId: string;
};

const NONE = "__none__";
const init: ActionState = { success: false };

export function MatchManager({ matches, teams, groups, customLeagues, eventId }: Props) {
  const emptyForm: MatchForm = {
    type: "league",
    groupId: groups[0]?.id ?? "",
    teamAId: "",
    teamBId: "",
    scheduledTime: "",
    durationMinutes: 10,
    court: "",
    refereeTeamId: "",
    refereeTeamId2: "",
  };

  const [editingMatch, setEditingMatch] = useState<MatchForm | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
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

  function startEdit(match: Match) {
    setEditingMatch(matchToForm(match));
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const teamLabel = (id: string | null, refLabel?: string | null) => {
    if (refLabel) return <span className="italic text-muted-foreground">{refLabel}</span>;
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

  const customLeagueByLeague = customLeagues.map((league) => ({
    league,
    matches: sorted.filter((m) => m.type === "custom-league" && m.customLeagueId === league.id),
  }));

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
                  buildPayload={buildMatchPayload}
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
      {customLeagueByLeague.map(({ league, matches: lm }) => (
        <div key={league.id}>
          {renderMatchList(`カスタムリーグ - ${league.name}`, lm)}
        </div>
      ))}

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
              buildPayload={buildMatchPayload}
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
        <input type="hidden" name="type" value="league" />
        <div className="grid grid-cols-2 gap-3">
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
