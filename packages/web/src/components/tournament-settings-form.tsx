"use client";

import { useState, useEffect, useActionState } from "react";
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

// 現在のイベント全体を hidden fields で持ち回し、一部だけ上書きして保存する
function buildFormData(
  event: Event,
  eventId: string,
  overrides: Partial<{
    name: string;
    date: string;
    description: string;
    customFields: CustomField[];
    eventFields: CustomField[];
    eventValues: Record<string, string | number>;
  }>,
) {
  return {
    eventId,
    name: overrides.name ?? event.name,
    date: overrides.date ?? event.date,
    description: overrides.description ?? event.description,
    customFields: JSON.stringify(overrides.customFields ?? event.customFields),
    eventFields: JSON.stringify(overrides.eventFields ?? event.eventFields),
    eventValues: JSON.stringify(overrides.eventValues ?? event.eventValues),
  };
}

function FieldList({
  fields,
  values,
  onAdd,
  onUpdate,
  onRemove,
  onValueChange,
}: {
  fields: CustomField[];
  values?: Record<string, string | number>;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<CustomField>) => void;
  onRemove: (id: string) => void;
  onValueChange?: (fieldId: string, value: string | number) => void;
}) {
  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <Select
              value={field.type}
              onValueChange={(v) => onUpdate(field.id, { type: v as "text" | "number" })}
            >
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">テキスト</SelectItem>
                <SelectItem value="number">数値</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(field.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">項目名</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              placeholder="例: コート代"
            />
          </div>
          {onValueChange && values && (
            <div className="space-y-1">
              <Label className="text-xs">値</Label>
              <Input
                type={field.type === "number" ? "number" : "text"}
                min={field.type === "number" ? 0 : undefined}
                placeholder={field.type === "number" ? "例: 30000" : "例: メモ"}
                value={values[field.id] ?? (field.type === "number" ? 0 : "")}
                onChange={(e) =>
                  onValueChange(
                    field.id,
                    field.type === "number" ? Number(e.target.value) : e.target.value,
                  )
                }
              />
            </div>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="mr-1 h-4 w-4" />
        項目を追加
      </Button>
    </div>
  );
}

function SectionSaveButton({ state }: { state: ActionState }) {
  return (
    <div className="space-y-1">
      <SubmitButton size="sm" pendingText="保存中...">保存</SubmitButton>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.success && <p className="text-xs text-green-600">保存しました</p>}
    </div>
  );
}

export function TournamentSettingsForm({ event, eventId }: Props) {
  // 基本情報
  const [basicState, basicAction] = useActionState(updateEventFormAction, init);

  // 大会カスタム項目
  const [eventFields, setEventFields] = useState<CustomField[]>(event.eventFields);
  const [eventValues, setEventValues] = useState<Record<string, string | number>>(event.eventValues);
  const [eventFieldState, eventFieldAction] = useActionState(updateEventFormAction, init);

  // チームカスタム項目
  const [customFields, setCustomFields] = useState<CustomField[]>(event.customFields);
  const [customFieldState, customFieldAction] = useActionState(updateEventFormAction, init);

  // 大会説明
  const [description, setDescription] = useState(event.description);
  const [descState, descAction] = useActionState(updateEventFormAction, init);

  // 保存成功時に state を event に反映（各セクション独立）
  useEffect(() => {
    if (eventFieldState.success) {
      // eventFields/eventValues はすでに state 管理なので何もしない
    }
  }, [eventFieldState.timestamp]);

  function addEventField() {
    setEventFields([...eventFields, { id: nanoid(), label: "", type: "number", required: false }]);
  }
  function updateEventField(id: string, patch: Partial<CustomField>) {
    setEventFields(eventFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function removeEventField(id: string) {
    setEventFields(eventFields.filter((f) => f.id !== id));
    setEventValues((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }
  function setEventValue(fieldId: string, value: string | number) {
    setEventValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  function addCustomField() {
    setCustomFields([...customFields, { id: nanoid(), label: "", type: "text", required: false }]);
  }
  function updateCustomField(id: string, patch: Partial<CustomField>) {
    setCustomFields(customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function removeCustomField(id: string) {
    setCustomFields(customFields.filter((f) => f.id !== id));
  }

  const base = buildFormData(event, eventId, {});

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <form action={basicAction}>
        {Object.entries({ ...base }).map(([k, v]) =>
          k !== "name" && k !== "date" ? <input key={k} type="hidden" name={k} value={v} /> : null,
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">大会名</Label>
              <Input id="name" name="name" defaultValue={event.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">開催日</Label>
              <Input id="date" name="date" type="date" defaultValue={event.date} />
            </div>
            <SectionSaveButton state={basicState} />
          </CardContent>
        </Card>
      </form>

      {/* 大会カスタム項目 */}
      <form action={eventFieldAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="name" value={event.name} />
        <input type="hidden" name="date" value={event.date} />
        <input type="hidden" name="description" value={event.description} />
        <input type="hidden" name="customFields" value={JSON.stringify(event.customFields)} />
        <input type="hidden" name="eventFields" value={JSON.stringify(eventFields)} />
        <input type="hidden" name="eventValues" value={JSON.stringify(eventValues)} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">大会カスタム項目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              大会全体に紐づく項目を設定できます（例: コート代、懇親会費/人など）。費用シミュレーターで使用できます。
            </p>
            <FieldList
              fields={eventFields}
              values={eventValues}
              onAdd={addEventField}
              onUpdate={updateEventField}
              onRemove={removeEventField}
              onValueChange={setEventValue}
            />
            <SectionSaveButton state={eventFieldState} />
          </CardContent>
        </Card>
      </form>

      {/* チームカスタム項目 */}
      <form action={customFieldAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="name" value={event.name} />
        <input type="hidden" name="date" value={event.date} />
        <input type="hidden" name="description" value={event.description} />
        <input type="hidden" name="customFields" value={JSON.stringify(customFields)} />
        <input type="hidden" name="eventFields" value={JSON.stringify(event.eventFields)} />
        <input type="hidden" name="eventValues" value={JSON.stringify(event.eventValues)} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">チームカスタム項目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              チームごとに入力してもらう追加項目を設定できます（例: 懇親会参加人数、代表者名など）
            </p>
            <FieldList
              fields={customFields}
              onAdd={addCustomField}
              onUpdate={updateCustomField}
              onRemove={removeCustomField}
            />
            <SectionSaveButton state={customFieldState} />
          </CardContent>
        </Card>
      </form>

      {/* 大会説明 */}
      <form action={descAction}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="name" value={event.name} />
        <input type="hidden" name="date" value={event.date} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="customFields" value={JSON.stringify(event.customFields)} />
        <input type="hidden" name="eventFields" value={JSON.stringify(event.eventFields)} />
        <input type="hidden" name="eventValues" value={JSON.stringify(event.eventValues)} />
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Label>大会説明 (Markdown)</Label>
            <div data-color-mode="light">
              <MDEditor
                value={description}
                onChange={(v) => setDescription(v ?? "")}
                height={300}
                preview="edit"
              />
            </div>
            <SectionSaveButton state={descState} />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
