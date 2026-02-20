"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/use-admin";
import { submitScore } from "@/lib/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Team } from "@/server/domain/entities/team";
import type { Match } from "@/server/domain/entities/match";

interface Props {
  teams: Team[];
  matches: Match[];
}

export function ScoreInputContent({ teams, matches }: Props) {
  const { isAdmin } = useAdmin();
  const router = useRouter();

  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );

  const [selected, setSelected] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [halfA, setHalfA] = useState("");
  const [halfB, setHalfB] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const editableMatches = useMemo(
    () =>
      matches
        .filter((m) => m.status !== "finished")
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [matches]
  );

  const finishedMatches = useMemo(
    () =>
      matches
        .filter((m) => m.status === "finished")
        .sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime)),
    [matches]
  );

  function teamName(id: string) {
    return teamMap.get(id)?.name ?? id;
  }

  function handleSelect(match: Match) {
    setSelected(match.id);
    setScoreA(match.scoreA?.toString() ?? "");
    setScoreB(match.scoreB?.toString() ?? "");
    setHalfA(match.halfScoreA?.toString() ?? "");
    setHalfB(match.halfScoreB?.toString() ?? "");
  }

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    await submitScore(
      selected,
      Number(scoreA) || 0,
      Number(scoreB) || 0,
      halfA ? Number(halfA) : null,
      halfB ? Number(halfB) : null
    );
    setSelected(null);
    setScoreA("");
    setScoreB("");
    setHalfA("");
    setHalfB("");
    setSubmitting(false);
    router.refresh();
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          管理者モードでログインしてください
        </p>
      </div>
    );
  }

  const selectedMatch = matches.find((m) => m.id === selected);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">スコア入力</h1>

      {selectedMatch && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {teamName(selectedMatch.teamAId)} vs{" "}
              {teamName(selectedMatch.teamBId)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                ハーフタイムスコア
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={halfA}
                  onChange={(e) => setHalfA(e.target.value)}
                  className="text-center"
                  placeholder={teamName(selectedMatch.teamAId)}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  min={0}
                  value={halfB}
                  onChange={(e) => setHalfB(e.target.value)}
                  className="text-center"
                  placeholder={teamName(selectedMatch.teamBId)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                最終スコア
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  className="text-center text-lg font-bold"
                  placeholder={teamName(selectedMatch.teamAId)}
                />
                <span className="text-lg font-bold text-muted-foreground">
                  -
                </span>
                <Input
                  type="number"
                  min={0}
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="text-center text-lg font-bold"
                  placeholder={teamName(selectedMatch.teamBId)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "送信中..." : "確定"}
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          未確定の試合
        </h2>
        {editableMatches.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            全試合のスコアが確定済みです
          </p>
        )}
        {editableMatches.map((m) => (
          <Card
            key={m.id}
            className={`cursor-pointer transition-colors hover:bg-accent ${
              m.id === selected ? "border-primary" : ""
            }`}
            onClick={() => handleSelect(m)}
          >
            <CardContent className="flex items-center justify-between py-3">
              <div className="text-sm">
                {teamName(m.teamAId)} vs {teamName(m.teamBId)}
              </div>
              <Badge
                variant={m.status === "ongoing" ? "destructive" : "outline"}
              >
                {m.status === "ongoing" ? "進行中" : "予定"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {finishedMatches.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            確定済み（タップで修正可）
          </h2>
          {finishedMatches.map((m) => (
            <Card
              key={m.id}
              className="cursor-pointer opacity-70 transition-colors hover:bg-accent hover:opacity-100"
              onClick={() => handleSelect(m)}
            >
              <CardContent className="flex items-center justify-between py-3">
                <div className="text-sm">
                  {teamName(m.teamAId)} {m.scoreA} - {m.scoreB}{" "}
                  {teamName(m.teamBId)}
                </div>
                <Badge variant="secondary">終了</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
