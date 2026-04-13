"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { saveTeamFormAction } from "@/lib/actions/team";
import type { ActionState } from "@/lib/actions/helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Team } from "@/server/domain/entities/team";
import type { CustomField } from "@/server/domain/entities/event";

type Props = {
  team: Team;
  customFields: CustomField[];
  eventId: string;
};

const init: ActionState = { success: false };

export function TeamSettingsForm({ team, customFields, eventId }: Props) {
  const router = useRouter();
  const [color, setColor] = useState(team.color);
  const [customValues, setCustomValues] = useState<
    Record<string, string | number>
  >(team.customValues);
  const [state, formAction] = useActionState(saveTeamFormAction, init);

  useEffect(() => {
    if (state.success) {
      router.push(
        eventId !== "default"
          ? `/more?id=${encodeURIComponent(eventId)}`
          : "/more",
      );
    }
  }, [state.timestamp]);

  function setCustomValue(fieldId: string, value: string | number) {
    setCustomValues({ ...customValues, [fieldId]: value });
  }

  const payload = JSON.stringify({
    id: team.id,
    groupId: team.groupId,
    name: team.name,
    color,
    customValues,
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="payload" value={payload} />
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 py-6">
            <div className="space-y-2">
              <Label>チーム名</Label>
              <p className="text-sm font-medium">{team.name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">チームカラー</Label>
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {customFields.length > 0 && (
          <Card>
            <CardContent className="space-y-4 py-6">
              {customFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && (
                      <span className="ml-0.5 text-destructive">*</span>
                    )}
                  </Label>
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    min={field.type === "number" ? 0 : undefined}
                    value={
                      customValues[field.id] ??
                      (field.type === "number" ? 0 : "")
                    }
                    onChange={(e) =>
                      setCustomValue(
                        field.id,
                        field.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <SubmitButton className="w-full" pendingText="保存中...">
          保存
        </SubmitButton>
      </div>
    </form>
  );
}
