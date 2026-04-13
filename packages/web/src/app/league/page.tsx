export const dynamic = "force-dynamic";

import { Suspense } from "react";
import * as container from "@/server/container";
import { LeagueTabs } from "@/components/league-tabs";
import { Refresher } from "@/components/refresher";
import { CardSkeleton } from "@/components/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function LeagueData({ eventId }: { eventId: string }) {
  const [standings, groups, teams, matches, customLeagues, customLeagueStandings] = await Promise.all([
    container.getStandings(eventId),
    container.getGroups(eventId),
    container.getTeams(eventId),
    container.getMatches(eventId),
    container.getCustomLeagues(eventId),
    container.getCustomLeagueStandings(eventId),
  ]);

  const groupNames = Object.fromEntries(groups.map((g) => [g.id, g.name]));

  return (
    <LeagueTabs
      standings={standings}
      groupNames={groupNames}
      teams={teams}
      matches={matches}
      customLeagues={customLeagues}
      customLeagueStandings={customLeagueStandings}
    />
  );
}

export default async function LeaguePage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";

  return (
    <div className="space-y-4">
      <Refresher />
      <h1 className="text-xl font-bold">リーグ表</h1>
      <Suspense fallback={<CardSkeleton count={4} />}>
        <LeagueData eventId={eventId} />
      </Suspense>
    </div>
  );
}
