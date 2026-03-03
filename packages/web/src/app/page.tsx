export const dynamic = "force-dynamic";

import { Suspense } from "react";
import * as container from "@/server/container";
import { HomeContent } from "@/components/home-content";
import { Refresher } from "@/components/refresher";
import { CardSkeleton } from "@/components/section-skeleton";

async function HomeData() {
  const [teams, matches, standings, groups] = await Promise.all([
    container.getTeams(),
    container.getMatches(),
    container.getStandings(),
    container.getGroups(),
  ]);

  return (
    <HomeContent teams={teams} matches={matches} standings={standings} groups={groups} />
  );
}

export default function HomePage() {
  return (
    <>
      <Refresher />
      <Suspense fallback={<CardSkeleton count={4} />}>
        <HomeData />
      </Suspense>
    </>
  );
}
