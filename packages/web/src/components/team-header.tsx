"use client";

import { Trophy } from "lucide-react";
import { useTeam } from "@/hooks/use-team";
import { Button } from "@/components/ui/button";

interface Props {
  teams: { id: string; name: string }[];
}

export function TeamHeader({ teams }: Props) {
  const { selectedTeamId, clearTeam } = useTeam();
  const myTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">AWS Kick Summit</h1>
      </div>
      {myTeam && (
        <Button variant="outline" size="sm" onClick={clearTeam}>
          {myTeam.name} ▼
        </Button>
      )}
    </div>
  );
}
