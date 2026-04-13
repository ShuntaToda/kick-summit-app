"use client";

import Link from "next/link";
import { ChevronRight, Palette } from "lucide-react";
import { useTeam } from "@/hooks/use-team";

export function TeamSettingsLink({ eventId }: { eventId: string }) {
  const { selectedTeamId } = useTeam();

  const params = new URLSearchParams();
  if (eventId !== "default") params.set("id", eventId);
  if (selectedTeamId) params.set("teamId", selectedTeamId);
  const qs = params.toString();
  const href = `/team-settings${qs ? `?${qs}` : ""}`;

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <Palette className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">チーム設定</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
