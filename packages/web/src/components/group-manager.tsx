"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGroup, deleteGroup } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Pencil, Check, X } from "lucide-react";
import type { Group } from "@/server/domain/entities/group";

type Props = {
  groups: Group[];
};

export function GroupManager({ groups }: Props) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!newName.trim()) return;
    startTransition(async () => {
      await saveGroup({ name: newName.trim() });
      setNewName("");
      router.refresh();
    });
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return;
    startTransition(async () => {
      await saveGroup({ id, name: editName.trim() });
      setEditingId(null);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteGroup(id);
      router.refresh();
    });
  }

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
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleUpdate(group.id)}
                  disabled={isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{group.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => startEdit(group)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(group.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-2">
        <Input
          placeholder="新しいグループ名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={isPending || !newName.trim()}>
          追加
        </Button>
      </div>
    </div>
  );
}
