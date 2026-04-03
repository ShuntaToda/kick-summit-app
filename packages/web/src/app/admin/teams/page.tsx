export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { TeamManager } from "@/components/team-manager";
import { CardSkeleton } from "@/components/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function TeamsData({ eventId }: { eventId: string }) {
  const [teams, groups, event] = await Promise.all([
    container.getTeams(eventId),
    container.getGroups(eventId),
    container.getEvent(eventId),
  ]);
  return (
    <TeamManager
      teams={teams}
      groups={groups}
      customFields={event?.customFields ?? []}
      eventId={eventId}
    />
  );
}

export default async function TeamsPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  return (
    <div className="space-y-4">
      <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">チーム管理</h1>
      <Suspense fallback={<CardSkeleton count={4} />}>
        <TeamsData eventId={eventId} />
      </Suspense>
    </div>
  );
}
