"use client";

import { useState, useEffect, useActionState } from "react";
import { saveCourtFormAction, deleteCourtAction } from "@/lib/actions/court";
import type { ActionState } from "@/lib/actions/helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Court } from "@/server/domain/entities/court";

type Props = {
  courts: Court[];
  eventId: string;
};

const init: ActionState = { success: false };

export function CourtManager({ courts, eventId }: Props) {
  const [newName, setNewName] = useState("");
  const [addState, addAction] = useActionState(saveCourtFormAction, init);

  useEffect(() => {
    if (addState.success) setNewName("");
  }, [addState.timestamp]);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <Label>コート</Label>
        <div className="flex flex-wrap gap-2">
          {courts.map((court) => (
            <span
              key={court.id}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm"
            >
              {court.name}
              <form action={deleteCourtAction}>
                <input type="hidden" name="id" value={court.id} />
                <button
                  type="submit"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </form>
            </span>
          ))}
          {courts.length === 0 && (
            <span className="text-sm text-muted-foreground">コートが登録されていません</span>
          )}
        </div>
        <form action={addAction} className="flex gap-2">
          <input type="hidden" name="eventId" value={eventId} />
          <Input
            name="name"
            placeholder="新しいコート名"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <SubmitButton size="sm" disabled={!newName.trim()}>
            <Plus className="mr-1 h-3 w-3" />
            追加
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
