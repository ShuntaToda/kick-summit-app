export const dynamic = "force-dynamic";

import { getTeams } from "@/server/application/get-teams";
import { getMatches } from "@/server/application/get-matches";
import { ScoreInputContent } from "@/components/score-input-content";
import { Refresher } from "@/components/refresher";

export default async function ScoreInputPage() {
  const [teams, matches] = await Promise.all([getTeams(), getMatches()]);

  return (
    <>
      <Refresher />
      <ScoreInputContent teams={teams} matches={matches} />
    </>
  );
}
