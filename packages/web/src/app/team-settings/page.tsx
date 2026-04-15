export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { TeamSettingsForm } from "@/features/team/ui/team-settings-form";
import { FormSkeleton } from "@/components/shared/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string; teamId?: string }> };

async function SettingsData({
  eventId,
  teamId,
}: {
  eventId: string;
  teamId: string;
}) {
  const [teams, event] = await Promise.all([
    container.getTeams(eventId),
    container.getEvent(eventId),
  ]);
  const team = teams.find((t) => t.id === teamId);
  if (!team) {
    return (
      <p className="text-sm text-muted-foreground">
        チームが見つかりません。「その他」ページからチームを選択してください。
      </p>
    );
  }
  return (
    <TeamSettingsForm
      team={team}
      customFields={event?.customFields ?? []}
      eventId={eventId}
    />
  );
}

export default async function TeamSettingsPage({ searchParams }: PageProps) {
  const { id, teamId } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  if (!teamId) {
    return (
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          その他
        </Link>
        <h1 className="text-xl font-bold">チーム設定</h1>
        <p className="text-sm text-muted-foreground">
          チームが選択されていません。ホーム画面からチームを選択してください。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        その他
      </Link>
      <h1 className="text-xl font-bold">チーム設定</h1>
      <Suspense fallback={<FormSkeleton />}>
        <SettingsData eventId={eventId} teamId={teamId} />
      </Suspense>
    </div>
  );
}
