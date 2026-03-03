"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTeam, deleteTeam } from "@/lib/actions";
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
import type { Team } from "@/server/domain/entities/team";
import type { Group } from "@/server/domain/entities/group";

type Props = {
  teams: Team[];
  groups: Group[];
};

type TeamForm = {
  id?: string;
  groupId: string;
  name: string;
  color: string;
  partyCount: number;
  receiptName: string;
};

const emptyForm = (groupId: string): TeamForm => ({
  groupId,
  name: "",
  color: "#3b82f6",
  partyCount: 0,
  receiptName: "",
});

export function TeamManager({ teams, groups }: Props) {
  const router = useRouter();
  const [editingTeam, setEditingTeam] = useState<TeamForm | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTeam, setNewTeam] = useState<TeamForm>(emptyForm(groups[0]?.id ?? ""));
  const [isPending, startTransition] = useTransition();

  const teamsByGroup = groups.map((group) => ({
    group,
    teams: teams.filter((t) => t.groupId === group.id),
  }));

  function handleSaveNew() {
    if (!newTeam.name.trim() || !newTeam.groupId) return;
    startTransition(async () => {
      await saveTeam({
        groupId: newTeam.groupId,
        name: newTeam.name.trim(),
        color: newTeam.color,
        partyCount: newTeam.partyCount,
        receiptName: newTeam.receiptName.trim(),
      });
      setNewTeam(emptyForm(groups[0]?.id ?? ""));
      setShowAddForm(false);
      router.refresh();
    });
  }

  function handleUpdate() {
    if (!editingTeam?.id || !editingTeam.name.trim()) return;
    startTransition(async () => {
      await saveTeam({
        id: editingTeam.id,
        groupId: editingTeam.groupId,
        name: editingTeam.name.trim(),
        color: editingTeam.color,
        partyCount: editingTeam.partyCount,
        receiptName: editingTeam.receiptName.trim(),
      });
      setEditingTeam(null);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTeam(id);
      router.refresh();
    });
  }

  function startEdit(team: Team) {
    setEditingTeam({
      id: team.id,
      groupId: team.groupId,
      name: team.name,
      color: team.color,
      partyCount: team.partyCount,
      receiptName: team.receiptName,
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
                    onSave={handleUpdate}
                    onCancel={() => setEditingTeam(null)}
                    isPending={isPending}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="flex-1 text-sm font-medium">
                      {team.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      懇親会 {team.partyCount}人
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(team)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(team.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
              onSave={handleSaveNew}
              onCancel={() => setShowAddForm(false)}
              isPending={isPending}
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
  onSave,
  onCancel,
  isPending,
  isNew,
}: {
  form: TeamForm;
  onChange: (form: TeamForm) => void;
  groups: Group[];
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  isNew?: boolean;
}) {
  return (
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
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">カラー</Label>
          <Input
            type="color"
            value={form.color}
            onChange={(e) => onChange({ ...form, color: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">懇親会人数</Label>
          <Input
            type="number"
            min={0}
            value={form.partyCount}
            onChange={(e) => onChange({ ...form, partyCount: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">領収書名</Label>
          <Input
            value={form.receiptName}
            onChange={(e) => onChange({ ...form, receiptName: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={isPending || !form.name.trim()}>
          {isNew ? "追加" : "保存"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" />
          キャンセル
        </Button>
      </div>
    </div>
  );
}
