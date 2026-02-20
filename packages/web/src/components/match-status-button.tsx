"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/use-admin";
import { changeMatchStatus } from "@/lib/actions";
import { Button } from "@/components/ui/button";

interface Props {
  matchId: string;
  status: "scheduled" | "ongoing" | "finished";
}

export function MatchStatusButton({ matchId, status }: Props) {
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!isAdmin) return null;

  async function handleClick(newStatus: "ongoing" | "finished") {
    startTransition(async () => {
      await changeMatchStatus(matchId, newStatus);
      router.refresh();
    });
  }

  if (status === "scheduled") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-6 text-xs"
        disabled={isPending}
        onClick={() => handleClick("ongoing")}
      >
        開始
      </Button>
    );
  }

  if (status === "ongoing") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-6 text-xs"
        disabled={isPending}
        onClick={() => handleClick("finished")}
      >
        終了
      </Button>
    );
  }

  return null;
}
