"use client";

import { useState, useEffect, useActionState } from "react";
import { saveTeamFormAction, deleteTeamAction } from "@/lib/actions/team";
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
import type { Team } from "@/server/domain/entities/team";
import type { Group } from "@/server/domain/entities/group";
import type { CustomField } from "@/server/domain/entities/event";

type Props = {
  teams: Team[];
  groups: Group[];
  customFields: CustomField[];
  eventId: string;
};

type TeamForm = {
  id?: string;
  groupId: string;
  name: string;
  color: string;
  customValues: Record<string, string | number>;
};

const emptyForm = (groupId: string): TeamForm => ({
  groupId,
  name: "",
  color: "#3b82f6",
  customValues: {},
});

const init: ActionState = { success: false };

export function TeamManager({ teams, groups, customFields, eventId }: Props) {
  const [editingTeam, setEditingTeam] = useState<TeamForm | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeam, setNewTeam] = useState<TeamForm>(emptyForm(groups[0]?.id ?? ""));
  const [addState, addAction] = useActionState(saveTeamFormAction, init);
  const [editState, editAction] = useActionState(saveTeamFormAction, init);

  useEffect(() => {
    if (addState.success) {
      setNewTeam(emptyForm(groups[0]?.id ?? ""));
      setShowAddForm(false);
    }
  }, [addState.timestamp]);

  useEffect(() => {
    if (editState.success) setEditingTeam(null);
  }, [editState.timestamp]);

  const teamsByGroup = groups.map((group) => ({
    group,
    teams: teams.filter((t) => t.groupId === group.id),
  }));

  function startEdit(team: Team) {
    setEditingTeam({
      id: team.id,
      groupId: team.groupId,
      name: team.name,
      color: team.color,
      customValues: team.customValues,
    });
  }

  return (
    <div className="space-y-6">
      {teamsByGroup.map(({ group, teams: groupTeams }) => (
        <div key={group.id} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {group.name}
          </h2>
          {groupTeams.map((team) => (
            <Card key={team.id}>
              <CardContent className="py-3">
                {editingTeam?.id === team.id ? (
                  <TeamFormFields
                    form={editingTeam}
                    onChange={setEditingTeam}
                    groups={groups}
                    customFields={customFields}
                    formAction={editAction}
                    eventId={eventId}
                    onCancel={() => setEditingTeam(null)}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">{team.name}</span>
                      {customFields.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                          {customFields.map((f) => {
                            const v = team.customValues[f.id];
                            if (v === undefined || v === "" || v === 0) return null;
                            return <span key={f.id}>{f.label}: {v}</span>;
                          })}
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(team)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <form action={deleteTeamAction}>
                      <input type="hidden" name="id" value={team.id} />
                      <SubmitButton size="icon" variant="ghost">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </SubmitButton>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {showAddForm ? (
        <Card>
          <CardContent className="pt-6">
            <TeamFormFields
              form={newTeam}
              onChange={(f) => setNewTeam(f)}
              groups={groups}
              customFields={customFields}
              formAction={addAction}
              eventId={eventId}
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
          チームを追加
        </Button>
      )}
    </div>
  );
}

function TeamFormFields({
  form,
  onChange,
  groups,
  customFields,
  formAction,
  eventId,
  onCancel,
  isNew,
}: {
  form: TeamForm;
  onChange: (form: TeamForm) => void;
  groups: Group[];
  customFields: CustomField[];
  formAction: (payload: FormData) => void;
  eventId: string;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const payload = JSON.stringify({
    id: form.id,
    groupId: form.groupId,
    name: form.name.trim(),
    color: form.color,
    customValues: form.customValues,
  });

  function setCustomValue(fieldId: string, value: string | number) {
    onChange({ ...form, customValues: { ...form.customValues, [fieldId]: value } });
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="payload" value={payload} />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">チーム名</Label>
            <Input
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">グループ</Label>
            <Select
              value={form.groupId}
              onValueChange={(v) => onChange({ ...form, groupId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            <Label className="text-xs">カラー</Label>
            <Input
              type="color"
              value={form.color}
              onChange={(e) => onChange({ ...form, color: e.target.value })}
            />
          </div>
          {customFields.map((field) => (
            <div key={field.id} className="space-y-1">
              <Label className="text-xs">
                {field.label}
                {field.required && <span className="ml-0.5 text-destructive">*</span>}
              </Label>
              <Input
                type={field.type === "number" ? "number" : "text"}
                min={field.type === "number" ? 0 : undefined}
                value={form.customValues[field.id] ?? (field.type === "number" ? 0 : "")}
                onChange={(e) =>
                  setCustomValue(
                    field.id,
                    field.type === "number" ? Number(e.target.value) : e.target.value,
                  )
                }
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <SubmitButton size="sm" disabled={!form.name.trim()}>
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
