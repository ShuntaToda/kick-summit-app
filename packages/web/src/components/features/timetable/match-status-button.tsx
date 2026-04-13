"use client";

import { useAdmin } from "@/hooks/use-admin";
import { changeMatchStatusAction } from "@/lib/actions/match";
import { SubmitButton } from "@/components/ui/submit-button";

async function changeStatusVoid(formData: FormData): Promise<void> {
  await changeMatchStatusAction(formData);
}

interface Props {
  matchId: string;
  status: "scheduled" | "ongoing" | "finished";
}

export function MatchStatusButton({ matchId, status }: Props) {
  const { isAdmin } = useAdmin();

  if (!isAdmin) return null;

  if (status === "scheduled") {
    return (
      <form action={changeStatusVoid}>
        <input type="hidden" name="matchId" value={matchId} />
        <input type="hidden" name="status" value="ongoing" />
        <SubmitButton
          variant="outline"
          size="sm"
          className="h-6 text-xs"
          pendingText="..."
        >
          開始
        </SubmitButton>
      </form>
    );
  }

  if (status === "ongoing") {
    return (
      <form action={changeStatusVoid}>
        <input type="hidden" name="matchId" value={matchId} />
        <input type="hidden" name="status" value="finished" />
        <SubmitButton
          variant="outline"
          size="sm"
          className="h-6 text-xs"
          pendingText="..."
        >
          終了
        </SubmitButton>
      </form>
    );
  }

  return null;
}
