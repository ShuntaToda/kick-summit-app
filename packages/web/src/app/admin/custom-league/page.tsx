export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { CustomLeagueManager } from "@/components/features/admin/custom-league-manager";
import { CardSkeleton } from "@/components/shared/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function CustomLeagueData({ eventId }: { eventId: string }) {
  const [customLeagues, matches, teams, groups, courts, standings] = await Promise.all([
    container.getCustomLeagues(eventId),
    container.getMatches(eventId),
    container.getTeams(eventId),
    container.getGroups(eventId),
    container.getCourts(eventId),
    container.getStandings(eventId),
  ]);
  return (
    <CustomLeagueManager
      customLeagues={customLeagues}
      matches={matches}
      teams={teams}
      groups={groups}
      courts={courts}
      standings={standings}
      eventId={eventId}
    />
  );
}

export default async function CustomLeaguePage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  return (
    <div className="space-y-4">
      <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">カスタムリーグ管理</h1>
      <Suspense fallback={<CardSkeleton count={3} />}>
        <CustomLeagueData eventId={eventId} />
      </Suspense>
    </div>
  );
}
