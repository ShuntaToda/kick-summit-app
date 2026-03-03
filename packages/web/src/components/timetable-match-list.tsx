"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/use-admin";
import { submitScore } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Match } from "@/server/domain/entities/match";

type TeamInfo = {
  name: string;
  color: string;
};

type Props = {
  matches: Match[];
  teamMap: Record<string, TeamInfo>;
};

function getMatchState(match: Match, now: number) {
  if (!match.scheduledTime) return "upcoming";
  const start = new Date(match.scheduledTime).getTime();
  if (isNaN(start)) return "upcoming";
  const end = start + match.durationMinutes * 60 * 1000;
  if (now >= start && now < end) return "playing";
  if (now < start) return "upcoming";
  return "finished";
}

function formatTime(scheduledTime: string) {
  if (!scheduledTime) return null;
  const d = new Date(scheduledTime);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function TeamName({ id, teamMap }: { id: string | null; teamMap: Record<string, TeamInfo> }) {
  const info = id ? teamMap[id] : null;
  const name = info?.name ?? (id ? id : "TBD");
  const color = info?.color ?? "#888";

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span
        className="inline-block h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

function MatchRow({
  match,
  teamMap,
  now,
  onTap,
}: {
  match: Match;
  teamMap: Record<string, TeamInfo>;
  now: number;
  onTap?: () => void;
}) {
  const state = getMatchState(match, now);

  return (
    <Card
      className={`relative overflow-hidden ${state === "playing" ? "border-primary border-2" : ""} ${onTap ? "cursor-pointer" : ""}`}
      onClick={onTap}
    >
      <CardContent className="py-3">
        <Badge
          variant={
            state === "playing"
              ? "destructive"
              : state === "finished" || match.status === "finished"
                ? "secondary"
                : "outline"
          }
          className="absolute right-1 top-1 rounded-sm text-[10px] px-1.5 py-0"
        >
          {state === "playing"
            ? "試合中"
            : state === "finished" || match.status === "finished"
              ? "終了"
              : "予定"}
        </Badge>
        <div className="flex items-center gap-3">
          <div className="w-24 shrink-0 text-center text-xs text-muted-foreground">
            {formatTime(match.scheduledTime) ? (
              <>
                {formatTime(match.scheduledTime)}
                {" - "}
                {formatTime(new Date(new Date(match.scheduledTime).getTime() + match.durationMinutes * 60 * 1000).toISOString())}
              </>
            ) : null}
            <div className={formatTime(match.scheduledTime) ? "mt-0.5" : ""}>{match.court}</div>
          </div>
          <div className="min-w-0 flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-x-2">
            <div className="flex justify-end">
              <TeamName id={match.teamAId} teamMap={teamMap} />
            </div>
            <span className="text-xs text-muted-foreground">vs</span>
            <div className="flex justify-start">
              <TeamName id={match.teamBId} teamMap={teamMap} />
            </div>
            <div className="flex justify-end">
              <span className="text-lg font-bold">{match.scoreA ?? 0}</span>
            </div>
            <span className="text-sm text-muted-foreground text-center">-</span>
            <div className="flex justify-start">
              <span className="text-lg font-bold">{match.scoreB ?? 0}</span>
            </div>
            {match.refereeTeamId && (
              <div className="col-span-3 mt-2 text-center text-[10px] text-muted-foreground">
                審判: {teamMap[match.refereeTeamId]?.name ?? "TBD"}
              </div>
            )}
          </div>
          {onTap && (
            <div className="flex shrink-0 items-center">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreDialog({
  match,
  teamMap,
  open,
  onClose,
}: {
  match: Match;
  teamMap: Record<string, TeamInfo>;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scoreA, setScoreA] = useState(String(match.scoreA ?? 0));
  const [scoreB, setScoreB] = useState(String(match.scoreB ?? 0));

  const teamAName = match.teamAId ? (teamMap[match.teamAId]?.name ?? "TBD") : "TBD";
  const teamBName = match.teamBId ? (teamMap[match.teamBId]?.name ?? "TBD") : "TBD";

  function handleSubmit() {
    startTransition(async () => {
      await submitScore(
        match.id,
        Number(scoreA) || 0,
        Number(scoreB) || 0,
        null,
        null,
      );
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>スコア入力</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              className="text-center text-lg font-bold"
              placeholder={teamAName}
            />
            <span className="text-lg font-bold text-muted-foreground">-</span>
            <Input
              type="number"
              min={0}
              value={scoreB}
              onChange={(e) => setScoreB(e.target.value)}
              className="text-center text-lg font-bold"
              placeholder={teamBName}
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "送信中..." : "確定"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TimetableMatchList({ matches, teamMap }: Props) {
  const { isAdmin } = useAdmin();
  const [now, setNow] = useState(Date.now());
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (matches.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        試合データがありません
      </p>
    );
  }

  return (
    <>
      {matches.map((m) => (
        <MatchRow
          key={m.id}
          match={m}
          teamMap={teamMap}
          now={now}
          onTap={isAdmin ? () => setEditingMatch(m) : undefined}
        />
      ))}
      {editingMatch && (
        <ScoreDialog
          match={editingMatch}
          teamMap={teamMap}
          open={!!editingMatch}
          onClose={() => setEditingMatch(null)}
        />
      )}
    </>
  );
}
