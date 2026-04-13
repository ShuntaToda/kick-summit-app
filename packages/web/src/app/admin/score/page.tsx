export const dynamic = "force-dynamic";

import { Suspense } from "react";
import * as container from "@/server/container";
import { ScoreInputContent } from "@/components/features/score/score-input-content";
import { Refresher } from "@/components/shared/refresher";
import { CardSkeleton } from "@/components/shared/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function ScoreData({ eventId }: { eventId: string }) {
  const [teams, matches] = await Promise.all([
    container.getTeams(eventId),
    container.getMatches(eventId),
  ]);

  return <ScoreInputContent teams={teams} matches={matches} />;
}

export default async function ScoreInputPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";

  return (
    <>
      <Refresher />
      <Suspense fallback={<CardSkeleton count={4} />}>
        <ScoreData eventId={eventId} />
      </Suspense>
    </>
  );
}
