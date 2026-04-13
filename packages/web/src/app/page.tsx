export const dynamic = "force-dynamic";

import { Suspense } from "react";
import * as container from "@/server/container";
import { HomeContent } from "@/components/home-content";
import { Refresher } from "@/components/refresher";
import { CardSkeleton } from "@/components/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function HomeData({ eventId }: { eventId: string }) {
  const [teams, matches, standings, groups, customLeagues] = await Promise.all([
    container.getTeams(eventId),
    container.getMatches(eventId),
    container.getStandings(eventId),
    container.getGroups(eventId),
    container.getCustomLeagues(eventId),
  ]);

  return (
    <HomeContent teams={teams} matches={matches} standings={standings} groups={groups} customLeagues={customLeagues} eventId={eventId} />
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";

  return (
    <>
      <Refresher />
      <Suspense fallback={<CardSkeleton count={4} />}>
        <HomeData eventId={eventId} />
      </Suspense>
    </>
  );
}
