export const dynamic = "force-dynamic";

import { Suspense } from "react";
import * as container from "@/server/container";
import { ScoreInputContent } from "@/components/score-input-content";
import { Refresher } from "@/components/refresher";
import { CardSkeleton } from "@/components/section-skeleton";

async function ScoreData() {
  const [teams, matches] = await Promise.all([
    container.getTeams(),
    container.getMatches(),
  ]);

  return <ScoreInputContent teams={teams} matches={matches} />;
}

export default function ScoreInputPage() {
  return (
    <>
      <Refresher />
      <Suspense fallback={<CardSkeleton count={4} />}>
        <ScoreData />
      </Suspense>
    </>
  );
}
