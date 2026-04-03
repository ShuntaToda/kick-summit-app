"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { updateEventFormAction } from "@/lib/actions/event";
import type { ActionState } from "@/lib/actions/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Plus, Trash2 } from "lucide-react";
import type { Event, CustomField } from "@/server/domain/entities/event";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Props = {
  event: Event;
  eventId: string;
};

const init: ActionState = { success: false };

export function TournamentSettingsForm({ event, eventId }: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(event.description);
  const [customFields, setCustomFields] = useState<CustomField[]>(event.customFields);
  const [state, formAction] = useActionState(updateEventFormAction, init);

  useEffect(() => {
    if (state.success) {
      const backPath = eventId !== "default" ? `/more?id=${encodeURIComponent(eventId)}` : "/more";
      router.push(backPath);
    }
  }, [state.timestamp]);

  function addField() {
    setCustomFields([
      ...customFields,
      { id: nanoid(), label: "", type: "text", required: false },
    ]);
  }

  function updateField(id: string, patch: Partial<CustomField>) {
    setCustomFields(customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    setCustomFields(customFields.filter((f) => f.id !== id));
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="customFields" value={JSON.stringify(customFields)} />
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">大会名</Label>
              <Input
                id="name"
                name="name"
                defaultValue={event.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">開催日</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={event.date}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">チームカスタム項目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              チームごとに入力してもらう追加項目を設定できます（例: 懇親会参加人数、シューズレンタル数、懇親会代表者名など）
            </p>
            {customFields.map((field) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">項目名</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="例: シューズレンタル数"
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">型</Label>
                  <Select
                    value={field.type}
                    onValueChange={(v) => updateField(field.id, { type: v as "text" | "number" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">テキスト</SelectItem>
                      <SelectItem value="number">数値</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1.5 pb-2">
                  <Checkbox
                    checked={field.required}
                    onCheckedChange={(v) => updateField(field.id, { required: !!v })}
                  />
                  <Label className="text-xs">必須</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addField}>
              <Plus className="mr-1 h-4 w-4" />
              項目を追加
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-6">
            <Label>大会説明 (Markdown)</Label>
            <div data-color-mode="light">
              <MDEditor
                value={description}
                onChange={(v) => setDescription(v ?? "")}
                height={300}
                preview="edit"
              />
            </div>
          </CardContent>
        </Card>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <SubmitButton pendingText="保存中...">
          保存
        </SubmitButton>
      </div>
    </form>
  );
}
