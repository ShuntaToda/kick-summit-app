"use client";

import { useState, useEffect, useActionState } from "react";
import { saveGroupFormAction, deleteGroupAction } from "@/lib/actions/group";
import type { ActionState } from "@/lib/actions/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Group } from "@/server/domain/entities/group";

type Props = {
  groups: Group[];
  eventId: string;
};

const init: ActionState = { success: false };

export function GroupManager({ groups, eventId }: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addState, addAction] = useActionState(saveGroupFormAction, init);
  const [editState, editAction] = useActionState(saveGroupFormAction, init);

  useEffect(() => {
    if (addState.success) setNewName("");
  }, [addState.timestamp]);

  useEffect(() => {
    if (editState.success) setEditingId(null);
  }, [editState.timestamp]);

  function startEdit(group: Group) {
    setEditingId(group.id);
    setEditName(group.name);
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardContent className="flex items-center gap-3 py-3">
            {editingId === group.id ? (
              <form action={editAction} className="flex flex-1 items-center gap-3">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="id" value={group.id} />
                <Input
                  name="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <SubmitButton size="icon" variant="ghost">
                  <Check className="h-4 w-4" />
                </SubmitButton>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{group.name}</span>
                <Button size="icon" variant="ghost" onClick={() => startEdit(group)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <form action={deleteGroupAction}>
                  <input type="hidden" name="id" value={group.id} />
                  <SubmitButton size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </SubmitButton>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      <form action={addAction} className="flex gap-2">
        <input type="hidden" name="eventId" value={eventId} />
        <Input
          name="name"
          placeholder="新しいグループ名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <SubmitButton disabled={!newName.trim()}>追加</SubmitButton>
      </form>
    </div>
  );
}
