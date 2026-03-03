export const dynamic = "force-dynamic";

import { Suspense } from "react";
import * as container from "@/server/container";
import { LeagueTabs } from "@/components/league-tabs";
import { Refresher } from "@/components/refresher";
import { CardSkeleton } from "@/components/section-skeleton";

async function LeagueData() {
  const [standings, groups, teams, matches] = await Promise.all([
    container.getStandings(),
    container.getGroups(),
    container.getTeams(),
    container.getMatches(),
  ]);

  const groupNames = Object.fromEntries(groups.map((g) => [g.id, g.name]));

  return (
    <LeagueTabs
      standings={standings}
      groupNames={groupNames}
      teams={teams}
      matches={matches}
    />
  );
}

export default function LeaguePage() {
  return (
    <div className="space-y-4">
      <Refresher />
      <h1 className="text-xl font-bold">リーグ表</h1>
      <Suspense fallback={<CardSkeleton count={4} />}>
        <LeagueData />
      </Suspense>
    </div>
  );
}
