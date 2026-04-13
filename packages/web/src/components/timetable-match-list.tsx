"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/hooks/use-admin";
import { submitScore, changeMatchStatusAction } from "@/lib/actions/match";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Match } from "@/server/domain/entities/match";
import { getNow } from "@/lib/now";

type TeamInfo = {
  name: string;
  color: string;
};

type Props = {
  matches: Match[];
  teamMap: Record<string, TeamInfo>;
  groupMap?: Record<string, string>; // groupId -> groupName
  eventId?: string;
};

const GROUP_RANK_PREFIX = "group-rank:";

function decodeRefLabel(
  refLabel: string,
  groupMap: Record<string, string>,
): string {
  if (!refLabel.startsWith(GROUP_RANK_PREFIX)) return refLabel;
  const rest = refLabel.slice(GROUP_RANK_PREFIX.length);
  const lastColon = rest.lastIndexOf(":");
  if (lastColon === -1) return refLabel;
  const groupId = rest.slice(0, lastColon);
  const rank = Number(rest.slice(lastColon + 1));
  if (!groupId || isNaN(rank)) return refLabel;
  const groupName = groupMap[groupId] ?? groupId;
  return `${groupName} ${rank}位`;
}

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

function TeamName({
  id,
  refLabel,
  teamMap,
  groupMap = {},
}: {
  id: string | null;
  refLabel?: string | null;
  teamMap: Record<string, TeamInfo>;
  groupMap?: Record<string, string>;
}) {
  const info = id ? teamMap[id] : null;
  const color = info?.color ?? "#888";

  if (refLabel) {
    return (
      <div className="text-center">
        <span className="text-xs text-muted-foreground italic">
          {decodeRefLabel(refLabel, groupMap)}
        </span>
        {info && (
          <div>
            <span
              className="border-b-2 pb-0.5 font-medium"
              style={{ borderColor: color }}
            >
              {info.name}
            </span>
          </div>
        )}
      </div>
    );
  }

  const name = info?.name ?? (id ? id : "TBD");

  return (
    <div className="text-center">
      <span
        className="border-b-2 pb-0.5 font-medium text-center"
        style={{ borderColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

function MatchRow({
  match,
  teamMap,
  groupMap = {},
  now,
  onTap,
}: {
  match: Match;
  teamMap: Record<string, TeamInfo>;
  groupMap?: Record<string, string>;
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
              : match.status === "finished"
                ? "secondary"
                : "outline"
          }
          className="absolute right-1 top-1 rounded-sm text-[10px] px-1.5 py-0"
        >
          {state === "playing"
            ? "試合中"
            : match.status === "finished"
              ? "終了"
              : "予定"}
        </Badge>
        <div className="space-y-2">
          <div className="ms-1.5 text-xs text-muted-foreground">
            {formatTime(match.scheduledTime) ? (
              <span>
                {formatTime(match.scheduledTime)}
                {" - "}
                {formatTime(
                  new Date(
                    new Date(match.scheduledTime).getTime() +
                      match.durationMinutes * 60 * 1000,
                  ).toISOString(),
                )}
              </span>
            ) : null}
            {match.court && (
              <span
                className={formatTime(match.scheduledTime) ? " ml-1.5" : ""}
              >
                {match.court}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="grid grid-cols-[1fr_auto_1fr] justify-center items-center gap-2">
              <TeamName
                id={match.teamAId}
                refLabel={match.teamARefLabel}
                teamMap={teamMap}
                groupMap={groupMap}
              />
              <div className="text-center text-sm">
                <span className="font-bold">{match.scoreA ?? 0}</span>
                <span className="mx-2 text-xs font-normal text-muted-foreground">
                  vs
                </span>
                <span className="font-bold">{match.scoreB ?? 0}</span>
              </div>
              <TeamName
                id={match.teamBId}
                refLabel={match.teamBRefLabel}
                teamMap={teamMap}
                groupMap={groupMap}
              />
            </div>
            {match.refereeTeamId && (
              <div className="pt-1 text-center text-[10px] text-muted-foreground">
                審判: {teamMap[match.refereeTeamId]?.name ?? "TBD"}
              </div>
            )}
            {onTap && (
              <div className="mt-1 flex justify-end">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
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
  eventId,
}: {
  match: Match;
  teamMap: Record<string, TeamInfo>;
  open: boolean;
  onClose: () => void;
  eventId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scoreA, setScoreA] = useState(String(match.scoreA ?? 0));
  const [scoreB, setScoreB] = useState(String(match.scoreB ?? 0));
  const [finished, setFinished] = useState(match.status === "finished");
  const [showTieAlert, setShowTieAlert] = useState(false);

  const teamAName = match.teamAId
    ? (teamMap[match.teamAId]?.name ?? "TBD")
    : "TBD";
  const teamBName = match.teamBId
    ? (teamMap[match.teamBId]?.name ?? "TBD")
    : "TBD";

  const customLeaguePath = eventId && eventId !== "default"
    ? `/admin/custom-league?id=${eventId}`
    : "/admin/custom-league";

  function handleSubmit() {
    startTransition(async () => {
      const newStatus = finished ? "finished" : "scheduled";
      const scoreResult = await submitScore(match.id, Number(scoreA) || 0, Number(scoreB) || 0, null, null, eventId);
      let hasTie = scoreResult.hasTie;
      if (newStatus !== match.status) {
        const fd = new FormData();
        fd.append("matchId", match.id);
        fd.append("status", newStatus);
        if (eventId) fd.append("eventId", eventId);
        const statusResult = await changeMatchStatusAction(fd);
        hasTie = hasTie || statusResult.hasTie;
      }
      router.refresh();
      if (hasTie) {
        setShowTieAlert(true);
      } else {
        onClose();
      }
    });
  }

  return (
    <>
      <Dialog open={open && !showTieAlert} onOpenChange={(v) => !v && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スコア入力</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <div className="space-y-1">
                <p className="text-center text-xs text-muted-foreground">{teamAName}</p>
                <Input
                  type="number"
                  min={0}
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  className="text-center text-lg font-bold"
                />
              </div>
              <span className="pb-2 text-lg font-bold text-muted-foreground">-</span>
              <div className="space-y-1">
                <p className="text-center text-xs text-muted-foreground">{teamBName}</p>
                <Input
                  type="number"
                  min={0}
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="text-center text-lg font-bold"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="finished" checked={finished} onCheckedChange={setFinished} />
              <Label htmlFor="finished" className="text-sm">試合完了</Label>
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

      {/* 同率発生時の注意モーダル */}
      <Dialog open={showTieAlert} onOpenChange={(v) => { if (!v) { setShowTieAlert(false); onClose(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>同率が発生しています</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              グループの順位に同率があるため、カスタムリーグの一部の対戦相手が未確定のままです。
              じゃんけん等で順位を決定し、カスタムリーグ管理ページで設定してください。
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" asChild>
                <Link href={customLeaguePath} onClick={() => { setShowTieAlert(false); onClose(); }}>
                  カスタムリーグ管理へ
                </Link>
              </Button>
              <Button variant="outline" onClick={() => { setShowTieAlert(false); onClose(); }}>
                閉じる
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TimetableMatchList({ matches, teamMap, groupMap = {}, eventId }: Props) {
  const { isAdmin } = useAdmin();
  const [now, setNow] = useState(getNow());
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(getNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (scrollTargetRef.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  if (matches.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        試合データがありません
      </p>
    );
  }

  // 試合中 or 最初の未来の試合をスクロール対象にする
  const scrollTargetId = (() => {
    const playing = matches.find((m) => getMatchState(m, now) === "playing");
    if (playing) return playing.id;
    const upcoming = matches.find((m) => getMatchState(m, now) === "upcoming");
    return upcoming?.id ?? null;
  })();

  return (
    <>
      {matches.map((m) => (
        <div key={m.id} ref={m.id === scrollTargetId ? scrollTargetRef : undefined}>
          <MatchRow
            match={m}
            teamMap={teamMap}
            groupMap={groupMap}
            now={now}
            onTap={isAdmin ? () => setEditingMatch(m) : undefined}
          />
        </div>
      ))}
      {editingMatch && (
        <ScoreDialog
          match={editingMatch}
          teamMap={teamMap}
          open={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          eventId={eventId}
        />
      )}
    </>
  );
}
