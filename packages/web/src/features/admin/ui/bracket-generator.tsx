"use client";

import { useState, useEffect, useActionState, useMemo } from "react";
import { generateBracketsFormAction } from "@/lib/actions/bracket";
import type { ActionState } from "@/lib/actions/helpers";
import type { Bracket } from "@/server/domain/entities/bracket";
import type { Court } from "@/server/domain/entities/court";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  calcBracketSize,
  calcTotalRounds,
  buildRoundLabels,
} from "@/features/admin/usecases/bracket-generator";

type Props = {
  existingBrackets: Bracket[];
  courts: Court[];
  eventId: string;
};

const init: ActionState = { success: false };

export function BracketGenerator({ existingBrackets, courts: courtsMaster, eventId }: Props) {
  const [bracketName, setBracketName] = useState("");
  const [teamCount, setTeamCount] = useState(4);
  const [scheduledTime, setScheduledTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [selectedCourts, setSelectedCourts] = useState<string[]>(courtsMaster.map((c) => c.name));
  const [showPreview, setShowPreview] = useState(false);
  const [genState, genAction] = useActionState(generateBracketsFormAction, init);

  useEffect(() => {
    if (genState.success) {
      setShowPreview(false);
      setBracketName("");
    }
  }, [genState.timestamp]);

  const bracketSize = calcBracketSize(teamCount);
  const totalRounds = calcTotalRounds(bracketSize);

  const existingSameName = useMemo(
    () => existingBrackets.filter((b) => b.bracketName === bracketName),
    [existingBrackets, bracketName],
  );

  const existingNames = useMemo(
    () => [...new Set(existingBrackets.map((b) => b.bracketName))].sort(),
    [existingBrackets],
  );

  const roundLabels = useMemo(
    () => buildRoundLabels(totalRounds),
    [totalRounds],
  );

  const canGenerate = bracketName.trim().length > 0 && teamCount >= 2 && selectedCourts.length > 0;

  const generatePayload = JSON.stringify({
    bracketName,
    teamCount,
    defaultScheduledTime: scheduledTime,
    defaultDurationMinutes: durationMinutes,
    defaultCourts: selectedCourts,
  });

  function toggleCourt(courtName: string, checked: boolean) {
    setSelectedCourts((prev) =>
      checked ? [...prev, courtName] : prev.filter((n) => n !== courtName),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">トーナメント生成</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingNames.length > 0 && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <span className="text-muted-foreground">既存: </span>
            {existingNames.map((name, i) => (
              <span key={name}>
                {i > 0 && "、"}
                <strong>{name}</strong>
              </span>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="bracketName">トーナメント名</Label>
          <Input
            id="bracketName"
            placeholder="例: 上位トーナメント"
            value={bracketName}
            onChange={(e) => {
              setBracketName(e.target.value);
              setShowPreview(false);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="teamCount">参加チーム数</Label>
            <Input
              id="teamCount"
              type="number"
              min={2}
              max={64}
              value={teamCount}
              onChange={(e) => {
                setTeamCount(Number(e.target.value));
                setShowPreview(false);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>使用コート</Label>
            <div className="flex flex-wrap gap-3">
              {courtsMaster.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={selectedCourts.includes(c.name)}
                    onCheckedChange={(checked) => toggleCourt(c.name, !!checked)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="scheduledTime">デフォルト開始時刻</Label>
            <Input
              id="scheduledTime"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="durationMinutes">試合時間（分）</Label>
            <Input
              id="durationMinutes"
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            />
          </div>
        </div>

        {teamCount >= 2 && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p>
              <strong>{teamCount}チーム</strong>出場（ブラケットサイズ: {bracketSize}）
            </p>
            <p className="mt-1">
              {roundLabels.map((label, i) => {
                const slotsInRound = bracketSize / Math.pow(2, i + 1);
                return (
                  <span key={i}>
                    {i > 0 && " → "}
                    {slotsInRound}試合（{label}）
                  </span>
                );
              })}
            </p>
            <p className="mt-1 text-muted-foreground">
              全ての対戦は生成後に手動で設定します
            </p>
          </div>
        )}

        {existingSameName.length > 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            「{bracketName}」のブラケット（{existingSameName.length}件）が既に存在します。生成すると置き換えられます。
          </div>
        )}

        <div className="flex gap-2">
          {!showPreview ? (
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              disabled={!canGenerate}
            >
              確認
            </Button>
          ) : (
            <>
              <form action={genAction}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="payload" value={generatePayload} />
                <SubmitButton pendingText="生成中...">
                  生成して保存
                </SubmitButton>
              </form>
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                キャンセル
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
