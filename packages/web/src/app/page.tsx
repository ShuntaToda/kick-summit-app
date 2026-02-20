export const dynamic = "force-dynamic";

import { getTeams } from "@/server/application/get-teams";
import { getMatches } from "@/server/application/get-matches";
import { getStandings } from "@/server/application/get-standings";
import { HomeContent } from "@/components/home-content";
import { Refresher } from "@/components/refresher";

export default async function HomePage() {
  const [teams, matches, standings] = await Promise.all([
    getTeams(),
    getMatches(),
    getStandings(),
  ]);

  return (
    <>
      <Refresher />
      <HomeContent teams={teams} matches={matches} standings={standings} />
    </>
  );
}
