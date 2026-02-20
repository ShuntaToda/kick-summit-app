"use client";

import { useEffect, useState } from "react";
import { useTeam } from "@/hooks/use-team";
import { fetchTeams } from "@/lib/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Team } from "@/server/domain/entities/team";

export function TeamSelectModal() {
  const { selectedTeamId, selectTeam } = useTeam();
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selectedTeamId === null) {
      fetchTeams().then((t) => {
        setTeams(t);
        if (t.length > 0) setOpen(true);
      });
    }
  }, [selectedTeamId]);

  function handleSelect(teamId: string) {
    selectTeam(teamId);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>チームを選択</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {teams.map((team) => (
            <Button
              key={team.id}
              variant="outline"
              className="h-auto py-3"
              onClick={() => handleSelect(team.id)}
            >
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: team.color }}
              />
              {team.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
