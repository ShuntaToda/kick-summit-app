export const dynamic = "force-dynamic";

import { getStandings } from "@/server/application/get-standings";
import { LeagueTabs } from "@/components/league-tabs";
import { Refresher } from "@/components/refresher";

export default async function LeaguePage() {
  const standings = await getStandings();

  return (
    <div className="space-y-4">
      <Refresher />
      <h1 className="text-xl font-bold">リーグ表</h1>
      <LeagueTabs standings={standings} />
    </div>
  );
}
